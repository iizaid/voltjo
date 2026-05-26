import type { CustomerProfileDraft } from "@/lib/onboarding/types";

export const ONBOARDING_STORAGE_KEY = "voltjo:onboarding:draft";
export const ONBOARDING_PROGRESS_KEY = "voltjo:onboarding:progress";

export interface OnboardingProgress {
  flowState: "intro" | "questions" | "auth";
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

  storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
}

export function loadOnboardingDraft(): CustomerProfileDraft | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  const rawDraft = storage.getItem(ONBOARDING_STORAGE_KEY);
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

  storage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(data));
}

export function loadOnboardingProgress(): OnboardingProgress | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  const raw = storage.getItem(ONBOARDING_PROGRESS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OnboardingProgress;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  const storage = getLocalStorage();
  if (!storage) return;

  storage.removeItem(ONBOARDING_STORAGE_KEY);
  storage.removeItem(ONBOARDING_PROGRESS_KEY);
}
