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
    "bg-[var(--voltjo-orange)] on-dark-fg shadow-[0_14px_30px_rgba(255,106,0,0.22)] hover:bg-[var(--voltjo-orange-dark)]",
  secondary:
    "border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] hover:border-[rgba(255,106,0,0.38)] hover:text-[var(--voltjo-orange)]",
  ghost:
    "bg-[var(--voltjo-orange-soft)] text-[var(--voltjo-orange-dark)] hover:bg-[#ffe5d4]",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const classes = `inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-extrabold transition duration-200 hover:-translate-y-0.5 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}
