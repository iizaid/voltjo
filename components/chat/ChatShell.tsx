"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { simulateChatResponse } from "@/lib/chat/mock-chat";
import type { ChatConversation, ChatCategory, ChatAttachment } from "@/lib/chat/types";
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

export function ChatShell() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ChatCategory | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  // Persist to local storage on change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages ?? [];

  const handleCreateNew = () => {
    if (activeConversation && activeConversation.messages.length === 0) {
      setMobileSidebarOpen(false);
      return;
    }
    const newConv = createConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setComposerValue("");
    setAttachment(null);
    setNotice(null);
    setMobileSidebarOpen(false);
    setSelectedCategory("all");
  };

  const handleClearConversations = () => {
    setConversations([]);
    setActiveId(null);
    setComposerValue("");
    setAttachment(null);
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

  const submitPrompt = async (prompt: string, att?: ChatAttachment) => {
    const trimmedPrompt = prompt.trim();
    if ((!trimmedPrompt && !att) || isLoading) return;

    let targetId = activeId;
    let newConversations = [...conversations];

    const userMessage = createUserMessage(trimmedPrompt, att);
    const placeholder = createAssistantPlaceholder();
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

    try {
      const response = await simulateChatResponse(trimmedPrompt);
      const completed = completeAssistantMessage(placeholder, response);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === placeholder.id ? completed : m)),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    } catch (err) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavAction = (label: string) => {
    if (label === "محادثة جديدة") {
      handleCreateNew();
      return;
    }

    if (label === "بحث") {
      if (sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return;
    }

    if (label === "المحادثات") {
      setSelectedCategory("all");
      setSearchQuery("");
      setMobileSidebarOpen(false);
      return;
    }

    if (label === "الإعدادات") {
      setNotice("إعدادات الحساب ستكون متاحة لاحقًا.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    if (["السيارات", "الشحن", "المقارنة", "الحاسبات", "الدعم والضمان"].includes(label)) {
      setSelectedCategory(label as ChatCategory);
      setMobileSidebarOpen(false);
      return;
    }
  };

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
        onNavAction={handleNavAction}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setMobileSidebarOpen(false);
        }}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearConversations={handleClearConversations}
        onExportConversations={handleExportConversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
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
        attachment={attachment}
        onAttachmentChange={setAttachment}
      />
    </div>
  );
}
