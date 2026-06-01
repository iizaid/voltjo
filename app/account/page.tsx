import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronLeft, LogOut } from "lucide-react";
import { AvatarCustomizer } from "@/components/account/AvatarCustomizer";
import { DeleteAccountRequest } from "@/components/account/DeleteAccountRequest";
import { PasswordResetAction } from "@/components/account/PasswordResetAction";
import { PrivacySettingsForm } from "@/components/account/PrivacySettingsForm";
import {
  COUNTRY_OPTIONS,
  JORDAN_CITY_OPTIONS,
  normalizePrivacySettings,
} from "@/lib/account/settings";
import { resolveAccountAvatarUrl } from "@/lib/account/avatar";
import {
  signOutAction,
  updateAccountProfileAction,
} from "@/lib/auth/actions";
import {
  getCurrentUserAndProfile,
  type CurrentProfile,
} from "@/lib/auth/session";
import { getOptionLabel, getPriorityLabels, UNKNOWN_LABEL } from "@/lib/auth/profile-display";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ACCOUNT_SECTIONS = ["profile", "account", "security", "privacy"] as const;

type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

function resolveString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveSection(value: string | string[] | undefined): AccountSection {
  const normalized = resolveString(value);
  if (normalized && ACCOUNT_SECTIONS.includes(normalized as AccountSection)) {
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

function getDisplayName(fullName: string | null | undefined, email: string | null) {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "مستخدم VoltJo";
}

function getSectionMeta(section: AccountSection) {
  switch (section) {
    case "profile":
      return {
        title: "الملف الشخصي",
        subtitle: "مراجعة هويتك الحالية وبيانات الملف الذكي المرتبطة بحسابك.",
      };
    case "account":
      return {
        title: "معلومات الحساب",
        subtitle: "تحديث الاسم وبعض البيانات الأساسية المرتبطة بحسابك.",
      };
    case "security":
      return {
        title: "الأمان",
        subtitle: "إرسال رابط تغيير كلمة المرور وإدارة الخروج من الجلسة الحالية.",
      };
    case "privacy":
      return {
        title: "الخصوصية والبيانات",
        subtitle: "التحكم في استخدام بياناتك وتنزيل نسخة من معلومات حسابك.",
      };
  }
}

function getStatusMessage(status: string | undefined) {
  switch (status) {
    case "saved":
      return {
        tone: "success" as const,
        message: "تم حفظ معلومات الحساب بنجاح.",
      };
    case "invalid-name":
      return {
        tone: "error" as const,
        message: "أدخل اسمًا صحيحًا قبل الحفظ.",
      };
    case "invalid-location":
      return {
        tone: "error" as const,
        message: "اختر بلدًا ومدينة صحيحتين قبل الحفظ.",
      };
    case "unavailable":
      return {
        tone: "error" as const,
        message: "الخدمة غير جاهزة الآن. حاول لاحقًا.",
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

function getProfileValue(questionId: string, value: string | null | undefined) {
  return getOptionLabel(questionId, value) || UNKNOWN_LABEL;
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

function ProfileSummary({
  profile,
}: {
  profile: CurrentProfile | null;
}) {
  const priorities = getPriorityLabels(profile?.priorities);
  const items = [
    {
      label: "الهدف الرئيسي",
      value: getProfileValue("mainGoal", profile?.main_goal),
      muted: !profile?.main_goal,
    },
    {
      label: "نمط الاستخدام",
      value: getProfileValue("drivingPattern", profile?.driving_pattern),
      muted: !profile?.driving_pattern,
    },
    {
      label: "إمكانية الشحن المنزلي",
      value: getProfileValue("homeChargingAccess", profile?.home_charging_access),
      muted: !profile?.home_charging_access,
    },
    {
      label: "حالة الامتلاك",
      value: getProfileValue("ownershipStatus", profile?.ownership_status),
      muted: !profile?.ownership_status,
    },
  ];

  return (
    <div className="space-y-5">
      <InfoGrid items={items} />

      <div className="border-t border-[rgba(13,13,13,0.06)] pt-5">
        <p className="text-sm font-bold text-[var(--voltjo-muted)]">الأولويات</p>
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
  );
}

function AccountSectionContent({
  status,
  profile,
  displayName,
  userEmail,
}: {
  status?: string;
  profile: CurrentProfile | null;
  displayName: string;
  userEmail: string;
}) {
  const statusMessage = getStatusMessage(status);
  const selectedCountry = profile?.country && COUNTRY_OPTIONS.some((item) => item.value === profile.country)
    ? profile.country
    : "jordan";
  const selectedCity = profile?.city && JORDAN_CITY_OPTIONS.some((item) => item.value === profile.city)
    ? profile.city
    : "amman";

  return (
    <SettingsCard
      title="معلومات الحساب"
      description="يمكنك تعديل الاسم والبلد والمدينة من هذه الصفحة، بينما يبقى البريد الإلكتروني للعرض فقط."
    >
      <div className="space-y-6">
        {statusMessage ? (
          <StatusNotice tone={statusMessage.tone} message={statusMessage.message} />
        ) : null}

        <form action={updateAccountProfileAction} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              الاسم الكامل
              <input
                name="fullName"
                defaultValue={profile?.full_name ?? ""}
                placeholder={displayName}
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البريد الإلكتروني
              <input
                value={userEmail}
                readOnly
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-[#F8F8F4] px-4 text-base font-semibold text-[var(--voltjo-muted)] outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البلد
              <select
                name="country"
                defaultValue={selectedCountry}
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)]"
              >
                {COUNTRY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              المدينة داخل الأردن
              <select
                name="city"
                defaultValue={selectedCity}
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)]"
              >
                {JORDAN_CITY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
            إذا اخترت بلدًا غير الأردن، سيتم تجاهل قيمة المدينة الحالية تلقائيًا.
          </p>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:opacity-95"
          >
            حفظ معلومات الحساب
          </button>
        </form>
      </div>
    </SettingsCard>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="تغيير كلمة المرور"
        description="سنرسل رابطًا آمنًا إلى بريدك الإلكتروني الحالي حتى تتمكن من تعيين كلمة مرور جديدة بنفسك."
      >
        <PasswordResetAction />
      </SettingsCard>

      <SettingsCard
        title="تسجيل الخروج"
        description="إنهاء الجلسة الحالية والعودة إلى الصفحة الرئيسية."
      >
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:opacity-95"
          >
            تسجيل الخروج
          </button>
        </form>
      </SettingsCard>
    </div>
  );
}

function PrivacySection({
  profile,
}: {
  profile: CurrentProfile | null;
}) {
  const privacySettings = normalizePrivacySettings(profile?.privacy_settings);

  return (
    <div className="space-y-6">
      <SettingsCard
        title="إعدادات الخصوصية"
        description="يمكنك إدارة بعض خيارات استخدام بيانات حسابك داخل التجربة الحالية."
      >
        <PrivacySettingsForm initialValues={privacySettings} />
      </SettingsCard>

      <SettingsCard
        title="البيانات"
        description="يمكنك تنزيل نسخة JSON من بياناتك الحالية، من دون كلمات مرور أو جلسات أو مفاتيح خاصة."
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--voltjo-black)]">
                تصدير البيانات
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
                تنزيل نسخة من بيانات الحساب والملف الذكي بصيغة JSON.
              </p>
            </div>
            <Link
              href="/api/account/export"
              className="inline-flex h-10 items-center justify-center rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
            >
              تصدير بياناتي
            </Link>
          </div>

          <DeleteAccountRequest />
        </div>
      </SettingsCard>
    </div>
  );
}

function ProfileSection({
  profile,
  avatarUrl,
  displayName,
  emailConfirmed,
  userEmail,
  createdAt,
}: {
  profile: CurrentProfile | null;
  avatarUrl: string | null;
  displayName: string;
  emailConfirmed: boolean;
  userEmail: string;
  createdAt: string;
}) {
  const identityLine = [
    getProfileValue("country", profile?.country),
    getProfileValue("city", profile?.city),
    getProfileValue("mainGoal", profile?.main_goal),
  ]
    .filter((value) => value !== UNKNOWN_LABEL)
    .join(" - ");

  return (
    <div className="space-y-6">
      <SettingsCard title="الملف الشخصي">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(13,13,13,0.08)] bg-[#FFF1E8] text-3xl font-black text-[var(--voltjo-orange)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                displayName.trim().charAt(0).toUpperCase() || "V"
              )}
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
              {identityLine ? (
                <p className="mt-2 text-sm font-semibold text-[var(--voltjo-muted)]">
                  {identityLine}
                </p>
              ) : null}
            </div>
          </div>

          <AvatarCustomizer currentAvatarUrl={avatarUrl} displayName={displayName} />
        </div>
      </SettingsCard>

      <SettingsCard
        title="الملف الذكي"
        description="هذا الملخص يعتمد على البيانات الحقيقية الحالية في حسابك ويستخدمه VoltJo لتخصيص التجربة."
      >
        <ProfileSummary profile={profile} />
      </SettingsCard>
    </div>
  );
}

function AccountSettingsContent({
  section,
  userEmail,
  emailConfirmed,
  createdAt,
  displayName,
  profile,
  status,
  avatarUrl,
}: {
  section: AccountSection;
  userEmail: string;
  emailConfirmed: boolean;
  createdAt: string;
  displayName: string;
  profile: CurrentProfile | null;
  status?: string;
  avatarUrl: string | null;
}) {
  switch (section) {
    case "profile":
      return (
        <ProfileSection
          profile={profile}
          avatarUrl={avatarUrl}
          displayName={displayName}
          emailConfirmed={emailConfirmed}
          userEmail={userEmail}
          createdAt={createdAt}
        />
      );
    case "account":
      return (
        <AccountSectionContent
          status={status}
          profile={profile}
          displayName={displayName}
          userEmail={userEmail}
        />
      );
    case "security":
      return <SecuritySection />;
    case "privacy":
      return <PrivacySection profile={profile} />;
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
  const createdAt = formatDate(user.created_at);
  const avatarUrl = await resolveAccountAvatarUrl(profile);

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
              profile={profile}
              status={status}
              avatarUrl={avatarUrl}
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
                href="/account?section=privacy"
                label="الخصوصية والبيانات"
                active={activeSection === "privacy"}
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
