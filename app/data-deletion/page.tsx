import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";

const SUPPORT_EMAIL = "support@voltjo.com";

const deletionSubject = "طلب حذف حساب VoltJo";
const deletionBody =
  "مرحبًا فريق VoltJo،\n\nأرغب في تقديم طلب حذف حسابي ومراجعة البيانات المرتبطة به يدويًا.\n\nالبريد المرتبط بالحساب:\nسبب أو ملاحظة اختيارية:\n\nأؤكد رغبتي في حذف بيانات الحساب حيثما أمكن.\n\nشكرًا لكم.";

const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  deletionSubject,
)}&body=${encodeURIComponent(deletionBody)}`;

const requestIncludes = [
  "البريد الإلكتروني المرتبط بالحساب.",
  "تأكيد واضح أنك تريد حذف الحساب والبيانات المرتبطة به حيثما أمكن.",
  "أي ملاحظة محددة حول بيانات تريد مراجعتها، مثل المحادثات أو الصورة أو الموقع المحفوظ.",
];

const mayBeDeleted = [
  "بيانات الملف الشخصي وإجابات البداية.",
  "سجل المحادثات والرسائل المرتبطة بحسابك.",
  "مرجع الصورة الشخصية وملف التخزين المرتبط بها حيثما أمكن.",
  "تفضيل الموقع المحفوظ إذا كان موجودًا.",
];

const mayRemain = [
  "سجلات أمنية محدودة أو بيانات تشغيل لازمة لمنع الإساءة وحماية الخدمة.",
  "نسخ احتياطية أو سجلات تشغيلية قد تحتاج وقتًا إضافيًا للخروج من أنظمة الحفظ الدورية.",
  "معلومات قليلة مطلوبة للحفاظ على سلامة النظام أو مراجعة طلبات إساءة سابقة.",
];

export const metadata: Metadata = {
  title: "حذف البيانات | VoltJo",
  description:
    "طريقة طلب حذف بيانات حساب VoltJo يدويًا في النسخة الأولية الحالية، وما قد يشمله الطلب.",
};

function Section({
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

export default function DataDeletionPage() {
  return (
    <main className="pb-20 pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-right">
            <p className="text-sm font-black text-[var(--voltjo-orange)]">
              الحساب والبيانات
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              حذف البيانات
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
              الحذف الذاتي المباشر غير مفعّل بعد في VoltJo. يمكنك إرسال طلب
              حذف يدوي، ونهدف تشغيليًا إلى مراجعته خلال 7–14 يوم عمل حسب
              وضوح الطلب وحالة البيانات.
            </p>
          </div>

          <div className="grid gap-5">
            <Section title="كيف تطلب الحذف؟">
              <p>
                أرسل رسالة إلى{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-black text-[var(--voltjo-orange)] transition hover:underline" dir="ltr">
                  {SUPPORT_EMAIL}
                </a>{" "}
                تتضمن المعلومات التالية:
              </p>
              <div className="mt-4">
                <BulletList items={requestIncludes} />
              </div>
              <a
                href={mailtoHref}
                className="mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-[var(--voltjo-orange)] px-5 text-sm font-black text-white transition hover:bg-[#e85e00]"
              >
                إرسال طلب حذف
              </a>
            </Section>

            <Section title="ما البيانات التي قد تُحذف؟">
              <BulletList items={mayBeDeleted} />
            </Section>

            <Section title="ما الذي قد يبقى مؤقتًا؟">
              <BulletList items={mayRemain} />
              <p className="mt-5">
                هذه ليست محاولة للاحتفاظ ببيانات الحساب للاستخدام العادي، بل
                مساحة تشغيلية محدودة لحماية الخدمة وسلامة السجلات.
              </p>
            </Section>

            <Section title="ملاحظة مهمة">
              <p>
                هذه الصفحة لا تضيف حذفًا آليًا داخل النظام. عند اكتمال ميزة
                الحذف الذاتي مستقبلًا سيتم توضيحها داخل الحساب.
              </p>
            </Section>
          </div>
        </div>
      </Container>
    </main>
  );
}
