"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onClear: () => void;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme?: "light" | "dark" | "auto";
      language?: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_ID = "voltjo-turnstile-script";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile is browser-only."));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      TURNSTILE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Turnstile.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Turnstile.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function TurnstileWidget({ onVerify, onClear }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const siteKey = useMemo(
    () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "",
    [],
  );

  useEffect(() => {
    if (!siteKey) {
      onClear();
      return;
    }

    let isMounted = true;

    loadTurnstileScript()
      .then(() => {
        if (!isMounted || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: "ar",
          theme: "light",
          callback: (token) => {
            onVerify(token);
            setLoadError(false);
          },
          "expired-callback": onClear,
          "error-callback": () => {
            onClear();
            setLoadError(true);
          },
        });
      })
      .catch(() => {
        if (!isMounted) return;
        onClear();
        setLoadError(true);
      });

    return () => {
      isMounted = false;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onClear, onVerify, siteKey]);

  if (!siteKey) {
    return (
      <div className="rounded-[14px] border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] px-4 py-3 text-xs font-bold leading-6 text-[var(--voltjo-muted)]">
        التحقق الآلي غير مفعّل في هذه البيئة.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="min-h-[65px] rounded-[14px] border border-[var(--voltjo-border)] bg-white px-3 py-2"
      />
      {loadError ? (
        <p className="text-xs font-bold leading-6 text-red-700">
          تعذر تحميل التحقق الآلي. أعد المحاولة.
        </p>
      ) : null}
    </div>
  );
}
