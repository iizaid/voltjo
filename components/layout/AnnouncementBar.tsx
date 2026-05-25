import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="w-full px-4 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-11 max-w-[1240px] items-center justify-center rounded-[14px] bg-[var(--voltjo-orange)] px-5 text-center text-sm font-medium on-dark-fg sm:h-12">
        <span className="leading-6">
          دليل 2024 لامتلاك السيارات الكهربائية والهايبرد في الأردن أصبح متاحاً
          الآن — قارن تكاليف الشحن والدعم والضمانات.{" "}
          <Link
            href="/resources"
            className="font-bold underline decoration-white/45 underline-offset-4 transition hover:decoration-white"
          >
            اطّلع عليه ←
          </Link>
        </span>
      </div>
    </div>
  );
}
