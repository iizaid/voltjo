"use client";

import {
  ChevronsLeft,
  MessageSquarePlus,
  Search,
  X,
  Trash2,
  Download,
  Settings,
  Home,
  Zap,
  GitCompare,
  BatteryCharging,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import type { ChatAccount } from "@/components/chat/ChatShell";
import type { ChatConversation } from "@/lib/chat/types";
import { getVisibleConversations } from "@/lib/chat/conversation-utils";
import { useState, useRef, useCallback, useEffect } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 272;
const STORAGE_KEY = "voltjo:sidebar:width";

const quickTools = [
  { icon: GitCompare, label: "مقارنة السيارات", prompt: "أريد مقارنة بين سيارتين كهربائيتين أو هايبرد" },
  { icon: BatteryCharging, label: "تكلفة الشحن", prompt: "احسب لي تكلفة شحن سيارة كهربائية أو هايبرد" },
  { icon: Zap, label: "دليل السوق", prompt: "أعطني دليلاً عن سوق السيارات الكهربائية في الأردن" },
  { icon: ShieldCheck, label: "الدعم والضمان", prompt: "ما هي شروط الدعم والضمان على السيارات الكهربائية؟" },
];

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
  onQuickPrompt,
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
  onQuickPrompt: (prompt: string) => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = Number.parseInt(saved, 10);
        if (Number.isFinite(parsed)) {
          setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed)));
        }
      }
    } catch {
      // best-effort
    }
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

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth, onMouseMove, onMouseUp]
  );

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
      } catch {
        // best-effort
      }
    }
  }, [sidebarWidth, isMounted]);

  const visibleConversations = getVisibleConversations({
    conversations,
    searchQuery,
    selectedCategory: "all",
  });

  const sidebarBase =
    "fixed inset-y-0 right-0 z-50 flex h-full shrink-0 flex-col border-l border-white/[0.06] bg-[#111110] transition-[transform] duration-200 lg:static lg:translate-x-0";
  const mobileClass = mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0";
  const collapsedClass = collapsed ? "lg:w-[72px]" : "";

  return (
    <aside
      style={!collapsed ? { width: mobileOpen ? 288 : sidebarWidth } : undefined}
      className={`${sidebarBase} ${mobileClass} ${collapsedClass} w-[288px]`}
      dir="rtl"
    >
      {/* Resize handle – desktop only */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          className="absolute left-0 top-0 hidden h-full w-1 cursor-col-resize select-none lg:flex items-center justify-center group"
          title="اسحب لتغيير العرض"
        >
          <div className="h-12 w-[2px] rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100" />
        </div>
      )}

      {/* ── Logo / header ── */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <div>
          {collapsed ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--voltjo-orange)] text-white text-sm font-black">V</span>
          ) : (
            <VoltJoLogo />
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Collapse toggle – desktop */}
          <button
            type="button"
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
            onClick={onToggleCollapse}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
          >
            <ChevronsLeft size={16} className={`transition ${collapsed ? "rotate-180" : ""}`} />
          </button>
          {/* Close – mobile */}
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── New chat ── */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          title={collapsed ? "محادثة جديدة" : undefined}
          className={`flex h-9 w-full items-center gap-2.5 rounded-lg bg-[var(--voltjo-orange)] px-3 text-sm font-bold text-white transition hover:bg-[#e85e00] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
        >
          <MessageSquarePlus size={15} strokeWidth={2} />
          <span className={collapsed ? "lg:hidden" : ""}>محادثة جديدة</span>
        </button>
      </div>

      {/* ── Search ── */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex h-8 items-center gap-2 rounded-lg bg-white/[0.06] px-3 text-white/40">
            <Search size={13} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-white/80 outline-none placeholder:text-white/30"
              placeholder="ابحث في المحادثات"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="shrink-0 rounded-full p-0.5 hover:bg-white/10"
                aria-label="مسح البحث"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Nav items ── */}
      {!collapsed && (
        <div className="px-3 pb-1">
          <Link
            href="/"
            className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] font-semibold text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
          >
            <Home size={14} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      )}

      <div className="mx-3 my-2 h-px bg-white/[0.06]" />

      {/* ── Quick tools ── */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-white/25">
            أدوات سريعة
          </p>
          <div className="grid gap-0.5">
            {quickTools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={() => onQuickPrompt(tool.prompt)}
                className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] font-semibold text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
              >
                <tool.icon size={13} className="shrink-0" />
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-3 my-2 h-px bg-white/[0.06]" />

      {/* ── Conversations ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {!collapsed && (
          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-white/25">
            المحادثات
          </p>
        )}

        {!collapsed && visibleConversations.length > 0 ? (
          <div className="grid gap-0.5">
            {visibleConversations.map((conv) => (
              <div key={conv.id} className="group relative flex w-full items-center">
                {confirmingDeleteId === conv.id ? (
                  <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-red-950/60 px-3 py-1.5 border border-red-500/20">
                    <span className="text-[12px] font-semibold text-red-400">حذف؟</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => { onDeleteConversation(conv.id); setConfirmingDeleteId(null); }}
                        className="rounded-md bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white transition hover:bg-red-700"
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-white/60 transition hover:bg-white/10"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onDoubleClick={() => onRenameConversation(conv.id)}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`flex-1 overflow-hidden truncate rounded-lg px-2 py-1.5 text-right text-[13px] font-semibold leading-5 transition ${
                        activeId === conv.id
                          ? "bg-white/[0.10] text-white"
                          : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                      }`}
                    >
                      {conv.title}
                    </button>
                    <button
                      type="button"
                      aria-label="حذف المحادثة"
                      onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(conv.id); }}
                      className="absolute left-1.5 hidden p-1 text-white/25 transition hover:text-red-400 group-hover:block"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : !collapsed && searchQuery ? (
          <p className="px-2 py-2 text-[12px] font-medium text-white/30">لا توجد نتائج مطابقة.</p>
        ) : !collapsed ? (
          <p className="px-2 py-2 text-[12px] font-medium text-white/30">لا توجد محادثات بعد.</p>
        ) : null}
      </div>

      {/* ── Account footer ── */}
      <div className="relative mx-3 mt-2 mb-3">
        {accountMenuOpen && !collapsed && (
          <div className="absolute bottom-full right-0 z-50 mb-1 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1A] p-1.5 shadow-xl">
            <Link
              href={account ? "/account" : "/start"}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => setAccountMenuOpen(false)}
            >
              <Settings size={13} />
              {account ? "الملف الشخصي" : "إنشاء ملف ذكي"}
            </Link>
            <button
              type="button"
              onClick={() => { setAccountMenuOpen(false); onExportConversations(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Download size={13} />
              تصدير المحادثات
            </button>
            <div className="my-1 h-px bg-white/[0.06]" />
            {confirmingClearAll ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-red-950/60 px-3 py-2 border border-red-500/20">
                <span className="text-[12px] font-semibold text-red-400">متأكد؟</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { onClearConversations(); setConfirmingClearAll(false); setAccountMenuOpen(false); }}
                    className="rounded-md bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-red-700"
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClearAll(false)}
                    className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-white/60 hover:bg-white/10"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClearAll(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-red-400/80 transition hover:bg-red-950/40 hover:text-red-400"
              >
                <Trash2 size={13} />
                مسح المحادثات
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--voltjo-orange)] text-sm font-black text-white">
            {account?.initial ?? "V"}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white/80">
                  {account?.label ?? "حساب VoltJo"}
                </p>
                <p className="truncate text-[11px] font-semibold text-white/30">
                  {account?.sublabel ?? "نسخة تجريبية"}
                </p>
              </div>
              <button
                type="button"
                aria-label="إعدادات الحساب"
                onClick={() => { setAccountMenuOpen(!accountMenuOpen); setConfirmingClearAll(false); }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white/70 ${accountMenuOpen ? "bg-white/[0.06] text-white/70" : ""}`}
              >
                <span className="text-base leading-none">···</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
