"use client";

import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import styles from "./Folder.module.css";

export interface FolderProps {
  color?: string;
  size?: number;
  items?: ReactNode[];
  className?: string;
}

type PaperOffset = {
  x: number;
  y: number;
};

type FolderCssVars = CSSProperties & {
  "--folder-color"?: string;
  "--folder-back-color"?: string;
  "--paper-1"?: string;
  "--paper-2"?: string;
  "--paper-3"?: string;
  "--magnet-x"?: string;
  "--magnet-y"?: string;
};

const MAX_ITEMS = 3;

function darkenColor(hex: string, percent: number) {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((part) => part + part)
      .join("");
  }

  const num = Number.parseInt(color, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 - percent))));
  const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 - percent))));
  const b = Math.max(0, Math.min(255, Math.floor((num & 0xff) * (1 - percent))));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function createEmptyOffsets() {
  return Array.from({ length: MAX_ITEMS }, (): PaperOffset => ({ x: 0, y: 0 }));
}

export default function Folder({
  color = "#5227FF",
  size = 1,
  items = [],
  className = "",
}: FolderProps) {
  const papers = items.slice(0, MAX_ITEMS);
  while (papers.length < MAX_ITEMS) {
    papers.push(null);
  }

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<PaperOffset[]>(createEmptyOffsets);

  const folderStyle: FolderCssVars = {
    "--folder-color": color,
    "--folder-back-color": darkenColor(color, 0.08),
    "--paper-1": darkenColor("#ffffff", 0.1),
    "--paper-2": darkenColor("#ffffff", 0.05),
    "--paper-3": "#ffffff",
  };

  const handleClick = () => {
    setOpen((prev) => {
      if (prev) {
        setPaperOffsets(createEmptyOffsets());
      }
      return !prev;
    });
  };

  const handlePaperMouseMove = (
    event: MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (!open) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (event.clientX - centerX) * 0.15;
    const offsetY = (event.clientY - centerY) * 0.15;

    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (index: number) => {
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  const folderClassName = [styles.folder, open ? styles.open : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div className={folderClassName} style={folderStyle} onClick={handleClick}>
        <div className={styles.folderBack}>
          {papers.map((item, index) => {
            const paperStyle: FolderCssVars = open
              ? {
                  "--magnet-x": `${paperOffsets[index]?.x ?? 0}px`,
                  "--magnet-y": `${paperOffsets[index]?.y ?? 0}px`,
                }
              : {};

            return (
              <div
                key={index}
                className={styles.paper}
                onMouseMove={(event) => handlePaperMouseMove(event, index)}
                onMouseLeave={() => handlePaperMouseLeave(index)}
                style={paperStyle}
              >
                {item}
              </div>
            );
          })}
          <div className={styles.folderFront} />
          <div className={`${styles.folderFront} ${styles.right}`} />
        </div>
      </div>
    </div>
  );
}
