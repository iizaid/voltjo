import { ArrowUp, Paperclip } from "lucide-react";

export function ChatComposer() {
  return (
    <form className="mx-auto w-full max-w-3xl" aria-label="مربع رسالة VoltJo">
      <div className="rounded-[28px] border border-[var(--voltjo-border)] bg-white p-3 shadow-[0_18px_55px_rgba(13,13,13,0.07)]">
        <textarea
          aria-label="رسالة إلى VoltJo Assistant"
          className="min-h-20 w-full resize-none bg-transparent px-3 py-2 text-right text-[15px] font-semibold leading-7 text-[var(--voltjo-black)] outline-none placeholder:text-[var(--voltjo-muted)]"
          placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان..."
          rows={2}
        />
        <div className="flex items-center justify-between gap-3 border-t border-[var(--voltjo-border-soft)] px-1 pt-3">
          <button
            type="button"
            aria-label="إضافة مرفق"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--voltjo-muted)] transition hover:bg-[rgba(13,13,13,0.045)] hover:text-[var(--voltjo-black)]"
          >
            <Paperclip size={18} />
          </button>
          <button
            type="button"
            aria-label="إرسال"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--voltjo-black)] text-white transition hover:-translate-y-0.5"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
