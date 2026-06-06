import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";

const testimonials1: Testimonial[] = [
  {
    text: "كنت محتارًا بين سيارة كهربائية وهايبرد. الفكرة أن VoltJo يجمع المقارنة، تكلفة الشحن، ونقاط الدعم في مكان واحد بدل البحث العشوائي.",
    name: "أحمد",
    role: "مهتم بشراء سيارة كهربائية",
  },
  {
    text: "أكثر شيء مفيد بالنسبة لي هو فهم تكلفة 100 كم والتكلفة الشهرية قبل اتخاذ القرار، خصوصًا أن الأرقام تختلف حسب طريقة الشحن.",
    name: "سارة",
    role: "تبحث عن سيارة يومية",
  },
  {
    text: "وجود مساعد يرتب أسئلة السيارات في السوق الأردني أفضل من سؤال عام لا يوضح متى تحتاج المعلومة إلى تحقق محلي.",
    name: "محمد",
    role: "مالك سيارة هايبرد",
  },
];

const testimonials2: Testimonial[] = [
  {
    text: "القسم الخاص بالمقارنة يساعدني أفهم الفرق بين السيارات الصينية والخيارات المعروفة بدون الدخول في عشرات الفيديوهات.",
    name: "ليث",
    role: "مهتم بالمقارنة",
  },
  {
    text: "أحتاج دائمًا أعرف هل السيارة مناسبة لطريق العقبة - عمان، وليس فقط المواصفات المكتوبة على الورق.",
    name: "نور",
    role: "استخدام يومي وسفر",
  },
  {
    text: "أعجبتني فكرة أن المنصة تركز على الأردن، لأن تكلفة الشحن والدعم والضمان تختلف كثيرًا من بلد لآخر.",
    name: "رامي",
    role: "باحث عن سيارة مستوردة",
  },
];

const testimonials3: Testimonial[] = [
  {
    text: "عندما تكتمل مراجعة البيانات، ستكون أداة مفيدة قبل زيارة المعارض أو التواصل مع البائعين.",
    name: "هبة",
    role: "تقييم قبل الشراء",
  },
  {
    text: "المهم بالنسبة لي أن المنصة توضح متى تكون المعلومة تقريبية ومتى تحتاج تأكيد من الوكيل أو المصدر الرسمي.",
    name: "عمر",
    role: "مهتم بالضمان والدعم",
  },
  {
    text: "بدل ما أسأل في مجموعات كثيرة، وجود مكان واحد يلخص المقارنة والتكلفة والمشاكل الشائعة سيكون مفيد جدًا.",
    name: "دانيا",
    role: "تبحث عن خيار اقتصادي",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-[8px] border border-[var(--voltjo-border)] bg-white px-3 py-1 text-xs font-bold text-[var(--voltjo-muted)] shadow-[0_1px_0_rgba(13,13,13,0.02)]">
          آراء وتجارب
        </span>
        <h2 className="mt-4 text-3xl font-bold text-[var(--voltjo-black)] sm:text-4xl">
          ماذا يقول المستخدمون؟
        </h2>
        <p className="mx-auto mt-4 max-w-[620px] text-base font-medium leading-8 text-[var(--voltjo-muted)]">
          تجارب وانطباعات مبدئية من أشخاص يبحثون عن قرار أوضح قبل شراء سيارة كهربائية أو هايبرد في الأردن.
        </p>
        <p className="mt-2 text-[11px] font-bold text-[var(--voltjo-muted)] opacity-60">
          (نماذج توضيحية لآراء وانطباعات الفئة المستهدفة)
        </p>
      </div>

      <div className="mx-auto mt-14 flex max-h-[720px] max-w-6xl justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
        <TestimonialsColumn
          testimonials={testimonials1}
          duration={15}
        />
        <TestimonialsColumn
          testimonials={testimonials2}
          duration={19}
          className="hidden md:flex"
        />
        <TestimonialsColumn
          testimonials={testimonials3}
          duration={17}
          className="hidden lg:flex"
        />
      </div>
    </section>
  );
}
