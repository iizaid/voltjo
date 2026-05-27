export const MAX_CHAT_MESSAGE_LENGTH = 1000;
export const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_CHAT_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const ATTACHMENT_DEMO_NOTICE =
  "رفع الملفات غير مفعّل في هذه النسخة التجريبية. تم حفظ اسم الملف فقط كملاحظة داخل المحادثة.";

export const INVALID_ATTACHMENT_TYPE_NOTICE =
  "نوع الملف غير مدعوم. يمكنك إرفاق صورة PNG أو JPG أو WebP أو ملف PDF فقط.";

export const LARGE_ATTACHMENT_NOTICE =
  "حجم الملف كبير جدًا. الحد الأقصى للمرفق هو 5 ميغابايت.";

export const LONG_MESSAGE_NOTICE =
  "الرسالة طويلة جدًا. اختصرها إلى 1000 حرف كحد أقصى.";
