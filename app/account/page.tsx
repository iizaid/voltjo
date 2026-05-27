import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

function formatDate(value: string | undefined) {
  if (!value) return "غير محدد";

  try {
    return new Intl.DateTimeFormat("ar-JO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "غير محدد";
  }
}

export default async function AccountPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/start");
  }

  const profileComplete = Boolean(profile?.onboarding_completed);

  return (
    <main className="min-h-dvh bg-[#FAFAFA] px-4 py-10 text-[var(--voltjo-black)] sm:px-6">
      <section className="mx-auto max-w-3xl rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_24px_70px_rgba(13,13,13,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 border-b border-[rgba(13,13,13,0.08)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--voltjo-orange)]">
              حساب VoltJo
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              الأمان والملف الشخصي
            </h1>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="h-11 rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold transition hover:bg-[#F5F5F3]"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoItem label="البريد الإلكتروني" value={user.email ?? "غير محدد"} />
          <InfoItem label="الاسم" value={profile?.full_name ?? "غير محدد"} />
          <InfoItem label="تاريخ إنشاء الحساب" value={formatDate(user.created_at)} />
          <InfoItem
            label="حالة الملف الذكي"
            value={profileComplete ? "مكتمل ومحفوظ" : "غير مكتمل"}
          />
        </div>

        <div className="mt-6 rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-5">
          <h2 className="text-lg font-black">الملف الذكي</h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
            هذا الملف منفصل عن بيانات الدخول، ويُستخدم لتخصيص تجربة المساعد
            والمقارنات وتقديرات التكلفة داخل VoltJo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={profileComplete ? "/dashboard" : "/start"}
              className="inline-flex h-11 items-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white"
            >
              {profileComplete ? "عرض لوحة الملف" : "إكمال الملف الذكي"}
            </Link>
            <Link
              href="/assistant"
              className="inline-flex h-11 items-center rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold"
            >
              فتح المساعد
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-5">
      <p className="text-sm font-bold text-[var(--voltjo-muted)]">{label}</p>
      <p className="mt-2 text-lg font-black leading-8">{value}</p>
    </div>
  );
}
