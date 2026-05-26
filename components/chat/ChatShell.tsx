"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { simulateChatResponse } from "@/lib/chat/mock-chat";
import type { ChatConversation, ChatMessage, ChatCategory } from "@/lib/chat/types";
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/lib/chat/storage";

const categoryPrompts: Record<string, string> = {
  السيارات: "اعطني لمحة عن السيارات الكهربائية والهايبرد المناسبة للأردن.",
  المقارنة: "أريد مقارنة بين سيارتين من حيث التكلفة والمدى والدعم.",
  الحاسبات: "احسب لي تكلفة الشحن التقريبية حسب الاستخدام اليومي.",
  "الدعم والضمان": "اشرح لي أهم نقاط الدعم والضمان التي يجب الانتباه لها.",
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ChatCategory | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    setConversations(loadConversations());
    setActiveId(loadActiveConversationId());
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
    setError(null);
    setNotice(null);
    setMobileSidebarOpen(false);
    setSelectedCategory("all");
  };

  const submitPrompt = async (prompt: string, attachmentName?: string) => {
    const trimmedPrompt = prompt.trim();
    if ((!trimmedPrompt && !attachmentName) || isLoading) return;

    let targetId = activeId;
    let newConversations = [...conversations];

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      createdAt: new Date().toISOString(),
      attachmentName,
    };

    if (!targetId || !conversations.find((c) => c.id === targetId)) {
      targetId = `conv-${Date.now()}`;
      const newConv: ChatConversation = {
        id: targetId,
        title: trimmedPrompt.slice(0, 30) || "مرفق جديد",
        category: inferCategory(trimmedPrompt),
        messages: [userMessage],
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
            title: c.messages.length === 0 ? (trimmedPrompt.slice(0, 30) || "مرفق جديد") : c.title,
            category: c.messages.length === 0 ? inferCategory(trimmedPrompt) : c.category,
            messages: [...c.messages, userMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
    }

    setConversations(newConversations);
    setComposerValue("");
    setIsLoading(true);
    setError(null);
    setMobileSidebarOpen(false);

    try {
      const response = await simulateChatResponse(trimmedPrompt);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              messages: [...c.messages, response],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("حدث خطأ غير متوقع."));
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
      setNotice("إعدادات الحساب ستكون متاحة لاحقًا في النسخة الكاملة.");
      return;
    }

    if (["السيارات", "المقارنة", "الحاسبات", "الدعم والضمان"].includes(label)) {
      setSelectedCategory(label as ChatCategory);
      const prompt = categoryPrompts[label];
      if (prompt && (!activeConversation || activeConversation.messages.length === 0)) {
        setComposerValue(prompt);
      }
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
        onSubmit={submitPrompt}
        onSuggestionSelect={submitPrompt}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
