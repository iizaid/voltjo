import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-[var(--voltjo-orange)] text-white on-dark-fg shadow-[0_10px_22px_rgba(255,77,0,0.18)] hover:bg-[var(--voltjo-orange-dark)] hover:shadow-[0_12px_26px_rgba(255,77,0,0.22)]",
  secondary:
    "border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(13,13,13,0.02)] hover:bg-[var(--voltjo-bg-soft)]",
  ghost:
    "bg-transparent text-[var(--voltjo-black)] hover:bg-[var(--voltjo-bg-soft)]",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  disabled = false,
}: ButtonProps) {
  const isAnimatedPrimary = variant === "primary" && !disabled;
  const disabledClasses = disabled
    ? "cursor-not-allowed bg-[var(--voltjo-surface-soft)] text-[var(--voltjo-muted)] shadow-none opacity-100 hover:bg-[var(--voltjo-surface-soft)]"
    : variants[variant];
  const motionClasses = isAnimatedPrimary
    ? "voltjo-action-button transition-transform duration-200 ease-[cubic-bezier(0,0,0.2,1)]"
    : "transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-0";
  const classes = `inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.28)] focus-visible:ring-offset-2 ${motionClasses} ${disabledClasses} ${className}`;
  const content = isAnimatedPrimary ? (
    <>
      <span className="voltjo-action-transition" aria-hidden="true" />
      <span className="voltjo-action-gradient" aria-hidden="true" />
      <span className="voltjo-action-label">{children}</span>
    </>
  ) : (
    children
  );

  if (href) {
    return (
      <Link
        aria-disabled={disabled}
        className={classes}
        href={disabled ? "#" : href}
        onClick={disabled ? (event) => event.preventDefault() : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled}>
      {content}
    </button>
  );
}
