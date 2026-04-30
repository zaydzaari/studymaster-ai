import { useState, useRef, useCallback, useEffect } from "react";

const RATE_IN = 16000;
const RATE_OUT = 24000;

function getWsUrl() {
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
  const [status, setStatus] = useState("idle"); // idle | connecting | listening | speaking | error
  const [transcript, setTranscript] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

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

  const supported =
    typeof WebSocket !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator?.mediaDevices?.getUserMedia;

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

  const scheduleAudio = useCallback((buf) => {
    try {
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
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: RATE_IN, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: RATE_IN });
      await ctx.resume();
      inCtxRef.current = ctx;

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
          wsRef.current.send(f32ToI16(e.inputBuffer.getChannelData(0)).buffer);
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
      setErrorMsg(
        err.name === "NotAllowedError"
          ? "Please allow microphone access to use the AI Tutor."
          : "Could not access microphone. Please try again."
      );
      setStatus("error");
      return false;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopMic();
    stopPlayback();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [stopMic, stopPlayback]);

  const open = useCallback(async (studyData) => {
    if (!supported) return;
    studyDataRef.current = studyData;
    setIsOpen(true);
    setStatus("connecting");
    setTranscript([]);
    setErrorMsg(null);

    // Request mic immediately while in user-gesture context
    const micOk = await startMic();
    if (!micOk) return;

    try {
      const ws = new WebSocket(getWsUrl());
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "start", context: studyData }));
      };

      ws.onmessage = (evt) => {
        if (evt.data instanceof ArrayBuffer) {
          scheduleAudio(evt.data);
          return;
        }
        const msg = JSON.parse(evt.data);

        if (msg.type === "connected") {
          setStatus("listening");
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
        } else if (msg.type === "turnComplete") {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && !last.final) return [...prev.slice(0, -1), { ...last, final: true }];
            return prev;
          });
        } else if (msg.type === "sessionEnded") {
          setStatus("idle");
          stopMic();
        } else if (msg.type === "error") {
          setErrorMsg(msg.message || "Connection error. Please try again.");
          setStatus("error");
          stopMic();
        }
      };

      ws.onerror = () => {
        setErrorMsg("Could not connect to AI Tutor. Please try again.");
        setStatus("error");
        stopMic();
      };

      ws.onclose = () => {
        stopMic();
        setStatus(s => (s === "error" ? s : "idle"));
      };
    } catch {
      setErrorMsg("Could not connect. Please try again.");
      setStatus("error");
      stopMic();
    }
  }, [supported, startMic, stopMic, scheduleAudio]);

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

  return { isOpen, status, transcript, errorMsg, audioLevel, supported, open, close, retry };
}
