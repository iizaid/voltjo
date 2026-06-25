import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const OCM_API_KEY = process.env.OPEN_CHARGE_MAP_API_KEY;

async function fetchOCMStations() {
  if (!OCM_API_KEY) {
    console.error("Missing OPEN_CHARGE_MAP_API_KEY in .env.local");
    console.warn("Please get an API key from https://openchargemap.org/");
    return;
  }

  console.log("Fetching charging stations from Open Charge Map (JO)...");
  
  try {
    const response = await fetch(
      `https://api.openchargemap.io/v3/poi/?output=json&countrycode=JO&maxresults=500&key=${OCM_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`OCM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} stations from OCM.`);

    let insertedCount = 0;

    for (const poi of data) {
      // Map OCM data to our schema
      const name = poi.AddressInfo?.Title || "Unknown Station";
      const latitude = poi.AddressInfo?.Latitude;
      const longitude = poi.AddressInfo?.Longitude;
      const city = poi.AddressInfo?.Town;
      
      if (!latitude || !longitude) continue;

      // Extract connectors
      const connections = poi.Connections || [];
      const paymentMethods = [];
      if (poi.UsageType?.IsPayAtLocation) paymentMethods.push("pay_at_location");
      if (poi.UsageType?.IsMembershipRequired) paymentMethods.push("membership_required");

      // Check if exists to prevent duplicates
      const { data: existing } = await supabase
        .from('charging_stations')
        .select('id')
        .eq('latitude', latitude)
        .eq('longitude', longitude)
        .maybeSingle();

      if (existing) {
        continue; // Skip exact coordinate duplicates for now (Deduplication algorithm can be improved)
      }

      // Insert Station as 'discovered'
      const { data: station, error: stationError } = await supabase
        .from('charging_stations')
        .insert({
          name_ar: name, // Fallback to English name until translated
          name_en: name,
          city: city,
          latitude: latitude,
          longitude: longitude,
          verification_status: 'discovered',
          operational_status: poi.StatusType?.IsOperational ? 'operational' : 'unknown',
          data_quality_score: 60, // 60 = OCM only
          source_data: poi, // Store raw data for audit
        })
        .select()
        .single();

      if (stationError || !station) {
        console.error(`Failed to insert station ${name}:`, stationError);
        continue;
      }

      insertedCount++;

      // Insert Connectors
      for (const conn of connections) {
        let voltageType = 'unknown';
        if (conn.Level?.IsFastChargeCapable) voltageType = 'DC';
        else if (conn.Level) voltageType = 'AC';

        await supabase.from('charging_connectors').insert({
          station_id: station.id,
          connector_type: conn.ConnectionType?.Title || 'Unknown',
          power_kw: conn.PowerKW,
          max_amps: conn.Amps,
          voltage_type: voltageType,
        });
      }
    }

    console.log(`Successfully ingested ${insertedCount} new stations.`);

  } catch (error) {
    console.error("Failed to fetch or ingest OCM data:", error);
  }
}

fetchOCMStations();
