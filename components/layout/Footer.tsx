import Link from "next/link";
import { Mail } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

const navLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "السيارات", href: "/cars" },
  { label: "المقارنة", href: "/compare" },
  { label: "المساعد الذكي", href: "/assistant" },
  { label: "الأسعار", href: "/pricing" },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 bg-[#050505] text-white">
      {/* Subtle top accent border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--voltjo-orange)] to-transparent opacity-30" />
      
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-12 lg:px-8">
        
        {/* Logo & Tagline */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-14 items-center justify-center rounded-xl bg-white px-6 shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
            <VoltJoLogo scrollToTop />
          </div>
          <p className="max-w-md text-[15px] font-medium text-white/60">
            منصة أردنية ذكية للسيارات الكهربائية والهايبرد.
          </p>
        </div>

        {/* Navigation */}
        <nav className="mb-10 w-full" dir="rtl">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[15px] font-semibold text-white/80 transition-colors hover:text-[var(--voltjo-orange)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="mailto:zaid.tarawneh.505@gmail.com"
                className="text-[15px] font-semibold text-white/80 transition-colors hover:text-[var(--voltjo-orange)]"
              >
                تواصل معنا
              </a>
            </li>
          </ul>
        </nav>

        {/* Contact Button */}
        <div>
          <a
            href="mailto:zaid.tarawneh.505@gmail.com"
            className="group flex items-center gap-2.5 rounded-full border border-[var(--voltjo-orange)]/40 bg-[var(--voltjo-orange)]/10 px-7 py-3 transition-all hover:bg-[var(--voltjo-orange)]/20"
          >
            <Mail className="size-[18px] text-[var(--voltjo-orange)]" />
            <span className="text-[15px] font-bold tracking-wide text-[var(--voltjo-orange)]" dir="ltr">
              zaid.tarawneh.505@gmail.com
            </span>
          </a>
        </div>

      </div>
    </footer>
  );
}
