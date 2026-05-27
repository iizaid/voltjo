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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age_range: string | null;
          country: string | null;
          city: string | null;
          ownership_status: string | null;
          has_driven_ev_or_hybrid: string | null;
          main_goal: string | null;
          driving_pattern: string | null;
          home_charging_access: string | null;
          priorities: string[];
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          profile_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          age_range?: string | null;
          country?: string | null;
          city?: string | null;
          ownership_status?: string | null;
          has_driven_ev_or_hybrid?: string | null;
          main_goal?: string | null;
          driving_pattern?: string | null;
          home_charging_access?: string | null;
          priorities?: string[];
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          profile_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          age_range?: string | null;
          country?: string | null;
          city?: string | null;
          ownership_status?: string | null;
          has_driven_ev_or_hybrid?: string | null;
          main_goal?: string | null;
          driving_pattern?: string | null;
          home_charging_access?: string | null;
          priorities?: string[];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
