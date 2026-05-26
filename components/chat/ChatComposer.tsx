import { ArrowUp, Paperclip } from "lucide-react";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onAttach,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttach: () => void;
  isLoading?: boolean;
}) {
  return (
    <form
      className="mx-auto w-full max-w-[820px]"
      aria-label="مربع رسالة VoltJo"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-[24px] border border-[rgba(31,31,29,0.14)] bg-[#FEFEFC] p-3 shadow-[0_8px_22px_rgba(31,31,29,0.045)] transition focus-within:border-[rgba(31,31,29,0.22)]">
        <textarea
          aria-label="رسالة إلى VoltJo Assistant"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="min-h-[76px] w-full resize-none bg-transparent px-3 py-2 text-right text-[15px] font-medium leading-7 text-[#1F1F1D] outline-none placeholder:text-[#6F6A60]"
          placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان..."
          rows={2}
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-2">
          <button
            type="button"
            aria-label="إضافة مرفق"
            onClick={onAttach}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] hover:text-[#1F1F1D]"
          >
            <Paperclip size={18} />
          </button>
          <button
            type="submit"
            aria-label="إرسال"
            disabled={!value.trim() || isLoading}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1F1D] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#C9C4BA] ${isLoading ? "animate-pulse" : ""}`}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
