import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StationForm from "@/components/admin/StationForm";

export default async function NewChargingStationPage() {
  const supabase = createServerClient();
  if (!supabase) {
    return <div>Database connection error</div>;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin/charging-stations/new");
  }

  // Fetch operators to populate the dropdown
  const { data: operators } = await supabase
    .from("charging_operators")
    .select("id, name_ar, name_en")
    .eq("is_active", true)
    .order("name_ar", { ascending: true });

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">إضافة محطة شحن جديدة</h1>
        <p className="text-zinc-600 mt-2 font-medium">أدخل تفاصيل المحطة لإدراجها في قاعدة البيانات</p>
      </div>

      <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <StationForm operators={operators || []} />
      </div>
    </div>
  );
}
