import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const pages = {
  cars: "السيارات",
  compare: "المقارنة",
  calculators: "الحاسبات",
  resources: "المصادر",
  pricing: "الأسعار",
} as const;

type PageSlug = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!(slug in pages)) {
    notFound();
  }

  const title = pages[slug as PageSlug];

  return (
    <section className="px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <Container>
        <div className="technical-panel mx-auto flex min-h-[52vh] max-w-4xl flex-col items-center justify-center rounded-[36px] border border-[var(--voltjo-border)] bg-white px-6 py-20 text-center soft-shadow">
          <Badge>VoltJo</Badge>
          <h1 className="mt-6 text-4xl font-black tracking-normal text-[var(--voltjo-black)] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-[var(--voltjo-muted)]">
            هذه الصفحة قيد التجهيز ضمن النسخة الأولى من واجهة VoltJo. المحتوى
            الحالي ثابت فقط ولا يحتوي على أي منطق خلفي أو اتصال بخدمات خارجية.
          </p>
          <div className="mt-9">
            <Button href="/">العودة للرئيسية</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
