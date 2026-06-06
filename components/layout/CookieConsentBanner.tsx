"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "voltjo_cookie_consent";
const INITIAL_LOADER_KEY = "voltjo:initial-loader:seen";
const INITIAL_LOADER_COMPLETE_EVENT = "voltjo:initial-loader:complete";

function hasAcceptedCookieConsent() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function hasCompletedInitialLoader() {
  try {
    return (
      document.documentElement.dataset.voltjoInitialLoader === "complete" ||
      ["true", "complete"].includes(
        window.sessionStorage.getItem(INITIAL_LOADER_KEY) ?? "",
      )
    );
  } catch {
    return true;
  }
}

function saveCookieConsent() {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
  } catch {
    // Consent persistence is best-effort if localStorage is unavailable.
  }

  document.cookie =
    `${COOKIE_CONSENT_KEY}=accepted; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasAcceptedCookieConsent()) return undefined;

    let revealTimer: number | null = null;

    const reveal = () => {
      if (hasAcceptedCookieConsent()) return;
      revealTimer = window.setTimeout(() => setIsVisible(true), 220);
    };

    if (hasCompletedInitialLoader()) {
      revealTimer = window.setTimeout(() => setIsVisible(true), 650);
    } else {
      window.addEventListener(INITIAL_LOADER_COMPLETE_EVENT, reveal, {
        once: true,
      });
      revealTimer = window.setTimeout(() => setIsVisible(true), 3900);
    }

    return () => {
      if (revealTimer) window.clearTimeout(revealTimer);
      window.removeEventListener(INITIAL_LOADER_COMPLETE_EVENT, reveal);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl rounded-[22px] border border-[var(--voltjo-border)] bg-white/96 p-4 text-right shadow-[0_22px_70px_rgba(13,13,13,0.12)] backdrop-blur-md sm:bottom-5 sm:p-5"
      role="region"
      aria-label="إشعار ملفات الارتباط"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-black text-[var(--voltjo-black)]">
            إشعار ملفات الارتباط
          </p>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
            يستخدم VoltJo ملفات ارتباط وتخزينًا محليًا أساسيًا لتسجيل الدخول،
            حفظ التفضيلات، وتحسين تجربة الاستخدام. لا توجد ملفات تتبع تسويقي
            مفعّلة حاليًا.
          </p>
          <Link
            href="/privacy"
            className="mt-2 inline-flex text-sm font-black text-[var(--voltjo-black)] underline decoration-[rgba(255,77,0,0.32)] underline-offset-4 hover:text-[var(--voltjo-orange-dark)]"
          >
            سياسة الخصوصية
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            saveCookieConsent();
            setIsVisible(false);
          }}
          className="voltjo-action-button on-dark-fg inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)] px-7 text-sm font-bold text-white shadow-[0_10px_22px_rgba(255,77,0,0.18)] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.28)] focus-visible:ring-offset-2"
        >
          <span className="voltjo-action-transition" aria-hidden="true" />
          <span className="voltjo-action-gradient" aria-hidden="true" />
          <span className="voltjo-action-label">قبول</span>
        </button>
      </div>
    </aside>
  );
}
