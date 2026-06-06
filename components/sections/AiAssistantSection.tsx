"use client";

import { Container } from "@/components/ui/Container";
import { Brain, HelpCircle, Car, MapPin, BarChart3, BellRing, CheckCircle2, LucideIcon } from "lucide-react";
import TrueFocus from "@/components/TrueFocus";

const leftCards = [
  { id: "01", title: "يرتّب نوع السؤال", desc: "سيارة، شحن، مقارنة، أو مشكلة شائعة.", icon: HelpCircle },
  { id: "02", title: "يربطها بالمعلومات المتاحة", desc: "الموديل، البطارية، النظام، وطريقة الاستخدام.", icon: Car },
  { id: "03", title: "يراعي سياق الأردن", desc: "الشحن، الدعم، الضمان، والطرق داخل الأردن عند توفر البيانات.", icon: MapPin }
];

const rightCards = [
  { id: "04", title: "يعرض تقديرات أولية", desc: "تكلفة 100 كم، الشهرية، والفرق بين الخيارات عند توفر المعطيات.", icon: BarChart3 },
  { id: "05", title: "ينبّه عند نقص البيانات", desc: "يوضح متى تكون الأرقام تقريبية أو بحاجة تأكيد.", icon: BellRing },
  { id: "06", title: "يقترح خطوات تحقق", desc: "يلخّص الأسئلة المهمة قبل مراجعة الوكيل أو المصدر الرسمي.", icon: CheckCircle2 }
];

const DesktopLinesSVG = () => (
  <svg 
    className="absolute inset-0 h-full w-full pointer-events-none hidden lg:block ai-branch-line" 
    viewBox="0 0 300 600" 
    preserveAspectRatio="none"
  >
    {/* Left lines (point to left cards) */}
    <path d="M 70 200 C 35 200, 35 60, 0 60" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />
    <path d="M 50 300 L 0 300" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />
    <path d="M 70 400 C 35 400, 35 540, 0 540" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />

    {/* Right lines (point to right cards) */}
    <path d="M 230 200 C 265 200, 265 60, 300 60" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />
    <path d="M 250 300 L 300 300" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />
    <path d="M 230 400 C 265 400, 265 540, 300 540" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" />
  </svg>
);

interface BranchCardProps {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  side: "left" | "right";
}

const BranchCard = ({ num, title, desc, icon: Icon, side }: BranchCardProps) => {
  return (
    <div className={`flex w-full items-center gap-4 rounded-[14px] border border-[var(--voltjo-border-soft)] bg-white/90 p-4 shadow-sm hover:shadow-md transition-shadow ai-feature-card ai-feature-card-${num}`}>
      {side === "left" ? (
        <>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--voltjo-border-soft)] bg-zinc-50 shadow-sm">
            <Icon className="size-6 stroke-[1.5] text-[var(--voltjo-black)]" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="text-[15px] font-bold text-[var(--voltjo-black)]">{title}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--voltjo-muted)]">{desc}</p>
          </div>
          <div className="flex h-8 items-center justify-center rounded-md border border-[var(--voltjo-orange)]/20 bg-[rgba(255,106,0,0.05)] px-2.5 text-[13px] font-bold text-[var(--voltjo-orange)]">
            {num}
          </div>
        </>
      ) : (
        <>
          <div className="flex h-8 items-center justify-center rounded-md border border-[var(--voltjo-orange)]/20 bg-[rgba(255,106,0,0.05)] px-2.5 text-[13px] font-bold text-[var(--voltjo-orange)]">
            {num}
          </div>
          <div className="flex-1 text-right">
            <h4 className="text-[15px] font-bold text-[var(--voltjo-black)]">{title}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--voltjo-muted)]">{desc}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--voltjo-border-soft)] bg-zinc-50 shadow-sm">
            <Icon className="size-6 stroke-[1.5] text-[var(--voltjo-black)]" />
          </div>
        </>
      )}
    </div>
  );
};

export function AiAssistantSection() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] py-20 md:py-32 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
      <Container>
        {/* Header Area */}
        <div className="mb-16 text-center lg:mb-24 flex flex-col items-center">
          <h2 className="display-heading text-balance text-4xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-[44px]">
            مساعد إرشادي تجريبي في
            <div className="mt-5 flex flex-wrap items-center justify-center gap-[0.3em]" dir="rtl">
              <span>السيارات</span>
              <TrueFocus 
                sentence="الكهربائية والهايبرد"
                borderColor="#ff6a00"
                glowColor="rgba(255, 106, 0, 0.4)"
                animationDuration={0.6}
                pauseBetweenAnimations={1.5}
                blurAmount={2}
              />
            </div>
          </h2>
          <p className="mx-auto mt-8 max-w-3xl text-base font-medium leading-8 text-[var(--voltjo-muted)] sm:text-lg">
            يساعدك VoltJo على ترتيب أسئلة السيارات داخل السوق الأردني: الموديلات، البطاريات، تكلفة الشحن، المقارنة، الدعم، والضمان. يعرض تقديرات أولية وينبّهك عند نقص البيانات قبل الرجوع للوكيل أو المصدر الرسمي.
          </p>
        </div>

        {/* AI Diagram Area */}
        <div className="relative mx-auto max-w-6xl">
          
          {/* --- Mobile Layout (< lg) --- */}
          <div className="flex flex-col items-center gap-6 lg:hidden" dir="rtl">
            {/* Top Cards (01, 02, 03) */}
            <div className="flex w-full max-w-[420px] flex-col gap-4 px-4 sm:px-5">
              {leftCards.map((card) => (
                <BranchCard key={card.id} num={card.id} title={card.title} desc={card.desc} icon={card.icon} side="left" />
              ))}
            </div>

            {/* Mobile Center Node */}
            <div className="relative my-4 flex h-[180px] w-[180px] shrink-0 items-center justify-center">
              {/* Vertical connector lines */}
              <div className="absolute top-[-40px] bottom-[50%] w-px bg-gradient-to-t from-[var(--voltjo-orange)]/60 to-transparent" />
              <div className="absolute top-[50%] bottom-[-40px] w-px bg-gradient-to-b from-[var(--voltjo-orange)]/60 to-transparent" />
              
              {/* Outer Glows - Less intense for mobile */}
              <div className="absolute inset-0 rounded-full bg-[var(--voltjo-orange)]/10 blur-[20px] animate-pulse" />
              <div className="absolute inset-3 rounded-full bg-[var(--voltjo-orange)]/15 blur-xl" />
              
              {/* Rings */}
              <div className="absolute inset-5 rounded-full border border-[var(--voltjo-orange)]/30 bg-gradient-to-tr from-[var(--voltjo-orange)]/5 to-transparent" />
              <div className="absolute inset-8 rounded-full border border-white/60 bg-white/40 shadow-[0_0_20px_rgba(255,106,0,0.1)] backdrop-blur-md" />
              
              {/* Core */}
              <div className="absolute inset-11 z-10 flex flex-col items-center justify-center rounded-full border border-zinc-100 bg-white shadow-xl">
                <Brain className="size-[40px] text-[var(--voltjo-black)] stroke-[1.5]" />
              </div>
            </div>

            {/* Bottom Cards (04, 05, 06) */}
            <div className="flex w-full max-w-[420px] flex-col gap-4 px-4 sm:px-5">
              {rightCards.map((card) => (
                <BranchCard key={card.id} num={card.id} title={card.title} desc={card.desc} icon={card.icon} side="left" />
              ))}
            </div>
          </div>

          {/* --- Desktop Layout (>= lg) --- */}
          {/* We force LTR on the grid container so columns 1 and 3 stay physical left and right. */}
          <div className="hidden lg:grid grid-cols-[1fr_300px_1fr] items-center gap-0 h-[600px]" dir="ltr">
            
            {/* Left Cards (01, 02, 03) */}
            <div className="flex flex-col gap-6 lg:h-full lg:justify-between z-10" dir="rtl">
              {leftCards.map((card) => (
                <BranchCard key={card.id} num={card.id} title={card.title} desc={card.desc} icon={card.icon} side="left" />
              ))}
            </div>

            {/* Center Node & SVG Lines */}
            <div className="relative flex h-full w-full flex-col items-center justify-center z-0 ai-hub-core">
              <DesktopLinesSVG />
              
              {/* Glowing Core */}
              <div className="relative flex h-52 w-52 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[var(--voltjo-orange)]/20 blur-[40px] animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-[var(--voltjo-orange)]/30 blur-2xl" />
                
                {/* Ring Layer */}
                <div className="absolute inset-2 rounded-full border border-[var(--voltjo-orange)]/40 bg-gradient-to-tr from-[var(--voltjo-orange)]/10 to-transparent ai-hub-ring" />
                <div className="absolute inset-6 rounded-full border border-white/60 bg-white/30 shadow-[0_0_30px_rgba(255,106,0,0.2)] backdrop-blur-md" />
                
                {/* Center Icon Plate */}
                <div className="absolute inset-10 z-10 flex flex-col items-center justify-center rounded-full border border-zinc-100 bg-white shadow-xl">
                  <Brain className="size-[48px] text-[var(--voltjo-black)] stroke-[1.5]" />
                </div>
              </div>
            </div>

            {/* Right Cards (04, 05, 06) */}
            <div className="flex flex-col gap-6 lg:h-full lg:justify-between z-10" dir="rtl">
              {rightCards.map((card) => (
                <BranchCard key={card.id} num={card.id} title={card.title} desc={card.desc} icon={card.icon} side="right" />
              ))}
            </div>

          </div>
        </div>
      </Container>
    </section>
  );
}
