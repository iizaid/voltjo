"use client";

import {
  ChevronsRight,
  MessageSquarePlus,
  Search,
  X,
  Trash2,
  Download,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import type { ChatConversation } from "@/lib/chat/types";
import { getVisibleConversations } from "@/lib/chat/conversation-utils";
import { useState, useRef, useCallback, useEffect } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = "voltjo:sidebar:width";

export function ChatSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onNewChat,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearConversations,
  onExportConversations,
  searchQuery,
  onSearchChange,
  searchInputRef,
  onSettingsAction,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  conversations: ChatConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string) => void;
  onClearConversations: () => void;
  onExportConversations: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSettingsAction: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    // sidebar is on the right in RTL, so dragging left = bigger width
    const delta = startX.current - e.clientX;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setSidebarWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const startResize = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth, onMouseMove, onMouseUp]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const visibleConversations = getVisibleConversations({
    conversations,
    searchQuery,
    selectedCategory: "all",
  });

  return (
    <aside
      style={!collapsed ? { width: sidebarWidth } : undefined}
      className={`fixed inset-y-0 right-0 z-50 flex h-full shrink-0 flex-col border-l border-[rgba(31,31,29,0.1)] bg-[#F4F3EF] px-3 py-4 transition-[transform] duration-200 lg:static lg:translate-x-0 ${
        collapsed ? "lg:w-[76px]" : ""
      } ${mobileOpen ? "translate-x-0 w-[288px]" : "translate-x-full lg:translate-x-0 w-[288px]"}`}
      dir="rtl"
    >
      {/* ── Resize handle (desktop only) ── */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          className="absolute left-0 top-0 hidden h-full w-1 cursor-col-resize select-none items-center justify-center lg:flex group"
          title="اسحب لتغيير العرض"
        >
          <div className="h-12 w-[3px] rounded-full bg-[rgba(31,31,29,0.12)] opacity-0 transition group-hover:opacity-100" />
        </div>
      )}
      {/* ── Logo row ── */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="العودة للصفحة الرئيسية">
          <div className="lg:hidden">
            <VoltJoLogo />
          </div>
          <div className="hidden lg:block">
            {collapsed ? <VoltJoLogo compact /> : <VoltJoLogo />}
          </div>
        </Link>
        {/* Collapse toggle – desktop */}
        <button
          type="button"
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          onClick={onToggleCollapse}
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] hover:text-[#1F1F1D]"
        >
          <ChevronsRight
            size={17}
            className={`transition ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        {/* Close – mobile */}
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onCloseMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── New chat button ── */}
      <button
        type="button"
        onClick={onNewChat}
        title={collapsed ? "محادثة جديدة" : undefined}
        className={`mt-5 flex h-9 w-full items-center gap-2.5 rounded-lg bg-[#1F1F1D] px-3 text-sm font-semibold text-white transition hover:bg-[#3A3732] ${
          collapsed ? "lg:justify-center lg:px-0" : ""
        }`}
      >
        <MessageSquarePlus size={16} strokeWidth={1.8} />
        <span className={collapsed ? "lg:hidden" : ""}>محادثة جديدة</span>
      </button>

      {/* ── Search ── */}
      {!collapsed && (
        <div className="mt-3 flex h-9 items-center gap-2 rounded-lg bg-white/55 px-3 text-[#6F6A60]">
          <Search size={15} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#6F6A60]"
            placeholder="ابحث في المحادثات"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="shrink-0 rounded-full p-0.5 hover:bg-black/10"
              aria-label="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      {!collapsed && (
        <div className="mt-4 border-t border-[rgba(31,31,29,0.07)]" />
      )}

      {/* ── Conversation list ── */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {!collapsed && (
          <p className="mb-2 px-1 text-xs font-bold text-[#6F6A60]">المحادثات</p>
        )}

        {!collapsed && visibleConversations.length > 0 ? (
          <div className="grid gap-0.5">
            {visibleConversations.map((conversation) => (
              <div key={conversation.id} className="group relative flex w-full items-center">
                {confirmingDeleteId === conversation.id ? (
                  <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2">
                    <span className="text-sm font-semibold text-red-600">حذف؟</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteConversation(conversation.id);
                          setConfirmingDeleteId(null);
                        }}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="rounded-md bg-[rgba(31,31,29,0.06)] px-3 py-1 text-xs font-bold text-[#1F1F1D] transition hover:bg-[rgba(31,31,29,0.12)]"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onDoubleClick={() => onRenameConversation(conversation.id)}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`flex-1 overflow-hidden truncate rounded-lg px-3 py-2 text-right text-sm font-semibold leading-6 transition ${
                        activeId === conversation.id
                          ? "bg-[rgba(31,31,29,0.08)] text-[#1F1F1D]"
                          : "text-[#34302A] hover:bg-[rgba(255,255,255,0.72)]"
                      }`}
                    >
                      {conversation.title}
                    </button>
                    <button
                      type="button"
                      aria-label="حذف المحادثة"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteId(conversation.id);
                      }}
                      className="absolute left-2 hidden p-1 text-[#6F6A60] transition hover:text-red-500 group-hover:block"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : !collapsed && searchQuery ? (
          <p className="px-1 py-2 text-sm font-medium text-[#6F6A60]">
            لا توجد نتائج مطابقة.
          </p>
        ) : !collapsed ? (
          <p className="px-1 py-2 text-sm font-medium text-[#6F6A60]">
            لا توجد محادثات بعد.
          </p>
        ) : null}
      </div>

      {/* ── Account area ── */}
      <div className="relative mt-4">
        {accountMenuOpen && !collapsed && (
          <div className="absolute bottom-16 right-0 z-50 w-full rounded-xl border border-[rgba(31,31,29,0.1)] bg-[#FEFEFC] p-2 shadow-lg">
            <Link
              href="/"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1F1F1D] hover:bg-[rgba(31,31,29,0.055)]"
              onClick={() => setAccountMenuOpen(false)}
            >
              العودة للموقع
            </Link>
            <button
              onClick={() => {
                setAccountMenuOpen(false);
                onSettingsAction();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1F1F1D] hover:bg-[rgba(31,31,29,0.055)]"
            >
              <Settings size={15} /> الإعدادات
            </button>
            <button
              onClick={() => {
                setAccountMenuOpen(false);
                onExportConversations();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1F1F1D] hover:bg-[rgba(31,31,29,0.055)]"
            >
              <Download size={15} /> تصدير المحادثات
            </button>
            {confirmingClearAll ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2">
                <span className="text-sm font-semibold text-red-600">متأكد؟</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearConversations();
                      setConfirmingClearAll(false);
                      setAccountMenuOpen(false);
                    }}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClearAll(false)}
                    className="rounded-md bg-[rgba(31,31,29,0.06)] px-3 py-1 text-xs font-bold text-[#1F1F1D] transition hover:bg-[rgba(31,31,29,0.12)]"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingClearAll(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> مسح المحادثات
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl px-2 py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F1F1D] text-sm font-black text-white">
              V
            </span>
            <span className={collapsed ? "lg:hidden" : ""}>
              <span className="block text-sm font-bold text-[#1F1F1D]">حساب VoltJo</span>
              <span className="block text-xs font-semibold text-[#6F6A60]">نسخة تجريبية</span>
            </span>
          </div>
          <button
            type="button"
            aria-label="إعدادات الحساب"
            onClick={() => {
              setAccountMenuOpen(!accountMenuOpen);
              setConfirmingClearAll(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] ${
              accountMenuOpen ? "bg-[rgba(31,31,29,0.055)]" : ""
            } ${collapsed ? "lg:hidden" : ""}`}
          >
            •••
          </button>
        </div>
      </div>
    </aside>
  );
}
