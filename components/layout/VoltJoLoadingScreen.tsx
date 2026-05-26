import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

export function VoltJoLoadingScreen() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-6 text-[var(--voltjo-black)]"
      dir="rtl"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,13,13,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(13,13,13,0.055)_1px,transparent_1px)] bg-[size:92px_92px]" />
        <div className="absolute left-[10%] top-[18%] h-36 w-64 rounded-[22px] border border-[rgba(13,13,13,0.07)] bg-white/20" />
        <div className="absolute bottom-[14%] right-[8%] h-44 w-72 rounded-[26px] border border-[rgba(13,13,13,0.07)] bg-white/20" />
        <div className="absolute left-[22%] top-[58%] h-px w-44 bg-[rgba(13,13,13,0.08)]" />
        <div className="absolute right-[18%] top-[26%] h-px w-52 bg-[rgba(13,13,13,0.08)]" />
        <div className="absolute left-[16%] top-[28%] h-2 w-2 rounded-full border border-[rgba(255,106,0,0.48)]" />
        <div className="absolute right-[24%] bottom-[26%] h-2 w-2 rounded-full bg-[rgba(255,106,0,0.42)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="absolute top-0 h-28 w-52 rounded-full bg-[rgba(255,106,0,0.07)] blur-3xl" />
        <div className="relative flex justify-center">
          <VoltJoLogo />
        </div>

        <div className="mt-9 flex items-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(13,13,13,0.22)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--voltjo-orange)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(13,13,13,0.22)]" />
        </div>

        <div className="voltjo-loading-scan mt-5 h-px w-[260px] max-w-full overflow-hidden bg-[rgba(13,13,13,0.12)]">
          <span className="block h-full w-16 bg-[var(--voltjo-orange)] motion-reduce:animate-none" />
        </div>

        <p className="mt-7 text-base font-bold text-[var(--voltjo-black)]">
          نجهّز التجربة...
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--voltjo-muted)]">
          جارٍ تحميل بيانات VoltJo
        </p>
        <span className="sr-only">جارٍ التحميل</span>
      </div>
    </section>
  );
}
