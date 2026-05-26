"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { simulateChatResponse } from "@/lib/chat/mock-chat";
import type { ChatMessageData } from "@/lib/chat/types";

const categoryPrompts: Record<string, string> = {
  السيارات: "اعطني لمحة عن السيارات الكهربائية والهايبرد المناسبة للأردن.",
  المقارنة: "أريد مقارنة بين سيارتين من حيث التكلفة والمدى والدعم.",
  الحاسبات: "احسب لي تكلفة الشحن التقريبية حسب الاستخدام اليومي.",
  "الدعم والضمان": "اشرح لي أهم نقاط الدعم والضمان التي يجب الانتباه لها.",
};

const conversationPrompts: Record<string, string> = {
  "هل BYD Song Plus مناسبة للأردن؟":
    "هل BYD Song Plus مناسبة للاستخدام اليومي في الأردن؟",
  "تكلفة شحن سيارة كهربائية في العقبة":
    "كم تكلفة شحن سيارة كهربائية في العقبة تقريبًا؟",
  "مقارنة بين Changan و BYD": "قارن بين Changan و BYD للسوق الأردني.",
  "أفضل هايبرد للاستخدام اليومي":
    "ما أفضل سيارة هايبرد للاستخدام اليومي في الأردن؟",
};

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [sourcesActive, setSourcesActive] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) return;

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setComposerValue("");
    setIsLoading(true);
    setError(null);
    setMobileSidebarOpen(false);

    try {
      const response = await simulateChatResponse(trimmedPrompt);
      setMessages((prev) => [...prev, response]);
      setNotice(
        sourcesActive
          ? "تم إنشاء رد تجريبي ثابت اعتمادًا على واجهة VoltJo فقط."
          : "تم إنشاء رد تجريبي ثابت. مصادر VoltJo غير محددة في هذا النموذج.",
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("حدث خطأ غير متوقع."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavAction = (label: string) => {
    if (label === "محادثة جديدة") {
      setMessages([]);
      setComposerValue("");
      setNotice(null);
      setMobileSidebarOpen(false);
      return;
    }

    if (label === "بحث") {
      setNotice("اكتب في مربع البحث داخل الشريط الجانبي لتصفية المحادثات.");
      return;
    }

    if (label === "المحادثات") {
      setSearchQuery("");
      setNotice("تم عرض آخر المحادثات في الشريط الجانبي.");
      return;
    }

    if (label === "الإعدادات") {
      setNotice("إعدادات الحساب ستكون متاحة لاحقًا في النسخة الكاملة.");
      return;
    }

    const prompt = categoryPrompts[label];
    if (prompt) {
      setComposerValue(prompt);
      setNotice(`تم تجهيز سؤال عن ${label}. اضغط إرسال للمتابعة.`);
    }
  };

  return (
    <div
      className="flex h-dvh w-full overflow-hidden bg-[#F8F7F4] text-[#1F1F1D]"
      dir="rtl"
    >
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNavAction={handleNavAction}
        onConversationSelect={(conversation) =>
          submitPrompt(conversationPrompts[conversation] ?? conversation)
        }
      />
      <ChatThread
        messages={messages}
        composerValue={composerValue}
        notice={notice}
        sourcesActive={sourcesActive}
        onComposerChange={setComposerValue}
        onSubmit={() => submitPrompt(composerValue)}
        onSuggestionSelect={submitPrompt}
        onAttach={() =>
          setNotice("رفع المرفقات غير مفعّل في هذه النسخة التجريبية.")
        }
        onToggleSources={() => {
          setSourcesActive((current) => !current);
          setNotice(
            sourcesActive
              ? "تم إيقاف مؤشر مصادر VoltJo لهذه المحادثة التجريبية."
              : "تم تفعيل مؤشر مصادر VoltJo لهذه المحادثة التجريبية.",
          );
        }}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
