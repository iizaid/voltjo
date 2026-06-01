import type { Metadata } from "next";
import { Readex_Pro, Changa } from "next/font/google";
import { InitialSiteLoader } from "@/components/layout/InitialSiteLoader";
import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-primary",
});

const displayFont = Changa({
  subsets: ["arabic", "latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "VoltJo | منصة السيارات الكهربائية والهايبرد في الأردن",
  description:
    "منصة أردنية ذكية لمقارنة السيارات الكهربائية والهايبرد وحساب تكلفة الشحن والملكية داخل الأردن.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${readexPro.variable} ${displayFont.variable}`}
    >
      <body>
        {children}
        <InitialSiteLoader />
      </body>
    </html>
  );
}
