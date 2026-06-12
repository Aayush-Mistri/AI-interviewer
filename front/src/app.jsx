import { useRef, useState } from "react";

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || "ws://localhost:3001";

export default function App() {
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const playTimeRef = useRef(0);

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  async function startInterview() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not available in this browser/context.");
      return;
    }

    const ws = new WebSocket(AGENT_WS_URL);
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

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        const msg = safeParseEvent(event.data);
        console.log("Event:", msg);
        setEvents((prev) => [...prev.slice(-10), msg]);
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

    ws.onclose = () => {
      setConnected(false);
      stopMic();
    };
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
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
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
    stopMic();
    wsRef.current?.close();
    setConnected(false);
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
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 20,
        padding: 32,
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ marginBottom: 28 }}>
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
          Start a real-time voice interview session with your AI agent.
        </p>
      </div>

      {!connected ? (
        <button
          onClick={startInterview}
          style={{
            background: "#22c55e",
            color: "#052e16",
            border: "none",
            padding: "12px 22px",
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(34, 197, 94, 0.25)",
          }}
        >
          Start Interview
        </button>
      ) : (
        <button
          onClick={stopInterview}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            padding: "12px 22px",
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(239, 68, 68, 0.25)",
          }}
        >
          Stop Interview
        </button>
      )}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginLeft: 14,
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

      <div style={{ marginTop: 32 }}>
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
            ? events.map((e, i) => JSON.stringify(e, null, 2)).join("\n\n")
            : "No events yet. Start the interview to see live agent events here."}
        </pre>
      </div>
    </div>
  </div>
);

}
