export function handleSocket(ws) {
    wss.on("connection", (clientWs, req) => {
        console.log("Browser connected");

        if (!deepgramApiKey) {
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
        let evaluationSaved = false;
        let interviewEndedByTimer = false;

        const dgWs = new WebSocket(DEEPGRAM_URL, {
            headers: {
                Authorization: `Token ${deepgramApiKey}`,
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
                    greeting: `Hello ${resumeSession.candidateName}, I reviewed your resume. This interview will have 5 questions based on your background and should take about 5 minutes. Let's begin.`,
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
            await finalizeInterview("The 5-minute interview limit has been reached.", true);
        }, INTERVIEW_DURATION_MS);

        clientWs.on("message", (data, isBinary) => {
            if (!isBinary) {
                const message = parseClientMessage(data);

                if (message?.type === "EndInterview") {
                    finalizeInterview("Interview ended by user.", true);
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
                collectTranscriptLine(eventText, transcriptLines);
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
            if (evaluationSaved) return;

            evaluationSaved = true;
            resumeSessions.delete(sessionId);

            try {
                const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
                const transcript = transcriptLines.join("\n") || interviewEvents.join("\n").slice(0, 12000);
                const evaluation = evaluateCandidate({
                    resumeText: resumeSession.resumeText,
                    transcript,
                    durationSeconds,
                    endedByTimer: interviewEndedByTimer
                });

                const evaluationPayload = {
                    type: "EvaluationSaved",
                    score: evaluation.score,
                    questionsAnswered: evaluation.questionsAnswered,
                    file: EVALUATION_FILE,
                    durationSeconds,
                    notes: evaluation.notes
                };

                completedEvaluations.set(sessionId, evaluationPayload);

                await appendEvaluationRow({
                    timestamp: new Date().toISOString(),
                    candidateName: resumeSession.candidateName,
                    score: evaluation.score,
                    questionsAnswered: evaluation.questionsAnswered,
                    durationSeconds,
                    endedByTimer: interviewEndedByTimer,
                    resumeSummary: resumeSession.resumeSummary,
                    notes: evaluation.notes,
                    transcript
                });

                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify(evaluationPayload));
                }

                return evaluationPayload;
            } catch (error) {
                console.error("Evaluation save error:", error.message);
            }
        }

        async function finalizeInterview(reason, closeAfterSend) {
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
    });
}