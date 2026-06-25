import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminChargingStationsPage() {
  const supabase = createServerClient();
  if (!supabase) {
    return <div>Database connection error</div>;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin/charging-stations");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  const { data: stations, error } = await supabase
    .from("charging_stations")
    .select("id, name_ar, city, verification_status, operational_status, data_quality_score, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching stations for admin:", error);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">إدارة محطات الشحن</h1>
        <div className="flex gap-4">
          <Link 
            href="/admin/charging-stations/reports" 
            className="bg-white text-black border-2 border-black px-4 py-2 hover:bg-zinc-100 transition-colors font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            مراجعة التقارير
          </Link>
          <Link 
            href="/admin/charging-stations/new" 
            className="bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            + إضافة محطة
          </Link>
        </div>
      </div>

      <div className="bg-white border-2 border-black p-0 overflow-x-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-right whitespace-nowrap">
          <thead className="bg-zinc-100 border-b-2 border-black">
            <tr>
              <th className="p-4 font-bold border-l-2 border-black">اسم المحطة</th>
              <th className="p-4 font-bold border-l-2 border-black">المدينة</th>
              <th className="p-4 font-bold border-l-2 border-black">التوثيق</th>
              <th className="p-4 font-bold border-l-2 border-black">التشغيل</th>
              <th className="p-4 font-bold border-l-2 border-black">الجودة</th>
              <th className="p-4 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {stations?.map((station) => (
              <tr key={station.id} className="border-b border-black last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="p-4 font-bold border-l-2 border-black">{station.name_ar}</td>
                <td className="p-4 border-l-2 border-black text-zinc-700">{station.city || '—'}</td>
                <td className="p-4 border-l-2 border-black">
                  <span className={`inline-block px-2 py-1 text-xs font-bold border-2 ${
                    station.verification_status === 'published' ? 'border-green-600 text-green-800 bg-green-100' :
                    station.verification_status === 'discovered' ? 'border-yellow-600 text-yellow-800 bg-yellow-100' :
                    'border-zinc-400 text-zinc-700 bg-zinc-100'
                  }`}>
                    {station.verification_status}
                  </span>
                </td>
                <td className="p-4 border-l-2 border-black">
                  <span className={`inline-flex items-center gap-2 ${station.operational_status === 'operational' ? 'text-green-700' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${station.operational_status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {station.operational_status}
                  </span>
                </td>
                <td className="p-4 border-l-2 border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-zinc-200 border border-black overflow-hidden">
                      <div 
                        className={`h-full ${station.data_quality_score >= 80 ? 'bg-green-500' : station.data_quality_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${station.data_quality_score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{station.data_quality_score}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Link 
                    href={`/admin/charging-stations/${station.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                  >
                    تعديل
                  </Link>
                </td>
              </tr>
            ))}
            {!stations?.length && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500 font-medium">
                  لا توجد محطات مسجلة حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
