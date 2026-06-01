export type AiModelId = "voltjo" | "gemini" | "kimi";

export type AiChatAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type AiChatRequest = {
  message: string;
  modelId: AiModelId;
  thinkingMode: boolean;
  attachment?: AiChatAttachment | null;
};

export type AiChatResponse = {
  id: string;
  role: "assistant";
  content: string;
  bullets?: string[];
  createdAt: string;
  status: "done";
  metadata: {
    modelId: AiModelId;
    thinkingMode: boolean;
    provider: "mock";
  };
};

export type AiProvider = {
  id: string;
  generateChatResponse(request: AiChatRequest): Promise<AiChatResponse>;
};
