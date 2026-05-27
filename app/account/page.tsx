import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BatteryCharging,
  Car,
  CheckCircle2,
  Gauge,
  Home,
  MapPin,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import {
  calculateProfileCompletion,
  getOptionLabel,
  getPriorityLabels,
  getUserInitial,
  UNKNOWN_LABEL,
} from "@/lib/auth/profile-display";

function formatDate(value: string | undefined) {
  if (!value) return UNKNOWN_LABEL;

  try {
    return new Intl.DateTimeFormat("ar-JO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return UNKNOWN_LABEL;
  }
}

export default async function AccountPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/start");
    return null;
  }

  const displayName = profile?.full_name || "مستخدم VoltJo";
  const accountCreatedAt = formatDate(user.created_at);
  const priorityLabels = getPriorityLabels(profile?.priorities);
  const completion = calculateProfileCompletion(profile);
  const profileComplete = Boolean(profile?.onboarding_completed);
  const profileItems = [
    {
      label: "البلد",
      value: getOptionLabel("country", profile?.country),
      icon: MapPin,
    },
    {
      label: "المدينة",
      value: getOptionLabel("city", profile?.city),
      icon: MapPin,
    },
    {
      label: "حالة السيارة",
      value: getOptionLabel("ownershipStatus", profile?.ownership_status),
      icon: Car,
    },
    {
      label: "الهدف الرئيسي",
      value: getOptionLabel("mainGoal", profile?.main_goal),
      icon: Gauge,
    },
    {
      label: "نمط الاستخدام",
      value: getOptionLabel("drivingPattern", profile?.driving_pattern),
      icon: BatteryCharging,
    },
    {
      label: "الشحن المنزلي",
      value: getOptionLabel("homeChargingAccess", profile?.home_charging_access),
      icon: Home,
    },
    {
      label: "تجربة القيادة",
      value: getOptionLabel(
        "hasDrivenEvOrHybrid",
        profile?.has_driven_ev_or_hybrid,
      ),
      icon: CheckCircle2,
    },
  ];

  return (
    <main
      className="min-h-dvh bg-[#FAFAFA] px-4 py-8 text-[var(--voltjo-black)] sm:px-6 lg:py-12"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full border border-[rgba(13,13,13,0.1)] bg-white px-4 text-sm font-bold transition hover:bg-[#F5F5F3]"
          >
            العودة للرئيسية
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="h-10 rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-4 text-sm font-bold transition hover:bg-[#F5F5F3]"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-[rgba(13,13,13,0.08)] bg-white shadow-[0_24px_80px_rgba(13,13,13,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--voltjo-black)] text-2xl font-black text-white">
                    {getUserInitial(displayName)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--voltjo-orange)]">
                      الملف الذكي
                    </p>
                    <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
                      {displayName}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
                      {user.email ?? UNKNOWN_LABEL}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-black ${
                    profileComplete
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-orange-200 bg-orange-50 text-orange-800"
                  }`}
                >
                  {profileComplete ? "مكتمل" : "غير مكتمل"}
                </span>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MiniStat label="تاريخ إنشاء الحساب" value={accountCreatedAt} />
                <MiniStat
                  label="جاهزية الملف"
                  value={`${completion.percentage}%`}
                />
                <MiniStat
                  label="حالة التخصيص"
                  value={profileComplete ? "مفعّل" : "بانتظار الإكمال"}
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/assistant"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  فتح المساعد
                  <ArrowLeft size={16} />
                </Link>
                <Link
                  href="/start"
                  className="inline-flex h-12 items-center rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold transition hover:bg-[#F6F6F4]"
                >
                  {profileComplete ? "تعديل الملف الذكي" : "إكمال الملف الذكي"}
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center rounded-full border border-[rgba(13,13,13,0.12)] bg-white px-5 text-sm font-bold transition hover:bg-[#F6F6F4]"
                >
                  لوحة التحكم
                </Link>
              </div>
            </div>

            <div className="border-t border-[rgba(13,13,13,0.08)] bg-[#F8F7F4] p-6 sm:p-8 lg:border-r lg:border-t-0 lg:p-10">
              <div className="rounded-[24px] border border-[rgba(13,13,13,0.08)] bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                      اكتمال الملف
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {completion.percentage}%
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,106,0,0.1)] text-[var(--voltjo-orange)]">
                    <UserRound size={24} />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(13,13,13,0.07)]">
                  <div
                    className="h-full rounded-full bg-[var(--voltjo-orange)]"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                  {completion.statusText}
                </p>
                {completion.missing.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {completion.missing.map((item) => (
                      <span
                        key={item.key}
                        className="rounded-full border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] px-3 py-1 text-xs font-bold text-[var(--voltjo-muted)]"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_18px_60px_rgba(13,13,13,0.045)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--voltjo-orange)]">
                  ملخص الملف
                </p>
                <h2 className="mt-2 text-2xl font-black">تفضيلاتك الذكية</h2>
              </div>
              <ShieldCheck className="text-[var(--voltjo-orange)]" size={24} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {profileItems.map((item) => (
                <ProfileField
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                />
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-5">
              <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                الأولويات
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(priorityLabels.length ? priorityLabels : [UNKNOWN_LABEL]).map(
                  (priority) => (
                    <span
                      key={priority}
                      className="rounded-full border border-[rgba(13,13,13,0.08)] bg-white px-3 py-1.5 text-sm font-bold"
                    >
                      {priority}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_18px_60px_rgba(13,13,13,0.045)] sm:p-8">
              <p className="text-sm font-bold text-[var(--voltjo-orange)]">
                كيف نستخدم الملف؟
              </p>
              <h2 className="mt-2 text-2xl font-black">تخصيص بدون مبالغة</h2>
              <p className="mt-4 text-sm font-semibold leading-8 text-[var(--voltjo-muted)]">
                يستخدم VoltJo هذه الإجابات لتوجيه المساعد، ترتيب المقارنات،
                وتحسين تقديرات تكلفة الشحن حسب استخدامك داخل الأردن. لا يتم
                اعتبارها بيانات نهائية، ويمكنك تحديثها لاحقًا قبل ربط مزايا
                التوصيات والحفظ.
              </p>
            </section>

            <section className="rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_18px_60px_rgba(13,13,13,0.045)] sm:p-8">
              <p className="text-sm font-bold text-[var(--voltjo-orange)]">
                الأمان
              </p>
              <h2 className="mt-2 text-2xl font-black">بيانات الدخول</h2>
              <div className="mt-5 grid gap-3">
                <MiniStat label="البريد الإلكتروني" value={user.email ?? UNKNOWN_LABEL} />
                <MiniStat label="تاريخ الحساب" value={accountCreatedAt} />
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                كلمة المرور تُدار عبر نظام تسجيل آمن ولا يتم تخزينها داخل VoltJo.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-4">
      <p className="text-xs font-bold text-[var(--voltjo-muted)]">{label}</p>
      <p className="mt-2 text-base font-black leading-7">{value}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-[rgba(13,13,13,0.08)] bg-[#FAFAFA] p-4">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--voltjo-orange)]">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-xs font-bold text-[var(--voltjo-muted)]">
          {label}
        </span>
        <span className="mt-1 block text-base font-black leading-7">{value}</span>
      </span>
    </div>
  );
}
