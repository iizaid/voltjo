export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-white text-[var(--voltjo-black)]">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
