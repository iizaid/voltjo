import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";

const SUPPORT_EMAIL = "support@voltjo.com";

const collectedData = [
  "البريد الإلكتروني ومعرّف الحساب اللازمين لتسجيل الدخول وإدارة الجلسة.",
  "إجابات البداية والملف الذكي، مثل الهدف من الاستخدام، المدينة، نمط القيادة، وأولوياتك.",
  "إعدادات الحساب وتفضيلات الخصوصية التي تختارها داخل حسابك.",
  "المحادثات والرسائل المرتبطة بحسابك عند استخدام المساعد وأنت مسجّل الدخول.",
  "مسار الصورة الشخصية ورابطها العام إذا رفعت صورة لحسابك.",
  "موقع المتصفح فقط إذا اخترت حفظه صراحة داخل تجربة خريطة الشحن.",
  "سجلات تقنية محدودة تساعد على الأمان، منع الإساءة، وتشغيل حدود الاستخدام.",
];

const dataUses = [
  "تمكين تسجيل الدخول والوصول إلى الحساب.",
  "تخصيص التجربة والملف الذكي حسب إجاباتك واختياراتك.",
  "عرض سجل المحادثات والعودة إليه داخل حسابك.",
  "تجهيز ملف تصدير بيانات الحساب عند طلبه من صفحة الحساب.",
  "حفظ تفضيل الموقع لخريطة الشحن فقط عند موافقتك الصريحة.",
  "حماية الخدمة من الإساءة، الرسائل المتكررة، ومحاولات تجاوز الحدود.",
];

const notCollected = [
  "لا نجمع بيانات دفع في المرحلة الحالية لأن الاشتراكات والمدفوعات غير مفعّلة.",
  "لا تُستخدم خدمة ذكاء اصطناعي حقيقية لمعالجة محادثاتك في مرحلة MVP الحالية؛ المساعد ما زال تجربة إرشادية.",
  "لا يخزّن VoltJo كلمات مرور المستخدمين مباشرة؛ تسجيل الدخول يدار عبر خدمة مصادقة مخصصة.",
];

const choices = [
  "يمكنك تنزيل نسخة من بيانات الحساب من صفحة الحساب.",
  "يمكنك استخدام خريطة الشحن بدون حفظ موقعك، وحفظ الموقع اختياري فقط.",
  "يمكنك استبدال الصورة الشخصية عند الحاجة.",
  "يمكنك إرسال طلب حذف يدوي من صفحة حذف البيانات.",
];

export const metadata: Metadata = {
  title: "سياسة الخصوصية | VoltJo",
  description:
    "سياسة خصوصية عربية توضح ما يجمعه VoltJo، سبب استخدامه، وخيارات المستخدم داخل النسخة الأولية الحالية.",
};

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold text-[var(--voltjo-black)]">{title}</h2>
      <div className="text-base font-medium leading-relaxed text-[var(--voltjo-muted)]">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-3 pr-2 marker:text-[var(--voltjo-orange)]">
      {items.map((item) => (
        <li key={item} className="leading-relaxed text-[var(--voltjo-muted)]">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="pb-20 pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-right">
            <p className="text-sm font-black text-[var(--voltjo-orange)]">
              الخصوصية والبيانات
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              سياسة الخصوصية
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
              هذه الصفحة تشرح بصورة عملية كيف يتعامل VoltJo مع بياناتك في مرحلة
              النسخة الأولية الحالية. الهدف هو الوضوح قبل أي إطلاق عام، وليس تقديم وعود
              امتثال قانوني غير مثبتة.
            </p>
          </div>

          <div className="grid gap-5">
            <InfoCard title="ما البيانات التي قد نجمعها؟">
              <BulletList items={collectedData} />
            </InfoCard>

            <InfoCard title="لماذا نستخدم هذه البيانات؟">
              <BulletList items={dataUses} />
            </InfoCard>

            <InfoCard title="ما الذي لا يحدث حاليًا؟">
              <BulletList items={notCollected} />
            </InfoCard>

            <InfoCard title="اختياراتك داخل VoltJo">
              <BulletList items={choices} />
              <p className="mt-5">
                لطلبات حذف البيانات، راجع صفحة{" "}
                <Link href="/data-deletion" className="font-black text-[var(--voltjo-orange)] transition hover:underline">
                  حذف البيانات
                </Link>
                .
              </p>
            </InfoCard>

            <InfoCard title="التواصل">
              <p>
                للأسئلة المتعلقة بالخصوصية أو طلبات البيانات، راسلنا على{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-black text-[var(--voltjo-orange)] transition hover:underline" dir="ltr">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </InfoCard>
          </div>
        </div>
      </Container>
    </main>
  );
}
