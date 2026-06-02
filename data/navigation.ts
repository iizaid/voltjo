import type { LucideIcon } from "lucide-react";

export type NavItemData = {
  label: string;
  href: string;
};

export type MegaMenuItemData = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type MegaMenuColumnData = {
  title: string;
  items: MegaMenuItemData[];
};

export const navItems: NavItemData[] = [
  { label: "السيارات المدعومة", href: "/vehicles" },
  { label: "خريطة الشحن", href: "/charging-map" },
  { label: "حاسبة الشحن", href: "/charging-calculator" },
  { label: "المساعد الذكي", href: "/assistant" },
  { label: "الأسعار", href: "/#pricing" },
];
