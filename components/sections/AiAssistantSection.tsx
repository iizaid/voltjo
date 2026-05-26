"use client";

import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Bot, MessageSquare, HelpCircle, Car, MapPin, BarChart3, BellRing, CheckCircle2, LucideIcon } from "lucide-react";

const leftCards = [
  { id: "01", title: "يفهم نوع السؤال", desc: "سيارة، شحن، مقارنة، أو مشكلة شائعة.", icon: HelpCircle },
  { id: "02", title: "يربطها بالسيارة", desc: "الموديل، البطارية، النظام، وطريقة الاستخدام.", icon: Car },
  { id: "03", title: "يفهم سياق الأردن", desc: "الشحن، الدعم، الضمان، والطرق داخل الأردن.", icon: MapPin }
];

const rightCards = [
  { id: "04", title: "يحسب ويقارن", desc: "تكلفة 100 كم، الشهرية، والفرق بين الخيارات.", icon: BarChart3 },
  { id: "05", title: "ينبّه عند نقص البيانات", desc: "يوضح متى تكون الأرقام تقريبية أو بحاجة تأكيد.", icon: BellRing },
  { id: "06", title: "يعطي خلاصة عملية", desc: "توصية أو مقارنة واضحة تساعدك على القرار.", icon: CheckCircle2 }
];

const DesktopLinesSVG = () => (
  <svg 
    className="absolute inset-0 h-full w-full pointer-events-none hidden lg:block ai-branch-line" 
    viewBox="0 0 300 600" 
    preserveAspectRatio="none"
  >
    <defs>
      <marker id="arrow-left" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 10 0 L 0 5 L 10 10 z" fill="var(--voltjo-orange)" />
      </marker>
      <marker id="arrow-right" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--voltjo-orange)" />
      </marker>
    </defs>

    {/* Left lines (point to left cards) */}
    <path d="M 70 200 C 35 200, 35 60, 0 60" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-left)" />
    <path d="M 50 300 L 0 300" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-left)" />
    <path d="M 70 400 C 35 400, 35 540, 0 540" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-left)" />

    {/* Right lines (point to right cards) */}
    <path d="M 230 200 C 265 200, 265 60, 300 60" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-right)" />
    <path d="M 250 300 L 300 300" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-right)" />
    <path d="M 230 400 C 265 400, 265 540, 300 540" fill="none" stroke="var(--voltjo-orange)" strokeWidth="1.5" markerEnd="url(#arrow-right)" />

    {/* Dots */}
    <circle cx="70" cy="200" r="3" fill="var(--voltjo-orange)" />
    <circle cx="50" cy="300" r="3" fill="var(--voltjo-orange)" />
    <circle cx="70" cy="400" r="3" fill="var(--voltjo-orange)" />
    <circle cx="230" cy="200" r="3" fill="var(--voltjo-orange)" />
    <circle cx="250" cy="300" r="3" fill="var(--voltjo-orange)" />
    <circle cx="230" cy="400" r="3" fill="var(--voltjo-orange)" />
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
        <div className="mb-16 text-center lg:mb-24">
          <SectionLabel>المساعد الذكي</SectionLabel>
          <h2 className="mt-5 text-balance text-4xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-[44px]">
            مساعد يفهم سؤالك قبل أن يعطيك الإجابة
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-[var(--voltjo-muted)] sm:text-lg">
            يربط مساعد VoltJo سؤالك بمعلومات السيارة، تكلفة الشحن، المقارنة، والدعم المحلي في الأردن — ثم يحوّل ذلك إلى إجابة واضحة تساعدك على اتخاذ قرار أفضل.
          </p>
        </div>

        {/* AI Diagram Area */}
        <div className="relative mx-auto max-w-6xl">
          {/* We force LTR on the grid container so columns 1 and 3 stay physical left and right. */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_300px_1fr] lg:gap-0 lg:h-[600px]" dir="ltr">
            
            {/* Left Cards (01, 02, 03) */}
            <div className="flex flex-col gap-6 lg:h-full lg:justify-between z-10" dir="rtl">
              {leftCards.map((card) => (
                <BranchCard key={card.id} num={card.id} title={card.title} desc={card.desc} icon={card.icon} side="left" />
              ))}
            </div>

            {/* Center Node & SVG Lines */}
            <div className="relative flex h-64 w-full flex-col items-center justify-center lg:h-full z-0 ai-hub-core">
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
                  <div className="relative flex items-center justify-center">
                    <Bot className="size-[52px] text-[var(--voltjo-black)] stroke-[1.5]" />
                    <div className="absolute -bottom-2 -right-3 rounded-full bg-white p-1 shadow-sm">
                      <MessageSquare className="size-5 text-[var(--voltjo-orange)] fill-[var(--voltjo-orange)]/20" />
                    </div>
                  </div>
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
