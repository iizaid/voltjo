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
    <div className="mx-auto mt-4 flex max-w-[820px] flex-wrap justify-center gap-2">
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
  );
}
