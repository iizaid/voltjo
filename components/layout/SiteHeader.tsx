import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[var(--voltjo-border-soft)] bg-white/85 backdrop-blur-xl transition-all duration-200">
      <AnnouncementBar />
      <Navbar />
    </header>
  );
}
