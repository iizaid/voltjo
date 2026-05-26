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
    <div className="mx-auto mt-4 w-full max-w-[820px] px-3">
      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-2xl border border-[rgba(31,31,29,0.12)] bg-white/50 px-3 py-2.5 text-right text-[13px] font-medium leading-snug text-[#3A3732] transition hover:bg-white/80 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {/* sm and above: pill wrap */}
      <div className="hidden sm:flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-[rgba(31,31,29,0.12)] bg-white/40 px-4 py-2 text-sm font-medium text-[#3A3732] transition hover:bg-white/75"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
