import {
  AlertTriangle,
  BatteryCharging,
  BookOpen,
  Calculator,
  CalendarDays,
  CircleHelp,
  FileText,
  Gauge,
  Globe2,
  Home,
  Leaf,
  List,
  Mail,
  Plus,
  Plug,
  Route,
  Scale,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DropdownKey = "cars" | "calculators" | "resources";

export type MegaMenuItemData = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type MegaMenuColumnData = {
  title: string;
  items: MegaMenuItemData[];
};

export type NavItemData = {
  label: string;
  href: string;
  dropdown?: DropdownKey;
};

export const navItems: NavItemData[] = [
  { label: "السيارات", href: "/cars", dropdown: "cars" },
  { label: "المقارنة", href: "/compare" },
  { label: "الحاسبات", href: "/calculators", dropdown: "calculators" },
  { label: "المساعد الذكي", href: "/assistant" },
  { label: "الأسعار", href: "/#pricing" },
];

export const megaMenus: Record<DropdownKey, MegaMenuColumnData[]> = {
  cars: [
    {
      title: "استكشف السيارات",
      items: [
        {
          title: "كل السيارات",
          description: "تصفح قاعدة السيارات المتوفرة في VoltJo.",
          href: "/cars",
          icon: List,
        },
        {
          title: "كهربائية بالكامل",
          description: "سيارات تعتمد على الكهرباء فقط.",
          href: "/cars?type=electric",
          icon: BatteryCharging,
        },
        {
          title: "هايبرد",
          description: "سيارات تجمع بين الوقود والكهرباء.",
          href: "/cars?type=hybrid",
          icon: Leaf,
        },
        {
          title: "Plug-in Hybrid",
          description: "هايبرد قابل للشحن الخارجي.",
          href: "/cars?type=phev",
          icon: Plug,
        },
      ],
    },
    {
      title: "حسب السوق",
      items: [
        {
          title: "خيارات بدعم محلي",
          description: "موديلات قد تتوفر عبر وكلاء أو موزعين محليين.",
          href: "/cars?source=local-support",
          icon: ShieldCheck,
        },
        {
          title: "سيارات مستوردة",
          description: "معلومات تساعدك على فهم الفروقات قبل الشراء.",
          href: "/cars?source=imported",
          icon: FileText,
        },
        {
          title: "وارد الصين",
          description: "نسخ وموديلات تحتاج مقارنة دقيقة قبل القرار.",
          href: "/cars?source=china-import",
          icon: Globe2,
        },
      ],
    },
    {
      title: "ابدأ بسرعة",
      items: [
        {
          title: "اقترح سيارة",
          description: "اطلب إضافة موديل غير موجود.",
          href: "/cars?intent=suggest",
          icon: Plus,
        },
        {
          title: "دليل شراء مختصر",
          description: "نقاط مهمة قبل اختيار كهرباء أو هايبرد.",
          href: "/resources?topic=buying-guide",
          icon: BookOpen,
        },
      ],
    },
  ],
  calculators: [
    {
      title: "حاسبات التكلفة",
      items: [
        {
          title: "حاسبة تكلفة الشحن",
          description: "احسب تكلفة الشحن حسب السيارة وطريقة الشحن.",
          href: "/calculators",
          icon: Calculator,
        },
        {
          title: "تكلفة 100 كم",
          description: "اعرف كلفة القيادة لكل 100 كم داخل الأردن.",
          href: "/calculators",
          icon: Gauge,
        },
        {
          title: "التكلفة الشهرية",
          description: "تقدير شهري حسب استخدامك اليومي.",
          href: "/calculators",
          icon: CalendarDays,
        },
      ],
    },
    {
      title: "أدوات القرار",
      items: [
        {
          title: "قارن بين سيارتين",
          description: "قارن التكلفة، المدى، الدعم، والمواصفات.",
          href: "/compare",
          icon: Scale,
        },
        {
          title: "جاهزية الشحن المنزلي",
          description: "اعرف إذا كان الشحن المنزلي مناسباً لاستخدامك.",
          href: "/calculators",
          icon: Home,
        },
        {
          title: "تكلفة الرحلات",
          description: "قدّر تكلفة رحلات مثل العقبة إلى عمّان.",
          href: "/calculators",
          icon: Route,
        },
      ],
    },
  ],
  resources: [
    {
      title: "المعرفة",
      items: [
        {
          title: "دليل السوق",
          description: "مقالات مبسطة عن السيارات الكهربائية والهايبرد في الأردن.",
          href: "/resources",
          icon: BookOpen,
        },
        {
          title: "الأسئلة الشائعة",
          description: "إجابات عن أكثر الأسئلة المتكررة قبل وبعد الشراء.",
          href: "/resources",
          icon: CircleHelp,
        },
        {
          title: "مصادر البيانات",
          description: "كيف نجمع ونراجع المعلومات التي تظهر في المنصة.",
          href: "/resources",
          icon: FileText,
        },
      ],
    },
    {
      title: "الدعم",
      items: [
        {
          title: "تواصل معنا",
          description: "راسلنا لأي استفسار أو اقتراح.",
          href: "/resources",
          icon: Mail,
        },
        {
          title: "الإبلاغ عن خطأ",
          description: "ساعدنا في تصحيح معلومة غير دقيقة.",
          href: "/resources",
          icon: AlertTriangle,
        },
        {
          title: "اقترح موديل",
          description: "اقترح سيارة تريد إضافتها إلى المنصة.",
          href: "/resources",
          icon: Plus,
        },
      ],
    },
  ],
};
