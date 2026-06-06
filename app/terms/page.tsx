import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";

const SUPPORT_EMAIL = "support@voltjo.com";

const termsSections = [
  {
    title: "طبيعة VoltJo",
    body:
      "VoltJo منصة معلومات وإرشاد تساعدك على ترتيب أسئلة السيارات الكهربائية والهايبرد والهايبرد القابلة للشحن داخل الأردن. المحتوى ليس نصيحة شراء نهائية ولا يغني عن مراجعة الوكيل أو المصدر الرسمي.",
  },
  {
    title: "دقة البيانات والتقديرات",
    body:
      "مواصفات السيارات، الأسعار، بيانات الشحن، وتقديرات التكلفة قد تكون أولية وقد تختلف حسب بلد الاستيراد، الفئة، الوكيل، طريقة الاستخدام، وتوفر السيارة في السوق الأردني. تحقّق دائمًا من التفاصيل قبل الشراء.",
  },
  {
    title: "المساعد التجريبي",
    body:
      "ردود المساعد إرشادية وتجريبية. قد تساعدك على المقارنة وطرح الأسئلة الصحيحة، لكنها ليست رأيًا مهنيًا نهائيًا ولا ضمانًا لصحة كل رقم أو توصيف.",
  },
  {
    title: "الاشتراكات والدفع",
    body:
      "الاشتراكات والمدفوعات غير مفعّلة في المرحلة الحالية. أي خطط أو مزايا مدفوعة معروضة في الموقع هي تمهيدية وقد تتغير قبل الإطلاق.",
  },
  {
    title: "الاستخدام المقبول",
    body:
      "لا تستخدم VoltJo للإساءة، الرسائل المزعجة، محاولات الأتمتة المفرطة، تجاوز حدود الاستخدام، أو اختبار الخدمة بطريقة تضر بالمستخدمين أو التشغيل.",
  },
  {
    title: "مسؤولية الحساب",
    body:
      "أنت مسؤول عن حماية بريدك الإلكتروني وجلسة الدخول الخاصة بك. إذا لاحظت استخدامًا غير معتاد لحسابك، تواصل معنا حتى نراجع الحالة.",
  },
];

export const metadata: Metadata = {
  title: "الشروط | VoltJo",
  description:
    "شروط استخدام VoltJo باللغة العربية، مع توضيح طبيعة المنصة وحدود البيانات والتقديرات في النسخة الأولية الحالية.",
};

export default function TermsPage() {
  return (
    <main className="pb-20 pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-right">
            <p className="text-sm font-black text-[var(--voltjo-orange)]">
              شروط الاستخدام
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              الشروط
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
              هذه الشروط مكتوبة لتوضيح طريقة استخدام VoltJo في النسخة الأولية الحالية
              بدون لغة قانونية ثقيلة أو وعود غير مؤكدة.
            </p>
          </div>

          <div className="grid gap-5">
            {termsSections.map((section) => (
              <section
                key={section.title}
                className="rounded-[24px] border border-[var(--voltjo-border)] bg-white p-6 shadow-[0_18px_50px_rgba(13,13,13,0.05)]"
              >
                <h2 className="text-2xl font-black text-[var(--voltjo-black)]">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm font-semibold leading-8 text-[var(--voltjo-muted)]">
                  {section.body}
                </p>
              </section>
            ))}

            <section className="rounded-[24px] border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.06)] p-6">
              <h2 className="text-2xl font-black text-[var(--voltjo-black)]">
                التواصل
              </h2>
              <p className="mt-4 text-sm font-semibold leading-8 text-[var(--voltjo-muted)]">
                للأسئلة حول هذه الشروط، راسلنا على{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-black text-[var(--voltjo-orange)] transition hover:underline" dir="ltr">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
