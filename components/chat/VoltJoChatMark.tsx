"use client";

import Image from "next/image";

const CHAT_MARK_SRC = "/brands/logo.png";

export function VoltJoChatMark({
  className = "",
  imageClassName = "",
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
      dir="ltr"
    >
      <Image
        src={CHAT_MARK_SRC}
        alt=""
        width={64}
        height={64}
        className={`object-contain ${imageClassName}`}
        priority={priority}
      />
    </span>
  );
}
