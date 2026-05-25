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
  { label: "المصادر", href: "/resources", dropdown: "resources" },
  { label: "الأسعار", href: "/pricing" },
];

export const megaMenus: Record<DropdownKey, MegaMenuColumnData[]> = {
  cars: [
    {
      title: "أنواع السيارات",
      items: [
        {
          title: "سيارات كهربائية",
          description: "استكشف السيارات الكهربائية المتوفرة في السوق الأردني.",
          href: "/cars",
          icon: BatteryCharging,
        },
        {
          title: "سيارات هايبرد",
          description: "قارن السيارات الهجينة المناسبة للاستخدام اليومي.",
          href: "/cars",
          icon: Leaf,
        },
        {
          title: "Plug-in Hybrid",
          description: "افهم الفرق بين الهايبرد القابل للشحن والكهربائي الكامل.",
          href: "/cars",
          icon: Plug,
        },
      ],
    },
    {
      title: "حسب السوق",
      items: [
        {
          title: "السيارات الصينية",
          description: "تعرف على أشهر الموديلات الصينية المنتشرة في الأردن.",
          href: "/cars",
          icon: Globe2,
        },
        {
          title: "سيارات الوكالة",
          description: "موديلات بدعم أوضح من الوكلاء والموزعين.",
          href: "/cars",
          icon: ShieldCheck,
        },
        {
          title: "السيارات المستوردة",
          description: "افهم مخاطر النسخ والفئات والضمان قبل الشراء.",
          href: "/cars",
          icon: FileText,
        },
      ],
    },
    {
      title: "ابدأ بسرعة",
      items: [
        {
          title: "كل السيارات المدعومة",
          description: "تصفح قائمة السيارات التي تغطيها المنصة.",
          href: "/cars",
          icon: List,
        },
        {
          title: "اقترح سيارة",
          description: "اطلب إضافة موديل جديد للمنصة.",
          href: "/resources",
          icon: Plus,
        },
        {
          title: "دليل السوق الأردني",
          description: "معلومات مبسطة قبل شراء سيارة كهربائية أو هايبرد.",
          href: "/resources",
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
