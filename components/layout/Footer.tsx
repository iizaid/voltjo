import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

const footerColumns = [
  {
    title: "المنصة",
    links: [
      ["السيارات", "/cars"],
      ["المقارنة", "/compare"],
      ["الحاسبات", "/calculators"],
      ["المساعد الذكي", "/assistant"],
    ],
  },
  {
    title: "الدعم",
    links: [
      ["تواصل معنا", "/resources"],
      ["الدعم الفني", "/resources"],
      ["اقترح سيارة", "/resources"],
      ["الإبلاغ عن خطأ", "/resources"],
    ],
  },
  {
    title: "المصادر",
    links: [
      ["الأسعار", "/pricing"],
      ["الدليل", "/resources"],
      ["الأسئلة الشائعة", "/resources"],
    ],
  },
  {
    title: "قانوني",
    links: [
      ["سياسة الخصوصية", "/resources"],
      ["الشروط والأحكام", "/resources"],
    ],
  },
];

const socialLinks = [
  { label: "Instagram", icon: Instagram, href: "mailto:hello@voltjo.com" },
  { label: "Facebook", icon: Facebook, href: "mailto:hello@voltjo.com" },
  { label: "LinkedIn", icon: Linkedin, href: "mailto:hello@voltjo.com" },
  { label: "Email", icon: Mail, href: "mailto:hello@voltjo.com" },
];

export function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-[var(--voltjo-border)] bg-[var(--voltjo-bg-soft)]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-16 lg:grid-cols-[1.35fr_2fr] lg:px-8 lg:py-20">
        <div>
          <VoltJoLogo />
          <p className="mt-5 max-w-md text-base leading-8 text-[var(--voltjo-muted)]">
            منصة أردنية ذكية لتبسيط قرارك في عالم السيارات الكهربائية
            والهايبرد. نقارن، نحسب، ونقدم لك معلومات محلية موثوقة تختار بثقة.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socialLinks.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.35)] hover:text-[var(--voltjo-orange)]"
              >
                <Icon size={18} />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-black text-[var(--voltjo-black)]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-bold text-[var(--voltjo-muted)] transition hover:text-[var(--voltjo-orange)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--voltjo-border)]">
        <div className="mx-auto max-w-[1180px] px-6 py-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {[
              "بيانات محلية موثوقة",
              "تحديثات مستمرة للأسعار والمواصفات",
              "دعم فريق محلي في الأردن",
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--voltjo-muted)]"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-4 border-t border-[var(--voltjo-border-soft)] pt-6 text-sm leading-7 text-[var(--voltjo-muted)] lg:grid-cols-[1fr_auto]">
            <p>
              جميع الحسابات والمعلومات المعروضة تقديرية لأغراض الإرشاد فقط، وقد
              تختلف حسب الاستخدام الفعلي وتحديثات الشركات. يرجى التحقق من
              التفاصيل من المصادر الرسمية عند الحاجة.
            </p>
            <p className="latin text-right font-semibold" dir="ltr">
              © 2026 VoltJo. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
