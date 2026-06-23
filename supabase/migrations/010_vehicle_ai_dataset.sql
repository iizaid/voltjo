-- ============================================================
-- VoltJo — AI Knowledge Data Completion (Jordan EV assistant)
-- Migration: 010_vehicle_ai_dataset
-- Date: 2026-06-23
-- ============================================================
--
-- Goal: bring the 6 supported vehicles to the MINIMUM data quality an AI
-- assistant needs to answer Jordan EV questions accurately. Schema is
-- UNCHANGED. High-value facts that have no dedicated column (drivetrain, AC/DC
-- charging speed, key strengths/weaknesses) are encoded into `summary_ar`,
-- which is the text the assistant consumes. Structured columns (battery, range,
-- price) are filled ONLY where confidence is high; low-confidence items are left
-- NULL with a TODO note for later verification.
--
-- Sources: well-established manufacturer specifications. No internet scraping.
-- Jordan prices are import-dependent and therefore kept as wide estimates.
-- Idempotent: re-running re-applies the same values.

-- ------------------------------------------------------------
-- Tesla Model 3 2025 (EV, sedan) — HIGH confidence on specs
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  battery_kwh = 60,                       -- RWD standard-range (LFP)
  electric_range_km = 510,                -- WLTP, RWD
  -- price is import-dependent in Jordan; wide estimate only.
  price_jod_min = 30000,
  price_jod_max = 38000,
  summary_ar = 'سيارة كهربائية بالكامل (سيدان) ببطارية ~60 كيلوواط/ساعة ومدى واقعي حوالى 510 كم. الدفع خلفي (RWD). شحن AC حتى 11 kW وشحن سريع DC حتى ~170 kW. كفاءة ممتازة (~14 kWh/100km). نقاط القوة: مدى طويل، شحن سريع، كفاءة عالية، برمجيات متقدمة. نقاط الضعف: منفذ الشحن يختلف حسب بلد الاستيراد (NACS/CCS)، وشبكة الصيانة في الأردن محدودة، والسعر متغيّر حسب الاستيراد.',
  data_confidence = 'estimate'
WHERE slug = 'tesla-model-3-2025';

-- ------------------------------------------------------------
-- BYD Song Plus DM-i 2025 (PHEV, SUV) — HIGH confidence on specs
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  battery_kwh = 18.3,
  electric_range_km = 95,                 -- EV-only (NEDC)
  total_range_km = 1100,                  -- combined PHEV
  price_jod_min = 23000,
  price_jod_max = 28000,
  summary_ar = 'كروس أوفر هجين قابل للشحن (PHEV) للعائلات، ببطارية 18.3 كيلوواط/ساعة ومدى كهربائي ~95 كم ومدى إجمالي يصل ~1100 كم. الدفع أمامي (FWD). شحن AC ~3.3 kW وشحن سريع DC محدود (~18 kW). نقاط القوة: تكلفة تشغيل منخفضة، مدى إجمالي طويل، مساحة عائلية مناسبة. نقاط الضعف: شحن سريع بطيء نسبيًا، ومدى كهربائي صافٍ أقل من السيارات الكهربائية بالكامل.',
  data_confidence = 'estimate'
WHERE slug = 'byd-song-plus-dmi-2025';

-- ------------------------------------------------------------
-- BYD Song Pro DM-i 2025 (PHEV, SUV) — MEDIUM confidence
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  battery_kwh = 12.9,
  electric_range_km = 71,                 -- EV-only (NEDC)
  total_range_km = 1000,
  -- TODO(price): Jordan dealer pricing unconfirmed — left NULL.
  summary_ar = 'هجين قابل للشحن (PHEV) متوسط الحجم ضمن عائلة Song، ببطارية ~12.9 كيلوواط/ساعة ومدى كهربائي ~71 كم ومدى إجمالي طويل. الدفع أمامي (FWD). شحن AC ~3.3 kW. نقاط القوة: اقتصادي بالوقود والكهرباء، مناسب للاستخدام اليومي. نقاط الضعف: مدى كهربائي قصير، وشحن AC/DC بطيء، وتوفر النسخ يختلف بين الوكلاء.',
  data_confidence = 'estimate'
WHERE slug = 'byd-song-pro-dmi-2025';

-- ------------------------------------------------------------
-- Toyota RAV4 Hybrid 2025 (HEV, SUV) — HIGH confidence (not plug-in)
-- battery_kwh intentionally NULL: HEV battery is not user-chargeable.
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  summary_ar = 'سيارة دفع رباعي هجينة تقليدية (HEV) لا تحتاج شحنًا خارجيًا — تشحن بطاريتها ذاتيًا. محرك 2.5 لتر، استهلاك وقود ~5.9 لتر/100km. تتوفر بدفع أمامي أو رباعي (FWD/AWD). نقاط القوة: اعتمادية عالية، لا حاجة لبنية شحن، اقتصادية داخل المدينة. نقاط الضعف: ليست كهربائية بالكامل، تعتمد على الوقود، ولا يمكن شحنها من الكهرباء.',
  data_confidence = 'estimate'
WHERE slug = 'toyota-rav4-hybrid-2025';

-- ------------------------------------------------------------
-- BYD Sealion 05 DM-i 2025 (PHEV, SUV) — LOW confidence
-- TODO: confirm battery_kwh, electric_range_km, total_range_km, price for the
-- Jordan-market version before marking any value as official. Left NULL.
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  summary_ar = 'كروس أوفر هجين قابل للشحن (PHEV) حديث ضمن عائلة BYD. التفاصيل الدقيقة للنسخة الأردنية (سعة البطارية والمدى والسعر) ما زالت قيد التأكيد. نقاط القوة المتوقعة: تكلفة تشغيل منخفضة ومدى إجمالي طويل. يُنصح بمراجعة الوكيل للأرقام النهائية.',
  data_confidence = 'estimate'
WHERE slug = 'byd-sealion-05-dmi-2025';

-- ------------------------------------------------------------
-- Dongfeng Mage PHEV 2026 (PHEV, SUV) — LOW confidence
-- TODO: confirm battery_kwh, ranges, price, drivetrain for Jordan market.
-- ------------------------------------------------------------
UPDATE public.supported_vehicles SET
  summary_ar = 'سيارة هجينة قابلة للشحن (PHEV) حديثة من دونغ فينغ. بياناتها المحلية في الأردن (البطارية والمدى والسعر) ما زالت محدودة وتقديرية. يُنصح بتأكيد المواصفات من المستورد قبل الاعتماد على أي رقم نهائي.',
  data_confidence = 'estimate'
WHERE slug = 'dongfeng-mage-phev-2026';

-- ------------------------------------------------------------
-- Efficiency (cost profile) — add the missing BYD Song Pro mixed estimate.
-- The others already have profiles from migration 005.
-- ------------------------------------------------------------
INSERT INTO public.vehicle_cost_profiles (vehicle_id, scenario, electricity_kwh_100km, fuel_l_100km, notes_ar, confidence)
SELECT sv.id, 'mixed', 5.0, 4.6,
  'تقدير أولي لاستخدام مختلط (كهرباء + وقود) داخل الأردن؛ يختلف حسب توفر الشحن وطريقة القيادة.',
  'estimate'
FROM public.supported_vehicles sv
WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, scenario) DO UPDATE SET
  electricity_kwh_100km = excluded.electricity_kwh_100km,
  fuel_l_100km = excluded.fuel_l_100km,
  notes_ar = excluded.notes_ar,
  confidence = excluded.confidence;
