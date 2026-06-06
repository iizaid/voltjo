"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { navItems } from "@/data/navigation";

export type NavbarAuthState = {
  isAuthenticated: boolean;
  displayName: string;
  email: string | null;
  initial: string;
  avatarUrl?: string | null;
  profileCompleted: boolean;
};

function getAccountLabel(auth: NavbarAuthState | null | undefined) {
  if (!auth?.isAuthenticated) return "ابدأ الآن";
  return auth.displayName.trim().split(/\s+/)[0] || "حسابي";
}

export function Navbar({ auth }: { auth?: NavbarAuthState | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative z-40 mx-auto max-w-[1240px]">
        <nav
          className="flex h-[68px] items-center justify-between gap-4 rounded-full border border-[var(--voltjo-border)] bg-white/95 px-4 shadow-[var(--voltjo-shadow-ring)] backdrop-blur-sm lg:px-5"
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-[14px] font-bold text-[var(--voltjo-black)] transition-colors duration-200 hover:bg-[var(--voltjo-surface-soft)]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex" dir="rtl">
            {auth?.isAuthenticated ? (
              <>
                <Link
                  href="/assistant"
                  className="flex h-10 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition-colors hover:bg-[var(--voltjo-surface-soft)]"
                >
                  المساعد
                </Link>
                <Link
                  href="/account"
                  className="flex h-10 items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-3.5 text-sm font-bold text-[var(--voltjo-black)] transition-colors hover:bg-[var(--voltjo-surface-soft)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--voltjo-black)] text-[11px] font-black text-white">
                    {auth.avatarUrl ? (
                      <img
                        src={auth.avatarUrl}
                        alt={auth.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      auth.initial
                    )}
                  </span>
                  <span>{getAccountLabel(auth)}</span>
                </Link>
              </>
            ) : (
              <Link
                href="/start"
                className="voltjo-action-button on-dark-fg flex h-10 items-center justify-center rounded-full bg-[var(--voltjo-orange)] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,77,0,0.16)] transition-transform duration-200"
              >
                <span className="voltjo-action-transition" aria-hidden="true" />
                <span className="voltjo-action-gradient" aria-hidden="true" />
                <span className="voltjo-action-label">ابدأ الآن</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="فتح قائمة التنقل"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {mobileOpen ? (
          <div className="absolute left-4 right-4 top-[calc(100%+8px)] rounded-[20px] border border-[var(--voltjo-border)] bg-white p-2 shadow-[var(--voltjo-shadow-soft)] lg:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full px-4 py-3 text-sm font-bold text-[var(--voltjo-black)] hover:bg-[var(--voltjo-surface-soft)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--voltjo-border-soft)] pt-3">
              {auth?.isAuthenticated ? (
                <>
                  <Link
                    href="/assistant"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-surface-soft)]"
                  >
                    المساعد
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-surface-soft)]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--voltjo-black)] text-[10px] font-black text-white">
                      {auth.avatarUrl ? (
                        <img
                          src={auth.avatarUrl}
                          alt={auth.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        auth.initial
                      )}
                    </span>
                    {auth.profileCompleted ? "حسابي" : "إكمال الملف الذكي"}
                  </Link>
                </>
              ) : (
                <Link
                  href="/start"
                  onClick={() => setMobileOpen(false)}
                  className="voltjo-action-button on-dark-fg flex w-full items-center justify-center rounded-full bg-[var(--voltjo-orange)] px-4 py-2.5 text-sm font-bold text-white transition-transform duration-200"
                >
                  <span className="voltjo-action-transition" aria-hidden="true" />
                  <span className="voltjo-action-gradient" aria-hidden="true" />
                  <span className="voltjo-action-label">ابدأ الآن</span>
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
