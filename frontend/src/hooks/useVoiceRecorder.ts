"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WAVEFORM_BARS = 26;

interface RecognitionEventResult {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEventResult) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof Ctor === "function"
    ? (Ctor as new () => SpeechRecognitionLike)
    : null;
}

export interface VoiceRecorder {
  supported: boolean;
  listening: boolean;
  duration: number;
  waveform: number[];
  transcript: string | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  cancel: () => void;
}

function idleWaveform(): number[] {
  return Array.from({ length: WAVEFORM_BARS }, () => 10);
}

export function useVoiceRecorder(): VoiceRecorder {
  const supported =
    typeof navigator !== "undefined" && "mediaDevices" in navigator && "MediaRecorder" in window;

  const [listening, setListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(idleWaveform);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);
  const waveRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveRef.current !== null) {
      window.clearInterval(waveRef.current);
      waveRef.current = null;
    }
  }, []);

  const teardownStream = useCallback(() => {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      recognitionRef.current?.abort();
      teardownStream();
    };
  }, [clearTimers, teardownStream]);

  const start = useCallback(async () => {
    if (!supported || listening) return;
    setError(null);
    setTranscript(null);
    setDuration(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch {
      setError("Microphone access was denied. Enable the microphone and try again.");
      return;
    }

    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      teardownStream();
    };
    recorder.start();
    mediaRecorderRef.current = recorder;

    const Recognition = getSpeechRecognition();
    if (Recognition) {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result && result[0]) {
            text += result[0].transcript;
          }
        }
        setTranscript(text.trim());
      };
      recognition.onerror = () => setError("Voice recognition unavailable. You can still send the recording.");
      recognition.start();
      recognitionRef.current = recognition;
    }

    setListening(true);
    setWaveform(idleWaveform);

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    waveRef.current = window.setInterval(() => {
      setWaveform((prev) =>
        prev.map((_, i) => 18 + Math.abs(Math.sin(i * 1.3 + Date.now() / 140)) * 62)
      );
    }, 140);
  }, [listening, supported, teardownStream]);

  const stop = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      clearTimers();
      setWaveform(idleWaveform);

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        setListening(false);
        recognitionRef.current = null;
        resolve(transcript || null);
      };

      const recognition = recognitionRef.current;
      const recorder = mediaRecorderRef.current;

      if (recognition) {
        recognition.onend = () => finish();
        try {
          recognition.stop();
        } catch {
          // recognition already stopped
        }
      }

      if (recorder && recorder.state !== "inactive") {
        recorder.addEventListener("stop", finish, { once: true });
        recorder.stop();
      } else {
        finish();
      }
    });
  }, [clearTimers, transcript]);

  const cancel = useCallback(() => {
    clearTimers();
    setWaveform(idleWaveform);
    setListening(false);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    teardownStream();
  }, [clearTimers, teardownStream]);

  return { supported, listening, duration, waveform, transcript, error, start, stop, cancel };
}