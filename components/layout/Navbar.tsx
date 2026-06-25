"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { navItems } from "@/data/navigation";
import { gsap } from "gsap";
import { Car, Map, Calculator, Sparkles, Tag, User, Settings, LogOut } from "lucide-react";
import { ConfirmSignOutForm } from "@/components/auth/ConfirmSignOutForm";

export type NavbarAuthState = {
  isAuthenticated: boolean;
  displayName: string;
  email: string | null;
  initial: string;
  avatarUrl?: string | null;
  profileCompleted: boolean;
};

const itemIconMap: { [key: string]: any } = {
  "/vehicles": Car,
  "/charging-map": Map,
  "/charging-calculator": Calculator,
  "/assistant": Sparkles,
  "/#pricing": Tag,
};

function getAccountLabel(auth: NavbarAuthState | null | undefined) {
  if (!auth?.isAuthenticated) return "ابدأ الآن";
  return auth.displayName.trim().split(/\s+/)[0] || "حسابي";
}

export function Navbar({ auth }: { auth?: NavbarAuthState | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Hover state to toggle active colors
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Dropdown menu state and ref
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Desktop highlight refs
  const navContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  // Mobile stagger refs
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    mobileItemsRef.current = [];
  }, [mobileOpen]);

  const addToMobileItems = (el: HTMLAnchorElement | HTMLButtonElement | null) => {
    if (el && !mobileItemsRef.current.includes(el)) {
      mobileItemsRef.current.push(el);
    }
  };

  const setLinkRef = (href: string) => (el: HTMLAnchorElement | null) => {
    linkRefs.current[href] = el;
  };

  // Position highlight behind the active tab
  const positionHighlight = (currentPath: string, animate = true) => {
    // Find matching link
    const matchedHref = navItems.find(item => item.href === currentPath)?.href || "";
    const activeEl = linkRefs.current[matchedHref];

    if (!activeEl || !highlightRef.current || !navContainerRef.current) {
      gsap.to(highlightRef.current, {
        opacity: 0,
        duration: animate ? 0.3 : 0,
        overwrite: "auto",
      });
      return;
    }

    const containerRect = navContainerRef.current.getBoundingClientRect();
    const linkRect = activeEl.getBoundingClientRect();

    const x = linkRect.left - containerRect.left;
    const width = linkRect.width;

    gsap.to(highlightRef.current, {
      x: x,
      width: width,
      opacity: 1,
      duration: animate ? 0.35 : 0,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  // Position on mount or path change
  const isFirstMount = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      positionHighlight(pathname, !isFirstMount.current);
      isFirstMount.current = false;
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Desktop hover highlight physics
  const handleMouseEnterLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setHoveredHref(href);
    if (!highlightRef.current || !navContainerRef.current) return;
    const linkEl = e.currentTarget;
    const containerRect = navContainerRef.current.getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();

    const x = linkRect.left - containerRect.left;
    const width = linkRect.width;

    gsap.to(highlightRef.current, {
      x: x,
      width: width,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeaveNav = () => {
    setHoveredHref(null);
    positionHighlight(pathname, true);
  };

  // Mobile menu reveal GSAP
  useEffect(() => {
    if (!mobileOpen || !mobilePanelRef.current) return;

    gsap.fromTo(
      mobilePanelRef.current,
      { opacity: 0, y: -10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      }
    );

    const validItems = mobileItemsRef.current.filter(Boolean);
    if (validItems.length > 0) {
      gsap.fromTo(
        validItems,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.035,
          duration: 0.25,
          ease: "power2.out",
          delay: 0.05,
        }
      );
    }
  }, [mobileOpen]);

  // Determine active item highlighting with robust pathname clean matching
  const getActiveHref = () => {
    const cleanPathname = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    return navItems.find(item => {
      const cleanItemHref = item.href.endsWith("/") && item.href.length > 1 ? item.href.slice(0, -1) : item.href;
      return cleanItemHref === cleanPathname;
    })?.href || "";
  };

  const activeHref = getActiveHref();
  const highlightedHref = hoveredHref !== null ? hoveredHref : activeHref;

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative z-40 mx-auto max-w-[1240px]">
        <nav
          className="flex h-[64px] items-center justify-between gap-4 rounded-full border border-neutral-100 bg-white/90 backdrop-blur-md px-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
          aria-label="التنقل الرئيسي"
          dir="ltr"
        >
          <div className="shrink-0" dir="ltr">
            <VoltJoLogo />
          </div>

          {/* Desktop Links Container with sliding highlight */}
          <div
            ref={navContainerRef}
            onMouseLeave={handleMouseLeaveNav}
            className="relative hidden flex-1 items-center justify-center gap-1.5 lg:flex h-11"
            dir="rtl"
          >
            {/* Background Sliding highlight (Pill shape matching image) */}
            <div
              ref={highlightRef}
              className="absolute top-0.5 bottom-0.5 left-0 bg-[#1a1a1a] rounded-full z-0 opacity-0 pointer-events-none"
              style={{ transformOrigin: "left center" }}
            />

            {navItems.map((item) => {
              const IconComponent = itemIconMap[item.href];
              const isHighlighted = item.href === highlightedHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={setLinkRef(item.href)}
                  onMouseEnter={(e) => handleMouseEnterLink(e, item.href)}
                  className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-extrabold transition-colors duration-300 ${
                    isHighlighted ? "text-white" : "text-neutral-600 hover:text-neutral-900"
                  }`}
                  style={{ color: isHighlighted ? "#ffffff" : undefined }}
                >
                  {IconComponent && (
                    <IconComponent 
                      className="size-4 shrink-0 transition-colors duration-300" 
                      style={{ color: isHighlighted ? "#ffffff" : undefined }}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Panel with Dropdown */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex" dir="rtl">
            {auth?.isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8] border border-neutral-200 hover:ring-4 hover:ring-[var(--voltjo-orange)]/15 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-label="قائمة الحساب"
                >
                  {auth.avatarUrl ? (
                    <img
                      src={auth.avatarUrl}
                      alt={auth.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[14px] font-black text-[var(--voltjo-orange)] select-none">
                      {auth.initial}
                    </span>
                  )}
                </button>

                {/* Account Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.12)] p-2 transition-all duration-200 origin-top-right z-50 flex flex-col gap-1 ${
                    dropdownOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                  dir="rtl"
                >
                  {/* User Info Header (Mini Card) */}
                  <div className="flex items-center gap-3 px-3 py-3 bg-neutral-50/70 border border-neutral-100 rounded-xl mb-1 select-none">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8] border border-neutral-200">
                      {auth.avatarUrl ? (
                        <img
                          src={auth.avatarUrl}
                          alt={auth.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[14px] font-black text-[var(--voltjo-orange)]">
                          {auth.initial}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-sm font-black text-[var(--voltjo-black)] truncate">
                        {auth.displayName}
                      </p>
                      {auth.email && (
                        <p className="text-[11px] font-bold text-neutral-400 truncate mt-0.5" dir="ltr">
                          {auth.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account Settings Option */}
                  <Link
                    href="/account"
                    onClick={() => setDropdownOpen(false)}
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 hover:text-[var(--voltjo-black)] transition duration-200 text-right w-full cursor-pointer"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-500 group-hover:border-[var(--voltjo-orange)]/25 group-hover:text-[var(--voltjo-orange)] transition-colors mt-0.5">
                      <Settings className="size-4 group-hover:rotate-45 transition-transform duration-300" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-700 group-hover:text-black transition-colors">
                        إعدادات الحساب
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-400 mt-0.5">
                        الملف الشخصي والخيارات الأمنية
                      </p>
                    </div>
                  </Link>

                  {/* Sign Out Option */}
                  <div onClick={() => setDropdownOpen(false)}>
                    <ConfirmSignOutForm
                      buttonClassName="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-red-50/50 transition duration-200 text-right w-full cursor-pointer text-red-600"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50/40 text-red-500 group-hover:border-red-200 group-hover:text-red-600 transition-colors mt-0.5">
                        <LogOut className="size-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">
                          تسجيل الخروج
                        </p>
                        <p className="text-[11px] font-semibold text-red-400 mt-0.5">
                          مغادرة الجلسة الحالية بأمان
                        </p>
                      </div>
                    </ConfirmSignOutForm>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/start"
                className="voltjo-action-button on-dark-fg flex h-10 items-center justify-center rounded-full bg-[var(--voltjo-orange)] border border-transparent px-6 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(255,77,0,0.18)] hover:bg-[#e04300] active:scale-[0.98] transition-all duration-200"
              >
                <span className="voltjo-action-label">ابدأ الآن</span>
              </Link>
            )}
          </div>

          {/* Pill-shaped Hamburger Menu */}
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-[var(--voltjo-black)] hover:bg-neutral-50 active:scale-95 transition-all duration-300 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="قائمة التنقل"
          >
            <div className="relative flex flex-col justify-center items-center w-5 h-5 gap-1.5">
              <span className={`block h-[2px] w-5 bg-neutral-900 rounded-full transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[8px]" : ""}`} />
              <span className={`block h-[2px] w-5 bg-neutral-900 rounded-full transition-all duration-200 ${mobileOpen ? "opacity-0 scale-0" : "opacity-100"}`} />
              <span className={`block h-[2px] w-5 bg-neutral-900 rounded-full transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[8px]" : ""}`} />
            </div>
          </button>
        </nav>

        {/* Mobile Dropdown Panel */}
        {mobileOpen ? (
          <>
            <div
              className="fixed inset-0 z-30 lg:hidden bg-black/10 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={mobilePanelRef}
              className="absolute left-4 right-4 z-40 top-[calc(100%+8px)] rounded-2xl border border-neutral-100 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] lg:hidden flex flex-col gap-1"
            >
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={addToMobileItems}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-[var(--voltjo-black)] hover:bg-[#F4F1EC]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-3">
                {auth?.isAuthenticated ? (
                  <Link
                    href="/account"
                    ref={addToMobileItems}
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-[var(--voltjo-black)] hover:bg-[#F4F1EC] transition duration-200"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8] text-[10px] font-black text-[var(--voltjo-orange)] border border-neutral-100">
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
                    <span>{auth.profileCompleted ? "حسابي" : "إكمال الملف الذكي"}</span>
                  </Link>
                ) : (
                  <Link
                    href="/start"
                    ref={addToMobileItems}
                    onClick={() => setMobileOpen(false)}
                    className="voltjo-action-button on-dark-fg flex w-full items-center justify-center rounded-full bg-[var(--voltjo-orange)] border border-transparent px-4 py-2.5 text-sm font-bold text-white transition duration-200"
                  >
                    <span className="voltjo-action-label">ابدأ الآن</span>
                  </Link>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
