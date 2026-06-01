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
