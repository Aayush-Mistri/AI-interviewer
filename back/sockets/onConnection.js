import { resumeSessions, completedEvaluations } from "../state.js";
import { WebSocket } from "ws";
import { config } from "../config.js";
import { buildInterviewPrompt } from "../utils/deepgramPrompt.js";
import { parseClientMessage } from "../utils/pdfScrap.js";
import { collectTranscriptLine, evaluateCandidate, appendEvaluationRow } from "../utils/postInterview.js";
import { appendConversationLine, createConversationHistory, finishConversationHistory } from "../utils/conversationHistory.js";

setInterval(() => {
  const expiresBefore = Date.now() - 30 * 60 * 1000;

  for (const [sessionId, session] of resumeSessions.entries()) {
    if (session.createdAt < expiresBefore) {
      resumeSessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

export function handleSocket(clientWs, req) {
    console.log("Browser connected");

    if (!config.deepgramApiKey) {
        clientWs.send(JSON.stringify({
            type: "Error",
            message: "Missing DEEPGRAM_API_KEY in back/.env",
        }));
        clientWs.close(1011, "Server is missing DEEPGRAM_API_KEY");
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");
    const resumeSession = resumeSessions.get(sessionId);

    if (!resumeSession) {
        clientWs.send(JSON.stringify({
            type: "Error",
            message: "Please upload a resume before starting the interview.",
        }));
        clientWs.close(1008, "Missing resume session");
        return;
    }

    const startedAt = Date.now();
    const interviewEvents = [];
    const transcriptLines = [];
    let evaluationPromise = null;
    let interviewEndedByTimer = false;
    let interviewFinalized = false;
    let historyWrite = Promise.resolve();
    const historyReady = createConversationHistory({
        sessionId,
        candidateName: resumeSession.candidateName,
        jobRole: resumeSession.jobRole,
    });

    function recordConversation(line) {
        if (!line) return;
        historyWrite = historyWrite
            .then(() => historyReady)
            .then((filePath) => {
                const speaker = line.speaker === "Candidate" ? `[${resumeSession.candidateName}]` : line.speaker;
                return appendConversationLine(filePath, speaker, line.text);
            })
            .catch((error) => console.error("Conversation history error:", error.message));
    }

    const dgWs = new WebSocket(config.deepgramUrl, {
        headers: {
            Authorization: `Token ${config.deepgramApiKey}`,
        },
    });

    dgWs.on("open", () => {
        console.log("Connected to Deepgram");

        dgWs.send(JSON.stringify({
            type: "Settings",
            audio: {
                input: {
                    encoding: "linear16",
                    sample_rate: 16000
                },
                output: {
                    encoding: "linear16",
                    sample_rate: 24000,
                    container: "none"
                }
            },
            agent: {
                greeting: `Hello ${resumeSession.candidateName}, I reviewed your resume. This interview will have 3-4 questions based on your background and should take about 2 minutes. Let's begin.`,
                listen: {
                    provider: {
                        type: "deepgram",
                        model: "nova-3",
                        language: "en",
                        smart_format: true
                    }
                },
                think: {
                    provider: {
                        type: "open_ai",
                        model: "gpt-4o-mini"
                    },
                    prompt: buildInterviewPrompt(resumeSession)
                },
                speak: {
                    provider: {
                        type: "deepgram",
                        model: "aura-2-thalia-en"
                    }
                }
            }
        }));
    });

    const interviewTimer = setTimeout(async () => {
        interviewEndedByTimer = true;
        await finalizeInterview("The 2-minute interview limit has been reached.", true);
    }, config.interviewDurationMs);

    clientWs.on("message", (data, isBinary) => {
        if (!isBinary) {
            const message = parseClientMessage(data);

            if (message?.type === "EndInterview") {
                if (!interviewFinalized) finalizeInterview("Interview ended by user.", true);
            }

            return;
        }

        if (dgWs.readyState === WebSocket.OPEN && isBinary) {
            dgWs.send(data);
        }
    });

    dgWs.on("message", (data, isBinary) => {
        if (clientWs.readyState !== WebSocket.OPEN) return;

        if (isBinary) {
            clientWs.send(data, { binary: true });
        } else {
            const eventText = data.toString();
            interviewEvents.push(eventText);
            recordConversation(collectTranscriptLine(eventText, transcriptLines));
            clientWs.send(eventText);
        }
    });

    clientWs.on("close", async () => {
        console.log("Browser disconnected");
        clearTimeout(interviewTimer);
        dgWs.close();
        await saveEvaluationOnce();
    });

    dgWs.on("close", async () => {
        console.log("Deepgram disconnected");
        clearTimeout(interviewTimer);
        await saveEvaluationOnce();
        clientWs.close();
    });

    dgWs.on("error", (error) => {
        console.error("Deepgram error:", error.message);
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
                type: "Error",
                message: "Deepgram connection failed. Check your API key and agent provider access.",
            }));
        }
    });

    clientWs.on("error", (error) => {
        console.error("Browser websocket error:", error.message);
    });

    async function saveEvaluationOnce() {
        if (evaluationPromise) return evaluationPromise;

        evaluationPromise = (async () => {
          resumeSessions.delete(sessionId);
          await historyWrite;

          try {
            const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
            const transcript = transcriptLines.map(({ speaker, text }) => `${speaker}: ${text}`).join("\n") || "No conversation text was captured.";
            const evaluation = evaluateCandidate({
                resumeText: resumeSession.resumeText,
                transcript,
                durationSeconds,
                endedByTimer: interviewEndedByTimer
            });
            const historyFile = await historyReady;

            const evaluationPayload = {
                type: "EvaluationSaved",
                score: evaluation.score,
                questionsAnswered: evaluation.questionsAnswered,
                file: config.evaluationFile,
                conversationHistoryFile: historyFile,
                durationSeconds,
                notes: evaluation.notes,
                summary: evaluation.summary,
                scoreBreakdown: evaluation.scoreBreakdown,
                questionFeedback: evaluation.questionFeedback,
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                improvementAdvice: evaluation.improvementAdvice,
            };

            completedEvaluations.set(sessionId, evaluationPayload);

            await finishConversationHistory(historyFile, {
                reason: interviewEndedByTimer ? "Time limit reached" : "Interview ended",
                score: evaluation.score,
            });

            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(evaluationPayload));
            }

            appendEvaluationRow({
                timestamp: new Date().toISOString(),
                candidateName: resumeSession.candidateName,
                score: evaluation.score,
                questionsAnswered: evaluation.questionsAnswered,
                durationSeconds,
                endedByTimer: interviewEndedByTimer,
                resumeSummary: resumeSession.resumeSummary,
                notes: evaluation.notes,
                summary: evaluation.summary,
                scoreBreakdown: JSON.stringify(evaluation.scoreBreakdown),
                questionFeedback: JSON.stringify(evaluation.questionFeedback),
                strengths: evaluation.strengths.join(" | "),
                weaknesses: evaluation.weaknesses.join(" | "),
                improvementAdvice: evaluation.improvementAdvice,
                transcript
            }).catch((error) => console.error("Evaluation export error:", error.message));

            return evaluationPayload;
          } catch (error) {
            console.error("Evaluation save error:", error.message);
            evaluationPromise = null;
            return null;
          }
        })();

        return evaluationPromise;
    }

    async function finalizeInterview(reason, closeAfterSend) {
        if (interviewFinalized) return;
        interviewFinalized = true;
        clearTimeout(interviewTimer);

        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
                type: "InterviewEnded",
                reason,
            }));
        }

        await saveEvaluationOnce();

        if (closeAfterSend) {
            setTimeout(() => {
                clientWs.close(1000, reason);
                dgWs.close();
            }, 300);
        }
    }
}
