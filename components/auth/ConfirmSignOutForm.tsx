"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";

interface ConfirmSignOutFormProps {
  className?: string;
  buttonClassName?: string;
  confirmMessage?: string;
  children: React.ReactNode;
}

export function ConfirmSignOutForm({
  className,
  buttonClassName,
  confirmMessage = "هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟",
  children,
}: ConfirmSignOutFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (err) {
        console.error("Sign out failed:", err);
      }
    });
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={buttonClassName}
      >
        {children}
      </button>

      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(13,13,13,0.45)] p-4 backdrop-blur-sm transition-all duration-300"
          dir="rtl"
          onClick={handleClose}
        >
          <div 
            className="relative w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-[0_32px_90px_rgba(13,13,13,0.18)] ring-1 ring-[rgba(255,255,255,0.72)] flex flex-col items-center transform transition-all duration-300 ease-out scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Website Logo shape */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1E8] mb-5 shadow-inner">
              <img
                src="/logo/VoltJo%20logo%20shape.svg"
                alt="VoltJo Logo"
                className="h-9 w-auto object-contain select-none"
              />
            </div>

            {/* Title */}
            <h3 className="text-xl font-extrabold text-[var(--voltjo-black)] mb-2">
              تسجيل الخروج
            </h3>

            {/* Confirmation Message */}
            <p className="text-sm font-bold leading-relaxed text-[var(--voltjo-muted)] mb-6 px-2">
              {confirmMessage}
            </p>

            {/* Buttons */}
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 h-12 rounded-full border border-[rgba(13,13,13,0.12)] bg-white text-sm font-bold text-[var(--voltjo-black)] hover:bg-[#F5F5F3] transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 h-12 rounded-full bg-[var(--voltjo-orange)] text-sm font-bold text-white hover:bg-[#e04300] transition shadow-lg shadow-orange-500/20 active:scale-[0.97] disabled:opacity-80 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>جاري الخروج...</span>
                  </>
                ) : (
                  <span>خروج</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
