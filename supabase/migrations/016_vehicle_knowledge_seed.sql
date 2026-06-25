-- ============================================================
-- VoltJo — Vehicle Knowledge Seed Data (RAG Training Data)
-- Migration: 016_vehicle_knowledge_seed
-- Date: 2026-06-25
-- ============================================================
-- Strategy: INSERT with content_hash = 'PENDING', then bulk-compute
-- at the end using encode(digest(content,'sha256'),'hex').
-- This avoids duplicating every long string twice (once as content
-- value, once inside digest()), which is both error-prone and hard
-- to maintain.
-- Idempotent: ON CONFLICT (vehicle_id, category, section) DO UPDATE
-- ============================================================

-- Helper: insert one knowledge chunk with a temporary hash
-- (hash is recomputed at the bottom of this file)
-- ============================================================
-- BYD SONG PLUS DM-i 2025
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Overview',
'BYD Song Plus DM-i 2025 is a plug-in hybrid (PHEV) compact SUV for families. It uses BYD 5th-generation DM-i super hybrid system with a 1.5L naturally aspirated engine paired with an electric motor. Battery: 18.3 kWh LFP (blade battery). Electric-only range: 95 km (NEDC), real-world Jordan ~70-80 km. Combined total range: 1100 km. Drivetrain: front-wheel drive (FWD). System output: 204 HP. One of the most popular PHEV SUVs in Jordan due to low running cost and long total range.',
'estimate', 'BYD official specs (export market) estimate for Jordan', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Dimensions and Space',
'BYD Song Plus DM-i 2025 dimensions: Length 4705mm, Width 1890mm, Height 1680mm, Wheelbase 2765mm. Seating: 5 passengers. Boot space: 408 liters (PHEV battery takes some floor space). Ground clearance: 190mm. Curb weight: 1980 kg. Good family SUV space with above-average rear legroom for the segment.',
'estimate', 'BYD official specs', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Strengths and Weaknesses',
'Strengths of BYD Song Plus DM-i 2025: (1) Very low running cost on electric mode ~0.5-0.8 JOD per 100km vs 8-12 JOD on petrol. (2) Long total range 1100km eliminates range anxiety. (3) BYD has official dealer in Jordan (Al-Khal Trading), good parts availability. (4) LFP blade battery has long cycle life, no thermal runaway risk. (5) Smooth quiet ride in EV mode. Weaknesses: (1) DC fast charging limited to 18 kW only. (2) AC home charging slow at 3.3 kW, takes 5.5 hours for full charge. (3) Heavier than competitors due to dual powertrain. (4) NEDC range figures are optimistic, real Jordan EV range closer to 70-80 km.',
'estimate', 'owner reports and dealer info', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'battery_charging', 'Battery Specifications',
'BYD Song Plus DM-i 2025 battery: BYD Blade Battery (LFP chemistry), 18.3 kWh total capacity, 16.5 kWh usable. Voltage: 350V. Battery warranted 8 years or 160,000 km. LFP chemistry means: no cobalt, safer against fire, longer cycle life 3000+ cycles vs 1000 for NMC, handles Jordanian heat well. Battery does not need servicing and performs reliably in hot climates.',
'official', 'BYD official specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'battery_charging', 'Charging Speeds and Ports',
'BYD Song Plus DM-i 2025 charging: AC port Type 2 at 3.3 kW single-phase. Full charge from empty: 5.5 hours on AC. DC fast charging CCS2 up to 18 kW. Time to 80% on DC: 40 minutes. Note: 18 kW DC is slow compared to real fast chargers. Home charging requires 16A socket or wallbox. The 3.3 kW AC rate is the main charging limitation of this vehicle.',
'estimate', 'BYD specs and owner reports', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'battery_charging', 'Charging Cost in Jordan',
'Charging cost for BYD Song Plus DM-i 2025 in Jordan: Electricity price residential ~0.09-0.12 JOD per kWh. Full charge 16.5 kWh usable: 1.5-2.0 JOD. Cost per 100km on electric: 1.7-2.5 JOD. Compare to petrol: 95-octane ~1.0 JOD per liter, petrol car at 10L/100km = 10 JOD per 100km. Savings: ~80% cost reduction for daily commute when charged at home. Public AC charger rate: 0.15-0.25 JOD per kWh. Wallbox installation cost: 150-300 JOD one-time.',
'estimate', 'Jordan electricity tariffs and market data 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'engine_fuel', 'Engine and Hybrid System',
'BYD Song Plus DM-i 2025 powertrain: DM-i 5th generation hybrid. Petrol engine: 1.5L Xiaoyun naturally aspirated, 81 kW (110 HP). Electric motor: 145 kW (197 HP) front axle. System total: 204 HP. The DM-i is electric-first: petrol engine mainly acts as generator at low speeds (series hybrid), drives wheels directly at high speed (parallel hybrid). Petrol consumption in hybrid mode: 4.5-6.0 L per 100km. Fuel type: 92 or 95 octane. Fuel tank: 15 liters.',
'official', 'BYD DM-i 5th gen specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'engine_fuel', 'Fuel Economy and Range',
'BYD Song Plus DM-i 2025 range: EV-only 95 km NEDC / 70-80 km real-world Jordan. Hybrid range with empty battery and full 15L tank: 700-900 km. Total range: up to 1100 km. Fuel economy with charged battery: 1.4-2.0 L per 100km NEDC. Fuel economy with empty battery: 5.5-7.0 L per 100km. Best strategy in Jordan: charge at home every night, drive daily on electric mode, use petrol for long trips. Amman daily commute of 50-80 km can be done entirely on electricity.',
'estimate', 'BYD specs and real-world Jordan owner data', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'maintenance', 'Service Schedule and Costs',
'BYD Song Plus DM-i 2025 maintenance in Jordan: Official dealer Al-Khal Trading (BYD Jordan). Oil change interval: every 10,000 km or 12 months, engine oil 5W-30, ~4L, cost 40-60 JOD at dealer. Brake pads last longer due to regenerative braking: 60,000-80,000 km before replacement. No timing belt (chain system, maintenance-free for 200,000+ km). HVAC filter: every 20,000 km, 15-25 JOD. Annual service cost estimate: 150-250 JOD per year. Electric motor and DM-i system have minimal maintenance.',
'estimate', 'BYD Jordan dealer info and owner reports', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'maintenance', 'Warranty in Jordan',
'BYD Song Plus DM-i 2025 warranty from Al-Khal Trading Jordan: Vehicle warranty 6 years or 150,000 km. Battery warranty 8 years or 160,000 km with capacity guarantee (battery will not drop below 70% capacity). After-sales service centers in Amman (main) and other governorates. Spare parts have good availability in Jordan due to high BYD sales volume. Note: warranty coverage differs between official dealer units and grey-market imports. Always buy from Al-Khal Trading for full warranty.',
'dealer', 'Al-Khal Trading BYD Jordan', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'safety', 'Safety Features',
'BYD Song Plus DM-i 2025 safety: 5 stars C-NCAP. Standard on all trims: 6 airbags (front, side, curtain), ABS+EBD, ESC, traction control, hill start assist, TPMS, rear parking sensors, reversing camera. ADAS features: forward collision warning, AEB automatic emergency braking, lane departure warning, lane keep assist, blind spot monitoring, adaptive cruise control, traffic sign recognition. Blade battery safety: LFP chemistry passes nail penetration test without thermal runaway.',
'official', 'BYD safety specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'trims', 'Available Trims in Jordan',
'BYD Song Plus DM-i 2025 trims in Jordan: (1) Standard: 12.8 inch rotating touchscreen DiLink 4.0, 8-speaker audio, 360-degree camera, lane keeping, adaptive cruise control. Price ~23,000 JOD. (2) Premium: Adds panoramic sunroof, heated and ventilated front seats, 12-speaker Dynaudio audio, Nappa leather seats, head-up display. Price ~25,500 JOD. (3) Flagship: Adds power tailgate, 15.6 inch rear entertainment screen, full ADAS driver assistance package. Price ~27,500 JOD. All trims include BYD DiPilot assistance, 6 airbags, tire pressure monitoring, auto-hold, electronic parking brake.',
'estimate', 'BYD Jordan dealer trim list', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Price in Jordan',
'BYD Song Plus DM-i 2025 price in Jordan: Range 23,000-28,000 JOD depending on trim Standard, Premium, or Flagship. EVs and PHEVs benefit from reduced customs duties in Jordan under government incentive programs. Registration: annual fee based on 1500cc engine class. Insurance comprehensive: 1,200-1,800 JOD per year based on vehicle value. Good resale value due to brand popularity. Always buy from official Al-Khal dealer to ensure warranty coverage.',
'estimate', 'Market research and dealer quotes 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Jordan Market Position',
'BYD Song Plus DM-i 2025 is one of the top-selling PHEV SUVs in Jordan as of 2025. Strong acceptance due to low running cost, long range, and family practicality. Official dealer: Al-Khal Trading Company, largest BYD dealer in Jordan with test drives in Amman showrooms. Competes with Chery Omoda 5 PHEV, MG One PHEV, and Toyota RAV4 Hybrid. Advantages over RAV4 Hybrid: plug-in charging, electric range, lower fuel cost. Advantages over MG PHEV: longer EV range, better battery quality, stronger warranty.',
'estimate', 'Jordan EV market analysis 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- BYD SONG PRO DM-i 2025
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Overview',
'BYD Song Pro DM-i 2025 is a plug-in hybrid PHEV compact SUV, slightly smaller and more affordable than the Song Plus. Uses BYD DM-i 5th generation system. Battery: 12.9 kWh LFP blade battery. Electric-only range: 71 km NEDC, real-world Jordan ~55-65 km. Combined total range: 1000 km. Drivetrain: front-wheel drive FWD. Positioned as a more affordable entry into BYD PHEV lineup, suitable for smaller families or tighter budgets.',
'estimate', 'BYD official specs', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Comparison with Song Plus',
'BYD Song Pro DM-i 2025 vs Song Plus DM-i 2025 key differences: Battery: Song Pro 12.9 kWh vs Song Plus 18.3 kWh. EV Range: Song Pro 71 km NEDC vs Song Plus 95 km NEDC. Real Jordan EV range: Song Pro 55-65 km vs Song Plus 70-80 km. Total Range: Song Pro 1000 km vs Song Plus 1100 km. Price in Jordan: Song Pro 20,000-24,000 JOD vs Song Plus 23,000-28,000 JOD. DC Charging: Song Pro 15 kW vs Song Plus 18 kW. Recommendation: If daily commute is under 55 km, Song Pro is sufficient and more affordable. If daily commute is 60-85 km or family needs more boot space, choose Song Plus.',
'estimate', 'BYD specs comparison', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'battery_charging', 'Battery and Charging',
'BYD Song Pro DM-i 2025 battery: BYD Blade Battery LFP, 12.9 kWh total, 11.5 kWh usable. AC charging 3.3 kW Type 2, full charge in 3.5 hours. DC fast charging CCS2 up to 15 kW. Charging cost Jordan: full charge ~1.0-1.4 JOD. Cost per 100km on electric: 1.5-2.2 JOD. The smaller 12.9 kWh battery means faster charge sessions than Song Plus. Battery warranty: 8 years or 160,000 km.',
'estimate', 'BYD specs and Jordan market data', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'engine_fuel', 'Engine and Fuel Economy',
'BYD Song Pro DM-i 2025 powertrain: Same 1.5L Xiaoyun engine as Song Plus. System output: 190 HP. Electric motor: 132 kW. Fuel consumption hybrid mode: 5.0-6.5 L per 100km. Fuel tank: 12 liters. Fuel type: 92 or 95 octane. Total range with fuel: 1000 km. In Amman city traffic DM-i system operates mostly on electric which maximizes efficiency.',
'estimate', 'BYD Song Pro DM-i specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Price and Market',
'BYD Song Pro DM-i 2025 price in Jordan: Estimated 20,000-24,000 JOD depending on trim. More affordable than Song Plus by approximately 3,000-4,000 JOD. Official dealer: Al-Khal Trading BYD Jordan. Registration fee same engine class as Song Plus (1500cc). Insurance: 1,000-1,500 JOD per year. Song Pro offers good value for buyers who want PHEV benefits at lower entry price. Availability may be more limited than Song Plus. Resale value expected to be good given BYD brand strength in Jordan.',
'estimate', 'Jordan market data 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'maintenance', 'Service and Warranty',
'BYD Song Pro DM-i 2025 maintenance in Jordan: Same service network as Song Plus via Al-Khal Trading. Oil change interval: 10,000 km or 12 months. Annual maintenance estimate: 130-220 JOD. Vehicle warranty: 6 years or 150,000 km. Battery warranty: 8 years or 160,000 km. Brake pads last 60,000-80,000 km due to regenerative braking. No timing belt maintenance. Good spare parts availability in Jordan.',
'estimate', 'BYD Jordan and owner reports', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'trims', 'Trim Levels',
'BYD Song Pro DM-i 2025 trims in Jordan: (1) Comfort trim: 10.1 inch touchscreen DiLink, 6 airbags, reversing camera, 360-view option, lane keeping, adaptive cruise, AEB, keyless entry. (2) Premium trim: Adds panoramic sunroof, 12.8 inch rotating touchscreen, leather seats, 8-speaker audio, heated front seats, head-up display, blind spot monitoring. Both trims include BYD blade battery, 6-year warranty, DM-i drivetrain. Comfort trim offers excellent value with all essential safety features.',
'estimate', 'BYD dealer trim information', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'safety', 'Safety Specifications',
'BYD Song Pro DM-i 2025 safety: 5-star C-NCAP rating. Standard on all trims: 6 airbags, ABS+EBD, ESC, hill start assist, TPMS, rear parking sensors. ADAS: forward collision warning, AEB automatic braking, lane departure warning, lane keep assist, adaptive cruise control with stop-and-go, blind spot monitoring. Blade battery LFP chemistry passes nail penetration test. BYD DiPilot semi-autonomous driving on premium trim.',
'official', 'BYD safety specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-pro-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- TOYOTA RAV4 HYBRID 2025
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Overview',
'Toyota RAV4 Hybrid 2025 is a self-charging hybrid SUV (HEV), NOT a plug-in hybrid. It never needs to be plugged in. The hybrid battery charges automatically through regenerative braking and the petrol engine. Engine: 2.5L 4-cylinder plus two electric motors. System output: 222 HP. Fuel consumption: 5.5-6.5 L per 100km. No meaningful electric-only range. Main advantages for Jordan: no charging infrastructure needed, excellent reliability record, Toyota Jordan has the best dealer network in the country.',
'official', 'Toyota official specifications', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'toyota-rav4-hybrid-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'RAV4 Hybrid vs BYD PHEV Comparison',
'Toyota RAV4 Hybrid 2025 vs BYD Song Plus DM-i 2025 in Jordan: Charging: RAV4 Hybrid needs no charging at all. Song Plus needs nightly charging to use EV mode. Running cost: Song Plus ~2 JOD per 100km on electric vs RAV4 ~6 JOD per 100km on petrol. RAV4 wins if no home charging available. Reliability: RAV4 Hybrid is among the most reliable vehicles ever built. Price: RAV4 Hybrid 28,000-35,000 JOD vs Song Plus 23,000-28,000 JOD. Dealer support: Toyota Jordan (Bustami and Saheb) is the best after-sales network in Jordan. Recommendation: RAV4 Hybrid if no home charging or reliability is top priority. Song Plus if home charging is available and running cost matters most.',
'estimate', 'Jordan market comparison 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'toyota-rav4-hybrid-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Price and Support in Jordan',
'Toyota RAV4 Hybrid 2025 in Jordan: Price range 28,000-35,000 JOD depending on trim LE, XLE, Limited, or Platinum. Official dealer: Bustami and Saheb (Toyota Jordan) with service centers in Amman, Zarqa, Irbid, Aqaba, and other cities. Warranty: 3 years or 100,000 km. Hybrid battery warranty: 8 years or 160,000 km. Parts availability: excellent, Toyota has the strongest parts supply chain in Jordan. Insurance comprehensive: 1,500-2,200 JOD per year. Annual license fee based on 2500cc engine class, higher than 1500cc BYD.',
'estimate', 'Toyota Jordan and market data 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'toyota-rav4-hybrid-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'maintenance', 'Maintenance and Reliability',
'Toyota RAV4 Hybrid 2025 maintenance: Oil change every 10,000 km or 12 months, synthetic 0W-20, cost 50-70 JOD at Toyota Jordan. Brake pads last 60,000-80,000 km. No timing belt (chain). Annual service estimate: 200-300 JOD. RAV4 Hybrid has one of the best reliability records of any SUV globally. Toyota THS-II hybrid system proven over 25 years with very few failures. Jordan owners report very low repair incidents. Toyota Jordan service centers in Amman, Zarqa, Irbid, Aqaba.',
'official', 'Toyota reliability data and Jordan owner reports', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'toyota-rav4-hybrid-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- TESLA MODEL 3 2025
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Overview',
'Tesla Model 3 2025 is a fully electric sedan with no petrol engine. Battery options: Standard Range RWD ~60 kWh LFP, Long Range AWD ~75 kWh NMC, Performance AWD ~75 kWh NMC. Electric range: 510 km WLTP Standard Range, up to 629 km WLTP Long Range. In Jordan all units are grey-market imports with no official Tesla dealer. Main concern for Jordan buyers: no official warranty support, no local service center, spare parts must be ordered internationally. Best suited for tech-savvy buyers who can manage without local dealer support.',
'estimate', 'Tesla specs and Jordan import market', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'tesla-model-3-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'battery_charging', 'Charging in Jordan',
'Tesla Model 3 2025 charging in Jordan: Charging port outside North America uses CCS2 European standard. Tesla Superchargers are NOT available in Jordan. Jordan public chargers mostly use Type 2 AC or CCS2 DC, compatible with European-spec Tesla. AC charging up to 11 kW three-phase, full charge 5.5-8 hours. DC fast charging up to 170 kW CCS2. Charging cost at home: 5-7 JOD for a full 60 kWh charge. Without Superchargers in Jordan, Tesla owners rely on EDCO public chargers, hotel chargers, and home charging. Range anxiety less of an issue with 510+ km range.',
'estimate', 'Tesla specs and Jordan charging infrastructure 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'tesla-model-3-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Jordan Market Notes',
'Tesla Model 3 2025 in Jordan: No official Tesla dealer, all units are grey-market imports from Europe, USA, or China. Price range: 30,000-38,000 JOD depending on spec and origin. No official warranty in Jordan. Service: no official Tesla service center, third-party EV workshops handle minor issues, major repairs require international parts ordering. Over-the-air software updates work regardless of import status. Registration: classified as electric vehicle with reduced customs. Recommendation: suitable only for buyers with technical knowledge who accept the risk of no local dealer support.',
'estimate', 'Jordan import market and grey market data 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'tesla-model-3-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- BYD SEALION 05 DM-i 2025
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'profile', 'Overview',
'BYD Sealion 05 DM-i 2025 is a new-generation PHEV compact SUV from BYD with a more modern design than the Song series. Uses DM-i 5th generation system. Expected battery: ~15.8 kWh. Expected EV range: 100-120 km NEDC. Expected total range: 1200 km. Jordan availability: being introduced via Al-Khal Trading in late 2025. All specifications are estimates. Exact Jordan-market specs, battery options, and trim levels are pending official confirmation from Al-Khal Trading.',
'needs_review', 'BYD global specs, Jordan version unconfirmed', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-sealion-05-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Jordan Market Status',
'BYD Sealion 05 DM-i 2025 in Jordan: Status mid-2025: being launched by Al-Khal Trading. Expected price: 22,000-27,000 JOD estimate, not confirmed. The Sealion 05 competes directly with BYD Song Plus. If its expected 100-120 km EV range is confirmed, it would be superior to Song Plus 95 km and Song Pro 71 km. Contact Al-Khal Trading for confirmed pricing, availability, and official Jordan-market specifications before purchase.',
'needs_review', 'Al-Khal Trading and BYD Jordan launch info, unconfirmed', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-sealion-05-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- GENERAL JORDAN EV MARKET (attached to Song Plus as primary)
-- ============================================================

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Jordan EV Incentives and Customs',
'Jordan EV and PHEV incentive policy 2025: Jordan has introduced customs duty reductions for electric and hybrid vehicles to encourage adoption. BEV battery electric vehicles get the largest reduction, sometimes 0-10% customs. PHEVs get partial reduction based on battery capacity and electric range. HEVs self-charging hybrids get the smallest reduction. Specific rates change periodically, always verify with Jordan Customs Authority or official dealer at purchase time. Registration fees for EVs are based on battery power not engine size, typically lower than equivalent ICE vehicle. Jordan Energy Ministry has EV adoption targets as part of the Green Growth National Plan.',
'estimate', 'Jordan Customs and Energy Ministry policy 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

INSERT INTO public.vehicle_knowledge
  (vehicle_id, category, section, content, confidence, confidence_raw, content_hash)
SELECT sv.id, 'market', 'Jordan EV Charging Infrastructure',
'Jordan EV charging infrastructure 2025: Public charging stations mainly in Amman at West Amman, Abdali, Mecca Street, Airport Road. EDCO Jordan Electric Power Company has been expanding the charging network. Fast DC chargers are limited, mainly at major shopping centers and hotels. Highway charging is limited: Amman to Aqaba highway has very few public chargers, plan carefully for long trips. Home charging is the most practical solution: install 16A or 32A socket in garage. Wallbox charger installation cost: 150-300 JOD. Monthly electricity increase for EV charging: 20-40 JOD for typical Amman daily commute.',
'estimate', 'Jordan EV infrastructure survey 2025', 'PENDING'
FROM public.supported_vehicles sv WHERE sv.slug = 'byd-song-plus-dmi-2025'
ON CONFLICT (vehicle_id, category, section) DO UPDATE SET
  content = EXCLUDED.content, confidence = EXCLUDED.confidence,
  confidence_raw = EXCLUDED.confidence_raw, content_hash = 'PENDING', updated_at = now();

-- ============================================================
-- FINAL STEP: Compute all content hashes in one bulk UPDATE
-- This replaces the 'PENDING' placeholder with the real sha256
-- hash of each row's content column.
-- ============================================================
UPDATE public.vehicle_knowledge
SET content_hash = encode(digest(content, 'sha256'), 'hex')
WHERE content_hash = 'PENDING';
