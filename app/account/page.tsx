import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronLeft, LogOut } from "lucide-react";
import {
  signOutAction,
  updateAccountProfileAction,
} from "@/lib/auth/actions";
import {
  getCurrentUserAndProfile,
  type CurrentProfile,
} from "@/lib/auth/session";
import {
  getOptionLabel,
  getPriorityLabels,
  getUserInitial,
  UNKNOWN_LABEL,
} from "@/lib/auth/profile-display";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ACCOUNT_SECTIONS = [
  "profile",
  "account",
  "security",
  "notifications",
  "privacy",
  "preferences",
] as const;

type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

function resolveString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveSection(value: string | string[] | undefined): AccountSection {
  const normalized = resolveString(value);
  if (
    normalized &&
    ACCOUNT_SECTIONS.includes(normalized as AccountSection)
  ) {
    return normalized as AccountSection;
  }
  return "profile";
}

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

function getDisplayName(
  fullName: string | null | undefined,
  email: string | null,
) {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "مستخدم VoltJo";
}

function getProfileValue(questionId: string, value: string | null | undefined) {
  const label = getOptionLabel(questionId, value);
  return label || UNKNOWN_LABEL;
}

function getSectionMeta(section: AccountSection) {
  switch (section) {
    case "profile":
      return {
        title: "الملف الشخصي",
        subtitle: "مراجعة هويتك داخل VoltJo وملخص الملف الذكي الحالي.",
      };
    case "account":
      return {
        title: "معلومات الحساب",
        subtitle: "إدارة البيانات الأساسية المرتبطة بحسابك الحالي.",
      };
    case "security":
      return {
        title: "الأمان",
        subtitle: "تنظيم الوصول إلى الحساب والخروج الآمن من الجلسة الحالية.",
      };
    case "notifications":
      return {
        title: "الإشعارات",
        subtitle: "عرض طريقة تنظيم الإشعارات قبل ربط إعدادات الإرسال المتقدمة.",
      };
    case "privacy":
      return {
        title: "الخصوصية والبيانات",
        subtitle: "إدارة طلبات البيانات والخيارات الحساسة بطريقة واضحة وآمنة.",
      };
    case "preferences":
      return {
        title: "التفضيلات",
        subtitle: "التفضيلات العامة لتجربة الاستخدام داخل VoltJo.",
      };
  }
}

function getStatusMessage(status: string | undefined) {
  switch (status) {
    case "saved":
      return {
        tone: "success" as const,
        message: "تم تحديث الاسم الكامل بنجاح.",
      };
    case "invalid-name":
      return {
        tone: "error" as const,
        message: "أدخل اسمًا صحيحًا قبل الحفظ.",
      };
    case "unavailable":
      return {
        tone: "error" as const,
        message: "الخدمة غير جاهزة الآن. حاول مرة أخرى لاحقًا.",
      };
    case "failed":
      return {
        tone: "error" as const,
        message: "تعذر حفظ التعديل الآن. حاول مرة أخرى.",
      };
    default:
      return null;
  }
}

function SidebarItem({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-[16px] px-3 py-3 text-sm font-bold transition ${
        active
          ? "bg-[rgba(255,106,0,0.08)] text-[var(--voltjo-black)]"
          : "text-[var(--voltjo-muted)] hover:bg-[#F6F6F2] hover:text-[var(--voltjo-black)]"
      }`}
    >
      <span>{label}</span>
      {active ? (
        <ChevronLeft size={16} className="text-[var(--voltjo-orange)]" />
      ) : null}
    </Link>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_8px_26px_rgba(13,13,13,0.03)] sm:p-7">
      <div className="mb-5">
        <h2 className="text-[24px] font-black leading-tight text-[var(--voltjo-black)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string; muted?: boolean }>;
}) {
  return (
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <p className="text-sm font-bold text-[var(--voltjo-muted)]">{item.label}</p>
          <p
            className={`text-base font-black leading-7 ${
              item.muted ? "text-[var(--voltjo-muted)]" : "text-[var(--voltjo-black)]"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PlaceholderButton({
  children,
  tone = "secondary",
}: {
  children: ReactNode;
  tone?: "secondary" | "danger";
}) {
  return (
    <button
      type="button"
      disabled
      className={`inline-flex h-10 items-center justify-center rounded-[14px] border px-4 text-sm font-bold disabled:cursor-not-allowed ${
        tone === "danger"
          ? "border-red-200 bg-white text-red-600 opacity-90"
          : "border-[rgba(13,13,13,0.08)] bg-white text-[var(--voltjo-muted)] opacity-90"
      }`}
    >
      {children}
    </button>
  );
}

function PlaceholderRow({
  title,
  description,
  buttonLabel,
  danger = false,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[18px] border p-4 sm:flex-row sm:items-center sm:justify-between ${
        danger
          ? "border-red-200 bg-red-50/60"
          : "border-[rgba(13,13,13,0.08)] bg-[#FBFBF9]"
      }`}
    >
      <div>
        <p
          className={`text-sm font-black ${
            danger ? "text-red-700" : "text-[var(--voltjo-black)]"
          }`}
        >
          {title}
        </p>
        <p
          className={`mt-1 text-sm font-medium leading-6 ${
            danger ? "text-red-700/85" : "text-[var(--voltjo-muted)]"
          }`}
        >
          {description}
        </p>
      </div>
      <PlaceholderButton tone={danger ? "danger" : "secondary"}>
        {buttonLabel}
      </PlaceholderButton>
    </div>
  );
}

function NotificationRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-4">
      <p className="text-sm font-black text-[var(--voltjo-black)]">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
        {description}
      </p>
      <p className="mt-3 text-xs font-extrabold text-[var(--voltjo-muted)]">
        للعرض فقط
      </p>
    </div>
  );
}

function StatusNotice({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}

function AccountSettingsContent({
  section,
  userEmail,
  emailConfirmed,
  createdAt,
  displayName,
  initial,
  profile,
  status,
}: {
  section: AccountSection;
  userEmail: string;
  emailConfirmed: boolean;
  createdAt: string;
  displayName: string;
  initial: string;
  profile: CurrentProfile | null;
  status?: string;
}) {
  const priorities = getPriorityLabels(profile?.priorities);
  const accountInfo = [
    { label: "البريد الإلكتروني", value: userEmail },
    {
      label: "البلد",
      value: getProfileValue("country", profile?.country),
      muted: !profile?.country,
    },
    {
      label: "المدينة",
      value: getProfileValue("city", profile?.city),
      muted: !profile?.city,
    },
    {
      label: "حالة الملف",
      value: profile?.onboarding_completed ? "مكتمل" : "غير مكتمل",
    },
  ];

  const preferencesInfo = [
    { label: "اللغة", value: "العربية" },
    { label: "المنطقة الزمنية", value: "Asia/Amman" },
    { label: "واجهة الاستخدام", value: "الوضع الفاتح" },
    {
      label: "السوق المفضّل",
      value:
        profile?.country === "jordan"
          ? "الأردن"
          : getProfileValue("country", profile?.country),
      muted: !profile?.country,
    },
  ];

  const smartProfileItems = [
    {
      label: "الهدف الرئيسي",
      value: getProfileValue("mainGoal", profile?.main_goal),
    },
    {
      label: "نمط الاستخدام",
      value: getProfileValue("drivingPattern", profile?.driving_pattern),
    },
    {
      label: "الشحن المنزلي",
      value: getProfileValue("homeChargingAccess", profile?.home_charging_access),
    },
  ];

  const statusMessage = getStatusMessage(status);

  switch (section) {
    case "profile":
      return (
        <div className="space-y-6">
          <SettingsCard title="الملف الشخصي">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,106,0,0.12)] text-3xl font-black text-[var(--voltjo-orange)]">
                  {initial}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[28px] font-black leading-tight text-[var(--voltjo-black)]">
                      {displayName}
                    </h2>
                    {emailConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                        <BadgeCheck size={14} />
                        البريد مفعّل
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-semibold text-[var(--voltjo-muted)]">
                    {userEmail}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--voltjo-muted)]">
                    عضو منذ {createdAt}
                  </p>
                </div>
              </div>

              <PlaceholderButton>تغيير الصورة</PlaceholderButton>
            </div>
          </SettingsCard>

          <SettingsCard
            title="الملف الذكي"
            description="ملخص قصير لأهم البيانات الحالية التي يعتمد عليها VoltJo في تخصيص التجربة."
          >
            <div className="space-y-5">
              <InfoGrid items={smartProfileItems} />

              <div className="border-t border-[rgba(13,13,13,0.06)] pt-5">
                <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                  الأولويات
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(priorities.length ? priorities : [UNKNOWN_LABEL]).map((priority) => (
                    <span
                      key={priority}
                      className="rounded-full border border-[rgba(13,13,13,0.08)] bg-[#FAFAF7] px-3 py-1.5 text-sm font-bold text-[var(--voltjo-black)]"
                    >
                      {priority}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/start"
                  className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
                >
                  تعديل الملف الذكي
                </Link>
              </div>
            </div>
          </SettingsCard>
        </div>
      );
    case "account":
      return (
        <SettingsCard
          title="معلومات الحساب"
          description="يمكن تعديل الاسم الكامل الآن. بقية الحقول للعرض فقط في هذه المرحلة."
        >
          <div className="space-y-6">
            {statusMessage ? (
              <StatusNotice tone={statusMessage.tone} message={statusMessage.message} />
            ) : null}

            <form action={updateAccountProfileAction} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)] sm:col-span-2">
                  الاسم الكامل
                  <input
                    name="fullName"
                    defaultValue={profile?.full_name ?? ""}
                    placeholder={displayName}
                    className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)]"
                  />
                </label>
              </div>

              <InfoGrid items={accountInfo} />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:opacity-95"
                >
                  حفظ التغييرات
                </button>
                <p className="text-sm font-medium text-[var(--voltjo-muted)]">
                  البريد الإلكتروني للعرض فقط حاليًا.
                </p>
              </div>
            </form>
          </div>
        </SettingsCard>
      );
    case "security":
      return (
        <SettingsCard
          title="الأمان وتسجيل الدخول"
          description="الإجراءات الحساسة غير مفعّلة من هذه الواجهة بعد، لكن الخروج من الحساب يعمل بشكل كامل."
        >
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-4">
              <p className="text-sm font-black text-[var(--voltjo-black)]">
                كلمة المرور
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
                تغيير كلمة المرور يتم عبر رابط آمن يرسل إلى بريدك الإلكتروني عند
                تفعيل إعدادات الحساب المتقدمة.
              </p>
            </div>

            <div className="rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--voltjo-black)]">
                    تسجيل الخروج
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
                    إنهاء الجلسة الحالية والعودة إلى صفحة البداية.
                  </p>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:opacity-95"
                  >
                    تسجيل الخروج
                  </button>
                </form>
              </div>
            </div>
          </div>
        </SettingsCard>
      );
    case "notifications":
      return (
        <SettingsCard
          title="الإشعارات"
          description="هذا القسم يوضح بنية الإشعارات المقصودة للحساب قبل ربط قنوات الإرسال والإدارة المتقدمة."
        >
          <div className="space-y-4">
            <NotificationRow
              title="إشعارات البريد الإلكتروني"
              description="ستُستخدم لتنبيهات الحساب والرسائل الأساسية المرتبطة بأمان الوصول."
            />
            <NotificationRow
              title="تنبيهات المقارنات"
              description="ستعرض الإشعارات المتعلقة بالمقارنات المحفوظة عند تفعيل هذا المسار."
            />
            <NotificationRow
              title="تحديثات السيارات والأسعار"
              description="مخصصة لتلقي تنبيهات حول التغييرات المهمة في السوق عند ربط خدمة الإرسال."
            />
            <NotificationRow
              title="تذكيرات الصيانة"
              description="ستُربط لاحقًا بميزات الملكية والمتابعة بعد إضافة البيانات اللازمة."
            />
          </div>
        </SettingsCard>
      );
    case "privacy":
      return (
        <SettingsCard
          title="الخصوصية والبيانات"
          description="هذه الإجراءات لا تنفذ أي تغييرات فعلية الآن، لكنها موضوعة هنا ضمن هيكلة واضحة للحساب."
        >
          <div className="space-y-4">
            <PlaceholderRow
              title="تصدير البيانات"
              description="يمكن استخدام هذا المسار لاحقًا لطلب نسخة من بيانات حسابك."
              buttonLabel="تصدير البيانات"
            />
            <PlaceholderRow
              title="إعدادات الخصوصية"
              description="سيتم تفعيل هذا الخيار بعد ربط إعدادات الحساب المتقدمة."
              buttonLabel="إعدادات الخصوصية"
            />
            <PlaceholderRow
              title="حذف الحساب"
              description="حذف الحساب غير متاح من الواجهة الحالية. تواصل مع الدعم لمعالجة الطلب بشكل آمن."
              buttonLabel="طلب حذف الحساب"
              danger
            />
          </div>
        </SettingsCard>
      );
    case "preferences":
      return (
        <SettingsCard
          title="تفضيلات الحساب"
          description="هذه التفضيلات معروضة بالحالة الحالية للحساب، من دون إجراءات حفظ إضافية."
        >
          <InfoGrid items={preferencesInfo} />
        </SettingsCard>
      );
  }
}

export default async function AccountPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const activeSection = resolveSection(resolvedSearchParams.section);
  const sectionMeta = getSectionMeta(activeSection);
  const status = resolveString(resolvedSearchParams.status);
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/start");
  }

  const displayName = getDisplayName(profile?.full_name, user.email ?? null);
  const initial = getUserInitial(displayName);
  const createdAt = formatDate(user.created_at);

  return (
    <main
      className="min-h-dvh bg-[#FAFAF8] px-4 py-6 text-[var(--voltjo-black)] sm:px-6 lg:px-8 lg:py-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1220px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,860px)_240px] lg:items-start lg:justify-center">
          <section className="space-y-6">
            <header className="space-y-2">
              <Link
                href="/assistant"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--voltjo-muted)] transition hover:text-[var(--voltjo-black)]"
              >
                <ArrowLeft size={16} />
                <span>العودة إلى المساعد</span>
              </Link>
              <h1 className="text-[30px] font-black leading-tight text-[var(--voltjo-black)]">
                {sectionMeta.title}
              </h1>
              <p className="text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
                {sectionMeta.subtitle}
              </p>
            </header>

            <AccountSettingsContent
              section={activeSection}
              userEmail={user.email ?? UNKNOWN_LABEL}
              emailConfirmed={Boolean(user.email_confirmed_at)}
              createdAt={createdAt}
              displayName={displayName}
              initial={initial}
              profile={profile}
              status={status}
            />
          </section>

          <aside className="rounded-[24px] border border-[rgba(13,13,13,0.08)] bg-white p-4 shadow-[0_10px_30px_rgba(13,13,13,0.03)] lg:sticky lg:top-6 lg:h-fit">
            <div>
              <p className="text-lg font-black text-[var(--voltjo-black)]">
                الإعدادات
              </p>
            </div>

            <nav className="mt-5 grid gap-1.5">
              <SidebarItem
                href="/account?section=profile"
                label="الملف الشخصي"
                active={activeSection === "profile"}
              />
              <SidebarItem
                href="/account?section=account"
                label="معلومات الحساب"
                active={activeSection === "account"}
              />
              <SidebarItem
                href="/account?section=security"
                label="الأمان"
                active={activeSection === "security"}
              />
              <SidebarItem
                href="/account?section=notifications"
                label="الإشعارات"
                active={activeSection === "notifications"}
              />
              <SidebarItem
                href="/account?section=privacy"
                label="الخصوصية والبيانات"
                active={activeSection === "privacy"}
              />
              <SidebarItem
                href="/account?section=preferences"
                label="التفضيلات"
                active={activeSection === "preferences"}
              />
            </nav>

            <form action={signOutAction} className="mt-6">
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-[rgba(13,13,13,0.08)] bg-white text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#F5F5F1]"
              >
                <LogOut size={16} />
                تسجيل الخروج
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
