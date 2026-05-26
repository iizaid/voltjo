import {
  BadgeCheck,
  Calculator,
  Car,
  ChevronsRight,
  Clock3,
  GitCompare,
  Home,
  MessageSquarePlus,
  Search,
  X,
  BatteryCharging,
  Trash2,
  Download,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import type { ChatConversation, ChatCategory } from "@/lib/chat/types";
import { getVisibleConversations } from "@/lib/chat/conversation-utils";
import { useState } from "react";

const navItems = [
  { label: "محادثة جديدة", icon: MessageSquarePlus },
  { label: "بحث", icon: Search },
  { label: "المحادثات", icon: Clock3 },
  { label: "السيارات", icon: Car },
  { label: "الشحن", icon: BatteryCharging },
  { label: "المقارنة", icon: GitCompare },
  { label: "الحاسبات", icon: Calculator },
  { label: "الدعم والضمان", icon: BadgeCheck },
];

export function ChatSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onNavAction,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearConversations,
  onExportConversations,
  searchQuery,
  onSearchChange,
  selectedCategory,
  searchInputRef,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNavAction: (label: string) => void;
  conversations: ChatConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string) => void;
  onClearConversations: () => void;
  onExportConversations: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ChatCategory | "all";
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const visibleConversations = getVisibleConversations({
    conversations,
    searchQuery,
    selectedCategory,
  });

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex h-full w-[288px] shrink-0 flex-col border-l border-[rgba(31,31,29,0.1)] bg-[#F4F3EF] px-3 py-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:w-auto ${
        collapsed ? "lg:w-[76px]" : "lg:w-[304px]"
      } ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Always show full logo on mobile, respect collapsed on desktop */}
        <div className="lg:hidden"><VoltJoLogo /></div>
        <div className="hidden lg:block">{collapsed ? <VoltJoLogo compact /> : <VoltJoLogo />}</div>
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
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onCloseMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-7 grid gap-1">
        <Link
          href="/"
          title={collapsed ? "الصفحة الرئيسية" : undefined}
          className={`flex h-9 items-center gap-3 rounded-lg px-3 text-right text-sm font-semibold text-[#3A3732] transition hover:bg-[rgba(31,31,29,0.055)] ${
            collapsed ? "lg:justify-center" : ""
          }`}
        >
          <Home size={17} strokeWidth={1.8} className="text-[#6F6A60]" />
          <span className={collapsed ? "lg:hidden" : ""}>الصفحة الرئيسية</span>
        </Link>

        {navItems.map(({ label, icon: Icon }) => {
          const isActive =
            label === selectedCategory ||
            (label === "المحادثات" && selectedCategory === "all");
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavAction(label)}
              title={collapsed ? label : undefined}
              className={`flex h-9 items-center gap-3 rounded-lg px-3 text-right text-sm font-semibold transition ${
                isActive
                  ? "bg-[rgba(31,31,29,0.08)] text-[#1F1F1D]"
                  : "text-[#3A3732] hover:bg-[rgba(31,31,29,0.055)]"
              } ${collapsed ? "lg:justify-center" : ""}`}
            >
              <Icon size={17} strokeWidth={1.8} className={isActive ? "text-[#1F1F1D]" : "text-[#6F6A60]"} />
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </button>
          );
        })}
      </div>

      {!collapsed ? (
        <div className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-white/55 px-3 text-[#6F6A60]">
          <Search size={16} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#6F6A60]"
            placeholder="ابحث في المحادثات"
          />
        </div>
      ) : null}

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        {!collapsed && visibleConversations.length > 0 ? (
          <>
            <p className="px-3 text-xs font-bold text-[#6F6A60] mb-3">الأخيرة</p>
            <div className="grid gap-1">
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
          </>
        ) : !collapsed && searchQuery ? (
          <p className="px-3 py-2 text-sm font-medium text-[#6F6A60]">
            لا توجد نتائج مطابقة.
          </p>
        ) : !collapsed ? (
          <p className="px-3 py-2 text-sm font-medium text-[#6F6A60]">
            لا توجد محادثات ضمن هذا التصنيف بعد.
          </p>
        ) : null}
      </div>

      <div className="relative mt-5">
        {accountMenuOpen && !collapsed && (
          <div className="absolute bottom-16 right-0 z-50 w-full rounded-xl border border-[rgba(31,31,29,0.1)] bg-[#FEFEFC] p-2 shadow-lg">
            <button
              onClick={() => {
                setAccountMenuOpen(false);
                onNavAction("الإعدادات");
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
            {/* Always show account info on mobile, hide when collapsed on desktop */}
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
