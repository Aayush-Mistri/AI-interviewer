import { useRef, useState } from "react";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || AGENT_WS_URL.replace(/^ws/, "http");

export default function App() {
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const playTimeRef = useRef(0);
  const evaluationRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSession, setResumeSession] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const transcriptLinesRef = useRef([]);
  const transcriptTurnsRef = useRef([]);

  async function uploadResume() {
    setError("");
    setNotice("");

    if (!resumeFile) {
      setError("Please choose a PDF resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/resume`, {
        method: "POST",
        body: formData
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not process resume.");
      }

      setResumeSession(data);
      setEvaluation(null);
      evaluationRef.current = null;
      setNotice(`Resume ready for ${data.candidateName}.`);
    } catch (err) {
      setResumeSession(null);
      setError(
        err.message === "Failed to fetch"
          ? `Could not reach backend at ${API_URL}. Make sure the backend is running with npm run dev in the back folder.`
          : err.message || "Could not upload resume."
      );
    } finally {
      setUploading(false);
    }
  }

  async function parseJsonResponse(response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async function startInterview() {
    transcriptLinesRef.current = [];
    transcriptTurnsRef.current = [];
    evaluationRef.current = null;
    setEvaluation(null);
    setNotice("");
    setError("");
  
    

    if (!resumeSession?.sessionId) {
      setError("Upload and process a resume before starting the interview.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not available in this browser/context.");
      return;
    }

    const wsUrl = withSessionId(AGENT_WS_URL, resumeSession.sessionId);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        setConnected(true);
        await startMic();
      } catch (err) {
        setError(err.message || "Could not start microphone.");
        ws.close();
      }
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = safeParseEvent(event.data);

        console.log("Event:", msg);
        setEvents((prev) => [...prev.slice(-10), msg]);

        // Store structured transcript
        if (
          msg.type === "ConversationText" &&
          msg.role &&
          msg.content
        ) {
          const speaker =
            msg.role === "assistant" ? "interviewer" : "user";

          transcriptTurnsRef.current.push({
            speaker,
            text: msg.content,
          });

          console.log("Structured transcript:", transcriptTurnsRef.current);

          console.log(
            "Formatted transcript:\n",
            transcriptTurnsRef.current
              .map((turn) => `${turn.speaker}: ${turn.text}`)
              .join("\n")
          );
        }

        if (msg.type === "InterviewEnded") {
          if (msg.type === "InterviewEnded") {
            const formattedTranscript = transcriptTurnsRef.current
              .map((turn) => {
                const label =
                  turn.speaker === "interviewer" ? "Interviewer" : "Candidate";

                return `${label}: ${turn.text}`;
              })
              .join("\n");

            console.log("FINAL STRUCTURED TRANSCRIPT:\n", formattedTranscript);

            const response = await fetch("http://localhost:3001/api/evaluate-local", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                transcript: formattedTranscript,
              }),
            });

            const evaluation = await response.json();

            console.log("LOCAL LLM EVALUATION:", evaluation);

            setNotice("Local LLM evaluation completed.");
          }
        }

        if (msg.type === "EvaluationSaved") {
          setEvaluation(msg);
          evaluationRef.current = msg;
          setNotice(`Evaluation saved. Score: ${msg.score}/100.`);
        }

        if (msg.type === "Error" || msg.error) {
          setError(msg.message || msg.error || "Voice agent returned an error.");
        }
      } else {
        playPCM(event.data);
      }
    };

    ws.onerror = () => {
      setError(`Could not connect to voice server at ${AGENT_WS_URL}.`);
    };

    ws.onclose = async () => {
      setConnected(false);
      setStopping(false);
      stopMic();

      if (!evaluationRef.current && resumeSession?.sessionId) {
        await fetchEvaluation(resumeSession.sessionId);
      }
    };
  }

  async function fetchEvaluation(sessionId) {
    try {
      const response = await fetch(`${API_URL}/evaluation/${encodeURIComponent(sessionId)}`);
      const data = await parseJsonResponse(response);

      if (response.ok) {
        setEvaluation(data);
        evaluationRef.current = data;
        setNotice(`Evaluation saved. Score: ${data.score}/100.`);
      }
    } catch {
      setNotice("Interview ended. Evaluation was saved locally if enough conversation was recorded.");
    }
  }

  function withSessionId(wsUrl, sessionId) {
    const separator = wsUrl.includes("?") ? "&" : "?";
    return `${wsUrl}${separator}sessionId=${encodeURIComponent(sessionId)}`;
  }

  function safeParseEvent(data) {
    try {
      return JSON.parse(data);
    } catch {
      return { type: "Message", message: data };
    }
  }

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(input);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(pcm16);
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
  }

  function floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return buffer;
  }

  function playPCM(arrayBuffer) {
    const audioCtx = audioCtxRef.current || new AudioContext({ sampleRate: 24000 });

    if (!audioCtxRef.current) {
      audioCtxRef.current = audioCtx;
    }

    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const startAt = Math.max(now, playTimeRef.current);
    source.start(startAt);

    playTimeRef.current = startAt + audioBuffer.duration;
  }

  function stopMic() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();

    streamRef.current?.getTracks().forEach((track) => track.stop());

    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
  }

  function stopInterview() {
    setStopping(true);
    setNotice("Ending interview and calculating score...");
    stopMic();

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "EndInterview" }));
      return;
    }

    wsRef.current?.close();
    setConnected(false);
    setStopping(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #111827)",
        color: "#f9fafb",
        fontFamily: "Inter, Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 820,
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <section style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              letterSpacing: "-0.04em",
            }}
          >
            AI Interviewer
          </h1>

          <p
            style={{
              marginTop: 8,
              color: "#9ca3af",
              fontSize: 15,
            }}
          >
            New generation of hiring
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gap: 14,
            marginBottom: 24,
            padding: 18,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            background: "rgba(2, 6, 23, 0.35)",
          }}
        >
          <label style={{ color: "#d1d5db", fontSize: 14, fontWeight: 700 }}>
            Resume PDF
          </label>

          <input
            type="file"
            accept="application/pdf"
            disabled={connected}
            onChange={(event) => {
              setResumeFile(event.target.files?.[0] || null);
              setResumeSession(null);
              setNotice("");
              setError("");
            }}
            style={{
              color: "#e5e7eb",
              background: "#020617",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: 12,
              padding: 12,
            }}
          />

          <button
            onClick={uploadResume}
            disabled={!resumeFile || uploading || connected}
            style={{
              justifySelf: "start",
              background: resumeFile && !uploading && !connected ? "#38bdf8" : "#475569",
              color: "#07111f",
              border: "none",
              padding: "11px 18px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
              cursor: resumeFile && !uploading && !connected ? "pointer" : "not-allowed",
            }}
          >
            {uploading ? "Processing Resume..." : "Process Resume"}
          </button>

          {resumeSession && (
            <div
              style={{
                color: "#bae6fd",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>Candidate:</strong> {resumeSession.candidateName}
            </div>
          )}
        </section>

        <section style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {!connected ? (
            <button
              onClick={startInterview}
              disabled={!resumeSession}
              style={{
                background: resumeSession ? "#22c55e" : "#475569",
                color: resumeSession ? "#052e16" : "#cbd5e1",
                border: "none",
                padding: "12px 22px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                cursor: resumeSession ? "pointer" : "not-allowed",
                boxShadow: resumeSession ? "0 10px 25px rgba(34, 197, 94, 0.25)" : "none",
              }}
            >
              Start Interview
            </button>
          ) : (
            <button
              onClick={stopInterview}
              disabled={stopping}
              style={{
                background: stopping ? "#64748b" : "#ef4444",
                color: "#fff",
                border: "none",
                padding: "12px 22px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                cursor: stopping ? "wait" : "pointer",
                boxShadow: "0 10px 25px rgba(239, 68, 68, 0.25)",
              }}
            >
              {stopping ? "Scoring..." : "Stop Interview"}
            </button>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: connected ? "#86efac" : "#fca5a5",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connected ? "#22c55e" : "#ef4444",
                display: "inline-block",
              }}
            />
            {connected ? "Connected" : "Disconnected"}
          </div>
        </section>

        {notice && (
          <p
            style={{
              marginTop: 20,
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              color: "#bbf7d0",
              padding: "12px 14px",
              borderRadius: 12,
              maxWidth: 720,
              fontSize: 14,
            }}
          >
            {notice}
          </p>
        )}

        {error && (
          <p
            style={{
              marginTop: 20,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fecaca",
              padding: "12px 14px",
              borderRadius: 12,
              maxWidth: 720,
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}

        {evaluation && (
          <section
            style={{
              marginTop: 24,
              padding: 18,
              borderRadius: 16,
              border: "1px solid rgba(56, 189, 248, 0.35)",
              background: "rgba(14, 165, 233, 0.12)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
              Evaluation Score: {evaluation.score}/100
            </h3>
            <p style={{ margin: 0, color: "#bae6fd", fontSize: 14 }}>
              Questions answered: {evaluation.questionsAnswered}/5
            </p>
            {evaluation.notes && (
              <p style={{ margin: "10px 0 0", color: "#dbeafe", fontSize: 13, lineHeight: 1.5 }}>
                {evaluation.notes}
              </p>
            )}
          </section>
        )}

        <section style={{ marginTop: 32 }}>
          <h3
            style={{
              marginBottom: 12,
              fontSize: 18,
            }}
          >
            Events
          </h3>

          <pre
            style={{
              background: "#020617",
              color: "#22c55e",
              padding: 18,
              borderRadius: 14,
              minHeight: 220,
              maxHeight: 360,
              overflow: "auto",
              fontSize: 13,
              lineHeight: 1.5,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {events.length
              ? events.map((event) => JSON.stringify(event, null, 2)).join("\n\n")
              : "No events yet. Upload a resume and start the interview to see live agent events here."}
          </pre>
        </section>
      </main>
    </div>
  );
}
