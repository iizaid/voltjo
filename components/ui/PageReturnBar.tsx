import Link from "next/link";
import { House } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function PageReturnBar() {
  return (
    <div className="mb-8 border-b border-[var(--voltjo-border)] bg-white" dir="rtl">
      <Container>
        <div className="flex min-h-[58px] items-center justify-start">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.12)]"
          >
            <House className="size-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
