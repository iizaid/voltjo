"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { simulateChatResponse } from "@/lib/chat/mock-chat";
import type { ChatConversation, ChatMessage, ChatCategory, ChatAttachment } from "@/lib/chat/types";
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/lib/chat/storage";

function inferCategory(prompt: string): ChatCategory {
  if (prompt.includes("تكلفة") || prompt.includes("شحن")) return "الشحن";
  if (prompt.includes("قارن") || prompt.includes("مقارنة")) return "المقارنة";
  if (prompt.includes("ضمان") || prompt.includes("دعم")) return "الدعم والضمان";
  if (
    prompt.includes("سيارة") ||
    prompt.includes("BYD") ||
    prompt.includes("Toyota") ||
    prompt.includes("Changan") ||
    prompt.includes("كهربائية") ||
    prompt.includes("هايبرد")
  )
    return "السيارات";
  return "عام";
}

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
    
    if (loadedActiveId && loadedConversations.find(c => c.id === loadedActiveId)) {
      setActiveId(loadedActiveId);
    } else {
      setActiveId(null);
    }
    
    setSidebarCollapsed(loadSidebarCollapsed());
  }, []);

  // Save to local storage on change
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
    const newId = `conv-${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: "محادثة جديدة",
      category: "عام",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    setComposerValue("");
    setAttachment(null);
    setNotice(null);
    setMobileSidebarOpen(false);
    setSelectedCategory("all");
  };

  const handleClearConversations = () => {
    if (window.confirm("هل أنت متأكد من مسح جميع المحادثات المحلية؟")) {
      setConversations([]);
      setActiveId(null);
      setComposerValue("");
      setAttachment(null);
    }
  };

  const handleExportConversations = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "voltjo-conversations.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeleteConversation = (id: string) => {
    if (window.confirm("هل تريد بالتأكيد حذف هذه المحادثة؟")) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    }
  };

  const handleRenameConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const newTitle = window.prompt("أدخل الاسم الجديد للمحادثة:", conv.title);
    if (newTitle && newTitle.trim()) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() } : c))
      );
    }
  };

  const submitPrompt = async (prompt: string, att?: ChatAttachment) => {
    const trimmedPrompt = prompt.trim();
    if ((!trimmedPrompt && !att) || isLoading) return;

    let targetId = activeId;
    let newConversations = [...conversations];

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      createdAt: new Date().toISOString(),
      attachment: att,
    };
    
    const sendingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      status: "sending",
      createdAt: new Date().toISOString(),
    };

    const newTitle = trimmedPrompt.slice(0, 30) || (att ? att.name : "محادثة جديدة");

    if (!targetId || !conversations.find((c) => c.id === targetId)) {
      targetId = `conv-${Date.now()}`;
      const newConv: ChatConversation = {
        id: targetId,
        title: newTitle,
        category: inferCategory(trimmedPrompt),
        messages: [userMessage, sendingMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newConversations = [newConv, ...newConversations];
      setActiveId(targetId);
    } else {
      newConversations = newConversations.map((c) => {
        if (c.id === targetId) {
          return {
            ...c,
            title: c.messages.length === 0 ? newTitle : c.title,
            category: c.messages.length === 0 ? inferCategory(trimmedPrompt) : c.category,
            messages: [...c.messages, userMessage, sendingMessage],
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
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === sendingMessage.id ? { ...response, id: sendingMessage.id, status: "done" } : m)),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === sendingMessage.id ? { ...m, status: "error", content: errMsg } : m)),
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
