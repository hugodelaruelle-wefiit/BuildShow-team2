"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * useSpeechRecognition — thin wrapper around the browser Web Speech API (STT).
 *
 * Captures the pitch and Q&R answers as live text. Final segments are streamed
 * to `onFinalResult` (so the caller owns/edits the accumulated transcript),
 * while `interim` holds the in-progress words for a live display.
 *
 * Browser support is Chrome-first (WebKit prefix); `supported` is false
 * elsewhere so the UI can fall back to typed input.
 */

interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag. Defaults to French. */
  lang?: string;
  /** Called with each finalized chunk of transcript as it is recognized. */
  onFinalResult?: (chunk: string) => void;
}

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  /** Words recognized but not yet finalized — for a live preview. */
  interim: string;
  /** A user-facing error label, or null. */
  error: string | null;
  start: () => void;
  stop: () => void;
}

const subscribeNoop = () => () => {};

function getRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const { lang = "fr-FR", onFinalResult } = options;

  // Read browser support without an effect so SSR/hydration stay in sync.
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => getRecognitionCtor() !== undefined,
    () => false,
  );

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Keep the latest callback in a ref so restarting recognition isn't needed
  // when the caller passes a new closure on each render.
  const onFinalResultRef = useRef(onFinalResult);
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  });

  // Whether the user still wants to be listening. `continuous` recognition can
  // fire `onend` on its own (silence, timeouts); we auto-restart while true.
  const wantListeningRef = useRef(false);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let liveInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          onFinalResultRef.current?.(text);
        } else {
          liveInterim += text;
        }
      }
      setInterim(liveInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech"/"aborted" are benign in continuous mode — ignore them.
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Micro non autorisé. Vérifiez les permissions du navigateur.");
        wantListeningRef.current = false;
        setListening(false);
      } else {
        setError("La reconnaissance vocale a rencontré un problème.");
      }
    };

    recognition.onend = () => {
      setInterim("");
      // Auto-restart if the user hasn't explicitly stopped.
      if (wantListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // start() throws if already started — safe to ignore.
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || wantListeningRef.current) return;
    setError(null);
    wantListeningRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // Already started — keep the listening state.
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    wantListeningRef.current = false;
    setListening(false);
    setInterim("");
    recognition?.stop();
  }, []);

  return { supported, listening, interim, error, start, stop };
}
