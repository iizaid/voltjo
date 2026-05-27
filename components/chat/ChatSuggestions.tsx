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
    <div className="mx-auto mt-5 w-full max-w-[820px] px-1">
      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-right text-[12px] font-semibold leading-snug text-white/45 transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white/70 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {/* sm+: pill wrap */}
      <div className="hidden flex-wrap justify-center gap-2 sm:flex">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-white/40 transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white/70"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
