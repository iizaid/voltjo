import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, ChevronLeft, LogOut } from "lucide-react";
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

const uiEase = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const pressableBase = `inline-flex min-h-11 items-center justify-center rounded-full text-sm font-bold transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-200 ${uiEase} active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`;
const primaryButtonClass = `${pressableBase} bg-[var(--voltjo-black)] px-5 text-white shadow-[0_10px_22px_rgba(13,13,13,0.08)] hover:-translate-y-0.5 hover:bg-[#111]`;
const secondaryButtonClass = `${pressableBase} border border-[rgba(38,38,38,0.08)] bg-white px-5 text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-0.5 hover:border-[rgba(38,38,38,0.12)] hover:bg-[#F7F7F3]`;
const fieldClass = "h-12 rounded-[18px] border border-[rgba(38,38,38,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-[rgba(38,38,38,0.18)] focus:shadow-[0_0_0_4px_rgba(255,77,0,0.08)]";
const readOnlyFieldClass = "h-12 rounded-[18px] border border-transparent bg-[#F4F4EF] px-4 text-base font-semibold text-[var(--voltjo-muted)] outline-none";

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
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center justify-between rounded-[18px] px-3.5 py-3 text-sm font-bold transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.14)] focus-visible:ring-offset-2 ${
        active
          ? "bg-[#F4F1EC] text-[var(--voltjo-black)] shadow-[inset_0_0_0_1px_rgba(38,38,38,0.04)]"
          : "text-[var(--voltjo-muted)] hover:bg-[#F7F7F3] hover:text-[var(--voltjo-black)]"
      }`}
    >
      <span>{label}</span>
      {active ? (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--voltjo-orange)] shadow-[0_1px_0_rgba(38,38,38,0.04)]">
          <ChevronLeft size={15} />
        </span>
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
    <section className="rounded-[28px] bg-white/90 p-5 shadow-[0_1px_0_rgba(255,255,255,0.9),0_18px_54px_rgba(13,13,13,0.045)] ring-1 ring-[rgba(38,38,38,0.06)] sm:p-7">
      <div className="mb-5">
        <h2 className="text-[22px] font-extrabold leading-tight text-[var(--voltjo-black)] sm:text-[24px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
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
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-[18px] px-4 py-3 text-sm font-bold ring-1 ${
        tone === "success"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"
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
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[18px] bg-[#F7F7F3] px-4 py-3 ring-1 ring-[rgba(38,38,38,0.04)]"
        >
          <p className="text-xs font-bold text-[var(--voltjo-muted)]">{item.label}</p>
          <p
            className={`mt-1 text-sm font-extrabold leading-7 ${
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

      <div className="pt-1">
        <p className="text-sm font-bold text-[var(--voltjo-muted)]">الأولويات</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(priorities.length ? priorities : [UNKNOWN_LABEL]).map((priority) => (
            <span
              key={priority}
              className="rounded-full bg-[#F4F1EC] px-3 py-1.5 text-sm font-bold text-[var(--voltjo-black)] ring-1 ring-[rgba(38,38,38,0.04)]"
            >
              {priority}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <Link
          href="/start"
          className={secondaryButtonClass}
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
                autoComplete="name"
                defaultValue={profile?.full_name ?? ""}
                placeholder={displayName}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البريد الإلكتروني
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={userEmail}
                readOnly
                dir="ltr"
                className={`${readOnlyFieldClass} text-left`}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البلد
              <select
                name="country"
                autoComplete="country-name"
                defaultValue={selectedCountry}
                className={fieldClass}
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
                autoComplete="address-level2"
                defaultValue={selectedCity}
                className={fieldClass}
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
            className={primaryButtonClass}
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
            className={primaryButtonClass}
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
          <div className="flex flex-col gap-4 rounded-[22px] bg-[#F7F7F3] p-4 ring-1 ring-[rgba(38,38,38,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[var(--voltjo-black)]">
                تصدير البيانات
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
                تنزيل نسخة من بيانات الحساب والملف الذكي بصيغة JSON.
              </p>
            </div>
            <Link
              href="/api/account/export"
              className={secondaryButtonClass}
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
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-[#FFF1E8] text-3xl font-black text-[var(--voltjo-orange)] shadow-[inset_0_0_0_1px_rgba(255,77,0,0.10),0_10px_28px_rgba(255,77,0,0.08)]">
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
                <h2 className="text-[26px] font-extrabold leading-tight text-[var(--voltjo-black)] sm:text-[28px]">
                  {displayName}
                </h2>
                {emailConfirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200">
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
  const currentUser = user;

  const displayName = getDisplayName(profile?.full_name, currentUser.email ?? null);
  const createdAt = formatDate(currentUser.created_at);
  const avatarUrl = resolveAccountAvatarUrl(profile);

  return (
    <main
      className="min-h-dvh bg-[#F7F7F3] px-4 py-6 text-[var(--voltjo-black)] sm:px-6 lg:px-8 lg:py-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1220px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,860px)_240px] lg:items-start lg:justify-center">
          <section className="space-y-6">
            <header className="space-y-2">
              <Link
                href="/assistant"
                className="inline-flex min-h-10 flex-row-reverse items-center gap-2 rounded-full bg-white/82 px-3.5 text-sm font-bold text-[var(--voltjo-muted)] shadow-[0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[rgba(38,38,38,0.06)] transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-white hover:text-[var(--voltjo-black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2"
              >
                <ArrowRight size={16} />
                <span>العودة إلى المساعد</span>
              </Link>
              <h1 className="text-[32px] font-extrabold leading-tight text-[var(--voltjo-black)] sm:text-[36px]">
                {sectionMeta.title}
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
                {sectionMeta.subtitle}
              </p>
            </header>

            <AccountSettingsContent
              section={activeSection}
              userEmail={currentUser.email ?? UNKNOWN_LABEL}
              emailConfirmed={Boolean(currentUser.email_confirmed_at)}
              createdAt={createdAt}
              displayName={displayName}
              profile={profile}
              status={status}
              avatarUrl={avatarUrl}
            />
          </section>

          <aside className="rounded-[28px] bg-white/86 p-4 shadow-[0_1px_0_rgba(255,255,255,0.9),0_16px_48px_rgba(13,13,13,0.045)] ring-1 ring-[rgba(38,38,38,0.06)] lg:sticky lg:top-6 lg:h-fit">
            <div>
              <p className="text-lg font-extrabold text-[var(--voltjo-black)]">
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
                className={`${secondaryButtonClass} w-full gap-2`}
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
