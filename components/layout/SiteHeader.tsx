import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar, type NavbarAuthState } from "@/components/layout/Navbar";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

function getEmailName(email: string | null | undefined) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || null;
}

function getFirstName(label: string | null | undefined) {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

function getInitial(label: string | null | undefined, fallback = "V") {
  const trimmed = label?.trim();
  return trimmed?.charAt(0).toUpperCase() || fallback;
}

export async function SiteHeader() {
  const { user, profile } = await getCurrentUserAndProfile();
  const displayName = profile?.full_name || getEmailName(user?.email) || null;
  const firstName = getFirstName(displayName);

  const auth: NavbarAuthState | null = user
    ? {
        isAuthenticated: true,
        displayName: displayName ?? firstName ?? "حسابي",
        email: user.email ?? null,
        initial: getInitial(displayName ?? user.email),
        profileCompleted: Boolean(profile?.onboarding_completed),
      }
    : null;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[var(--voltjo-border-soft)] bg-white/85 backdrop-blur-xl transition-all duration-200">
      <AnnouncementBar />
      <Navbar auth={auth} />
    </header>
  );
}
