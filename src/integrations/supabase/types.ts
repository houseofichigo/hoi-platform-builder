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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assess_gate_decisions: {
        Row: {
          constraints: Json
          created_at: string
          criteria_responses: Json
          decision: string
          gate_number: number
          id: string
          justification: string
          module_id: string
          rationales: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          constraints?: Json
          created_at?: string
          criteria_responses: Json
          decision: string
          gate_number: number
          id?: string
          justification: string
          module_id: string
          rationales?: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          constraints?: Json
          created_at?: string
          criteria_responses?: Json
          decision?: string
          gate_number?: number
          id?: string
          justification?: string
          module_id?: string
          rationales?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assess_gate_decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_outputs: {
        Row: {
          id: string
          output_key: string
          seeded: boolean
          touched: boolean
          updated_at: string
          user_id: string
          value: Json
          workspace_id: string
        }
        Insert: {
          id?: string
          output_key: string
          seeded?: boolean
          touched?: boolean
          updated_at?: string
          user_id: string
          value: Json
          workspace_id: string
        }
        Update: {
          id?: string
          output_key?: string
          seeded?: boolean
          touched?: boolean
          updated_at?: string
          user_id?: string
          value?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assess_outputs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_progress: {
        Row: {
          completed_at: string | null
          current_step: number | null
          id: string
          max_step_reached: number
          module_id: string
          started_at: string | null
          status: string
          studied: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          id?: string
          max_step_reached?: number
          module_id: string
          started_at?: string | null
          status?: string
          studied?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          id?: string
          max_step_reached?: number
          module_id?: string
          started_at?: string | null
          status?: string
          studied?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assess_progress_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_score_snapshots: {
        Row: {
          computed_at: string
          computed_by: string | null
          computed_outputs: Json
          confidence: number
          id: string
          input_hash: string
          raw_inputs: Json
          reason_codes: string[]
          score_type: string
          scoring_model_version: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          computed_at?: string
          computed_by?: string | null
          computed_outputs?: Json
          confidence?: number
          id?: string
          input_hash: string
          raw_inputs?: Json
          reason_codes?: string[]
          score_type?: string
          scoring_model_version: string
          user_id: string
          workspace_id: string
        }
        Update: {
          computed_at?: string
          computed_by?: string | null
          computed_outputs?: Json
          confidence?: number
          id?: string
          input_hash?: string
          raw_inputs?: Json
          reason_codes?: string[]
          score_type?: string
          scoring_model_version?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_score_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          stripe_event_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          stripe_event_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          stripe_event_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_flags: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          evidence_requirements: Json
          id: string
          recomputed_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_reason: string | null
          reviewer_role: string | null
          roadmap_entry_id: string | null
          rule_code: string
          rule_source: string
          severity: string
          source_snapshot: Json
          status: string
          updated_at: string
          use_case_id: string
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_requirements?: Json
          id?: string
          recomputed_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_reason?: string | null
          reviewer_role?: string | null
          roadmap_entry_id?: string | null
          rule_code: string
          rule_source: string
          severity: string
          source_snapshot?: Json
          status?: string
          updated_at?: string
          use_case_id: string
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_requirements?: Json
          id?: string
          recomputed_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_reason?: string | null
          reviewer_role?: string | null
          roadmap_entry_id?: string | null
          rule_code?: string
          rule_source?: string
          severity?: string
          source_snapshot?: Json
          status?: string
          updated_at?: string
          use_case_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_flags_roadmap_entry_id_fkey"
            columns: ["roadmap_entry_id"]
            isOneToOne: false
            referencedRelation: "roadmap_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_flags_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_flags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hoi_admin_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      hoi_admin_notes: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          note: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hoi_admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_item_versions: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          library_item_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          library_item_id: string
          snapshot: Json
          version: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          library_item_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "library_item_versions_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          archived_at: string | null
          content_owner_id: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          editorial_status: string
          id: string
          internal_notes: string | null
          last_reviewed_at: string | null
          metadata: Json
          module_ids: string[]
          phase_ids: string[]
          published: boolean
          published_at: string | null
          reviewer_id: string | null
          summary: string | null
          tags: string[]
          title: string
          type: string
          updated_at: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          content_owner_id?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          editorial_status?: string
          id?: string
          internal_notes?: string | null
          last_reviewed_at?: string | null
          metadata?: Json
          module_ids?: string[]
          phase_ids?: string[]
          published?: boolean
          published_at?: string | null
          reviewer_id?: string | null
          summary?: string | null
          tags?: string[]
          title: string
          type: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          content_owner_id?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          editorial_status?: string
          id?: string
          internal_notes?: string | null
          last_reviewed_at?: string | null
          metadata?: Json
          module_ids?: string[]
          phase_ids?: string[]
          published?: boolean
          published_at?: string | null
          reviewer_id?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          recipient_user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          recipient_user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          recipient_user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          monthly_price_cents: number | null
          name: string
          seat_limit: number | null
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id: string
          metadata?: Json
          monthly_price_cents?: number | null
          name: string
          seat_limit?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          monthly_price_cents?: number | null
          name?: string
          seat_limit?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_pilot_reviews: {
        Row: {
          accuracy_score: number | null
          error_rate_percent: number | null
          evidence_notes: string | null
          id: string
          recommendation: string | null
          reviewer_load: string | null
          roadmap_entry_id: string | null
          submitted_at: string
          submitted_by: string | null
          time_saved_hours_per_week: number | null
          use_case_id: string
          user_satisfaction: string | null
          workspace_id: string
        }
        Insert: {
          accuracy_score?: number | null
          error_rate_percent?: number | null
          evidence_notes?: string | null
          id?: string
          recommendation?: string | null
          reviewer_load?: string | null
          roadmap_entry_id?: string | null
          submitted_at?: string
          submitted_by?: string | null
          time_saved_hours_per_week?: number | null
          use_case_id: string
          user_satisfaction?: string | null
          workspace_id: string
        }
        Update: {
          accuracy_score?: number | null
          error_rate_percent?: number | null
          evidence_notes?: string | null
          id?: string
          recommendation?: string | null
          reviewer_load?: string | null
          roadmap_entry_id?: string | null
          submitted_at?: string
          submitted_by?: string | null
          time_saved_hours_per_week?: number | null
          use_case_id?: string
          user_satisfaction?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_pilot_reviews_roadmap_entry_id_fkey"
            columns: ["roadmap_entry_id"]
            isOneToOne: false
            referencedRelation: "roadmap_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_pilot_reviews_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_pilot_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_workspace_id: string | null
          department: string | null
          full_name: string | null
          job_role: string | null
          library_visited_at: string | null
          role: string | null
          tour_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_workspace_id?: string | null
          department?: string | null
          full_name?: string | null
          job_role?: string | null
          library_visited_at?: string | null
          role?: string | null
          tour_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_workspace_id?: string | null
          department?: string | null
          full_name?: string | null
          job_role?: string | null
          library_visited_at?: string | null
          role?: string | null
          tour_completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_workspace_id_fkey"
            columns: ["default_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_entries: {
        Row: {
          created_at: string
          created_by: string | null
          evidence_summary: Json
          gate_status: Json
          id: string
          owner_id: string | null
          priority_score: number | null
          source_metadata: Json
          stage: string
          target_quarter: string | null
          updated_at: string
          use_case_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evidence_summary?: Json
          gate_status?: Json
          id?: string
          owner_id?: string | null
          priority_score?: number | null
          source_metadata?: Json
          stage?: string
          target_quarter?: string | null
          updated_at?: string
          use_case_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evidence_summary?: Json
          gate_status?: Json
          id?: string
          owner_id?: string | null
          priority_score?: number | null
          source_metadata?: Json
          stage?: string
          target_quarter?: string | null
          updated_at?: string
          use_case_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_entries_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: true
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: string | null
          id: string
          reason: string | null
          roadmap_entry_id: string
          to_stage: string
          use_case_id: string
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          reason?: string | null
          roadmap_entry_id: string
          to_stage: string
          use_case_id: string
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          reason?: string | null
          roadmap_entry_id?: string
          to_stage?: string
          use_case_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_stage_history_roadmap_entry_id_fkey"
            columns: ["roadmap_entry_id"]
            isOneToOne: false
            referencedRelation: "roadmap_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_stage_history_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_stage_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_approvals: {
        Row: {
          comment: string | null
          created_at: string
          decision: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          use_case_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decision?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          use_case_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decision?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_case_approvals_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: true
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_captures: {
        Row: {
          block_number: number
          block_title: string | null
          completed_at: string | null
          created_at: string
          id: string
          responses: Json
          updated_at: string
          use_case_id: string
        }
        Insert: {
          block_number: number
          block_title?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          use_case_id: string
        }
        Update: {
          block_number?: number
          block_title?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_case_captures_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_score_snapshots: {
        Row: {
          computed_at: string
          computed_by: string | null
          computed_outputs: Json
          confidence: number
          id: string
          input_hash: string
          raw_inputs: Json
          reason_codes: string[]
          score_type: string
          scoring_model_version: string
          use_case_id: string
          workspace_id: string
        }
        Insert: {
          computed_at?: string
          computed_by?: string | null
          computed_outputs?: Json
          confidence?: number
          id?: string
          input_hash: string
          raw_inputs?: Json
          reason_codes?: string[]
          score_type?: string
          scoring_model_version: string
          use_case_id: string
          workspace_id: string
        }
        Update: {
          computed_at?: string
          computed_by?: string | null
          computed_outputs?: Json
          confidence?: number
          id?: string
          input_hash?: string
          raw_inputs?: Json
          reason_codes?: string[]
          score_type?: string
          scoring_model_version?: string
          use_case_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_case_score_snapshots_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_case_score_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_scores: {
        Row: {
          agent_suitability: number | null
          ai_suitability: number | null
          business_impact: number | null
          classification: string | null
          complexity_score: number | null
          complexity_tag: string | null
          created_at: string
          delivery_readiness: number | null
          feasibility: number | null
          gate_statuses: Json
          id: string
          pillar_scores: Json
          priority: number | null
          process_maturity: number | null
          quadrant: string | null
          reason_codes: string[]
          risk: number | null
          scored_at: string | null
          scored_by: string | null
          scoring_version: string
          step_automation_map: Json
          updated_at: string
          use_case_id: string
        }
        Insert: {
          agent_suitability?: number | null
          ai_suitability?: number | null
          business_impact?: number | null
          classification?: string | null
          complexity_score?: number | null
          complexity_tag?: string | null
          created_at?: string
          delivery_readiness?: number | null
          feasibility?: number | null
          gate_statuses?: Json
          id?: string
          pillar_scores?: Json
          priority?: number | null
          process_maturity?: number | null
          quadrant?: string | null
          reason_codes?: string[]
          risk?: number | null
          scored_at?: string | null
          scored_by?: string | null
          scoring_version?: string
          step_automation_map?: Json
          updated_at?: string
          use_case_id: string
        }
        Update: {
          agent_suitability?: number | null
          ai_suitability?: number | null
          business_impact?: number | null
          classification?: string | null
          complexity_score?: number | null
          complexity_tag?: string | null
          created_at?: string
          delivery_readiness?: number | null
          feasibility?: number | null
          gate_statuses?: Json
          id?: string
          pillar_scores?: Json
          priority?: number | null
          process_maturity?: number | null
          quadrant?: string | null
          reason_codes?: string[]
          risk?: number | null
          scored_at?: string | null
          scored_by?: string | null
          scoring_version?: string
          step_automation_map?: Json
          updated_at?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_case_scores_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: true
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          capture_v2: Json | null
          capture_version: string
          created_at: string
          created_by: string | null
          derived_scores: Json | null
          description: string | null
          function: string | null
          id: string
          lifecycle_history: Json
          lifecycle_state: string
          name: string
          post_commit_edits: number
          status: string
          updated_at: string
          use_case_family: string | null
          workspace_id: string
        }
        Insert: {
          capture_v2?: Json | null
          capture_version?: string
          created_at?: string
          created_by?: string | null
          derived_scores?: Json | null
          description?: string | null
          function?: string | null
          id?: string
          lifecycle_history?: Json
          lifecycle_state?: string
          name: string
          post_commit_edits?: number
          status?: string
          updated_at?: string
          use_case_family?: string | null
          workspace_id: string
        }
        Update: {
          capture_v2?: Json | null
          capture_version?: string
          created_at?: string
          created_by?: string | null
          derived_scores?: Json | null
          description?: string | null
          function?: string | null
          id?: string
          lifecycle_history?: Json
          lifecycle_state?: string
          name?: string
          post_commit_edits?: number
          status?: string
          updated_at?: string
          use_case_family?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          price_id: string | null
          seat_limit: number | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id: string
          price_id?: string | null
          seat_limit?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          price_id?: string | null
          seat_limit?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          onboarding_dismissed_at: string | null
          plan: string
          slug: string
          updated_at: string
          use_case_profile: Json | null
          worked_example: string | null
          workspace_profile: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          onboarding_dismissed_at?: string | null
          plan?: string
          slug: string
          updated_at?: string
          use_case_profile?: Json | null
          worked_example?: string | null
          workspace_profile?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          onboarding_dismissed_at?: string | null
          plan?: string
          slug?: string
          updated_at?: string
          use_case_profile?: Json | null
          worked_example?: string | null
          workspace_profile?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "workspace_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_access_use_case: {
        Args: { _use_case_id: string; _user_id: string }
        Returns: boolean
      }
      can_modify_use_case: {
        Args: { _use_case_id: string; _user_id: string }
        Returns: boolean
      }
      create_workspace: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          created_at: string
          id: string
          name: string
          onboarding_dismissed_at: string | null
          plan: string
          slug: string
          updated_at: string
          use_case_profile: Json | null
          worked_example: string | null
          workspace_profile: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_audit_log_with_diffs: {
        Args: { p_limit?: number; p_workspace_id: string }
        Returns: {
          action_type: string
          actor_id: string
          after_state: Json
          before_state: Json
          created_at: string
          entity_id: string
          entity_label: string
          entity_type: string
          id: string
          metadata: Json
          workspace_id: string
        }[]
      }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          inviter_email: string
          role: string
          status: string
          workspace_id: string
          workspace_name: string
          workspace_slug: string
        }[]
      }
      has_workspace_role: {
        Args: { _roles: string[]; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_hoi_admin: {
        Args: { _roles?: string[]; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_use_case_admin: {
        Args: { _use_case_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
