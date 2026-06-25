"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Bot, CarFront, Mail, MessageCircle, X } from "lucide-react";
import Link from "next/link";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const actions = [
  {
    id: "assistant",
    title: "اسأل المساعد الذكي",
    description: "احصل على إجابة مخصصة عن السيارات الكهربائية والهايبرد.",
    href: "/assistant",
    Icon: Bot,
    external: false,
  },
  {
    id: "vehicles",
    title: "السيارات المدعومة",
    description: "تصفح قاعدة السيارات التي يعتمد عليها VoltJo في الإطلاق.",
    href: "/vehicles",
    Icon: CarFront,
    external: false,
  },
  {
    id: "contact",
    title: "تواصل معنا",
    description: "للملاحظات أو الإبلاغ عن خطأ في البيانات.",
    href: "mailto:zaid.tarawneh.505@gmail.com",
    Icon: Mail,
    external: true,
  },
] as const;

export function FloatingHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLAnchorElement[]>([]);
  const panelCtxRef = useRef<gsap.Context | null>(null);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Panel open / close animation
  useIsomorphicLayoutEffect(() => {
    if (!mounted || !panelRef.current) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    panelCtxRef.current?.revert();

    const ctx = gsap.context(() => {
      if (isOpen) {
        // Make panel visible before animating
        gsap.set(panelRef.current, { display: "flex" });
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 12, scale: 0.96, transformOrigin: "bottom right" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: prefersReduced ? 0 : 0.32,
            ease: "power3.out",
          }
        );
        // Stagger action items
        if (itemsRef.current.length) {
          gsap.fromTo(
            itemsRef.current,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.055,
              delay: prefersReduced ? 0 : 0.12,
              duration: prefersReduced ? 0 : 0.28,
              ease: "power2.out",
            }
          );
        }
      } else {
        gsap.to(panelRef.current, {
          opacity: 0,
          y: 8,
          scale: 0.98,
          duration: prefersReduced ? 0 : 0.2,
          ease: "power2.inOut",
          transformOrigin: "bottom right",
          onComplete: () => {
            gsap.set(panelRef.current, { display: "none" });
          },
        });
      }
    });

    panelCtxRef.current = ctx;
    return () => ctx.revert();
  }, [isOpen, mounted]);

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className="fixed z-[80]"
      style={{
        bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        right: "1.5rem",
      }}
      dir="rtl"
    >
      {/* Panel */}
      <div
        id="voltjo-help-panel"
        ref={panelRef}
        role="dialog"
        aria-label="مركز مساعدة VoltJo"
        aria-hidden={!isOpen}
        style={{
          display: "none",
          width: "clamp(300px, calc(100vw - 32px), 370px)",
          position: "absolute",
          bottom: "calc(100% + 14px)",
          right: 0,
          flexDirection: "column",
          background: "rgba(255,255,255,0.97)",
          border: "1px solid var(--voltjo-border, rgba(13,13,13,0.08))",
          borderRadius: "18px",
          boxShadow:
            "0 20px 60px rgba(13,13,13,0.10), 0 4px 16px rgba(13,13,13,0.06), 0 1px 0 rgba(255,255,255,0.8) inset",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "18px 18px 14px",
            borderBottom: "1px solid var(--voltjo-border, rgba(13,13,13,0.07))",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111",
                lineHeight: 1.3,
              }}
            >
              كيف نقدر نساعدك؟
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--voltjo-muted, #5f6673)",
                lineHeight: 1.5,
              }}
            >
              اختر أحد الخيارات السريعة أو افتح المساعد الذكي.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق مركز المساعدة"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              border: "1px solid var(--voltjo-border, rgba(13,13,13,0.08))",
              background: "transparent",
              cursor: "pointer",
              color: "#888",
              flexShrink: 0,
              marginRight: "8px",
              transition: "background 150ms, color 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f5f5f5";
              (e.currentTarget as HTMLButtonElement).style.color = "#333";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
            }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Action rows */}
        <div style={{ padding: "10px 12px" }}>
          {actions.map((action, i) => {
            const { Icon } = action;
            const isExternal = action.external;
            return (
              <Link
                key={action.id}
                href={action.href}
                ref={(el) => {
                  if (el) itemsRef.current[i] = el;
                }}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 10px",
                  borderRadius: "12px",
                  border:
                    "1px solid transparent",
                  marginBottom: i < actions.length - 1 ? "4px" : 0,
                  textDecoration: "none",
                  color: "inherit",
                  transition:
                    "background 160ms, border-color 160ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,106,0,0.05)";
                  el.style.borderColor = "rgba(255,106,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "transparent";
                  el.style.borderColor = "transparent";
                }}
              >
                {/* Icon box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "rgba(255,106,0,0.08)",
                    flexShrink: 0,
                    color: "var(--voltjo-orange, #ff6a00)",
                  }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#111",
                      lineHeight: 1.3,
                    }}
                  >
                    {action.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "11.5px",
                      color: "var(--voltjo-muted, #5f6673)",
                      lineHeight: 1.45,
                      whiteSpace: "normal",
                    }}
                  >
                    {action.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    color: "#ccc",
                    transform: "rotate(180deg)",
                  }}
                >
                  <path
                    d="M5.5 3L9.5 7L5.5 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            );
          })}
        </div>

        {/* Panel footer */}
        <div
          style={{
            padding: "10px 18px 14px",
            borderTop:
              "1px solid var(--voltjo-border, rgba(13,13,13,0.07))",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "var(--voltjo-muted, #5f6673)",
            }}
          >
            نرد عليك بأقرب وقت ممكن.
          </p>
        </div>
      </div>

      {/* Floating button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="فتح مركز المساعدة"
        aria-expanded={isOpen}
        aria-controls="voltjo-help-panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: isOpen
            ? "var(--voltjo-orange-dark, #d9480f)"
            : "var(--voltjo-orange, #ff6a00)",
          border: "1.5px solid rgba(0,0,0,0.08)",
          boxShadow:
            "0 6px 20px rgba(13,13,13,0.12), 0 1px 4px rgba(13,13,13,0.08)",
          cursor: "pointer",
          color: "#fff",
          transition: "background 200ms, transform 180ms ease, box-shadow 200ms ease",
          outline: "none",
          position: "relative",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 8px 28px rgba(13,13,13,0.18), 0 2px 8px rgba(13,13,13,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(13,13,13,0.12), 0 1px 4px rgba(13,13,13,0.08)";
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline =
            "2px solid rgba(255,106,0,0.5)";
          (e.currentTarget as HTMLButtonElement).style.outlineOffset = "3px";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = "none";
        }}
      >
        {isOpen ? (
          <X size={22} strokeWidth={2.2} />
        ) : (
          <MessageCircle size={22} strokeWidth={1.9} />
        )}
      </button>
    </div>
  );
}
