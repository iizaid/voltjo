import type { CustomerProfileDraft } from "@/lib/onboarding/types";

export const ONBOARDING_STORAGE_KEY = "voltjo:onboarding:draft";
export const ONBOARDING_PROGRESS_KEY = "voltjo:onboarding:progress";
export const ONBOARDING_PRIVACY_CONSENT_KEY = "voltjo_privacy_onboarding_consent";

export interface OnboardingProgress {
  flowState: "intro" | "consent" | "questions" | "auth";
  currentQuestionIndex: number;
}

function getLocalStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(data: CustomerProfileDraft) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Onboarding persistence is best-effort until backend storage is added.
  }
}

export function loadOnboardingDraft(): CustomerProfileDraft | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  let rawDraft: string | null;
  try {
    rawDraft = storage.getItem(ONBOARDING_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!rawDraft) return null;

  try {
    const parsedDraft = JSON.parse(rawDraft);
    if (!parsedDraft || typeof parsedDraft !== "object") return null;
    return parsedDraft as CustomerProfileDraft;
  } catch {
    return null;
  }
}

export function saveOnboardingProgress(data: OnboardingProgress) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // Onboarding persistence is best-effort until backend storage is added.
  }
}

export function loadOnboardingProgress(): OnboardingProgress | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(ONBOARDING_PROGRESS_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !["intro", "consent", "questions", "auth"].includes(parsed.flowState) ||
      typeof parsed.currentQuestionIndex !== "number"
    ) {
      return null;
    }
    return parsed as OnboardingProgress;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.removeItem(ONBOARDING_STORAGE_KEY);
    storage.removeItem(ONBOARDING_PROGRESS_KEY);
  } catch {
    // Onboarding persistence is best-effort until backend storage is added.
  }
}

export function loadOnboardingPrivacyConsent() {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    return storage.getItem(ONBOARDING_PRIVACY_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function saveOnboardingPrivacyConsent() {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(ONBOARDING_PRIVACY_CONSENT_KEY, "accepted");
  } catch {
    // Onboarding consent persistence is best-effort on the current browser.
  }
}
