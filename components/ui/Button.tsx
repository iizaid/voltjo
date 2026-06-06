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
    "bg-[var(--voltjo-black)] text-white on-dark-fg shadow-[0_1px_0_rgba(13,13,13,0.05)] hover:bg-[#1a1a1a]",
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
  const disabledClasses = disabled
    ? "cursor-not-allowed bg-[var(--voltjo-surface-soft)] text-[var(--voltjo-muted)] shadow-none opacity-100 hover:bg-[var(--voltjo-surface-soft)]"
    : variants[variant];
  const classes = `inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.12)] ${disabledClasses} ${className}`;

  if (href) {
    return (
      <Link
        aria-disabled={disabled}
        className={classes}
        href={disabled ? "#" : href}
        onClick={disabled ? (event) => event.preventDefault() : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
