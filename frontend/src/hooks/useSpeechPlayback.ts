"use client";

import { useCallback, useEffect, useState } from "react";

export interface PlaybackController {
  supported: boolean;
  speaking: boolean;
  voiceMode: boolean;
  toggleVoiceMode: () => void;
  speak: (id: string, text: string) => void;
  stop: () => void;
  isSpeaking: (id: string) => boolean;
}

export function useSpeechPlayback(): PlaybackController {
  const [speaking, setSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      stop();
      if (!supported || !text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.onend = () => {
        setSpeaking(false);
        setSpeakingId(null);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setSpeakingId(null);
      };

      setSpeakingId(id);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [stop, supported]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((prev) => {
      if (prev) stop();
      return !prev;
    });
  }, [stop]);

  return {
    supported,
    speaking,
    voiceMode,
    toggleVoiceMode,
    speak,
    stop,
    isSpeaking: (id: string) => speaking && speakingId === id,
  };
}