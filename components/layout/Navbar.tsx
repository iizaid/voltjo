"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { megaMenus, navItems, type DropdownKey } from "@/data/navigation";

export function Navbar() {
  const [openMenu, setOpenMenu] = useState<DropdownKey | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeColumns = openMenu ? megaMenus[openMenu] : null;

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div ref={navRef} className="relative z-40 mx-auto max-w-[1240px]">
        <nav
          className="flex h-[76px] items-center justify-between gap-4 rounded-[28px] border border-[var(--voltjo-border)] bg-white/92 px-4 shadow-[0_18px_50px_rgba(13,13,13,0.07)] backdrop-blur-xl lg:h-[82px] lg:px-6"
          aria-label="التنقل الرئيسي"
          dir="ltr"
        >
          <div className="shrink-0" dir="ltr">
            <VoltJoLogo />
          </div>

          <div
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            dir="rtl"
          >
            {navItems.map((item) => {
              if (item.dropdown) {
                const dropdown = item.dropdown;

                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-expanded={openMenu === dropdown}
                    aria-haspopup="true"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === dropdown ? null : dropdown,
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[15px] font-bold text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.055)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.1)] ${
                      openMenu === dropdown ? "bg-[rgba(13,13,13,0.055)]" : ""
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${
                        openMenu === dropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  className="rounded-[10px] px-4 py-2 text-[15px] font-bold text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.055)]"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex" dir="rtl">
            <Link
              href="/dashboard"
              onClick={() => setOpenMenu(null)}
              className="flex h-11 items-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-black on-dark-fg transition hover:-translate-y-0.5"
            >
              لوحة التحكم
            </Link>
            <Link
              href="/resources"
              aria-label="التنبيهات"
              onClick={() => setOpenMenu(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.045)]"
            >
              <Bell size={18} />
            </Link>
          </div>

          <details className="group lg:hidden" dir="rtl">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] marker:hidden">
              <Menu className="group-open:hidden" size={21} />
              <X className="hidden group-open:block" size={21} />
            </summary>
            <div className="absolute left-4 right-4 top-[calc(100%+12px)] rounded-[26px] border border-[var(--voltjo-border)] bg-white p-3 shadow-[0_22px_70px_rgba(13,13,13,0.12)]">
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl px-4 py-3 text-base font-bold text-[var(--voltjo-black)] hover:bg-[rgba(13,13,13,0.045)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 flex gap-2 border-t border-[var(--voltjo-border-soft)] pt-3">
                <Link
                  href="/dashboard"
                  className="flex flex-1 items-center justify-center rounded-full bg-[var(--voltjo-black)] px-5 py-3 text-sm font-black on-dark-fg"
                >
                  لوحة التحكم
                </Link>
                <Link
                  href="/resources"
                  aria-label="التنبيهات"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--voltjo-border)]"
                >
                  <Bell size={18} />
                </Link>
              </div>
            </div>
          </details>
        </nav>

        {activeColumns ? (
          <div className="absolute left-0 right-0 top-full mt-3 hidden lg:block">
            <MegaMenu key={openMenu} columns={activeColumns} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
