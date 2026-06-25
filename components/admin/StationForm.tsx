"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

type Operator = { id: string; name_ar: string; name_en: string | null };

export default function StationForm({ 
  operators, 
  initialData 
}: { 
  operators: Operator[];
  initialData?: any; // To be typed properly later
}) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic State
  const [formData, setFormData] = useState({
    name_ar: initialData?.name_ar || "",
    name_en: initialData?.name_en || "",
    operator_id: initialData?.operator_id || "",
    city: initialData?.city || "",
    area: initialData?.area || "",
    latitude: initialData?.latitude?.toString() || "",
    longitude: initialData?.longitude?.toString() || "",
    operational_status: initialData?.operational_status || "operational",
    verification_status: initialData?.verification_status || "discovered",
    is_24h: initialData?.is_24h || false,
    pricing_model: initialData?.pricing_model || "unknown",
  });

  // Connectors State
  const [connectors, setConnectors] = useState<any[]>(initialData?.connectors || []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const addConnector = () => {
    setConnectors([...connectors, { connector_type: "ccs2", power_kw: "", voltage_type: "DC" }]);
  };

  const updateConnector = (index: number, field: string, value: string) => {
    const newConnectors = [...connectors];
    newConnectors[index][field] = value;
    setConnectors(newConnectors);
  };

  const removeConnector = (index: number) => {
    setConnectors(connectors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        operator_id: formData.operator_id || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      let stationId = initialData?.id;

      if (stationId) {
        // Update
        const { error } = await supabase.from("charging_stations").update(payload).eq("id", stationId);
        if (error) throw error;
        
        // Delete old connectors and re-insert (simple approach for MVP admin)
        await supabase.from("charging_connectors").delete().eq("station_id", stationId);
      } else {
        // Insert
        const { data, error } = await supabase.from("charging_stations").insert(payload).select().single();
        if (error) throw error;
        stationId = data.id;
      }

      // Insert Connectors
      if (connectors.length > 0) {
        const connectorsPayload = connectors.map(c => ({
          ...c,
          station_id: stationId,
          power_kw: c.power_kw ? parseFloat(c.power_kw) : null,
        }));
        await supabase.from("charging_connectors").insert(connectorsPayload);
      }

      // Log Audit (Assuming user auth logic)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("station_audit_logs").insert({
          station_id: stationId,
          user_id: user.id,
          action: initialData ? "update" : "create",
          new_data: payload,
        });
      }

      router.push("/admin/charging-stations");
      router.refresh();
    } catch (error) {
      console.error("Error saving station:", error);
      alert("حدث خطأ أثناء الحفظ. يرجى التحقق من المدخلات.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* القسم الأساسي */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b-2 border-black pb-2">المعلومات الأساسية</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold mb-2">اسم المحطة (عربي) *</label>
            <input required name="name_ar" value={formData.name_ar} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all" />
          </div>
          <div>
            <label className="block font-bold mb-2">اسم المحطة (إنجليزي)</label>
            <input name="name_en" value={formData.name_en} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all" />
          </div>
          <div>
            <label className="block font-bold mb-2">المشغّل (Operator)</label>
            <select name="operator_id" value={formData.operator_id} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer">
              <option value="">بدون مشغّل محدد</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name_ar}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-bold mb-2">المدينة</label>
              <input name="city" value={formData.city} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
            <div className="flex-1">
              <label className="block font-bold mb-2">المنطقة / الحي</label>
              <input name="area" value={formData.area} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* الموقع الجغرافي */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b-2 border-black pb-2">الموقع الجغرافي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold mb-2">خط العرض (Latitude) *</label>
            <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white font-mono text-left" dir="ltr" />
          </div>
          <div>
            <label className="block font-bold mb-2">خط الطول (Longitude) *</label>
            <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 focus:bg-white font-mono text-left" dir="ltr" />
          </div>
        </div>
      </div>

      {/* الحالة والتشغيل */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b-2 border-black pb-2">التشغيل والتوثيق</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-bold mb-2">حالة التشغيل</label>
            <select name="operational_status" value={formData.operational_status} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 cursor-pointer">
              <option value="operational">تعمل (Operational)</option>
              <option value="under_construction">قيد الإنشاء</option>
              <option value="planned">مخطط لها</option>
              <option value="temporarily_closed">مغلقة مؤقتاً</option>
              <option value="permanently_closed">مغلقة نهائياً</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-2">حالة التوثيق (الظهور)</label>
            <select name="verification_status" value={formData.verification_status} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 cursor-pointer">
              <option value="published">منشورة للعامة (Published)</option>
              <option value="admin_reviewed">مراجعة الإدارة</option>
              <option value="operator_verified">موثقة من المشغل</option>
              <option value="google_verified">موثقة عبر قوقل</option>
              <option value="discovered">مكتشفة حديثاً (لا تظهر)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-2">نموذج التسعير</label>
            <select name="pricing_model" value={formData.pricing_model} onChange={handleChange} className="w-full border-2 border-black p-3 bg-zinc-50 cursor-pointer">
              <option value="unknown">غير معروف</option>
              <option value="per_kwh">لكل كيلوواط (per_kwh)</option>
              <option value="per_session">لكل جلسة (per_session)</option>
              <option value="free">مجاني (free)</option>
            </select>
          </div>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-black bg-zinc-50 hover:bg-zinc-100 transition-colors w-fit">
          <input type="checkbox" name="is_24h" checked={formData.is_24h} onChange={handleChange} className="w-5 h-5 accent-black border-2 border-black cursor-pointer" />
          <span className="font-bold">المحطة مفتوحة 24 ساعة يومياً</span>
        </label>
      </div>

      {/* الشواحن والمنافذ */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
          <h2 className="text-xl font-bold">منافذ الشحن (Connectors)</h2>
          <button type="button" onClick={addConnector} className="bg-black text-white px-4 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
            + إضافة منفذ
          </button>
        </div>
        
        {connectors.length === 0 ? (
          <p className="text-zinc-500 font-medium p-4 border-2 border-dashed border-zinc-300 text-center">لا يوجد منافذ مضافة حالياً.</p>
        ) : (
          <div className="space-y-4">
            {connectors.map((connector, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                <button type="button" onClick={() => removeConnector(index)} className="absolute top-2 left-2 text-red-600 font-bold text-xl hover:text-red-800">×</button>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">النوع</label>
                  <select value={connector.connector_type} onChange={e => updateConnector(index, "connector_type", e.target.value)} className="w-full border-2 border-black p-2 bg-zinc-50">
                    <option value="ccs2">CCS2</option>
                    <option value="ccs1">CCS1</option>
                    <option value="type2">Type 2</option>
                    <option value="chademo">CHAdeMO</option>
                    <option value="gbt">GB/T</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">القدرة (kW)</label>
                  <input type="number" placeholder="مثال: 60" value={connector.power_kw} onChange={e => updateConnector(index, "power_kw", e.target.value)} className="w-full border-2 border-black p-2 bg-zinc-50 font-mono text-left" dir="ltr" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">التيار</label>
                  <select value={connector.voltage_type} onChange={e => updateConnector(index, "voltage_type", e.target.value)} className="w-full border-2 border-black p-2 bg-zinc-50">
                    <option value="DC">DC (سريع)</option>
                    <option value="AC">AC (بطيء/متوسط)</option>
                    <option value="unknown">غير معروف</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* أزرار الحفظ */}
      <div className="pt-8 border-t-2 border-black flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-3 border-2 border-black font-bold hover:bg-zinc-100 transition-colors">
          إلغاء
        </button>
        <button type="submit" disabled={isLoading} className="px-8 py-3 bg-black text-white font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-800 hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50">
          {isLoading ? "جاري الحفظ..." : "حفظ المحطة"}
        </button>
      </div>
    </form>
  );
}
