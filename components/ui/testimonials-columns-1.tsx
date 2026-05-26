"use client";

import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  image?: string;
  name: string;
  role: string;
};

export type TestimonialsColumnProps = {
  testimonials: Testimonial[];
  className?: string;
  duration?: number;
};

export function TestimonialsColumn({
  testimonials,
  className = "",
  duration = 15,
}: TestimonialsColumnProps) {
  // Duplicate the list internally to create a seamless infinite scroll loop
  const list = [...testimonials, ...testimonials];

  return (
    <div className={`relative flex flex-col ${className}`}>
      <motion.div
        animate={{ y: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {list.map((item, index) => (
          <div
            key={index}
            className="w-[280px] rounded-[16px] border border-[var(--voltjo-border)] bg-white p-6 shadow-[0_1px_2px_rgba(13,13,13,0.03)] sm:w-[320px]"
            dir="rtl"
          >
            <p className="text-[15px] font-medium leading-7 text-[var(--voltjo-black)]">
              "{item.text}"
            </p>
            <div className="mt-5 flex items-center gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(13,13,13,0.04)] text-sm font-bold text-[var(--voltjo-muted)]">
                  {item.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-[13px] font-bold text-[var(--voltjo-black)]">
                  {item.name}
                </div>
                <div className="text-[12px] font-medium text-[var(--voltjo-muted)]">
                  {item.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
