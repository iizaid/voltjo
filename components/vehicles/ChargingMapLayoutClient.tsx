"use client";

import { useState } from "react";
import Link from "next/link";
import { House, MapPin, Zap, Fuel, Heart, User, List, Map as MapIcon, LogOut, ChevronLeft } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { ConfirmSignOutForm } from "@/components/auth/ConfirmSignOutForm";

type Props = {
  infoColumn: React.ReactNode;
  map: React.ReactNode;
  user: any;
  avatarUrl: string | null;
  displayName: string;
  initial: string;
  firstName: string;
  email: string | null;
};

export function ChargingMapLayoutClient({
  infoColumn,
  map,
  user,
  avatarUrl,
  displayName,
  initial,
  firstName,
  email,
}: Props) {
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden" dir="rtl">
      {/* Mobile Top Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--voltjo-border)] bg-white px-4 lg:hidden z-30 shadow-sm">
        {/* Left Side: Profile or Log in */}
        <div className="flex items-center">
          {user ? (
            <Link href="/account" className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8] text-sm font-black text-[var(--voltjo-orange)] ring-2 ring-neutral-200 hover:ring-[var(--voltjo-orange)] transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
            </Link>
          ) : (
            <Link
              href="/start"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[rgba(255,77,0,0.08)] border border-[rgba(255,77,0,0.15)] px-3 text-xs font-bold text-[var(--voltjo-orange)] transition hover:bg-[rgba(255,77,0,0.12)]"
            >
              <User className="size-3" />
              <span>ابدأ</span>
            </Link>
          )}
        </div>

        {/* Right Side: Logo */}
        <VoltJoLogo className="h-10" />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row h-full w-full">
        {/* Desktop Vertical Sidebar (Navbar) */}
        <div className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-l border-neutral-900/60 bg-neutral-950 p-5 text-white">
          <div className="space-y-8">
            {/* Logo Area */}
            <div className="px-2">
              <Link href="/" className="inline-block" aria-label="VoltJo">
                <svg
                  id="Layer_1"
                  data-name="Layer 1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="175 0 640 209.351"
                  className="h-9 w-auto text-white select-none"
                >
                  <g>
                    <path
                      fill="currentColor"
                      d="M547.548,156.745l.009,22.955c.001,2.811-2.919,7.012-5.832,6.957l-13.877-.262c-17.852-.338-36.662-7.127-38.985-25.28l-1.675-13.086-.237-37.273c-4.086.898-11.177-.126-11.663-4.984-.835-8.341-.847-17.259.007-25.598.497-4.852,7.485-5.878,11.63-4.962l.103-10.379c.042-4.288,3.291-8.656,8.169-8.656h24.597c4.23,0,7.849,3.96,7.899,7.875l.14,10.951,8.173-.017c4.629-.01,8.057,3.282,8.057,7.969l-.002,20.03c0,4.709-3.419,7.955-8.056,7.976l-8.281.038.214,33.796c6.543,6.749,19.605,1.172,19.609,11.95Z"
                    />
                    <path
                      fill="currentColor"
                      d="M451.362,186.802l-25.456.191c-4.998.037-8.739-3.926-8.739-9.235l.013-122.456c0-3.277,2.726-8.218,5.758-8.243l27.086-.219c4.363-.035,7.276,3.009,7.897,7.446l-.025,125.386c0,3.23-3.242,7.105-6.533,7.13Z"
                    />
                    <g>
                      <path
                        fill="currentColor"
                        d="M766.946,184.857c-28.664,13.283-65.939,4.202-77.943-26.981-12.691-32.968-.807-75.466,36.337-83.581,26.325-5.751,53.889,3.14,65.199,28.12,12.757,28.175,6.176,68.647-23.594,82.442ZM751.977,145.336c6.274-9.068,5.606-21.746-1.677-29.534-2.939-3.142-7.635-5.149-11.47-4.585-3.366.495-7.222,2.862-9.756,6.004-6.266,7.769-6.192,19.088-.975,27.591,2.52,4.107,7.122,6.919,11.469,7.093,4.435.177,9.379-2.19,12.409-6.569Z"
                      />
                      <g>
                        <path
                          fill="currentColor"
                          d="M603.943,188.153c-37.804-8.344-45.446-52.151-32.993-52.17l29.029-.045c7.018,4.199,7.045,14.863,18.095,13.443,4.308-.554,9.699-4.1,9.733-9.445l.198-30.965,40.115-.002.023,30.988c.019,24.987-17.734,45.129-42.319,48.856-7.488,1.135-14.496.97-21.882-.66Z"
                        />
                        <path
                          fill="#ff4d00"
                          d="M628.602,104.003l-.403-9.343-16.25-.131c-4.225-.034-7.137-3.725-7.129-7.671l.054-24.607c.01-4.476,3.46-7.844,8.219-7.839l46.762.05c4.819.527,7.952,2.632,7.949,7.487l-.027,42.007-39.175.048Z"
                        />
                      </g>
                    </g>
                    <g>
                      <path
                        fill="currentColor"
                        d="M397.131,154.106c-10.138,32.862-47.041,43.902-76.376,32.138-30.815-12.358-38.878-50.244-28.237-79.691,6.193-17.137,20.572-29.239,38.441-32.64,27.967-5.323,55.497,5.543,65.321,32.763,5.537,15.342,5.671,31.81.852,47.43ZM355.568,145.797c6.649-8.864,6.139-22.065-1.273-29.953-2.981-3.172-7.634-5.209-11.463-4.624-3.368.514-7.245,2.798-9.793,5.999-7.108,8.926-6.349,22.708,1.731,30.741,6.113,6.078,15.356,5.09,20.798-2.163Z"
                      />
                      <g>
                        <path
                          fill="currentColor"
                          d="M270.447,102.521l-22.734,76.026c-1.367,4.573-4.846,8.352-9.789,8.352h-24.961c-3.885,0-7.878-3.038-9.066-6.991l-34.838-115.893c-1.259-4.187,2.174-7.806,6.092-7.825l23.851-.116c4.85-.024,9.048,2.907,10.439,7.471l16.185,53.09,13.227-43.636,31.595,29.52Z"
                        />
                        <path
                          fill="#ff4d00"
                          d="M282.952,62.633l-10.246,33.804-30.271-28.368c-1.236-5.679,3.077-12.28,9.581-12.281l25.683-.004c3.384,0,5.58,2.95,5.252,6.848Z"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5" aria-label="تنقل لوحة التحكم">
              <Link
                href="/charging-map"
                className="flex h-11 items-center gap-3 rounded-xl bg-neutral-900 px-4 text-sm font-bold text-[var(--voltjo-orange)] shadow-[0_4px_12px_rgba(255,77,0,0.06)] transition-all"
              >
                <MapPin className="size-4 text-[var(--voltjo-orange)] animate-pulse" />
                <span>خريطة المحطات</span>
              </Link>

              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900/70 hover:text-white transition-all duration-200 text-right cursor-default"
              >
                <Zap className="size-4" />
                <span>محطات الشحن</span>
              </button>

              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900/70 hover:text-white transition-all duration-200 text-right cursor-default"
              >
                <Fuel className="size-4" />
                <span>محطات الوقود</span>
              </button>

              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900/70 hover:text-white transition-all duration-200 text-right cursor-default"
              >
                <Heart className="size-4" />
                <span>المحطات المحفوظة</span>
              </button>

              <div className="my-2 border-t border-neutral-900" />

              <Link
                href="/"
                className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-300 transition-all duration-200"
              >
                <House className="size-4" />
                <span>الرئيسية</span>
              </Link>
            </nav>
          </div>

          {/* User Account Panel at bottom */}
          <div className="border-t border-neutral-900 pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-neutral-900/50 transition-all duration-200">
                <Link href="/account" className="flex flex-1 items-center gap-3 overflow-hidden">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8] text-sm font-black text-[var(--voltjo-orange)] ring-2 ring-neutral-800 transition group-hover:ring-[var(--voltjo-orange)]">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </span>
                  <div className="overflow-hidden text-right">
                    <p className="truncate text-sm font-bold text-neutral-100 hover:text-[var(--voltjo-orange)] transition-colors">
                      {firstName}
                    </p>
                    <p className="truncate text-xs text-neutral-500 font-medium">
                      {email}
                    </p>
                  </div>
                </Link>

                <ConfirmSignOutForm
                  className="shrink-0"
                  buttonClassName="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-900 hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="size-4" />
                </ConfirmSignOutForm>
              </div>
            ) : (
              <Link
                href="/start"
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-[rgba(255,77,0,0.06)] border border-[rgba(255,77,0,0.15)] px-3 py-2.5 hover:bg-[rgba(255,77,0,0.12)] transition-all duration-200 group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--voltjo-orange)] text-sm font-bold text-white">
                    <User className="size-4" />
                  </span>
                  <div className="overflow-hidden text-right">
                    <p className="truncate text-sm font-bold text-white">ابدأ الآن</p>
                    <p className="truncate text-xs text-[var(--voltjo-orange)] font-medium">إنشاء ملف ذكي</p>
                  </div>
                </div>
                <ChevronLeft className="size-4 text-[var(--voltjo-orange)] transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Info Column & Map Layout */}
        <div className="relative flex flex-1 overflow-hidden h-full w-full">
          {/* Info Column */}
          <div
            className={`
              z-10 flex flex-col overflow-y-auto bg-white transition-all duration-300
              lg:w-[calc(50vw-16rem)] lg:border-l lg:border-[var(--voltjo-border)] lg:flex h-full shrink-0
              ${activeTab === "list" ? "fixed inset-x-0 top-14 bottom-16 flex z-25 bg-white" : "hidden"}
            `}
          >
            {infoColumn}
          </div>

          {/* Map Column */}
          <div
            className={`
              relative z-0 flex-1 lg:w-1/2 lg:shrink-0 h-full w-full lg:block
              ${activeTab === "map" ? "block" : "hidden"}
            `}
          >
            {map}
          </div>
        </div>

        {/* Floating Toggle Button for Mobile */}
        <button
          onClick={() => setActiveTab(activeTab === "map" ? "list" : "map")}
          className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl border border-neutral-800 hover:bg-neutral-900 transition active:scale-95 lg:hidden"
        >
          {activeTab === "map" ? (
            <>
              <List className="size-4 text-[var(--voltjo-orange)]" />
              <span>عرض القائمة</span>
            </>
          ) : (
            <>
              <MapIcon className="size-4 text-[var(--voltjo-orange)]" />
              <span>عرض الخريطة</span>
            </>
          )}
        </button>

        {/* Mobile Bottom Navigation Bar */}
        <div className="grid grid-cols-5 items-center bg-neutral-950 text-white border-t border-neutral-900 h-16 shrink-0 lg:hidden z-30 w-full">
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`flex flex-col items-center justify-center gap-1.5 h-full w-full transition-all ${
              activeTab === "map" ? "text-[var(--voltjo-orange)]" : "text-neutral-400"
            }`}
          >
            <MapPin className={`size-5 ${activeTab === "map" ? "animate-pulse" : ""}`} />
            <span className="text-[10px] font-bold">الخريطة</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1.5 h-full w-full text-neutral-600 cursor-default"
          >
            <Zap className="size-5" />
            <span className="text-[10px] font-bold">الشحن</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1.5 h-full w-full text-neutral-600 cursor-default"
          >
            <Fuel className="size-5" />
            <span className="text-[10px] font-bold">الوقود</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1.5 h-full w-full text-neutral-600 cursor-default"
          >
            <Heart className="size-5" />
            <span className="text-[10px] font-bold">المحفوظة</span>
          </button>

          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1.5 h-full w-full text-neutral-400 hover:text-white transition-all"
          >
            <House className="size-5" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
