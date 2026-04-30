import { useState, useRef, useCallback, useEffect } from "react";

const RATE_IN = 16000;
const RATE_OUT = 24000;

function getWsUrl() {
  // Explicit WebSocket URL (set on Vercel pointing to Railway backend)
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

  // Derive from API base URL if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
      .replace(/^https:/, "wss:")
      .replace(/^http:/, "ws:") + "/api/voice";
  }

  // Local dev — same host via Vite proxy
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/voice`;
}

function f32ToI16(f32) {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
  }
  return i16;
}

export function useVoiceTutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Debug state
  const [voiceDebug, setVoiceDebug] = useState({
    wsUrl: null,
    wsState: "disconnected",
    micGranted: null,
    micSampleRate: null,
    sessionConnected: false,
    chunksSent: 0,
    bytesSent: 0,
    chunksReceived: 0,
    bytesReceived: 0,
    lastError: null,
    processorType: null,
    openedAt: null,
  });

  const wsRef = useRef(null);
  const inCtxRef = useRef(null);
  const outCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const nextPlayRef = useRef(0);
  const studyDataRef = useRef(null);
  const chunksSentRef = useRef(0);
  const bytesSentRef = useRef(0);
  const chunksReceivedRef = useRef(0);
  const bytesReceivedRef = useRef(0);

  const patchDebug = useCallback((patch) => {
    setVoiceDebug(prev => ({ ...prev, ...patch }));
  }, []);

  const supported =
    typeof WebSocket !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator?.mediaDevices?.getUserMedia;

  const unavailableOnDeploy = false;

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { processorRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { inCtxRef.current?.close(); } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    processorRef.current = null;
    sourceRef.current = null;
    inCtxRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopPlayback = useCallback(() => {
    try { outCtxRef.current?.close(); } catch {}
    outCtxRef.current = null;
    nextPlayRef.current = 0;
  }, []);

  // Hard-stop all queued audio (on barge-in interrupt)
  const killAudio = useCallback(() => {
    try { outCtxRef.current?.close(); } catch {}
    outCtxRef.current = null;
    nextPlayRef.current = 0;
  }, []);

  const scheduleAudio = useCallback((buf) => {
    try {
      chunksReceivedRef.current++;
      bytesReceivedRef.current += buf.byteLength;
      patchDebug({ chunksReceived: chunksReceivedRef.current, bytesReceived: bytesReceivedRef.current });

      if (!outCtxRef.current || outCtxRef.current.state === "closed") {
        outCtxRef.current = new AudioContext({ sampleRate: RATE_OUT });
        nextPlayRef.current = outCtxRef.current.currentTime + 0.05;
      }
      const ctx = outCtxRef.current;
      const i16 = new Int16Array(buf);
      const f32 = new Float32Array(i16.length);
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;

      const ab = ctx.createBuffer(1, f32.length, RATE_OUT);
      ab.copyToChannel(f32, 0);
      const src = ctx.createBufferSource();
      src.buffer = ab;
      src.connect(ctx.destination);

      const t = Math.max(ctx.currentTime + 0.02, nextPlayRef.current);
      src.start(t);
      nextPlayRef.current = t + ab.duration;

      setStatus("speaking");
      src.onended = () => {
        if (outCtxRef.current && nextPlayRef.current <= outCtxRef.current.currentTime + 0.1) {
          setStatus("listening");
        }
      };
    } catch {}
  }, [patchDebug]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: RATE_IN, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();

      const ctx = new AudioContext({ sampleRate: RATE_IN });
      await ctx.resume();
      inCtxRef.current = ctx;

      patchDebug({
        micGranted: true,
        micSampleRate: settings.sampleRate || ctx.sampleRate,
        processorType: "ScriptProcessor",
      });

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // eslint-disable-next-line no-undef
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const pcm = f32ToI16(e.inputBuffer.getChannelData(0)).buffer;
          wsRef.current.send(pcm);
          chunksSentRef.current++;
          bytesSentRef.current += pcm.byteLength;
          // update every 10 chunks to avoid excessive re-renders
          if (chunksSentRef.current % 10 === 0) {
            patchDebug({ chunksSent: chunksSentRef.current, bytesSent: bytesSentRef.current });
          }
        }
      };
      source.connect(processor);
      processor.connect(ctx.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setAudioLevel(data.reduce((a, b) => a + b, 0) / data.length / 128);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return true;
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Mic blocked — please allow microphone in browser settings."
        : `Mic error: ${err.name} — ${err.message}`;
      setErrorMsg(msg);
      setStatus("error");
      patchDebug({ micGranted: false, lastError: msg });
      return false;
    }
  }, [patchDebug]);

  const cleanup = useCallback(() => {
    stopMic();
    stopPlayback();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    patchDebug({ wsState: "disconnected", sessionConnected: false });
  }, [stopMic, stopPlayback, patchDebug]);

  const open = useCallback(async (studyData) => {
    if (!supported) return;
    studyDataRef.current = studyData;
    setIsOpen(true);
    setStatus("connecting");
    setTranscript([]);
    setErrorMsg(null);

    chunksSentRef.current = 0;
    bytesSentRef.current = 0;
    chunksReceivedRef.current = 0;
    bytesReceivedRef.current = 0;

    const wsUrl = getWsUrl();
    patchDebug({
      wsUrl,
      wsState: "connecting",
      sessionConnected: false,
      chunksSent: 0,
      bytesSent: 0,
      chunksReceived: 0,
      bytesReceived: 0,
      lastError: null,
      openedAt: new Date().toISOString(),
    });

    const micOk = await startMic();
    if (!micOk) return;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        patchDebug({ wsState: "open" });
        ws.send(JSON.stringify({ type: "start", context: studyData }));
      };

      ws.onmessage = (evt) => {
        if (evt.data instanceof ArrayBuffer) {
          scheduleAudio(evt.data);
          return;
        }

        let msg;
        try {
          msg = JSON.parse(evt.data);
        } catch {
          // Non-JSON frame (e.g. tunnel close message) — ignore silently
          return;
        }

        if (msg.type === "connected") {
          setStatus("listening");
          patchDebug({ sessionConnected: true });
        } else if (msg.type === "inputTranscript") {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "user" && !last.final) {
              return [...prev.slice(0, -1), { role: "user", text: msg.text, final: msg.final }];
            }
            return [...prev, { role: "user", text: msg.text, final: msg.final }];
          });
        } else if (msg.type === "outputTranscript") {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "tutor" && !last.final) {
              return [...prev.slice(0, -1), { role: "tutor", text: last.text + msg.text, final: false }];
            }
            return [...prev, { role: "tutor", text: msg.text, final: false }];
          });
        } else if (msg.type === "interrupted") {
          // User spoke while AI was talking — kill queued audio immediately
          killAudio();
          setStatus("listening");
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && !last.final) return [...prev.slice(0, -1), { ...last, final: true }];
            return prev;
          });
        } else if (msg.type === "turnComplete") {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && !last.final) return [...prev.slice(0, -1), { ...last, final: true }];
            return prev;
          });
          patchDebug({ chunksSent: chunksSentRef.current, bytesSent: bytesSentRef.current });
        } else if (msg.type === "sessionEnded") {
          setStatus("idle");
          stopMic();
          patchDebug({ wsState: "disconnected", sessionConnected: false });
        } else if (msg.type === "error") {
          const errMsg = msg.message || "Connection error. Please try again.";
          setErrorMsg(errMsg);
          setStatus("error");
          stopMic();
          patchDebug({ lastError: errMsg, wsState: "error" });
        }
      };

      ws.onerror = (e) => {
        const errMsg = "WebSocket error — cannot reach backend at " + wsUrl;
        setErrorMsg(errMsg);
        setStatus("error");
        stopMic();
        patchDebug({ wsState: "error", sessionConnected: false, lastError: errMsg });
      };

      ws.onclose = (e) => {
        stopMic();
        setStatus(s => (s === "error" ? s : "idle"));
        patchDebug({ wsState: "disconnected", sessionConnected: false });
      };
    } catch (err) {
      const errMsg = `Could not connect: ${err.message}`;
      setErrorMsg(errMsg);
      setStatus("error");
      stopMic();
      patchDebug({ wsState: "error", lastError: errMsg });
    }
  }, [supported, startMic, stopMic, scheduleAudio, killAudio, patchDebug]);

  const close = useCallback(() => {
    cleanup();
    setIsOpen(false);
    setStatus("idle");
    setTranscript([]);
    setErrorMsg(null);
  }, [cleanup]);

  const retry = useCallback(() => {
    cleanup();
    setStatus("idle");
    setErrorMsg(null);
    setTimeout(() => open(studyDataRef.current), 100);
  }, [cleanup, open]);

  useEffect(() => cleanup, [cleanup]);

  return { isOpen, status, transcript, errorMsg, audioLevel, supported, unavailableOnDeploy, open, close, retry, voiceDebug };
}
