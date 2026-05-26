import {
  BadgeCheck,
  Calculator,
  Car,
  ChevronsRight,
  Clock3,
  GitCompare,
  MessageSquarePlus,
  Search,
  X,
} from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import type { ChatConversation, ChatCategory } from "@/lib/chat/types";

const navItems = [
  { label: "محادثة جديدة", icon: MessageSquarePlus },
  { label: "بحث", icon: Search },
  { label: "المحادثات", icon: Clock3 },
  { label: "السيارات", icon: Car },
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
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ChatCategory | "all";
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const visibleConversations = conversations
    .filter((c) => selectedCategory === "all" || c.category === selectedCategory)
    .filter(
      (c) =>
        c.title.includes(searchQuery) ||
        c.messages.some((m) => m.content.includes(searchQuery))
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex h-full shrink-0 flex-col border-l border-[rgba(31,31,29,0.1)] bg-[#F4F3EF] px-3 py-4 transition-transform duration-200 lg:static lg:translate-x-0 ${
        collapsed ? "lg:w-[76px]" : "lg:w-[304px]"
      } ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        {collapsed ? <VoltJoLogo compact /> : <VoltJoLogo />}
        <button
          type="button"
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          onClick={onToggleCollapse}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] hover:text-[#1F1F1D]"
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
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={17} strokeWidth={1.8} className={isActive ? "text-[#1F1F1D]" : "text-[#6F6A60]"} />
              {!collapsed ? label : null}
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
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`rounded-lg px-3 py-2 text-right text-sm font-semibold leading-6 transition ${
                    activeId === conversation.id
                      ? "bg-[rgba(31,31,29,0.08)] text-[#1F1F1D]"
                      : "text-[#34302A] hover:bg-[rgba(255,255,255,0.72)]"
                  }`}
                >
                  {conversation.title}
                </button>
              ))}
            </div>
          </>
        ) : !collapsed && searchQuery ? (
          <p className="px-3 py-2 text-sm font-medium text-[#6F6A60]">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl px-2 py-2">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1F1D] text-sm font-black text-white">
            V
          </span>
          {!collapsed ? (
            <span>
              <span className="block text-sm font-bold text-[#1F1F1D]">
                حساب VoltJo
              </span>
              <span className="block text-xs font-semibold text-[#6F6A60]">
                نسخة تجريبية
              </span>
            </span>
          ) : null}
        </div>
        {!collapsed ? (
          <button
            type="button"
            aria-label="إعدادات الحساب"
            onClick={() => onNavAction("الإعدادات")}
            className="h-8 w-8 rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)]"
          >
            •••
          </button>
        ) : null}
      </div>
    </aside>
  );
}
