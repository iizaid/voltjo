import { TechnicalBackground } from "@/components/background/TechnicalBackground";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-[var(--voltjo-black)]">
      <TechnicalBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
