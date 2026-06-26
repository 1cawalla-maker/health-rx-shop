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
        Relationships: [
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_attempts: {
        Row: {
          answered: boolean
          attempt_number: number
          attempted_at: string
          call_status: string | null
          consultation_id: string
          doctor_id: string
          doctor_user_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          notes: string | null
          twilio_call_sid: string | null
        }
        Insert: {
          answered?: boolean
          attempt_number: number
          attempted_at?: string
          call_status?: string | null
          consultation_id: string
          doctor_id: string
          doctor_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          twilio_call_sid?: string | null
        }
        Update: {
          answered?: boolean
          attempt_number?: number
          attempted_at?: string
          call_status?: string | null
          consultation_id?: string
          doctor_id?: string
          doctor_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          twilio_call_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_attempts_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_attempts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          consultation_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          consultation_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          consultation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "consultation_events_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          booking_id: string
          created_at: string
          doctor_id: string
          id: string
          internal_only: boolean | null
          isbar: Json | null
          note_type: string
          notes: string
          source: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          doctor_id: string
          id?: string
          internal_only?: boolean | null
          isbar?: Json | null
          note_type?: string
          notes: string
          source?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          internal_only?: boolean | null
          isbar?: Json | null
          note_type?: string
          notes?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_payments: {
        Row: {
          amount_cents: number
          consultation_id: string
          created_at: string
          currency: string
          id: string
          net_amount_cents: number | null
          paid_at: string | null
          patient_id: string
          status: string
          stripe_balance_transaction_id: string | null
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          consultation_id: string
          created_at?: string
          currency?: string
          id?: string
          net_amount_cents?: number | null
          paid_at?: string | null
          patient_id: string
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          consultation_id?: string
          created_at?: string
          currency?: string
          id?: string
          net_amount_cents?: number | null
          paid_at?: string | null
          patient_id?: string
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_payments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_reservations: {
        Row: {
          consultation_id: string
          created_at: string
          doctor_id: string | null
          expires_at: string
          id: string
          patient_id: string
          scheduled_at: string
          status: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          doctor_id?: string | null
          expires_at: string
          id?: string
          patient_id: string
          scheduled_at: string
          status?: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          doctor_id?: string | null
          expires_at?: string
          id?: string
          patient_id?: string
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_reservations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_reservations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          booking_metadata: Json
          booking_provider: string
          booking_return_token: string | null
          booking_status: string
          completed_at: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string | null
          doctor_user_id: string | null
          end_time: string | null
          halaxy_appointment_id: string | null
          halaxy_appointment_status: string | null
          halaxy_booking_url: string | null
          halaxy_charge_item_definition_id: string | null
          halaxy_document_reference_id: string | null
          halaxy_healthcare_service_id: string | null
          halaxy_invoice_id: string | null
          halaxy_last_webhook_at: string | null
          halaxy_location_id: string | null
          halaxy_location_name: string | null
          halaxy_manage_url: string | null
          halaxy_patient_id: string | null
          halaxy_payment_status: string | null
          halaxy_payment_transaction_id: string | null
          halaxy_practitioner_id: string | null
          halaxy_practitioner_name: string | null
          halaxy_practitioner_role_id: string | null
          id: string
          notes: string | null
          outcome: string | null
          outcome_reason: string | null
          patient_id: string
          reason_for_visit: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          booking_metadata?: Json
          booking_provider?: string
          booking_return_token?: string | null
          booking_status?: string
          completed_at?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          doctor_user_id?: string | null
          end_time?: string | null
          halaxy_appointment_id?: string | null
          halaxy_appointment_status?: string | null
          halaxy_booking_url?: string | null
          halaxy_charge_item_definition_id?: string | null
          halaxy_document_reference_id?: string | null
          halaxy_healthcare_service_id?: string | null
          halaxy_invoice_id?: string | null
          halaxy_last_webhook_at?: string | null
          halaxy_location_id?: string | null
          halaxy_location_name?: string | null
          halaxy_manage_url?: string | null
          halaxy_patient_id?: string | null
          halaxy_payment_status?: string | null
          halaxy_payment_transaction_id?: string | null
          halaxy_practitioner_id?: string | null
          halaxy_practitioner_name?: string | null
          halaxy_practitioner_role_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          outcome_reason?: string | null
          patient_id: string
          reason_for_visit?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          booking_metadata?: Json
          booking_provider?: string
          booking_return_token?: string | null
          booking_status?: string
          completed_at?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          doctor_user_id?: string | null
          end_time?: string | null
          halaxy_appointment_id?: string | null
          halaxy_appointment_status?: string | null
          halaxy_booking_url?: string | null
          halaxy_charge_item_definition_id?: string | null
          halaxy_document_reference_id?: string | null
          halaxy_healthcare_service_id?: string | null
          halaxy_invoice_id?: string | null
          halaxy_last_webhook_at?: string | null
          halaxy_location_id?: string | null
          halaxy_location_name?: string | null
          halaxy_manage_url?: string | null
          halaxy_patient_id?: string | null
          halaxy_payment_status?: string | null
          halaxy_payment_transaction_id?: string | null
          halaxy_practitioner_id?: string | null
          halaxy_practitioner_name?: string | null
          halaxy_practitioner_role_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          outcome_reason?: string | null
          patient_id?: string
          reason_for_visit?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability_blocks: {
        Row: {
          created_at: string
          date: string
          doctor_id: string
          end_time: string
          id: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id: string
          end_time: string
          id?: string
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string
          end_time?: string
          id?: string
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_blocks_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_issued_prescriptions: {
        Row: {
          approved_pdf_at: string | null
          booking_id: string
          consultation_id: string | null
          containers_allowed: number
          created_at: string
          daily_max_pouches: number
          directions: string | null
          doctor_declaration_accepted: boolean
          doctor_declaration_accepted_at: string | null
          doctor_id: string
          expires_at: string
          id: string
          issued_at: string
          max_pouches_per_day: number | null
          nicotine_strength: Database["public"]["Enums"]["nicotine_strength"]
          patient_id: string
          patient_identity_verification_id: string | null
          patient_identity_verified_at: string | null
          pdf_storage_path: string | null
          reference_id: string
          status: Database["public"]["Enums"]["issued_prescription_status"]
          supply_days: number
          total_pouches: number
          updated_at: string
          usage_tier: Database["public"]["Enums"]["usage_tier"]
        }
        Insert: {
          approved_pdf_at?: string | null
          booking_id: string
          consultation_id?: string | null
          containers_allowed: number
          created_at?: string
          daily_max_pouches: number
          directions?: string | null
          doctor_declaration_accepted?: boolean
          doctor_declaration_accepted_at?: string | null
          doctor_id: string
          expires_at: string
          id?: string
          issued_at?: string
          max_pouches_per_day?: number | null
          nicotine_strength: Database["public"]["Enums"]["nicotine_strength"]
          patient_id: string
          patient_identity_verification_id?: string | null
          patient_identity_verified_at?: string | null
          pdf_storage_path?: string | null
          reference_id: string
          status?: Database["public"]["Enums"]["issued_prescription_status"]
          supply_days?: number
          total_pouches: number
          updated_at?: string
          usage_tier: Database["public"]["Enums"]["usage_tier"]
        }
        Update: {
          approved_pdf_at?: string | null
          booking_id?: string
          consultation_id?: string | null
          containers_allowed?: number
          created_at?: string
          daily_max_pouches?: number
          directions?: string | null
          doctor_declaration_accepted?: boolean
          doctor_declaration_accepted_at?: string | null
          doctor_id?: string
          expires_at?: string
          id?: string
          issued_at?: string
          max_pouches_per_day?: number | null
          nicotine_strength?: Database["public"]["Enums"]["nicotine_strength"]
          patient_id?: string
          patient_identity_verification_id?: string | null
          patient_identity_verified_at?: string | null
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
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_issued_prescriptions_patient_identity_verification__fkey"
            columns: ["patient_identity_verification_id"]
            isOneToOne: false
            referencedRelation: "patient_identity_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_payout_profiles: {
        Row: {
          abn: string
          account_name: string | null
          account_number: string | null
          bsb: string | null
          created_at: string
          doctor_id: string
          entity_name: string
          gst_registered: boolean
          id: string
          remittance_email: string
          updated_at: string
        }
        Insert: {
          abn: string
          account_name?: string | null
          account_number?: string | null
          bsb?: string | null
          created_at?: string
          doctor_id: string
          entity_name: string
          gst_registered?: boolean
          id?: string
          remittance_email: string
          updated_at?: string
        }
        Update: {
          abn?: string
          account_name?: string | null
          account_number?: string | null
          bsb?: string | null
          created_at?: string
          doctor_id?: string
          entity_name?: string
          gst_registered?: boolean
          id?: string
          remittance_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_payout_profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_payouts: {
        Row: {
          amount_cents: number
          consultation_id: string
          created_at: string
          currency: string
          doctor_id: string
          failure_message: string | null
          gross_amount_cents: number | null
          id: string
          paid_at: string | null
          payout_period_end: string | null
          payout_period_start: string | null
          remittance_email_sent_at: string | null
          remittance_pdf_path: string | null
          status: string
          stripe_balance_transaction_id: string | null
          stripe_fee_cents: number | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          consultation_id: string
          created_at?: string
          currency?: string
          doctor_id: string
          failure_message?: string | null
          gross_amount_cents?: number | null
          id?: string
          paid_at?: string | null
          payout_period_end?: string | null
          payout_period_start?: string | null
          remittance_email_sent_at?: string | null
          remittance_pdf_path?: string | null
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_fee_cents?: number | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          consultation_id?: string
          created_at?: string
          currency?: string
          doctor_id?: string
          failure_message?: string | null
          gross_amount_cents?: number | null
          id?: string
          paid_at?: string | null
          payout_period_end?: string | null
          payout_period_start?: string | null
          remittance_email_sent_at?: string | null
          remittance_pdf_path?: string | null
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_fee_cents?: number | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_payouts_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
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
      doctor_signatures: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          storage_bucket: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_signatures_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          doctor_id: string
          id: string
          onboarding_complete: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          doctor_id: string
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          doctor_id?: string
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_stripe_accounts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          ahpra_number: string | null
          created_at: string
          halaxy_practitioner_id: string | null
          id: string
          is_active: boolean | null
          onboarding_completed_at: string | null
          onboarding_invited_at: string | null
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
          halaxy_practitioner_id?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_invited_at?: string | null
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
          halaxy_practitioner_id?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_invited_at?: string | null
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
      eligibility_quiz_sessions: {
        Row: {
          answers: Json
          completed_at: string
          created_at: string
          id: string
          linked_at: string | null
          notice_version: string
          patient_id: string | null
          privacy_policy_version: string
          result: string
          risk_flags: string[]
          updated_at: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          created_at?: string
          id?: string
          linked_at?: string | null
          notice_version: string
          patient_id?: string | null
          privacy_policy_version: string
          result?: string
          risk_flags?: string[]
          updated_at?: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          created_at?: string
          id?: string
          linked_at?: string | null
          notice_version?: string
          patient_id?: string | null
          privacy_policy_version?: string
          result?: string
          risk_flags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          payload: Json
          provider: string | null
          provider_message_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          to_email: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          to_email: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      halaxy_webhook_events: {
        Row: {
          action: string | null
          consultation_id: string | null
          created_at: string
          error_message: string | null
          halaxy_event_id: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          resource_reference: string | null
          resource_type: string | null
          updated_at: string
        }
        Insert: {
          action?: string | null
          consultation_id?: string | null
          created_at?: string
          error_message?: string | null
          halaxy_event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          resource_reference?: string | null
          resource_type?: string | null
          updated_at?: string
        }
        Update: {
          action?: string | null
          consultation_id?: string | null
          created_at?: string
          error_message?: string | null
          halaxy_event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          resource_reference?: string | null
          resource_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaxy_webhook_events_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "intake_forms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_prescriptions: {
        Row: {
          consultation_id: string
          doctor_id: string
          id: string
          issued_at: string
          max_strength_mg: number
          patient_id: string
        }
        Insert: {
          consultation_id: string
          doctor_id: string
          id?: string
          issued_at?: string
          max_strength_mg: number
          patient_id: string
        }
        Update: {
          consultation_id?: string
          doctor_id?: string
          id?: string
          issued_at?: string
          max_strength_mg?: number
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issued_prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
      order_pdfs: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          path: string
          shopify_order_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          id?: string
          kind: string
          path: string
          shopify_order_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          path?: string
          shopify_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_pdfs_shopify_order_id_fkey"
            columns: ["shopify_order_id"]
            isOneToOne: false
            referencedRelation: "shopify_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_identity_verifications: {
        Row: {
          created_at: string
          document_type: string | null
          failure_reason: string | null
          id: string
          metadata: Json
          patient_id: string
          provider: string | null
          provider_reference_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_dob: string | null
          verified_name: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json
          patient_id: string
          provider?: string | null
          provider_reference_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_dob?: string | null
          verified_name?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json
          patient_id?: string
          provider?: string | null
          provider_reference_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_dob?: string | null
          verified_name?: string | null
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
          consultation_id: string | null
          created_at: string
          doctor_id: string | null
          expires_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          max_units_per_month: number | null
          max_units_per_order: number | null
          ocr_confidence: number | null
          ocr_error: string | null
          ocr_extracted: Json | null
          ocr_processed_at: string | null
          ocr_raw_text: string | null
          ocr_status: string
          patient_id: string
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          product_category: string | null
          review_reason: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          total_units_allowed: number | null
          updated_at: string
        }
        Insert: {
          allowed_strength_max?: number | null
          allowed_strength_min?: number | null
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          max_units_per_month?: number | null
          max_units_per_order?: number | null
          ocr_confidence?: number | null
          ocr_error?: string | null
          ocr_extracted?: Json | null
          ocr_processed_at?: string | null
          ocr_raw_text?: string | null
          ocr_status?: string
          patient_id: string
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          product_category?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          total_units_allowed?: number | null
          updated_at?: string
        }
        Update: {
          allowed_strength_max?: number | null
          allowed_strength_min?: number | null
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          max_units_per_month?: number | null
          max_units_per_order?: number | null
          ocr_confidence?: number | null
          ocr_error?: string | null
          ocr_extracted?: Json | null
          ocr_processed_at?: string | null
          ocr_raw_text?: string | null
          ocr_status?: string
          patient_id?: string
          prescription_type?: Database["public"]["Enums"]["prescription_type"]
          product_category?: string | null
          review_reason?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          total_units_allowed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          currency: string
          display_price_cents: number
          display_strength_mg: number
          id: string
          max_order_qty: number | null
          product_id: string
          raw: Json
          shopify_variant_gid: string | null
          sort_order: number
          stock_status: string
          supplier_catalog_item_id: string | null
          supplier_cost_cents: number | null
          supplier_payment_url: string | null
          supplier_sku: string | null
          supplier_url: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          currency?: string
          display_price_cents: number
          display_strength_mg: number
          id?: string
          max_order_qty?: number | null
          product_id: string
          raw?: Json
          shopify_variant_gid?: string | null
          sort_order?: number
          stock_status?: string
          supplier_catalog_item_id?: string | null
          supplier_cost_cents?: number | null
          supplier_payment_url?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          currency?: string
          display_price_cents?: number
          display_strength_mg?: number
          id?: string
          max_order_qty?: number | null
          product_id?: string
          raw?: Json
          shopify_variant_gid?: string | null
          sort_order?: number
          stock_status?: string
          supplier_catalog_item_id?: string | null
          supplier_cost_cents?: number | null
          supplier_payment_url?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_supplier_catalog_item_id_fkey"
            columns: ["supplier_catalog_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_notes: string | null
          brand: string
          can_size_pouches: number
          created_at: string
          description: string | null
          display_name: string
          flavour: string | null
          id: string
          image_url: string | null
          requires_prescription: boolean
          shopify_product_gid: string | null
          sort_order: number
          status: string
          supplier_catalog_item_id: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          brand?: string
          can_size_pouches?: number
          created_at?: string
          description?: string | null
          display_name: string
          flavour?: string | null
          id?: string
          image_url?: string | null
          requires_prescription?: boolean
          shopify_product_gid?: string | null
          sort_order?: number
          status?: string
          supplier_catalog_item_id?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          brand?: string
          can_size_pouches?: number
          created_at?: string
          description?: string | null
          display_name?: string
          flavour?: string | null
          id?: string
          image_url?: string | null
          requires_prescription?: boolean
          shopify_product_gid?: string | null
          sort_order?: number
          status?: string
          supplier_catalog_item_id?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_catalog_item_id_fkey"
            columns: ["supplier_catalog_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_attestation_version: string | null
          age_attested_at: string | null
          collection_notice_version: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          email_verification_method: string | null
          email_verified_at: string | null
          full_name: string | null
          halaxy_patient_id: string | null
          halaxy_patient_synced_at: string | null
          id: string
          minimal_onboarding_completed_at: string | null
          phone: string | null
          phone_change_requested_at: string | null
          phone_change_verification_method: string | null
          phone_change_verified_at: string | null
          phone_verification_method: string | null
          phone_verified_at: string | null
          previous_phone: string | null
          privacy_notice_accepted_at: string | null
          privacy_policy_version: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_country: string | null
          shipping_place_id: string | null
          shipping_postcode: string | null
          shipping_state: string | null
          shipping_suburb: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_attestation_version?: string | null
          age_attested_at?: string | null
          collection_notice_version?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verification_method?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          halaxy_patient_id?: string | null
          halaxy_patient_synced_at?: string | null
          id?: string
          minimal_onboarding_completed_at?: string | null
          phone?: string | null
          phone_change_requested_at?: string | null
          phone_change_verification_method?: string | null
          phone_change_verified_at?: string | null
          phone_verification_method?: string | null
          phone_verified_at?: string | null
          previous_phone?: string | null
          privacy_notice_accepted_at?: string | null
          privacy_policy_version?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_country?: string | null
          shipping_place_id?: string | null
          shipping_postcode?: string | null
          shipping_state?: string | null
          shipping_suburb?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_attestation_version?: string | null
          age_attested_at?: string | null
          collection_notice_version?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verification_method?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          halaxy_patient_id?: string | null
          halaxy_patient_synced_at?: string | null
          id?: string
          minimal_onboarding_completed_at?: string | null
          phone?: string | null
          phone_change_requested_at?: string | null
          phone_change_verification_method?: string | null
          phone_change_verified_at?: string | null
          phone_verification_method?: string | null
          phone_verified_at?: string | null
          previous_phone?: string | null
          privacy_notice_accepted_at?: string | null
          privacy_policy_version?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_country?: string | null
          shipping_place_id?: string | null
          shipping_postcode?: string | null
          shipping_state?: string | null
          shipping_suburb?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopify_order_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          raw: Json | null
          shopify_line_item_id: number | null
          shopify_order_id: string
          shopify_variant_gid: string | null
          shopify_variant_id: number | null
          strength_mg: number | null
          title: string | null
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          raw?: Json | null
          shopify_line_item_id?: number | null
          shopify_order_id: string
          shopify_variant_gid?: string | null
          shopify_variant_id?: number | null
          strength_mg?: number | null
          title?: string | null
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          raw?: Json | null
          shopify_line_item_id?: number | null
          shopify_order_id?: string
          shopify_variant_gid?: string | null
          shopify_variant_id?: number | null
          strength_mg?: number | null
          title?: string | null
          variant_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_order_items_shopify_order_id_fkey"
            columns: ["shopify_order_id"]
            isOneToOne: false
            referencedRelation: "shopify_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          created_at: string
          currency: string | null
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          order_name: string | null
          prescription_id: string | null
          processed_at: string | null
          raw: Json | null
          shopify_order_gid: string | null
          shopify_order_id: number
          subtotal_price: number | null
          total_price: number | null
          total_tax: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          order_name?: string | null
          prescription_id?: string | null
          processed_at?: string | null
          raw?: Json | null
          shopify_order_gid?: string | null
          shopify_order_id: number
          subtotal_price?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          order_name?: string | null
          prescription_id?: string | null
          processed_at?: string | null
          raw?: Json | null
          shopify_order_gid?: string | null
          shopify_order_id?: number
          subtotal_price?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_catalog_items: {
        Row: {
          created_at: string
          external_product_id: string | null
          external_variant_id: string | null
          id: string
          last_seen_at: string | null
          raw: Json
          raw_description: string | null
          raw_image_url: string | null
          raw_name: string | null
          raw_price: number | null
          raw_stock: string | null
          raw_strength: string | null
          source_url: string | null
          supplier_id: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_product_id?: string | null
          external_variant_id?: string | null
          id?: string
          last_seen_at?: string | null
          raw?: Json
          raw_description?: string | null
          raw_image_url?: string | null
          raw_name?: string | null
          raw_price?: number | null
          raw_stock?: string | null
          raw_strength?: string | null
          source_url?: string | null
          supplier_id: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_product_id?: string | null
          external_variant_id?: string | null
          id?: string
          last_seen_at?: string | null
          raw?: Json
          raw_description?: string | null
          raw_image_url?: string | null
          raw_name?: string | null
          raw_price?: number | null
          raw_stock?: string | null
          raw_strength?: string | null
          source_url?: string | null
          supplier_id?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_catalog_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      twilio_call_logs: {
        Row: {
          answered: boolean | null
          answered_at: string | null
          consultation_id: string
          created_at: string
          direction: string
          doctor_id: string | null
          doctor_user_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          from_number: string | null
          id: string
          parent_call_sid: string | null
          patient_id: string
          raw_events: Json
          started_at: string | null
          status: string
          to_number: string | null
          twilio_call_sid: string | null
          updated_at: string
        }
        Insert: {
          answered?: boolean | null
          answered_at?: string | null
          consultation_id: string
          created_at?: string
          direction?: string
          doctor_id?: string | null
          doctor_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          parent_call_sid?: string | null
          patient_id: string
          raw_events?: Json
          started_at?: string | null
          status?: string
          to_number?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
        }
        Update: {
          answered?: boolean | null
          answered_at?: string | null
          consultation_id?: string
          created_at?: string
          direction?: string
          doctor_id?: string | null
          doctor_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          parent_call_sid?: string | null
          patient_id?: string
          raw_events?: Json
          started_at?: string | null
          status?: string
          to_number?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twilio_call_logs_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_call_logs_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      confirm_paid_consultation: {
        Args: { _consultation_id: string }
        Returns: {
          booking_metadata: Json
          booking_provider: string
          booking_return_token: string | null
          booking_status: string
          completed_at: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string | null
          doctor_user_id: string | null
          end_time: string | null
          halaxy_appointment_id: string | null
          halaxy_appointment_status: string | null
          halaxy_booking_url: string | null
          halaxy_charge_item_definition_id: string | null
          halaxy_document_reference_id: string | null
          halaxy_healthcare_service_id: string | null
          halaxy_invoice_id: string | null
          halaxy_last_webhook_at: string | null
          halaxy_location_id: string | null
          halaxy_location_name: string | null
          halaxy_manage_url: string | null
          halaxy_patient_id: string | null
          halaxy_payment_status: string | null
          halaxy_payment_transaction_id: string | null
          halaxy_practitioner_id: string | null
          halaxy_practitioner_name: string | null
          halaxy_practitioner_role_id: string | null
          id: string
          notes: string | null
          outcome: string | null
          outcome_reason: string | null
          patient_id: string
          reason_for_visit: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          timezone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "consultations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_fair_consultation_reservation: {
        Args: { _consultation_id: string; _expires_at?: string }
        Returns: {
          doctor_id: string
          expires_at: string
          reservation_id: string
          scheduled_at: string
        }[]
      }
      expire_stale_consultation_reservations: { Args: never; Returns: number }
      get_doctor_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_active_prescription: {
        Args: { _patient_id: string }
        Returns: boolean
      }
      has_active_shop_entitlement: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_approved_doctor: { Args: { _user_id: string }; Returns: boolean }
      is_booking_doctor: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      is_doctor_assigned_to_patient: {
        Args: { _doctor_id: string; _patient_id: string }
        Returns: boolean
      }
      link_eligibility_quiz_session: {
        Args: { _quiz_session_id: string }
        Returns: boolean
      }
      select_fair_consultation_doctor: {
        Args: { _scheduled_at: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
      consultation_status:
        | "requested"
        | "confirmed"
        | "intake_pending"
        | "ready_for_call"
        | "called"
        | "script_uploaded"
        | "completed"
        | "cancelled"
        | "no_answer"
      consultation_type: "video" | "phone"
      issued_prescription_status: "active" | "expired" | "revoked"
      nicotine_strength: "3mg" | "6mg" | "9mg" | "12mg"
      prescription_status:
        | "pending_review"
        | "active"
        | "expired"
        | "cancelled"
        | "rejected"
      prescription_type: "uploaded" | "issued"
      usage_tier: "light" | "moderate" | "heavy"
      user_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "doctor", "patient"],
      consultation_status: [
        "requested",
        "confirmed",
        "intake_pending",
        "ready_for_call",
        "called",
        "script_uploaded",
        "completed",
        "cancelled",
        "no_answer",
      ],
      consultation_type: ["video", "phone"],
      issued_prescription_status: ["active", "expired", "revoked"],
      nicotine_strength: ["3mg", "6mg", "9mg", "12mg"],
      prescription_status: [
        "pending_review",
        "active",
        "expired",
        "cancelled",
        "rejected",
      ],
      prescription_type: ["uploaded", "issued"],
      usage_tier: ["light", "moderate", "heavy"],
      user_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
