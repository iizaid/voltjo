import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UpdatePasswordForm } from "@/components/account/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <main
      className="min-h-dvh bg-[#FAFAF8] px-4 py-8 text-[var(--voltjo-black)] sm:px-6"
      dir="rtl"
    >
      <div className="mx-auto max-w-[760px] space-y-5">
        <Link
          href="/start"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--voltjo-muted)] transition hover:text-[var(--voltjo-black)]"
        >
          <ArrowLeft size={16} />
          العودة
        </Link>

        <UpdatePasswordForm />
      </div>
    </main>
  );
}
