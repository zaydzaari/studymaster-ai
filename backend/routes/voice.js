import { GoogleGenAI } from '@google/genai';
import { buildVoiceTutorPrompt } from '../utils/gemini.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.1-flash-live-preview';
const WS_OPEN = 1;

export function setupVoiceWebSocket(wss) {
  wss.on('connection', (ws) => {
    let session = null;
    let inactivityTimer = null;

    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => ws.close(1000, 'Timeout'), 120_000);
    }

    function send(obj) {
      if (ws.readyState === WS_OPEN) ws.send(JSON.stringify(obj));
    }

    function cleanup() {
      clearTimeout(inactivityTimer);
      try { session?.close(); } catch {}
      session = null;
    }

    ws.on('message', async (data) => {
      resetTimer();
      try {
        // JSON control messages start with '{'
        if (data instanceof Buffer && data[0] === 0x7b) {
          const msg = JSON.parse(data.toString());

          if (msg.type === 'start') {
            if (session) try { session.close(); } catch {}

            session = await ai.live.connect({
              model: MODEL,
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Aoede' },
                  },
                },
                systemInstruction: {
                  parts: [{ text: buildVoiceTutorPrompt(msg.context) }],
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
              callbacks: {
                onopen() {
                  send({ type: 'connected' });
                },
                onmessage(message) {
                  if (ws.readyState !== WS_OPEN) return;

                  // Input transcription (user's spoken words)
                  const inputTx =
                    message.inputTranscription ??
                    message.serverContent?.inputTranscription;
                  if (inputTx?.text) {
                    send({
                      type: 'inputTranscript',
                      text: inputTx.text,
                      final: inputTx.isFinal !== false,
                    });
                  }

                  // Output transcription (tutor's spoken words)
                  const outputTx =
                    message.outputTranscription ??
                    message.serverContent?.outputTranscription;
                  if (outputTx?.text) {
                    send({ type: 'outputTranscript', text: outputTx.text });
                  }

                  // Audio data
                  const parts = message.serverContent?.modelTurn?.parts ?? [];
                  for (const part of parts) {
                    if (part.inlineData?.data) {
                      ws.send(Buffer.from(part.inlineData.data, 'base64'));
                    }
                  }

                  // User interrupted the AI mid-speech
                  if (message.serverContent?.interrupted) {
                    send({ type: 'interrupted' });
                  }

                  // Turn complete
                  if (message.serverContent?.turnComplete) {
                    send({ type: 'turnComplete' });
                  }
                },
                onerror(err) {
                  console.error('Gemini Live error:', err);
                  send({ type: 'error', message: 'AI connection error' });
                },
                onclose() {
                  send({ type: 'sessionEnded' });
                },
              },
            });
          }

          if (msg.type === 'stop') cleanup();
        } else if (session) {
          // Binary frame = raw PCM-16 audio at 16 kHz from the client
          session.sendRealtimeInput({
            audio: { data: data.toString('base64'), mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('Voice WS error:', err.message);
        send({ type: 'error', message: err.message });
      }
    });

    ws.on('close', cleanup);
    ws.on('error', () => cleanup());

    resetTimer();
  });
}
