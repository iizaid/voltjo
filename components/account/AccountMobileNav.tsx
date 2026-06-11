"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";

type AccountSection = "profile" | "account" | "security" | "privacy";

const sectionLinks: Array<{
  id: AccountSection;
  label: string;
  href: string;
}> = [
  {
    id: "profile",
    label: "الملف الشخصي",
    href: "/account?section=profile",
  },
  {
    id: "account",
    label: "معلومات الحساب",
    href: "/account?section=account",
  },
  {
    id: "security",
    label: "الأمان",
    href: "/account?section=security",
  },
  {
    id: "privacy",
    label: "الخصوصية والبيانات",
    href: "/account?section=privacy",
  },
];

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(13,13,13,0.06)] ring-1 ring-[rgba(38,38,38,0.08)] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:bg-[#F7F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2";

export function AccountMobileNav({
  activeSection,
  signOutAction,
}: {
  activeSection: AccountSection;
  signOutAction: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeFromOverlay(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="فتح قائمة إعدادات الحساب"
        onClick={() => setIsOpen(true)}
        className={iconButtonClass}
      >
        <Menu size={20} />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-[rgba(13,13,13,0.22)] px-4 py-4 backdrop-blur-[2px]"
          onMouseDown={closeFromOverlay}
        >
          <nav
            id={menuId}
            aria-label="قائمة إعدادات الحساب"
            className="mr-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[360px] flex-col overflow-y-auto rounded-[26px] bg-white p-4 text-right shadow-[0_24px_80px_rgba(13,13,13,0.18)] ring-1 ring-[rgba(38,38,38,0.08)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-extrabold text-[var(--voltjo-black)]">
                الإعدادات
              </p>
              <button
                type="button"
                aria-label="إغلاق قائمة إعدادات الحساب"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F3] text-[var(--voltjo-black)] transition-[background-color,transform] duration-200 hover:bg-[#F0F0EA] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-1.5">
              {sectionLinks.map((item) => {
                const active = activeSection === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`min-h-12 rounded-[18px] px-4 py-3 text-sm font-extrabold transition-[background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 ${
                      active
                        ? "bg-[#F4F1EC] text-[var(--voltjo-black)] ring-1 ring-[rgba(38,38,38,0.05)]"
                        : "text-[var(--voltjo-muted)] hover:bg-[#F7F7F3] hover:text-[var(--voltjo-black)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <form action={signOutAction} className="mt-4 border-t border-[rgba(38,38,38,0.08)] pt-4">
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[rgba(38,38,38,0.08)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[rgba(38,38,38,0.14)] hover:bg-[#F7F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2"
              >
                <LogOut size={16} />
                تسجيل الخروج
              </button>
            </form>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
