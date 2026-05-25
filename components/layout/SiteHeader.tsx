import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";

export function SiteHeader() {
  return (
    <div className="relative z-30">
      <AnnouncementBar />
      <Navbar />
    </div>
  );
}
