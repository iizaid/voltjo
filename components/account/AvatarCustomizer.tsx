"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ALLOWED_AVATAR_IMAGE_TYPES,
  MAX_AVATAR_IMAGE_SIZE_BYTES,
} from "@/lib/account/settings";

const PREVIEW_SIZE = 256;
const OUTPUT_SIZE = 512;

type UploadState = {
  ok: boolean;
  message: string;
  avatarUrl?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDisplayNameInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "V";
}

export function AvatarCustomizer({
  currentAvatarUrl,
  displayName,
}: {
  currentAvatarUrl?: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const hasLocalImage = Boolean(localPreviewUrl && naturalSize.width && naturalSize.height);

  const baseScale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    return Math.max(PREVIEW_SIZE / naturalSize.width, PREVIEW_SIZE / naturalSize.height);
  }, [naturalSize.height, naturalSize.width]);

  function clampPosition(nextX: number, nextY: number, nextZoom = zoom) {
    if (!naturalSize.width || !naturalSize.height) {
      return { x: 0, y: 0 };
    }

    const effectiveScale = baseScale * nextZoom;
    const displayedWidth = naturalSize.width * effectiveScale;
    const displayedHeight = naturalSize.height * effectiveScale;
    const maxX = Math.max(0, (displayedWidth - PREVIEW_SIZE) / 2);
    const maxY = Math.max(0, (displayedHeight - PREVIEW_SIZE) / 2);

    return {
      x: clamp(nextX, -maxX, maxX),
      y: clamp(nextY, -maxY, maxY),
    };
  }

  function closeModal() {
    setIsOpen(false);
    setErrorMessage("");
    setUploadState(null);
    setIsSaving(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
    setSelectedFileName("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreviewUrl(null);
  }

  function handleFileSelection(file: File) {
    if (!ALLOWED_AVATAR_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_IMAGE_TYPES)[number])) {
      setErrorMessage("الملف غير مدعوم. استخدم JPG أو PNG أو WEBP فقط.");
      return;
    }

    if (file.size > MAX_AVATAR_IMAGE_SIZE_BYTES) {
      setErrorMessage("حجم الصورة أكبر من 3MB.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreviewUrl(objectUrl);
    setSelectedFileName(file.name);
    setErrorMessage("");
    setUploadState(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
  }

  async function createCroppedBlob() {
    const image = imageRef.current;
    if (!image || !naturalSize.width || !naturalSize.height) {
      throw new Error("NO_IMAGE");
    }

    const scale = baseScale * zoom;
    const sourceWidth = PREVIEW_SIZE / scale;
    const sourceHeight = PREVIEW_SIZE / scale;
    const sourceX = naturalSize.width / 2 - sourceWidth / 2 - position.x / scale;
    const sourceY = naturalSize.height / 2 - sourceHeight / 2 - position.y / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("NO_CONTEXT");
    }

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.save();
    context.beginPath();
    context.arc(
      OUTPUT_SIZE / 2,
      OUTPUT_SIZE / 2,
      OUTPUT_SIZE / 2,
      0,
      Math.PI * 2,
    );
    context.closePath();
    context.clip();
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );
    context.restore();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    });

    if (!blob) {
      throw new Error("NO_BLOB");
    }

    return blob;
  }

  async function handleSave() {
    if (!hasLocalImage) {
      setErrorMessage("اختر صورة واضحة قبل الحفظ.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setUploadState(null);

    try {
      const blob = await createCroppedBlob();
      const formData = new FormData();
      formData.append(
        "avatar",
        new File([blob], "avatar.webp", { type: "image/webp" }),
      );

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as UploadState | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(payload?.message || "تعذر حفظ الصورة الآن. حاول مرة أخرى.");
        return;
      }

      setUploadState(payload);
      router.refresh();
      closeModal();
    } catch {
      setErrorMessage("تعذر حفظ الصورة الآن. حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
      >
        تغيير الصورة
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(13,13,13,0.38)] p-4">
          <div
            className="w-full max-w-[720px] rounded-[28px] border border-[rgba(13,13,13,0.08)] bg-white p-5 shadow-[0_28px_80px_rgba(13,13,13,0.16)] sm:p-7"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(13,13,13,0.08)] bg-white text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
              <div className="flex-1 text-right">
                <h3 className="text-[28px] font-black text-[var(--voltjo-black)]">
                  تغيير الصورة الشخصية
                </h3>
                <p className="mt-2 text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
                  ارفع صورة واضحة، ثم اضبطها داخل الإطار الدائري.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-64 w-64 overflow-hidden rounded-full border border-[rgba(13,13,13,0.08)] bg-[#F6F3EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  {localPreviewUrl ? (
                    <img
                      ref={imageRef}
                      src={localPreviewUrl}
                      alt="معاينة الصورة"
                      draggable={false}
                      onLoad={(event) => {
                        const target = event.currentTarget;
                        setNaturalSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }}
                      onPointerDown={(event) => {
                        if (!naturalSize.width || !naturalSize.height) return;
                        dragStateRef.current = {
                          pointerId: event.pointerId,
                          startX: event.clientX,
                          startY: event.clientY,
                          originX: position.x,
                          originY: position.y,
                        };
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        const dragState = dragStateRef.current;
                        if (!dragState || dragState.pointerId !== event.pointerId) return;
                        const nextX = dragState.originX + (event.clientX - dragState.startX);
                        const nextY = dragState.originY + (event.clientY - dragState.startY);
                        setPosition(clampPosition(nextX, nextY));
                      }}
                      onPointerUp={(event) => {
                        if (dragStateRef.current?.pointerId === event.pointerId) {
                          dragStateRef.current = null;
                          event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                      }}
                      onPointerCancel={(event) => {
                        if (dragStateRef.current?.pointerId === event.pointerId) {
                          dragStateRef.current = null;
                          event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                      }}
                      className="absolute left-1/2 top-1/2 max-w-none touch-none select-none"
                      style={{
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${baseScale * zoom})`,
                        transformOrigin: "center center",
                        cursor: naturalSize.width ? "grab" : "default",
                      }}
                    />
                  ) : currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[56px] font-black text-[var(--voltjo-orange)]">
                      {getDisplayNameInitial(displayName)}
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[rgba(13,13,13,0.08)]" />
                </div>

                <div className="w-full space-y-2 text-center">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
                  >
                    <Upload size={16} />
                    اختيار صورة
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleFileSelection(file);
                      }
                    }}
                  />
                  <p className="text-xs font-medium text-[var(--voltjo-muted)]">
                    JPG / PNG / WEBP حتى 3MB
                  </p>
                  {selectedFileName ? (
                    <p className="text-xs font-bold text-[var(--voltjo-black)]">
                      {selectedFileName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-[var(--voltjo-black)]">
                      مستوى التقريب
                    </p>
                    <span className="text-sm font-bold text-[var(--voltjo-muted)]">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(event) => {
                      const nextZoom = Number(event.target.value);
                      setZoom(nextZoom);
                      setPosition((current) =>
                        clampPosition(current.x, current.y, nextZoom),
                      );
                    }}
                    disabled={!hasLocalImage}
                    className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(13,13,13,0.08)] accent-[var(--voltjo-orange)] disabled:cursor-not-allowed"
                  />
                </div>

                <div className="rounded-[22px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-5 text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
                  <p>
                    اسحب الصورة داخل الإطار لتحريكها، ثم استخدم شريط التقريب حتى
                    تصل إلى النتيجة المناسبة.
                  </p>
                </div>

                {errorMessage ? (
                  <div className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {uploadState?.message ? (
                  <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {uploadState.message}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[#FAFAF7]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !hasLocalImage}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isSaving ? "جارٍ الحفظ..." : "حفظ الصورة"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
