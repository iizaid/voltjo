import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Car,
  MessageSquareText,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ConfirmSignOutForm } from "@/components/auth/ConfirmSignOutForm";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import {
  calculateProfileCompletion,
  getOptionLabel,
  UNKNOWN_LABEL,
} from "@/lib/auth/profile-display";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/start");
  }

  const completion = calculateProfileCompletion(profile);
  const profileComplete = Boolean(profile?.onboarding_completed);
  const displayName = profile?.full_name || user.email || "مستخدم VoltJo";

  return (
    <main
      className="min-h-dvh bg-[#FAFAFA] px-4 py-8 text-[var(--voltjo-black)] sm:px-6 lg:py-12"
      dir="rtl"
    >
      <section className="mx-auto max-w-5xl rounded-[30px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_24px_80px_rgba(13,13,13,0.06)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 border-b border-[rgba(13,13,13,0.08)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--voltjo-orange)]">
              لوحة التحكم
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              أهلًا، {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              هذه لوحة خفيفة لمرحلة الملف الذكي. ستصبح مركزًا للحفظ والمقارنات
              والتقارير عندما يتم ربط قاعدة بيانات السيارات والمحادثات لاحقًا.
            </p>
          </div>
          <ConfirmSignOutForm
            buttonClassName="h-11 rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold transition hover:bg-[#F5F5F3]"
          >
            تسجيل الخروج
          </ConfirmSignOutForm>
        </div>

        {!profile || !profileComplete ? (
          <div className="mt-8 rounded-[24px] border border-orange-200 bg-orange-50 p-6">
            <h2 className="text-2xl font-black">أكمل ملفك الذكي أولًا</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-8 text-[var(--voltjo-muted)]">
              الملف الذكي هو الأساس الحالي لتخصيص تجربة VoltJo. أكمله حتى
              يتمكن المساعد والمقارنات وتقديرات التكلفة من فهم احتياجك بشكل
              أفضل.
            </p>
            <Link
              href="/start"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white"
            >
              إكمال الملف الذكي
              <ArrowLeft size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="جاهزية الملف"
                value={`${completion.percentage}%`}
                description={completion.statusText}
                icon={UserRound}
              />
              <SummaryCard
                label="الهدف الحالي"
                value={getOptionLabel("mainGoal", profile.main_goal)}
                description="يستخدم لتوجيه المساعد والمقارنات."
                icon={Car}
              />
              <SummaryCard
                label="المساعد"
                value="جاهز للتجربة"
                description="الدردشة الحالية لا تزال محلية وتجريبية."
                icon={MessageSquareText}
              />
            </div>

            <div className="mt-8 rounded-[24px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-6">
              <h2 className="text-2xl font-black">الخطوة التالية</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-8 text-[var(--voltjo-muted)]">
                استخدم المساعد الآن، أو راجع ملفك الذكي. وحدات السيارات
                المحفوظة، المقارنات، التقارير، وسجل المحادثات ستُضاف بعد تجهيز
                قواعد البيانات الخاصة بها.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/assistant"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white"
                >
                  فتح المساعد
                  <ArrowLeft size={16} />
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-12 items-center rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold"
                >
                  إدارة الملف الشخصي
                </Link>
                <Link
                  href="/start"
                  className="inline-flex h-12 items-center rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold"
                >
                  تحديث الإجابات
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--voltjo-orange)]">
        <Icon size={21} />
      </span>
      <p className="mt-4 text-sm font-bold text-[var(--voltjo-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-black leading-8">{value || UNKNOWN_LABEL}</p>
      <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
        {description}
      </p>
    </div>
  );
}
