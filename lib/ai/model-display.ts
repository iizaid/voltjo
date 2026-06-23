import type { AiModelId } from "@/lib/ai/types";

/**
 * UI display layer for the chat model selector.
 *
 * This file is the SINGLE source of truth for everything the user sees about a
 * model: name, description, badge, tags, icon. It is intentionally client-safe
 * and contains NO backend provider identifiers. The mapping from a user-facing
 * model to the real upstream provider lives in `model-config.ts` (server-only),
 * so provider internals can never leak into the UI bundle.
 *
 * VoltJo Max is a branded experience: users never see which model powers it.
 */

/** Capability chips shown on each model card. Closed set for visual consistency. */
export type ModelTag =
  | "سريع"
  | "تحليل متقدم"
  | "محادثات طويلة"
  | "برمجة"
  | "تفكير عميق";

export type ModelDisplay = {
  id: AiModelId;
  /** User-facing name. Branded; may differ entirely from the upstream model. */
  displayName: string;
  /** One-line Arabic capability description. Keep it to a single line. */
  description: string;
  /** Highlighted as the default/best assistant. */
  recommended: boolean;
  /** Not yet enabled; rendered disabled with a "قريباً" badge. */
  comingSoon: boolean;
  /** Capability chips. 0–3 keeps cards readable. */
  tags: ModelTag[];
  /** Icon key resolved by the selector to a provider mark. */
  icon: string;
};

/**
 * Display config keyed by model id. The UI consumes ONLY this object.
 * Order here is the order shown in the selector — VoltJo Max is always first.
 */
export const MODEL_DISPLAY_CONFIG: Partial<Record<AiModelId, ModelDisplay>> = {
  voltjo: {
    id: "voltjo",
    displayName: "VoltJo Max",
    description: "أفضل مساعد للسيارات الكهربائية والهجينة في الأردن",
    recommended: true,
    comingSoon: false,
    tags: ["تحليل متقدم", "تفكير عميق"],
    icon: "voltjo",
  },
  gemini: {
    id: "gemini",
    displayName: "Gemini 2.5 Pro",
    description: "نموذج سريع ومتوازن مناسب للأسئلة العامة",
    recommended: false,
    comingSoon: false,
    tags: ["سريع", "تحليل متقدم"],
    icon: "google",
  },
  deepseek: {
    id: "deepseek",
    displayName: "DeepSeek R1",
    description: "ممتاز للتحليل العميق والاستفسارات التقنية",
    recommended: false,
    comingSoon: false,
    tags: ["تفكير عميق", "برمجة"],
    icon: "deepseek",
  },
  kimi: {
    id: "kimi",
    displayName: "Kimi K2",
    description: "مناسب للمحادثات الطويلة والسياق الممتد",
    recommended: false,
    comingSoon: true,
    tags: ["محادثات طويلة"],
    icon: "kimi",
  },
  nvidia: {
    id: "nvidia",
    displayName: "NVIDIA Nemotron Ultra",
    description: "نموذج قوي للتحليل المتقدم والمهام المعقدة",
    recommended: false,
    comingSoon: true,
    tags: ["تحليل متقدم", "برمجة"],
    icon: "nvidia",
  },
};

/**
 * Ordered list the selector renders. VoltJo Max first (default + recommended),
 * then enabled models, then coming-soon entries.
 */
export const CHAT_MODELS: ModelDisplay[] = [
  MODEL_DISPLAY_CONFIG.voltjo!,
  MODEL_DISPLAY_CONFIG.gemini!,
  MODEL_DISPLAY_CONFIG.deepseek!,
  MODEL_DISPLAY_CONFIG.kimi!,
  MODEL_DISPLAY_CONFIG.nvidia!,
];

/** The default selected model. Always VoltJo Max. */
export const DEFAULT_MODEL: ModelDisplay = CHAT_MODELS[0];
