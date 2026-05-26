import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-latin",
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
      className={`${ibmPlexArabic.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
