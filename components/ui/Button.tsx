import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variants = {
  primary:
    "bg-[var(--voltjo-orange)] text-white shadow-[0_1px_0_rgba(13,13,13,0.05)] hover:bg-[var(--voltjo-orange-dark)]",
  secondary:
    "border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(13,13,13,0.02)] hover:border-[rgba(255,106,0,0.38)]",
  ghost:
    "bg-[rgba(255,106,0,0.05)] text-[var(--voltjo-orange-dark)] hover:bg-[rgba(255,106,0,0.1)]",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const classes = `inline-flex min-h-[44px] items-center justify-center rounded-[8px] px-6 text-sm font-bold transition-colors duration-200 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}
