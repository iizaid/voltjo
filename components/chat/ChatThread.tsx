import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage, type ChatMessageData } from "@/components/chat/ChatMessage";

const suggestions = [
  "قارن بين BYD Song Plus و Toyota BZ4X",
  "احسب تكلفة شحن سيارة كهربائية",
  "هل السيارة الصينية مناسبة للأردن؟",
  "ما الفرق بين EV و Plug-in Hybrid؟",
];

const messages: ChatMessageData[] = [
  {
    role: "user",
    content: "هل BYD Song Plus DM-i مناسبة للاستخدام اليومي في الأردن؟",
  },
  {
    role: "assistant",
    content:
      "نعم، مناسبة جدًا إذا كان استخدامك داخل المدن ومعك إمكانية شحن منزلي. ميزتها أنها تقلل استهلاك الوقود في المشاوير الطويلة، وتخلي تكلفة التشغيل اليومية أقل من سيارات البنزين في كثير من الحالات.",
    bullets: [
      "مناسبة للاستخدام اليومي داخل المدن.",
      "الشحن المنزلي يساعدك تقلل التكلفة.",
      "الأفضل مقارنة السعر والدعم والضمان قبل الشراء.",
    ],
  },
];

export function ChatThread() {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#FCFCFB]" dir="rtl">
      <header className="flex min-h-16 items-center justify-between border-b border-[var(--voltjo-border-soft)] bg-white/82 px-5 backdrop-blur md:px-8">
        <div>
          <h1 className="latin text-left text-base font-black text-[var(--voltjo-black)]" dir="ltr">
            VoltJo Assistant
          </h1>
          <p className="text-xs font-bold text-[var(--voltjo-muted)]">
            مساعد متخصص للسيارات الكهربائية والهايبرد في الأردن
          </p>
        </div>
        <span className="rounded-full border border-[var(--voltjo-border-soft)] bg-white px-3 py-1.5 text-xs font-black text-[var(--voltjo-muted)]">
          نسخة ثابتة
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="chat-thread-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 pt-8 md:px-6">
          <div className="flex flex-1 flex-col overflow-y-auto pb-8">
            <div className="mx-auto flex w-full max-w-3xl grow flex-col">
              <div className="mb-10 flex min-h-[230px] flex-col items-center justify-center text-center">
                <h2 className="text-3xl font-black tracking-normal text-[var(--voltjo-black)] sm:text-4xl">
                  كيف أقدر أساعدك في سيارتك؟
                </h2>
                <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="rounded-2xl border border-[var(--voltjo-border)] bg-white px-4 py-3 text-right text-sm font-bold leading-6 text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-bg-soft)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-8">
                {messages.map((message, index) => (
                  <ChatMessage key={`${message.role}-${index}`} message={message} />
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 mx-auto w-full max-w-4xl bg-gradient-to-t from-[#FCFCFB] via-[#FCFCFB] to-transparent pb-5 pt-8">
            <ChatComposer />
            <p className="mx-auto mt-3 max-w-3xl text-center text-xs font-semibold text-[var(--voltjo-muted)]">
              قد تختلف المعلومات حسب توفر البيانات. راجع صفحة السيارة أو المصادر
              الرسمية قبل اتخاذ قرار شراء.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
