export type OnboardingQuestionType = "single" | "multi";

export type OnboardingQuestionId =
  | "ageRange"
  | "country"
  | "city"
  | "ownershipStatus"
  | "hasDrivenEvOrHybrid"
  | "mainGoal"
  | "drivingPattern"
  | "homeChargingAccess"
  | "priorities";

export type OnboardingOption = {
  label: string;
  value: string;
};

export type OnboardingQuestion = {
  id: OnboardingQuestionId;
  title: string;
  subtitle?: string;
  type: OnboardingQuestionType;
  options: OnboardingOption[];
  helperText?: string;
};

export type CustomerProfileDraft = Partial<{
  ageRange: string;
  country: string;
  city: string;
  ownershipStatus: string;
  hasDrivenEvOrHybrid: string;
  mainGoal: string;
  drivingPattern: string;
  homeChargingAccess: string;
  priorities: string[];
}>;
