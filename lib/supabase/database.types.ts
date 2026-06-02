export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          model_id: string;
          thinking_mode: boolean;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          model_id?: string;
          thinking_mode?: boolean;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string | null;
          model_id?: string;
          thinking_mode?: boolean;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          bullets: Json | null;
          metadata: Json;
          attachment: Json | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content?: string;
          bullets?: Json | null;
          metadata?: Json;
          attachment?: Json | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          bullets?: Json | null;
          metadata?: Json;
          attachment?: Json | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      charging_locations: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          city: string | null;
          area: string | null;
          latitude: number | null;
          longitude: number | null;
          plug_types: string[] | null;
          power_kw: number | null;
          is_verified: boolean;
          source: string | null;
          notes_ar: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          city?: string | null;
          area?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          plug_types?: string[] | null;
          power_kw?: number | null;
          is_verified?: boolean;
          source?: string | null;
          notes_ar?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          city?: string | null;
          area?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          plug_types?: string[] | null;
          power_kw?: number | null;
          is_verified?: boolean;
          source?: string | null;
          notes_ar?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_config: Json;
          avatar_path: string | null;
          age_range: string | null;
          country: string | null;
          city: string | null;
          ownership_status: string | null;
          has_driven_ev_or_hybrid: string | null;
          main_goal: string | null;
          driving_pattern: string | null;
          home_charging_access: string | null;
          location_preferences: Json;
          priorities: string[];
          privacy_settings: Json;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          profile_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_config?: Json;
          avatar_path?: string | null;
          age_range?: string | null;
          country?: string | null;
          city?: string | null;
          ownership_status?: string | null;
          has_driven_ev_or_hybrid?: string | null;
          main_goal?: string | null;
          driving_pattern?: string | null;
          home_charging_access?: string | null;
          location_preferences?: Json;
          priorities?: string[];
          privacy_settings?: Json;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          profile_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_config?: Json;
          avatar_path?: string | null;
          age_range?: string | null;
          country?: string | null;
          city?: string | null;
          ownership_status?: string | null;
          has_driven_ev_or_hybrid?: string | null;
          main_goal?: string | null;
          driving_pattern?: string | null;
          home_charging_access?: string | null;
          location_preferences?: Json;
          priorities?: string[];
          privacy_settings?: Json;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          profile_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      supported_vehicles: {
        Row: {
          id: string;
          brand_id: string;
          slug: string;
          name_en: string;
          name_ar: string;
          model_year: number;
          vehicle_type: "ev" | "phev" | "hev";
          body_type: string | null;
          market: string;
          battery_kwh: number | null;
          fuel_tank_liters: number | null;
          engine_liters: number | null;
          electric_range_km: number | null;
          total_range_km: number | null;
          price_jod_min: number | null;
          price_jod_max: number | null;
          charging_port: string | null;
          dc_fast_charging: boolean | null;
          home_charging_supported: boolean | null;
          is_active: boolean;
          summary_ar: string | null;
          jordan_notes_ar: string | null;
          data_confidence: "official" | "dealer" | "owner_reported" | "estimate";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          slug: string;
          name_en: string;
          name_ar: string;
          model_year: number;
          vehicle_type: "ev" | "phev" | "hev";
          body_type?: string | null;
          market?: string;
          battery_kwh?: number | null;
          fuel_tank_liters?: number | null;
          engine_liters?: number | null;
          electric_range_km?: number | null;
          total_range_km?: number | null;
          price_jod_min?: number | null;
          price_jod_max?: number | null;
          charging_port?: string | null;
          dc_fast_charging?: boolean | null;
          home_charging_supported?: boolean | null;
          is_active?: boolean;
          summary_ar?: string | null;
          jordan_notes_ar?: string | null;
          data_confidence?: "official" | "dealer" | "owner_reported" | "estimate";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          slug?: string;
          name_en?: string;
          name_ar?: string;
          model_year?: number;
          vehicle_type?: "ev" | "phev" | "hev";
          body_type?: string | null;
          market?: string;
          battery_kwh?: number | null;
          fuel_tank_liters?: number | null;
          engine_liters?: number | null;
          electric_range_km?: number | null;
          total_range_km?: number | null;
          price_jod_min?: number | null;
          price_jod_max?: number | null;
          charging_port?: string | null;
          dc_fast_charging?: boolean | null;
          home_charging_supported?: boolean | null;
          is_active?: boolean;
          summary_ar?: string | null;
          jordan_notes_ar?: string | null;
          data_confidence?: "official" | "dealer" | "owner_reported" | "estimate";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supported_vehicles_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "vehicle_brands";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_brands: {
        Row: {
          id: string;
          slug: string;
          name_en: string;
          name_ar: string;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_en: string;
          name_ar: string;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_en?: string;
          name_ar?: string;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicle_cost_profiles: {
        Row: {
          id: string;
          vehicle_id: string;
          scenario: string;
          electricity_kwh_100km: number | null;
          fuel_l_100km: number | null;
          notes_ar: string | null;
          confidence: "official" | "dealer" | "owner_reported" | "estimate";
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          scenario: string;
          electricity_kwh_100km?: number | null;
          fuel_l_100km?: number | null;
          notes_ar?: string | null;
          confidence?: "official" | "dealer" | "owner_reported" | "estimate";
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          scenario?: string;
          electricity_kwh_100km?: number | null;
          fuel_l_100km?: number | null;
          notes_ar?: string | null;
          confidence?: "official" | "dealer" | "owner_reported" | "estimate";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_cost_profiles_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "supported_vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
