import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="w-full px-4 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[40px] h-auto py-2.5 max-w-[1240px] items-center justify-center rounded-[8px] bg-[var(--voltjo-orange)] px-4 text-center text-xs sm:text-sm font-medium on-dark-fg text-white">
        <span className="leading-relaxed sm:leading-6">
          {/* Mobile Text */}
          <span className="inline sm:hidden">
            بيانات السيارات تجريبية وقيد المراجعة.{" "}
            <Link
              href="/vehicles"
              className="font-bold underline decoration-white/45 underline-offset-4 transition hover:decoration-white inline"
            >
              اطّلع عليه ←
            </Link>
          </span>
          {/* Desktop Text */}
          <span className="hidden sm:inline">
            قاعدة السيارات التجريبية في VoltJo قيد المراجعة — استعرض
            الموديلات الأولية قبل الاعتماد على أي قرار.{" "}
            <Link
              href="/vehicles"
              className="font-bold underline decoration-white/45 underline-offset-4 transition hover:decoration-white inline"
            >
              اطّلع عليه ←
            </Link>
          </span>
        </span>
      </div>
    </div>
  );
}

