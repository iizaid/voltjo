const suggestions = [
  "قارن بين BYD Song Plus و Toyota bZ4X",
  "احسب تكلفة شحن سيارة كهربائية",
  "هل السيارات الصينية مناسبة للأردن؟",
  "ما الفرق بين EV و Plug-in Hybrid؟",
  "أفضل سيارة هايبرد للاستخدام اليومي",
];

export function ChatSuggestions({
  onSelect,
}: {
  onSelect: (suggestion: string) => void;
}) {
  return (
    <div className="mx-auto mt-6 w-full max-w-[820px] px-1">
      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-xl border border-[rgba(13,13,13,0.06)] bg-[#FEFEFC] px-3 py-3 text-right text-[12px] font-semibold leading-snug text-[#3A3732] shadow-[0_2px_8px_rgba(13,13,13,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(13,13,13,0.04)] active:scale-[0.98]"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {/* sm+: pill wrap */}
      <div className="hidden flex-wrap justify-center gap-2.5 sm:flex">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-[rgba(13,13,13,0.06)] bg-[#FEFEFC] px-4 py-2.5 text-[13px] font-semibold text-[#3A3732] shadow-[0_2px_8px_rgba(13,13,13,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(13,13,13,0.04)] active:scale-[0.98]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
