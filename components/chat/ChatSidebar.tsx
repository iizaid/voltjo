import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

const conversations = [
  "BYD Song Plus للاستخدام اليومي",
  "تكلفة شحن سيارة كهربائية",
  "مقارنة الهايبرد والكهربائي",
];

const categories = ["السيارات", "الشحن", "المقارنة", "الدعم والضمان"];

export function ChatSidebar() {
  return (
    <aside
      className="hidden h-full w-[286px] shrink-0 border-r border-[var(--voltjo-border)] bg-[#F7F7F5] px-4 py-5 lg:flex lg:flex-col"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        <VoltJoLogo />
      </div>

      <button className="mt-7 flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--voltjo-border)] bg-white text-sm font-black text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.035)]">
        <Plus size={17} />
        محادثة جديدة
      </button>

      <div className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-[var(--voltjo-border-soft)] bg-white px-3 text-[var(--voltjo-muted)]">
        <Search size={16} />
        <span className="text-sm font-semibold">بحث في المحادثات</span>
      </div>

      <div className="mt-8">
        <p className="px-2 text-xs font-black text-[var(--voltjo-muted)]">
          المحادثات الأخيرة
        </p>
        <div className="mt-3 grid gap-1">
          {conversations.map((conversation) => (
            <Link
              key={conversation}
              href="/assistant"
              className="rounded-xl px-3 py-2.5 text-sm font-bold leading-6 text-[var(--voltjo-black)] transition hover:bg-white"
            >
              {conversation}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="px-2 text-xs font-black text-[var(--voltjo-muted)]">
          التصنيفات
        </p>
        <div className="mt-3 grid gap-1">
          {categories.map((category) => (
            <button
              key={category}
              className="rounded-xl px-3 py-2.5 text-right text-sm font-bold text-[var(--voltjo-muted)] transition hover:bg-white hover:text-[var(--voltjo-black)]"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-[var(--voltjo-border-soft)] bg-white/70 p-4">
        <p className="text-sm font-black text-[var(--voltjo-black)]">
          VoltJo Assistant
        </p>
        <p className="mt-2 text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
          واجهة ثابتة الآن. لا يوجد اتصال بخدمة ذكاء اصطناعي أو قاعدة بيانات.
        </p>
      </div>
    </aside>
  );
}
