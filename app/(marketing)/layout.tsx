import { TechnicalBackground } from "@/components/background/TechnicalBackground";
import { FloatingHelpWidget } from "@/components/layout/FloatingHelpWidget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div id="site-top" className="site-shell">
      <TechnicalBackground />
      <div className="site-content">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
      <FloatingHelpWidget />
    </div>
  );
}
