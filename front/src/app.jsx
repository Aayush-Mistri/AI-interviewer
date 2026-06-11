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
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>AI Interviewer</h1>

      {!connected ? (
        <button onClick={startInterview}>Start Interview</button>
      ) : (
        <button onClick={stopInterview}>Stop Interview</button>
      )}

      {error && (
        <p style={{ color: "#b00020", maxWidth: 720 }}>
          {error}
        </p>
      )}

      <h3>Events</h3>
      <pre style={{ background: "#111", color: "#0f0", padding: 15 }}>
        {events.map((e, i) => JSON.stringify(e, null, 2)).join("\n\n")}
      </pre>
    </div>
  );
}
