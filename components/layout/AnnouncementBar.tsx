import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="w-full px-4 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-10 max-w-[1240px] items-center justify-center rounded-[8px] bg-[var(--voltjo-orange)] px-5 text-center text-sm font-medium on-dark-fg">
        <span className="leading-6">
          قاعدة السيارات التجريبية في VoltJo قيد المراجعة — استعرض
          الموديلات الأولية قبل الاعتماد على أي قرار.{" "}
          <Link
            href="/vehicles"
            className="font-bold underline decoration-white/45 underline-offset-4 transition hover:decoration-white"
          >
            اطّلع عليه ←
          </Link>
        </span>
      </div>
    </div>
  );
}
