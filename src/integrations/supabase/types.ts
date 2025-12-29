export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
        }
        Relationships: []
      }
      booking_files: {
        Row: {
          booking_id: string
          doctor_id: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          patient_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          booking_id: string
          doctor_id?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          patient_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          booking_id?: string
          doctor_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          patient_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      call_attempts: {
        Row: {
          attempt_number: number
          attempted_at: string
          booking_id: string
          doctor_id: string
          id: string
          notes: string | null
        }
        Insert: {
          attempt_number: number
          attempted_at?: string
          booking_id: string
          doctor_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          attempt_number?: number
          attempted_at?: string
          booking_id?: string
          doctor_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_attempts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_bookings: {
        Row: {
          amount_paid: number | null
          created_at: string
          doctor_id: string | null
          doctor_notes: string | null
          id: string
          paid_at: string | null
          patient_id: string
          reason_for_visit: string | null
          scheduled_date: string
          slot_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          time_window_end: string
          time_window_start: string
          timezone: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          paid_at?: string | null
          patient_id: string
          reason_for_visit?: string | null
          scheduled_date: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          time_window_end: string
          time_window_start: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string
          reason_for_visit?: string | null
          scheduled_date?: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          time_window_end?: string
          time_window_start?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_notes: {
        Row: {
          booking_id: string
          created_at: string
          doctor_id: string
          id: string
          internal_only: boolean | null
          notes: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          doctor_id: string
          id?: string
          internal_only?: boolean | null
          notes: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          internal_only?: boolean | null
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string
          reason_for_visit: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["consultation_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason_for_visit?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason_for_visit?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability_slots: {
        Row: {
          availability_type: Database["public"]["Enums"]["availability_type"]
          created_at: string
          day_of_week: number | null
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean
          max_bookings: number
          specific_date: string | null
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week?: number | null
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean
          max_bookings?: number
          specific_date?: string | null
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week?: number | null
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          max_bookings?: number
          specific_date?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_issued_prescriptions: {
        Row: {
          booking_id: string
          containers_allowed: number
          created_at: string
          daily_max_pouches: number
          doctor_id: string
          expires_at: string
          id: string
          issued_at: string
          nicotine_strength: Database["public"]["Enums"]["nicotine_strength"]
          patient_id: string
          pdf_storage_path: string | null
          reference_id: string
          status: Database["public"]["Enums"]["issued_prescription_status"]
          supply_days: number
          total_pouches: number
          updated_at: string
          usage_tier: Database["public"]["Enums"]["usage_tier"]
        }
        Insert: {
          booking_id: string
          containers_allowed: number
          created_at?: string
          daily_max_pouches: number
          doctor_id: string
          expires_at: string
          id?: string
          issued_at?: string
          nicotine_strength: Database["public"]["Enums"]["nicotine_strength"]
          patient_id: string
          pdf_storage_path?: string | null
          reference_id: string
          status?: Database["public"]["Enums"]["issued_prescription_status"]
          supply_days?: number
          total_pouches: number
          updated_at?: string
          usage_tier: Database["public"]["Enums"]["usage_tier"]
        }
        Update: {
          booking_id?: string
          containers_allowed?: number
          created_at?: string
          daily_max_pouches?: number
          doctor_id?: string
          expires_at?: string
          id?: string
          issued_at?: string
          nicotine_strength?: Database["public"]["Enums"]["nicotine_strength"]
          patient_id?: string
          pdf_storage_path?: string | null
          reference_id?: string
          status?: Database["public"]["Enums"]["issued_prescription_status"]
          supply_days?: number
          total_pouches?: number
          updated_at?: string
          usage_tier?: Database["public"]["Enums"]["usage_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "doctor_issued_prescriptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          ahpra_number: string | null
          bio: string | null
          created_at: string
          id: string
          qualifications: string | null
          registration_number: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ahpra_number?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          qualifications?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ahpra_number?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          qualifications?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          ahpra_number: string | null
          created_at: string
          id: string
          is_active: boolean | null
          phone: string | null
          practice_location: string | null
          provider_number: string | null
          registration_complete: boolean | null
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ahpra_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          practice_location?: string | null
          provider_number?: string | null
          registration_complete?: boolean | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ahpra_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          practice_location?: string | null
          provider_number?: string | null
          registration_complete?: boolean | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intake_forms: {
        Row: {
          allergies: string | null
          answers: Json | null
          booking_id: string
          completed_at: string | null
          consent_given: boolean
          created_at: string
          current_medications: string | null
          id: string
          medical_history: string | null
          patient_id: string
          phone_number: string
          preferred_pharmacy: string | null
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          answers?: Json | null
          booking_id: string
          completed_at?: string | null
          consent_given?: boolean
          created_at?: string
          current_medications?: string | null
          id?: string
          medical_history?: string | null
          patient_id: string
          phone_number: string
          preferred_pharmacy?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          answers?: Json | null
          booking_id?: string
          completed_at?: string | null
          consent_given?: boolean
          created_at?: string
          current_medications?: string | null
          id?: string
          medical_history?: string | null
          patient_id?: string
          phone_number?: string
          preferred_pharmacy?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          additional_notes: string | null
          allergies: string | null
          created_at: string
          current_conditions: string | null
          id: string
          medications: string | null
          smoking_history: string | null
          updated_at: string
          user_id: string
          vaping_history: string | null
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string | null
          created_at?: string
          current_conditions?: string | null
          id?: string
          medications?: string | null
          smoking_history?: string | null
          updated_at?: string
          user_id: string
          vaping_history?: string | null
        }
        Update: {
          additional_notes?: string | null
          allergies?: string | null
          created_at?: string
          current_conditions?: string | null
          id?: string
          medications?: string | null
          smoking_history?: string | null
          updated_at?: string
          user_id?: string
          vaping_history?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          allowed_strength_max: number | null
          allowed_strength_min: number | null
          created_at: string
          doctor_id: string | null
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          max_units_per_month: number | null
          max_units_per_order: number | null
          patient_id: string
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          product_category: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
        }
        Insert: {
          allowed_strength_max?: number | null
          allowed_strength_min?: number | null
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          max_units_per_month?: number | null
          max_units_per_order?: number | null
          patient_id: string
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          product_category?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Update: {
          allowed_strength_max?: number | null
          allowed_strength_min?: number | null
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          max_units_per_month?: number | null
          max_units_per_order?: number | null
          patient_id?: string
          prescription_type?: Database["public"]["Enums"]["prescription_type"]
          product_category?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_prescription_overview: {
        Row: {
          allowed_strength_max: number | null
          allowed_strength_min: number | null
          created_at: string | null
          doctor_id: string | null
          expires_at: string | null
          file_url: string | null
          issued_at: string | null
          max_units_per_month: number | null
          max_units_per_order: number | null
          patient_dob: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          prescription_id: string | null
          prescription_type:
            | Database["public"]["Enums"]["prescription_type"]
            | null
          review_reason: string | null
          status: Database["public"]["Enums"]["prescription_status"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      admin_user_overview: {
        Row: {
          date_of_birth: string | null
          doctor_id: string | null
          doctor_is_active: boolean | null
          full_name: string | null
          phone: string | null
          profile_created_at: string | null
          provider_number: string | null
          qualifications: string | null
          registration_number: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          role_created_at: string | null
          role_id: string | null
          specialties: string[] | null
          specialty: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_prescription_quantities: {
        Args: { _usage_tier: Database["public"]["Enums"]["usage_tier"] }
        Returns: {
          containers_allowed: number
          daily_max_pouches: number
          total_pouches: number
        }[]
      }
      complete_doctor_registration: {
        Args: {
          _ahpra_number: string
          _provider_number: string
          _user_id: string
        }
        Returns: boolean
      }
      get_available_slots: {
        Args: { _date: string; _timezone?: string }
        Returns: {
          available_capacity: number
          doctor_id: string
          end_time: string
          slot_id: string
          start_time: string
        }[]
      }
      get_doctor_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_active_issued_prescription: {
        Args: { _patient_id: string }
        Returns: boolean
      }
      has_active_prescription: {
        Args: { _patient_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_doctor: { Args: { _user_id: string }; Returns: boolean }
      is_booking_doctor: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      is_doctor_assigned_to_patient: {
        Args: { _doctor_id: string; _patient_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
      availability_type: "recurring" | "one_off" | "blocked"
      booking_status:
        | "pending_payment"
        | "booked"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_answer"
      consultation_status:
        | "requested"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "intake_pending"
        | "ready_for_call"
        | "called"
        | "script_uploaded"
      consultation_type: "video" | "phone"
      issued_prescription_status: "active" | "expired" | "revoked"
      nicotine_strength: "3mg" | "6mg" | "9mg" | "12mg"
      prescription_status: "pending_review" | "active" | "rejected" | "expired"
      prescription_type: "uploaded" | "issued"
      usage_tier: "light" | "moderate" | "heavy"
      user_status: "approved" | "pending_approval" | "deactivated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "doctor", "admin"],
      availability_type: ["recurring", "one_off", "blocked"],
      booking_status: [
        "pending_payment",
        "booked",
        "in_progress",
        "completed",
        "cancelled",
        "no_answer",
      ],
      consultation_status: [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "intake_pending",
        "ready_for_call",
        "called",
        "script_uploaded",
      ],
      consultation_type: ["video", "phone"],
      issued_prescription_status: ["active", "expired", "revoked"],
      nicotine_strength: ["3mg", "6mg", "9mg", "12mg"],
      prescription_status: ["pending_review", "active", "rejected", "expired"],
      prescription_type: ["uploaded", "issued"],
      usage_tier: ["light", "moderate", "heavy"],
      user_status: ["approved", "pending_approval", "deactivated"],
    },
  },
} as const
