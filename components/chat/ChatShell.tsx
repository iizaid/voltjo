"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import type { ChatConversation, ChatAttachment } from "@/lib/chat/types";
import { streamChatMessage } from "@/lib/chat/api-client";
import { CHAT_MODELS, type ModelDisplay } from "@/lib/ai/model-display";
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/lib/chat/storage";
import {
  inferChatCategory,
  generateConversationTitle,
  createConversation,
  createUserMessage,
  createAssistantPlaceholder,
  completeAssistantMessage,
  failAssistantMessage,
  deleteConversationById,
  renameConversation as renameConversationUtil,
  serializeConversationsForExport,
} from "@/lib/chat/conversation-utils";
import {
  ATTACHMENT_DEMO_NOTICE,
  LONG_MESSAGE_NOTICE,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";

export type ChatAccount = {
  label: string;
  sublabel: string;
  initial: string;
  avatarUrl?: string | null;
};



export function ChatShell({
  account,
  initialPrompt,
}: {
  account?: ChatAccount | null;
  initialPrompt?: string | null;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasHydratedConversations, setHasHydratedConversations] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelDisplay>(CHAT_MODELS[0]);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [thinkingMode, setThinkingMode] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasSubmittedInitialPromptRef = useRef(false);
  const submitPromptRef = useRef<((prompt: string, att?: ChatAttachment, options?: { forceNew?: boolean }) => Promise<void>) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);

  // Load from local storage on mount
  useEffect(() => {
    const loadedConversations = loadConversations();
    const loadedActiveId = loadActiveConversationId();
    setConversations(loadedConversations);

    if (loadedActiveId && loadedConversations.find((c) => c.id === loadedActiveId)) {
      setActiveId(loadedActiveId);
    } else {
      setActiveId(null);
    }

    setSidebarCollapsed(loadSidebarCollapsed());
    setHasHydratedConversations(true);
  }, []);

  // Persist to local storage on change
  useEffect(() => {
    if (!hasHydratedConversations) return;
    saveConversations(conversations);
  }, [conversations, hasHydratedConversations]);

  useEffect(() => {
    if (!hasHydratedConversations) return;
    saveActiveConversationId(activeId);
  }, [activeId, hasHydratedConversations]);

  useEffect(() => {
    if (!hasHydratedConversations) return;
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed, hasHydratedConversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );
  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation],
  );

  const handleCreateNew = () => {
    setActiveId(null);
    setComposerValue("");
    setAttachment(null);
    setNotice(null);
    setTypingMessageId(null);
    setMobileSidebarOpen(false);
  };

  const handleClearConversations = () => {
    setConversations([]);
    setActiveId(null);
    setComposerValue("");
    setAttachment(null);
    setNotice(null);
    setTypingMessageId(null);
  };

  const handleExportConversations = () => {
    const jsonStr = serializeConversationsForExport(conversations);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "voltjo-conversations.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleDeleteConversation = (id: string) => {
    const result = deleteConversationById(conversations, id, activeId);
    setConversations(result.conversations);
    setActiveId(result.nextActiveId);
  };

  const handleRenameConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const newTitle = window.prompt("أدخل الاسم الجديد للمحادثة:", conv.title);
    if (newTitle && newTitle.trim()) {
      setConversations(renameConversationUtil(conversations, id, newTitle));
    }
  };

  const handleAssistantTypingComplete = (id: string) => {
    setTypingMessageId((current) => (current === id ? null : current));
  };

  const handleStop = () => {
    stopRequestedRef.current = true;
    abortControllerRef.current?.abort();
    // If response already arrived and animation is running, jump to full text immediately
    if (typingMessageId) {
      setTypingMessageId(null);
    }
    setIsLoading(false);
  };

  const submitPrompt = async (
    prompt: string,
    att?: ChatAttachment,
    options?: { forceNew?: boolean }
  ) => {
    const trimmedPrompt = prompt.trim();
    if ((!trimmedPrompt && !att) || isLoading) return;

    if (trimmedPrompt.length > MAX_CHAT_MESSAGE_LENGTH) {
      setNotice(LONG_MESSAGE_NOTICE);
      return;
    }

    setTypingMessageId(null);

    if (att) {
      setNotice(ATTACHMENT_DEMO_NOTICE);
    } else {
      setNotice(null);
    }

    let targetId = options?.forceNew ? null : activeId;
    let newConversations = [...conversations];

    const userMessage = createUserMessage(trimmedPrompt, att);
    const shouldUseExistingServerConversation =
      Boolean(account) &&
      !options?.forceNew &&
      Boolean(activeConversation?.serverId);

    const requestOptions = {
      modelId: selectedModel.id,
      thinkingMode,
      conversationId: shouldUseExistingServerConversation
        ? activeConversation?.serverId ?? null
        : null,
      attachment: att ?? null,
    };

    const placeholder = createAssistantPlaceholder({
      modelId: requestOptions.modelId,
      thinkingMode: requestOptions.thinkingMode,
      requestStartedAt: Date.now(),
    });
    const title = generateConversationTitle(trimmedPrompt) || (att ? att.name : "محادثة جديدة");

    if (!targetId || !conversations.find((c) => c.id === targetId)) {
      const newConv = createConversation({
        title,
        category: inferChatCategory(trimmedPrompt),
        messages: [userMessage, placeholder],
      });
      targetId = newConv.id;
      newConversations = [newConv, ...newConversations];
      setActiveId(targetId);
    } else {
      newConversations = newConversations.map((c) => {
        if (c.id === targetId) {
          return {
            ...c,
            title: c.messages.length === 0 ? title : c.title,
            category: c.messages.length === 0 ? inferChatCategory(trimmedPrompt) : c.category,
            messages: [...c.messages, userMessage, placeholder],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
    }

    setConversations(newConversations);
    setComposerValue("");
    setAttachment(null);
    setIsLoading(true);
    setMobileSidebarOpen(false);

    stopRequestedRef.current = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Build session history from current conversation messages (for guest users
    // who have no server-side DB record, this gives the AI full context).
    const sessionHistory = (activeConversation?.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.status === "done" && m.content)
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content ?? "" }));

    try {
      for await (const chunk of streamChatMessage({
        message: trimmedPrompt || att?.name || "مرفق",
        modelId: requestOptions.modelId,
        thinkingMode: requestOptions.thinkingMode,
        conversationId: requestOptions.conversationId,
        attachment: requestOptions.attachment,
        clientHistory: sessionHistory.length > 0 ? sessionHistory : undefined,
        conversationTitle: activeConversation?.title,
        messageCount: activeConversation?.messages.filter(m => m.status === "done").length,
      }, { signal: abortController.signal })) {
        if (stopRequestedRef.current) break;

        if (chunk.type === 'token') {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== targetId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholder.id
                    ? { ...m, status: 'streaming' as const, content: (m.content ?? '') + chunk.content }
                    : m
                ),
              };
            })
          );
        } else if (chunk.type === 'done') {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== targetId) return c;
              return {
                ...c,
                serverId: chunk.conversationId ?? c.serverId,
                messages: c.messages.map((m) =>
                  m.id === placeholder.id
                    ? {
                        ...m,
                        status: 'done' as const,
                        metadata: {
                          ...m.metadata,
                          usage: chunk.usage ?? undefined,
                          model: chunk.model,
                          latencyMs: chunk.latencyMs,
                        },
                      }
                    : m
                ),
                updatedAt: new Date().toISOString(),
              };
            })
          );
          setIsLoading(false);
        } else if (chunk.type === 'error') {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== targetId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholder.id ? failAssistantMessage(m, chunk.message) : m
                ),
              };
            })
          );
          setIsLoading(false);
        }
      }

      // If user stopped mid-stream, mark the message as done with partial content
      if (stopRequestedRef.current) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === placeholder.id && m.status === 'streaming'
                  ? { ...m, status: 'done' as const }
                  : m
              ),
            };
          })
        );
        setIsLoading(false);
      }
    } catch (err) {
      if (stopRequestedRef.current) {
        // User cancelled — remove the loading placeholder silently
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? { ...c, messages: c.messages.filter((m) => m.id !== placeholder.id) }
              : c,
          ),
        );
      } else {
        const errMsg = err instanceof Error ? err.message : undefined;
        const failed = failAssistantMessage(placeholder, errMsg);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetId) {
              return {
                ...c,
                messages: c.messages.map((m) => (m.id === placeholder.id ? failed : m)),
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      stopRequestedRef.current = false;
    }
  };

  submitPromptRef.current = submitPrompt;

  // Re-run a failed assistant message in place: find its preceding user turn,
  // flip the failed bubble back to "sending", call the API again, and replace
  // it with the result — without adding a duplicate user message.
  const handleRetryMessage = async (failedMessageId: string) => {
    if (isLoading) return;

    const conversation = conversations.find((c) =>
      c.messages.some((m) => m.id === failedMessageId),
    );
    if (!conversation) return;

    const failedIndex = conversation.messages.findIndex((m) => m.id === failedMessageId);
    if (failedIndex < 1) return;

    // The user turn that produced this assistant message is the prior user message.
    let userMessage = null as (typeof conversation.messages)[number] | null;
    for (let i = failedIndex - 1; i >= 0; i--) {
      if (conversation.messages[i].role === "user") {
        userMessage = conversation.messages[i];
        break;
      }
    }
    if (!userMessage) return;

    const targetId = conversation.id;
    const requestModelId = conversation.messages[failedIndex].metadata?.modelId ?? selectedModel.id;
    const requestThinkingMode =
      conversation.messages[failedIndex].metadata?.thinkingMode ?? thinkingMode;

    setNotice(null);
    setTypingMessageId(null);
    setIsLoading(true);

    // Flip the failed bubble back to a "sending" placeholder.
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === failedMessageId
                  ? { ...m, status: "sending" as const, content: "" }
                  : m,
              ),
            }
          : c,
      ),
    );

    const retryHistory = conversation.messages
      .slice(0, failedIndex)
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.status === "done" && m.content)
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content ?? "" }));

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    stopRequestedRef.current = false;

    try {
      for await (const chunk of streamChatMessage({
        message: userMessage.content || userMessage.attachment?.name || "مرفق",
        modelId: requestModelId,
        thinkingMode: requestThinkingMode,
        conversationId: conversation.serverId ?? null,
        attachment: userMessage.attachment ?? null,
        clientHistory: retryHistory.length > 0 ? retryHistory : undefined,
      }, { signal: abortController.signal })) {
        if (stopRequestedRef.current) break;

        if (chunk.type === "token") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === failedMessageId
                        ? { ...m, status: "streaming" as const, content: (m.content ?? "") + chunk.content }
                        : m,
                    ),
                  }
                : c,
            ),
          );
        } else if (chunk.type === "done") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    serverId: chunk.conversationId ?? c.serverId,
                    messages: c.messages.map((m) =>
                      m.id === failedMessageId
                        ? {
                            ...m,
                            status: "done" as const,
                            metadata: {
                              ...m.metadata,
                              usage: chunk.usage ?? undefined,
                              model: chunk.model,
                              latencyMs: chunk.latencyMs,
                            },
                          }
                        : m,
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          );
          setIsLoading(false);
        } else if (chunk.type === "error") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === failedMessageId
                        ? failAssistantMessage({ ...m, status: "sending" }, chunk.message)
                        : m,
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          );
          setIsLoading(false);
        }
      }

      if (stopRequestedRef.current) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === failedMessageId && m.status === "streaming"
                      ? { ...m, status: "done" as const }
                      : m,
                  ),
                }
              : c,
          ),
        );
        setIsLoading(false);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : undefined;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === failedMessageId
                    ? failAssistantMessage({ ...m, status: "sending" }, errMsg)
                    : m,
                ),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydratedConversations) return;
    if (!initialPrompt?.trim()) return;
    if (hasSubmittedInitialPromptRef.current) return;

    hasSubmittedInitialPromptRef.current = true;
    void submitPromptRef.current?.(initialPrompt, undefined, { forceNew: true });
    window.history.replaceState(null, "", "/assistant");
  }, [hasHydratedConversations, initialPrompt]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F8F7F4] text-[#1F1F1D]" dir="rtl">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <ChatSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNewChat={handleCreateNew}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setComposerValue("");
          setAttachment(null);
          setNotice(null);
          setTypingMessageId(null);
          setMobileSidebarOpen(false);
        }}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearConversations={handleClearConversations}
        onExportConversations={handleExportConversations}
        account={account}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
      />
      <ChatThread
        messages={messages}
        composerValue={composerValue}
        notice={notice}
        onComposerChange={setComposerValue}
        onSubmit={(val) => submitPrompt(val, attachment || undefined)}
        onSuggestionSelect={(val) => submitPrompt(val, attachment || undefined)}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        isLoading={isLoading}
        onStop={handleStop}
        attachment={attachment}
        onAttachmentChange={setAttachment}
        onNotice={setNotice}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        typingMessageId={typingMessageId}
        thinkingMode={thinkingMode}
        onThinkingModeChange={setThinkingMode}
        onAssistantTypingComplete={handleAssistantTypingComplete}
        onRetryMessage={handleRetryMessage}
      />
    </div>
  );
}
