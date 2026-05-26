"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { megaMenus, navItems, type DropdownKey } from "@/data/navigation";

export function Navbar() {
  const [openMenu, setOpenMenu] = useState<DropdownKey | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openDropdown = (dropdown: DropdownKey) => {
    clearCloseTimeout();
    setOpenMenu(dropdown);
  };

  const scheduleCloseDropdown = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
      closeTimeoutRef.current = null;
    }, 120);
  };

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
      clearCloseTimeout();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeColumns = openMenu ? megaMenus[openMenu] : null;

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div ref={navRef} className="relative z-40 mx-auto max-w-[1240px]">
        <nav
          className="flex h-[72px] items-center justify-between gap-4 rounded-[8px] border border-[var(--voltjo-border)] bg-white/95 px-4 shadow-none backdrop-blur-sm lg:px-6"
          aria-label="التنقل الرئيسي"
          dir="ltr"
          onMouseEnter={clearCloseTimeout}
          onMouseLeave={scheduleCloseDropdown}
          onPointerEnter={clearCloseTimeout}
          onPointerLeave={scheduleCloseDropdown}
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
                    onMouseEnter={() => openDropdown(dropdown)}
                    onPointerEnter={() => openDropdown(dropdown)}
                    onFocus={() => openDropdown(dropdown)}
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === dropdown ? null : dropdown,
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-[14px] font-bold text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.1)] ${
                      openMenu === dropdown ? "bg-[rgba(13,13,13,0.06)]" : ""
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
                  onMouseEnter={() => setOpenMenu(null)}
                  onPointerEnter={() => setOpenMenu(null)}
                  onClick={() => setOpenMenu(null)}
                  className="rounded-[6px] px-3 py-2 text-[14px] font-bold text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.04)]"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex" dir="rtl">
            <Link
              href="/login"
              onClick={() => setOpenMenu(null)}
              className="flex h-10 items-center justify-center rounded-[8px] px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[rgba(13,13,13,0.04)]"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpenMenu(null)}
              className="flex h-10 items-center justify-center rounded-[8px] bg-[var(--voltjo-orange)] px-5 text-sm font-bold text-[#FFFFFF] transition hover:bg-[#e85e00] hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              إنشاء حساب
            </Link>
          </div>

          <details className="group lg:hidden" dir="rtl">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-[8px] border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] marker:hidden">
              <Menu className="group-open:hidden" size={20} />
              <X className="hidden group-open:block" size={20} />
            </summary>
            <div className="absolute left-4 right-4 top-[calc(100%+8px)] rounded-[12px] border border-[var(--voltjo-border)] bg-white p-2 shadow-[0_12px_40px_rgba(13,13,13,0.1)]">
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[8px] px-4 py-3 text-sm font-bold text-[var(--voltjo-black)] hover:bg-[rgba(13,13,13,0.04)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--voltjo-border-soft)] pt-3">
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-[8px] bg-[var(--voltjo-orange)] px-4 py-2.5 text-sm font-bold text-[#FFFFFF] transition hover:bg-[#e85e00]"
                >
                  إنشاء حساب
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-[8px] border border-[var(--voltjo-border)] bg-[#FCFCFA] px-4 py-2.5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-white hover:border-[var(--voltjo-border-strong)]"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          </details>
        </nav>

        {activeColumns ? (
          <div
            className="absolute left-0 right-0 top-full hidden lg:block"
            onMouseEnter={clearCloseTimeout}
            onMouseLeave={scheduleCloseDropdown}
            onPointerEnter={clearCloseTimeout}
            onPointerLeave={scheduleCloseDropdown}
          >
            <MegaMenu key={openMenu} columns={activeColumns} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
