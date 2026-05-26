import type { CustomerProfileDraft } from "@/lib/onboarding/types";

export const ONBOARDING_STORAGE_KEY = "voltjo:onboarding:draft";

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

export function clearOnboardingDraft() {
  const storage = getLocalStorage();
  if (!storage) return;

  storage.removeItem(ONBOARDING_STORAGE_KEY);
}
