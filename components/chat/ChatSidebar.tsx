"use client";

import {
  ChevronsRight,
  MessageSquarePlus,
  Search,
  X,
  Trash2,
  Download,
  Settings,
  MoreHorizontal,
  Home,
} from "lucide-react";
import Link from "next/link";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import type { ChatAccount } from "@/components/chat/ChatShell";
import type { ChatConversation } from "@/lib/chat/types";
import { getVisibleConversations } from "@/lib/chat/conversation-utils";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

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
  account,
  searchQuery,
  onSearchChange,
  searchInputRef,
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
  account?: ChatAccount | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
  const [isMounted, setIsMounted] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedWidth = Number.parseInt(saved, 10);
        if (Number.isFinite(parsedWidth)) {
          setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsedWidth)));
        }
      }
    } catch {
      // Sidebar width persistence is best-effort only.
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
        setConfirmingClearAll(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
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
    if (isMounted) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
      } catch {
        // Sidebar width persistence is best-effort only.
      }
    }
  }, [sidebarWidth, isMounted]);

  const visibleConversations = useMemo(
    () =>
      getVisibleConversations({
        conversations,
        searchQuery,
        selectedCategory: "all",
      }),
    [conversations, searchQuery],
  );

  return (
    <aside
      style={!collapsed ? { width: sidebarWidth } : undefined}
      className={`fixed inset-y-0 right-0 z-50 flex h-full shrink-0 flex-col border-l border-[rgba(31,31,29,0.08)] bg-[#FAFAFD] transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0 ${
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

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-2">
        <div className="cursor-pointer">
          <div className="lg:hidden">
            <VoltJoLogo />
          </div>
          <div className="hidden lg:block">
            {collapsed ? <VoltJoLogo compact /> : <VoltJoLogo />}
          </div>
        </div>
        <button
          type="button"
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.06)]"
        >
          <ChevronsRight size={17} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.06)] lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── New Chat ── */}
      <div className="px-3 mt-4">
        <button
          type="button"
          onClick={onNewChat}
          title={collapsed ? "محادثة جديدة" : undefined}
          className={`flex h-10 w-full items-center gap-2.5 rounded-xl bg-[#1F1F1D] px-3 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <MessageSquarePlus size={16} strokeWidth={2} />
          <span className={collapsed ? "lg:hidden" : ""}>محادثة جديدة</span>
        </button>
      </div>

      {/* ── Search ── */}
      {!collapsed && (
        <div className="px-3 mt-4">
          <div className="flex h-9 items-center gap-2 rounded-xl bg-white border border-[rgba(31,31,29,0.08)] px-3 text-[#6F6A60] shadow-[0_2px_8px_rgba(13,13,13,0.02)] focus-within:border-[rgba(31,31,29,0.15)] transition-colors">
            <Search size={14} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-[#6F6A60]"
              placeholder="ابحث في المحادثات..."
            />
            {searchQuery && (
              <button type="button" onClick={() => onSearchChange("")} className="shrink-0 rounded p-0.5 hover:bg-[#F8F7F4]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Conversations ── */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {!collapsed && <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#6F6A60]/80">المحادثات السابقة</p>}
        
        {!collapsed && visibleConversations.length > 0 ? (
          <div className="grid gap-1">
            {visibleConversations.map((conversation) => (
              <div key={conversation.id} className="group relative flex w-full items-center">
                {confirmingDeleteId === conversation.id ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-red-50/80 border border-red-100 px-3 py-2"
                  >
                    <span className="text-[13px] font-semibold text-red-600">تأكيد الحذف؟</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => { onDeleteConversation(conversation.id); setConfirmingDeleteId(null); }} className="rounded-md bg-red-600 px-3 py-1 text-[12px] font-bold text-white hover:bg-red-700">حذف</button>
                      <button onClick={() => setConfirmingDeleteId(null)} className="rounded-md bg-white px-3 py-1 text-[12px] font-bold text-[#1F1F1D] shadow-sm border border-[rgba(13,13,13,0.08)]">إلغاء</button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <button
                      type="button"
                      onDoubleClick={() => onRenameConversation(conversation.id)}
                      onClick={() => onSelectConversation(conversation.id)}
                      title={conversation.title}
                      className={`relative flex-1 overflow-hidden rounded-xl border py-2 text-right text-[13px] font-semibold leading-5 transition-colors ${
                        activeId === conversation.id
                          ? "border-[#1F1F1D] bg-[#1F1F1D] pl-9 pr-3.5 text-white shadow-[0_8px_18px_rgba(31,31,29,0.14)]"
                          : "border-transparent pl-9 pr-3 text-[#6F6A60] hover:border-[rgba(13,13,13,0.06)] hover:bg-[rgba(13,13,13,0.04)] hover:text-[#1F1F1D]"
                      }`}
                    >
                      <span
                        className="block overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext]"
                        dir="auto"
                      >
                        {conversation.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="حذف المحادثة"
                      onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(conversation.id); }}
                      className="absolute left-2 hidden p-1.5 text-[#6F6A60] transition hover:text-red-500 group-hover:block"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : !collapsed && searchQuery ? (
          <p className="px-1 py-4 text-[13px] font-medium text-[#6F6A60] text-center">لا توجد نتائج.</p>
        ) : !collapsed ? (
          <p className="px-1 py-4 text-[13px] font-medium text-[#6F6A60] text-center">لا توجد محادثات بعد.</p>
        ) : null}
      </div>

      {/* ── Simplified Account Footer ── */}
      <div className="relative border-t border-[rgba(31,31,29,0.08)] p-3" ref={menuRef}>
        <AnimatePresence>
          {accountMenuOpen && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-full right-3 left-3 mb-2 overflow-hidden rounded-2xl border border-[rgba(31,31,29,0.08)] bg-white p-1.5 shadow-[0_12px_40px_rgba(13,13,13,0.12)]"
            >
              <Link
                href={account ? "/account" : "/start"}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                onClick={() => setAccountMenuOpen(false)}
              >
                <Settings size={15} className="text-[#6F6A60]" />
                {account ? "الملف الشخصي" : "إنشاء ملف ذكي"}
              </Link>

              <Link
                href="/"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                onClick={() => setAccountMenuOpen(false)}
              >
                <Home size={15} className="text-[#6F6A60]" />
                العودة للموقع
              </Link>
              
              <button
                onClick={() => { setAccountMenuOpen(false); onExportConversations(); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
              >
                <Download size={15} className="text-[#6F6A60]" />
                تصدير المحادثات
              </button>

              <div className="mx-2 my-1 h-px bg-[rgba(31,31,29,0.06)]" />

              {confirmingClearAll ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50/80 px-3 py-2">
                  <span className="text-[12px] font-bold text-red-600">تأكيد المسح؟</span>
                  <div className="flex gap-1">
                    <button onClick={() => { onClearConversations(); setConfirmingClearAll(false); setAccountMenuOpen(false); }} className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">مسح</button>
                    <button onClick={() => setConfirmingClearAll(false)} className="rounded-md bg-white border border-[rgba(13,13,13,0.08)] px-2.5 py-1 text-[11px] font-bold text-[#1F1F1D]">إلغاء</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingClearAll(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  مسح جميع المحادثات
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => { setAccountMenuOpen(!accountMenuOpen); setConfirmingClearAll(false); }}
          className={`flex w-full items-center justify-between rounded-xl p-2 transition hover:bg-[rgba(13,13,13,0.04)] ${
            accountMenuOpen ? "bg-[rgba(13,13,13,0.04)]" : ""
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F1F1D] text-[13px] font-black text-white shadow-sm">
              {account?.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt={account.label ?? "حساب VoltJo"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                account?.initial ?? "V"
              )}
            </span>
            {!collapsed && (
              <div className="min-w-0 text-right">
                <p className="truncate text-[13px] font-bold text-[#1F1F1D]">{account?.label ?? "حساب VoltJo"}</p>
                <p className="truncate text-[11px] font-semibold text-[#6F6A60]">{account?.sublabel ?? "ابدأ ملفك الذكي"}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <MoreHorizontal size={16} className="text-[#6F6A60] shrink-0 mr-2" />
          )}
        </button>
      </div>
    </aside>
  );
}
