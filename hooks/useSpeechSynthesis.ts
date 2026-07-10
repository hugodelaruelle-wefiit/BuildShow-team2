"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * useSpeechSynthesis — thin wrapper around the browser Web Speech API (TTS).
 *
 * Used to make the "client" speak its questions aloud during the Q&R. Picks a
 * French voice when one is available, and reports `speaking` so the UI can
 * gate the microphone until the question has finished being read.
 */

interface UseSpeechSynthesisResult {
  supported: boolean;
  speaking: boolean;
  /** Speak `text`; resolves (via onDone) once reading finishes or is cancelled. */
  speak: (text: string, onDone?: () => void) => void;
  cancel: () => void;
}

const subscribeNoop = () => () => {};

export function useSpeechSynthesis(lang = "fr-FR"): UseSpeechSynthesisResult {
  // Read browser support without an effect so SSR/hydration stay in sync.
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );

  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onDone?.();
        return;
      }
      // Clear anything queued so questions never overlap.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const frenchVoice = voicesRef.current.find((v) =>
        v.lang?.toLowerCase().startsWith("fr"),
      );
      if (frenchVoice) utterance.voice = frenchVoice;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onDone?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onDone?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [lang],
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, cancel };
}
