import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import { createClient } from "@/lib/supabase/server";

function getOptionLabel(questionId: string, value: string | null) {
  if (!value) return "غير محدد";
  const question = onboardingQuestions.find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label ?? value;
}

function getPriorityLabels(values: string[]) {
  const question = onboardingQuestions.find((item) => item.id === "priorities");
  return values.map(
    (value) =>
      question?.options.find((option) => option.value === value)?.label ?? value,
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/start");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/start");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const priorityLabels = profile ? getPriorityLabels(profile.priorities) : [];

  return (
    <main className="min-h-dvh bg-[#FAFAFA] px-4 py-10 text-[var(--voltjo-black)] sm:px-6">
      <section className="mx-auto max-w-4xl rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_24px_70px_rgba(13,13,13,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 border-b border-[rgba(13,13,13,0.08)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--voltjo-orange)]">
              لوحة VoltJo
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              ملفك الذكي
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

        {!profile || !profile.onboarding_completed ? (
          <div className="mt-8 rounded-[22px] border border-orange-200 bg-orange-50 p-5">
            <h2 className="text-xl font-black">أكمل ملفك الذكي</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              لم نجد ملفًا مكتملًا لهذا الحساب. أجب على أسئلة البداية حتى نخصص
              المساعد، المقارنات، وتقديرات التكلفة حسب احتياجك.
            </p>
            <Link
              href="/start"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white"
            >
              إكمال الأسئلة
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoItem label="البريد الإلكتروني" value={user.email ?? "غير محدد"} />
            <InfoItem label="الاسم" value={profile.full_name ?? "غير محدد"} />
            <InfoItem
              label="المدينة"
              value={getOptionLabel("city", profile.city)}
            />
            <InfoItem
              label="الهدف الرئيسي"
              value={getOptionLabel("mainGoal", profile.main_goal)}
            />
            <InfoItem
              label="نمط القيادة"
              value={getOptionLabel("drivingPattern", profile.driving_pattern)}
            />
            <InfoItem
              label="الشحن المنزلي"
              value={getOptionLabel(
                "homeChargingAccess",
                profile.home_charging_access,
              )}
            />
            <div className="rounded-[20px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-5 sm:col-span-2">
              <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                الأولويات
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(priorityLabels.length ? priorityLabels : ["غير محدد"]).map(
                  (priority) => (
                    <span
                      key={priority}
                      className="rounded-full border border-[rgba(13,13,13,0.08)] bg-white px-3 py-1 text-sm font-bold"
                    >
                      {priority}
                    </span>
                  ),
                )}
              </div>
            </div>
            <InfoItem
              label="حالة الملف"
              value={profile.onboarding_completed ? "مكتمل" : "غير مكتمل"}
            />
          </div>
        )}
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
