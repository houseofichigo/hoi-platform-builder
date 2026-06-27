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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_score_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audience: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string | null
          scope: string | null
          segment: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id?: string | null
          scope?: string | null
          segment?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string | null
          scope?: string | null
          segment?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_workspace_id_fkey"
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          end_date: string | null
          id: string
          merge_duplicates_mode: string | null
          metadata: Json
          name: string
          organization_id: string | null
          participating_departments: Json
          participating_users: Json
          require_lead_review: boolean
          reviewers: Json
          start_date: string | null
          status: string
          summary: string | null
          updated_at: string
          workflows_per_employee: number | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          merge_duplicates_mode?: string | null
          metadata?: Json
          name: string
          organization_id?: string | null
          participating_departments?: Json
          participating_users?: Json
          require_lead_review?: boolean
          reviewers?: Json
          start_date?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          workflows_per_employee?: number | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          merge_duplicates_mode?: string | null
          metadata?: Json
          name?: string
          organization_id?: string | null
          participating_departments?: Json
          participating_users?: Json
          require_lead_review?: boolean
          reviewers?: Json
          start_date?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          workflows_per_employee?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          archived_at: string | null
          country: string | null
          created_at: string
          created_by: string | null
          data_residency: string | null
          engagement_type: string | null
          id: string
          internal_audience: Json
          kind: string | null
          metadata: Json
          name: string
          notes: string | null
          organization_id: string | null
          reusable_ip: boolean
          sector: string | null
          segment: string | null
          status: string | null
          tier: string | null
          under_nda: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_residency?: string | null
          engagement_type?: string | null
          id?: string
          internal_audience?: Json
          kind?: string | null
          metadata?: Json
          name: string
          notes?: string | null
          organization_id?: string | null
          reusable_ip?: boolean
          sector?: string | null
          segment?: string | null
          status?: string | null
          tier?: string | null
          under_nda?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_residency?: string | null
          engagement_type?: string | null
          id?: string
          internal_audience?: Json
          kind?: string | null
          metadata?: Json
          name?: string
          notes?: string | null
          organization_id?: string | null
          reusable_ip?: boolean
          sector?: string | null
          segment?: string | null
          status?: string | null
          tier?: string | null
          under_nda?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile: {
        Row: {
          archived_at: string | null
          brand: Json
          business_model: string | null
          created_at: string
          customer_type: string | null
          data_residency: Json
          fiscal_year_end: string | null
          growth_stage: string | null
          hq_city: string | null
          hq_country: string | null
          id: string
          industry: string | null
          is_regulated: boolean
          languages: Json
          legal_name: string | null
          locations: Json
          metadata: Json
          mission: string | null
          onboarding_completed_at: string | null
          onboarding_phase: string
          onboarding_step: number
          organization_id: string | null
          overview: string | null
          primary_jurisdiction: string | null
          primary_language: string | null
          regulatory_regimes: Json
          revenue_range: string | null
          sells_training: boolean
          size: string | null
          size_band: string | null
          sub_industry: string | null
          updated_at: string
          value_proposition: string | null
          values: Json
          vision: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand?: Json
          business_model?: string | null
          created_at?: string
          customer_type?: string | null
          data_residency?: Json
          fiscal_year_end?: string | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industry?: string | null
          is_regulated?: boolean
          languages?: Json
          legal_name?: string | null
          locations?: Json
          metadata?: Json
          mission?: string | null
          onboarding_completed_at?: string | null
          onboarding_phase?: string
          onboarding_step?: number
          organization_id?: string | null
          overview?: string | null
          primary_jurisdiction?: string | null
          primary_language?: string | null
          regulatory_regimes?: Json
          revenue_range?: string | null
          sells_training?: boolean
          size?: string | null
          size_band?: string | null
          sub_industry?: string | null
          updated_at?: string
          value_proposition?: string | null
          values?: Json
          vision?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand?: Json
          business_model?: string | null
          created_at?: string
          customer_type?: string | null
          data_residency?: Json
          fiscal_year_end?: string | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industry?: string | null
          is_regulated?: boolean
          languages?: Json
          legal_name?: string | null
          locations?: Json
          metadata?: Json
          mission?: string | null
          onboarding_completed_at?: string | null
          onboarding_phase?: string
          onboarding_step?: number
          organization_id?: string | null
          overview?: string | null
          primary_jurisdiction?: string | null
          primary_language?: string | null
          regulatory_regimes?: Json
          revenue_range?: string | null
          sells_training?: boolean
          size?: string | null
          size_band?: string | null
          sub_industry?: string | null
          updated_at?: string
          value_proposition?: string | null
          values?: Json
          vision?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_score: {
        Row: {
          ai_score: number | null
          automation_score: number | null
          computed_at: string
          confidence: string | null
          data_score: number | null
          data_total: number | null
          details: Json
          ebitda_total: number | null
          effort_total: number | null
          error_total: number | null
          maturity_score: number | null
          n_processes: number
          organization_id: string | null
          overall_score: number | null
          pct_approved: number | null
          stage: string | null
          workspace_id: string
        }
        Insert: {
          ai_score?: number | null
          automation_score?: number | null
          computed_at?: string
          confidence?: string | null
          data_score?: number | null
          data_total?: number | null
          details?: Json
          ebitda_total?: number | null
          effort_total?: number | null
          error_total?: number | null
          maturity_score?: number | null
          n_processes?: number
          organization_id?: string | null
          overall_score?: number | null
          pct_approved?: number | null
          stage?: string | null
          workspace_id: string
        }
        Update: {
          ai_score?: number | null
          automation_score?: number | null
          computed_at?: string
          confidence?: string | null
          data_score?: number | null
          data_total?: number | null
          details?: Json
          ebitda_total?: number | null
          effort_total?: number | null
          error_total?: number | null
          maturity_score?: number | null
          n_processes?: number
          organization_id?: string | null
          overall_score?: number | null
          pct_approved?: number | null
          stage?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_score_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_score_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source: {
        Row: {
          accessibility: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          data_type: string | null
          department_owner_id: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string | null
          owner: string | null
          reliability: string | null
          sensitivity_level: string | null
          source_type: string | null
          status: string | null
          system: string | null
          tool_id: string | null
          update_frequency: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accessibility?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string | null
          department_owner_id?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id?: string | null
          owner?: string | null
          reliability?: string | null
          sensitivity_level?: string | null
          source_type?: string | null
          status?: string | null
          system?: string | null
          tool_id?: string | null
          update_frequency?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accessibility?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string | null
          department_owner_id?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string | null
          owner?: string | null
          reliability?: string | null
          sensitivity_level?: string | null
          source_type?: string | null
          status?: string | null
          system?: string | null
          tool_id?: string | null
          update_frequency?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_source_department_owner_id_fkey"
            columns: ["department_owner_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      department: {
        Row: {
          archived_at: string | null
          audience_id: string | null
          color: string | null
          core_tools: Json
          created_at: string
          description: string | null
          distinct_audience: boolean
          goals: Json
          head_count: number | null
          headcount: number | null
          holds_sensitive_data: boolean
          id: string
          knowledge_owner_user_id: string | null
          lead_member_id: string | null
          lead_membership_id: string | null
          lead_user_id: string | null
          name: string
          organization_id: string | null
          pain_points: Json
          parent_id: string | null
          products_supported: Json
          responsibilities: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          audience_id?: string | null
          color?: string | null
          core_tools?: Json
          created_at?: string
          description?: string | null
          distinct_audience?: boolean
          goals?: Json
          head_count?: number | null
          headcount?: number | null
          holds_sensitive_data?: boolean
          id?: string
          knowledge_owner_user_id?: string | null
          lead_member_id?: string | null
          lead_membership_id?: string | null
          lead_user_id?: string | null
          name: string
          organization_id?: string | null
          pain_points?: Json
          parent_id?: string | null
          products_supported?: Json
          responsibilities?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          audience_id?: string | null
          color?: string | null
          core_tools?: Json
          created_at?: string
          description?: string | null
          distinct_audience?: boolean
          goals?: Json
          head_count?: number | null
          headcount?: number | null
          holds_sensitive_data?: boolean
          id?: string
          knowledge_owner_user_id?: string | null
          lead_member_id?: string | null
          lead_membership_id?: string | null
          lead_user_id?: string | null
          name?: string
          organization_id?: string | null
          pain_points?: Json
          parent_id?: string | null
          products_supported?: Json
          responsibilities?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_lead_member_id_fkey"
            columns: ["lead_member_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_lead_member_id_fkey"
            columns: ["lead_member_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      department_score: {
        Row: {
          ai_score: number | null
          automation_score: number | null
          computed_at: string
          confidence: string | null
          data_score: number | null
          data_total: number | null
          department_id: string
          details: Json
          ebitda_total: number | null
          effort_total: number | null
          error_total: number | null
          id: string
          maturity_score: number | null
          n_processes: number
          organization_id: string | null
          overall_score: number | null
          pct_approved: number | null
          workspace_id: string
        }
        Insert: {
          ai_score?: number | null
          automation_score?: number | null
          computed_at?: string
          confidence?: string | null
          data_score?: number | null
          data_total?: number | null
          department_id: string
          details?: Json
          ebitda_total?: number | null
          effort_total?: number | null
          error_total?: number | null
          id?: string
          maturity_score?: number | null
          n_processes?: number
          organization_id?: string | null
          overall_score?: number | null
          pct_approved?: number | null
          workspace_id: string
        }
        Update: {
          ai_score?: number | null
          automation_score?: number | null
          computed_at?: string
          confidence?: string | null
          data_score?: number | null
          data_total?: number | null
          department_id?: string
          details?: Json
          ebitda_total?: number | null
          effort_total?: number | null
          error_total?: number | null
          id?: string
          maturity_score?: number | null
          n_processes?: number
          organization_id?: string | null
          overall_score?: number | null
          pct_approved?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_score_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_score_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_score_workspace_id_fkey"
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
            referencedRelation: "organization"
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
      governance_threshold: {
        Row: {
          auto_approve_score: number | null
          created_at: string
          ebitda_floor: number | null
          effort_floor: number | null
          notes: string | null
          required_reviewers: number
          risk_tier_gates: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_approve_score?: number | null
          created_at?: string
          ebitda_floor?: number | null
          effort_floor?: number | null
          notes?: string | null
          required_reviewers?: number
          risk_tier_gates?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_approve_score?: number | null
          created_at?: string
          ebitda_floor?: number | null
          effort_floor?: number | null
          notes?: string | null
          required_reviewers?: number
          risk_tier_gates?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_threshold_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_threshold_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
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
      knowledge_source: {
        Row: {
          archived_at: string | null
          connector_status: string | null
          created_at: string
          created_by: string | null
          data_residency: string | null
          id: string
          ingestion_status: string | null
          location_uri: string | null
          metadata: Json
          name: string
          organization_id: string | null
          owner: string | null
          owner_client_id: string | null
          owner_department_id: string | null
          sensitivity_level: string | null
          source_type: string | null
          status: string | null
          updated_at: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          connector_status?: string | null
          created_at?: string
          created_by?: string | null
          data_residency?: string | null
          id?: string
          ingestion_status?: string | null
          location_uri?: string | null
          metadata?: Json
          name: string
          organization_id?: string | null
          owner?: string | null
          owner_client_id?: string | null
          owner_department_id?: string | null
          sensitivity_level?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string
          url?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          connector_status?: string | null
          created_at?: string
          created_by?: string | null
          data_residency?: string | null
          id?: string
          ingestion_status?: string | null
          location_uri?: string | null
          metadata?: Json
          name?: string
          organization_id?: string | null
          owner?: string | null
          owner_client_id?: string | null
          owner_department_id?: string | null
          sensitivity_level?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_source_owner_client_id_fkey"
            columns: ["owner_client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_source_owner_department_id_fkey"
            columns: ["owner_department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_source_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_source_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      member_profile: {
        Row: {
          ai_literacy: string | null
          archived_at: string | null
          bio: string | null
          collaborators: Json
          completed_at: string | null
          created_at: string
          daily_tool_ids: Json
          decisions_made: Json
          display_name: string | null
          expertise: string[]
          is_demo: boolean
          job_title: string | null
          languages: string[]
          membership_id: string | null
          metadata: Json
          organization_id: string | null
          preferences: Json
          responsibilities: Json
          role_context: Json
          timezone: string | null
          updated_at: string
          user_id: string | null
          workspace_id: string
          workspace_member_id: string
        }
        Insert: {
          ai_literacy?: string | null
          archived_at?: string | null
          bio?: string | null
          collaborators?: Json
          completed_at?: string | null
          created_at?: string
          daily_tool_ids?: Json
          decisions_made?: Json
          display_name?: string | null
          expertise?: string[]
          is_demo?: boolean
          job_title?: string | null
          languages?: string[]
          membership_id?: string | null
          metadata?: Json
          organization_id?: string | null
          preferences?: Json
          responsibilities?: Json
          role_context?: Json
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id: string
          workspace_member_id: string
        }
        Update: {
          ai_literacy?: string | null
          archived_at?: string | null
          bio?: string | null
          collaborators?: Json
          completed_at?: string | null
          created_at?: string
          daily_tool_ids?: Json
          decisions_made?: Json
          display_name?: string | null
          expertise?: string[]
          is_demo?: boolean
          job_title?: string | null
          languages?: string[]
          membership_id?: string | null
          metadata?: Json
          organization_id?: string | null
          preferences?: Json
          responsibilities?: Json
          role_context?: Json
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
          workspace_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_profile_workspace_member_id_fkey"
            columns: ["workspace_member_id"]
            isOneToOne: true
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_profile_workspace_member_id_fkey"
            columns: ["workspace_member_id"]
            isOneToOne: true
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          data_value: number | null
          department_id: string | null
          ebitda_impact: number | null
          effort: string | null
          effort_savings: number | null
          error_reduction: number | null
          id: string
          metadata: Json
          name: string
          organization_id: string | null
          problem: string | null
          process_id: string | null
          recommended_solution: string | null
          roi: Json | null
          status: string
          step_node_id: string | null
          strategic_alignment: number | null
          summary: string | null
          type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_value?: number | null
          department_id?: string | null
          ebitda_impact?: number | null
          effort?: string | null
          effort_savings?: number | null
          error_reduction?: number | null
          id?: string
          metadata?: Json
          name: string
          organization_id?: string | null
          problem?: string | null
          process_id?: string | null
          recommended_solution?: string | null
          roi?: Json | null
          status?: string
          step_node_id?: string | null
          strategic_alignment?: number | null
          summary?: string | null
          type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_value?: number | null
          department_id?: string | null
          ebitda_impact?: number | null
          effort?: string | null
          effort_savings?: number | null
          error_reduction?: number | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string | null
          problem?: string | null
          process_id?: string | null
          recommended_solution?: string | null
          roi?: Json | null
          status?: string
          step_node_id?: string | null
          strategic_alignment?: number | null
          summary?: string | null
          type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_workspace_id_fkey"
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
            referencedRelation: "organization"
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
      process: {
        Row: {
          approved_at: string | null
          archived_at: string | null
          capture: Json
          capture_json: Json
          created_at: string
          created_by: string
          data_value: number | null
          department_id: string | null
          description: string | null
          diagram_json: Json
          ebitda_impact: number | null
          effort_savings: number | null
          error_reduction: number | null
          id: string
          maturity_stage: string | null
          name: string
          organization_id: string | null
          owner_member_id: string | null
          risk_tier: string | null
          score_json: Json
          scores: Json
          status: Database["public"]["Enums"]["process_status"]
          submitted_at: string | null
          template_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          archived_at?: string | null
          capture?: Json
          capture_json?: Json
          created_at?: string
          created_by: string
          data_value?: number | null
          department_id?: string | null
          description?: string | null
          diagram_json?: Json
          ebitda_impact?: number | null
          effort_savings?: number | null
          error_reduction?: number | null
          id?: string
          maturity_stage?: string | null
          name: string
          organization_id?: string | null
          owner_member_id?: string | null
          risk_tier?: string | null
          score_json?: Json
          scores?: Json
          status?: Database["public"]["Enums"]["process_status"]
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          archived_at?: string | null
          capture?: Json
          capture_json?: Json
          created_at?: string
          created_by?: string
          data_value?: number | null
          department_id?: string | null
          description?: string | null
          diagram_json?: Json
          ebitda_impact?: number | null
          effort_savings?: number | null
          error_reduction?: number | null
          id?: string
          maturity_stage?: string | null
          name?: string
          organization_id?: string | null
          owner_member_id?: string | null
          risk_tier?: string | null
          score_json?: Json
          scores?: Json
          status?: Database["public"]["Enums"]["process_status"]
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "process_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_export: {
        Row: {
          created_at: string
          export_type: string
          format: string
          generated_by: string | null
          id: string
          organization_id: string | null
          payload: Json
          process_id: string
          storage_path: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          export_type: string
          format?: string
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          process_id: string
          storage_path?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          export_type?: string
          format?: string
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          process_id?: string
          storage_path?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_export_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_export_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_export_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_status_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["process_status"] | null
          id: string
          note: string | null
          organization_id: string | null
          process_id: string
          to_status: Database["public"]["Enums"]["process_status"]
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["process_status"] | null
          id?: string
          note?: string | null
          organization_id?: string | null
          process_id: string
          to_status: Database["public"]["Enums"]["process_status"]
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["process_status"] | null
          id?: string
          note?: string | null
          organization_id?: string | null
          process_id?: string
          to_status?: Database["public"]["Enums"]["process_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_status_audit_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_status_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_status_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_step: {
        Row: {
          actor_member_id: string | null
          actor_type: string | null
          canvas_x: number | null
          canvas_y: number | null
          capture_json: Json
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          input_data: string | null
          metadata: Json
          node_type: string | null
          organization_id: string | null
          output_data: string | null
          process_id: string
          risk_notes: string | null
          step_order: number
          title: string
          tool_action_id: string | null
          tool_id: string | null
          tool_name: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_type?: string | null
          canvas_x?: number | null
          canvas_y?: number | null
          capture_json?: Json
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          input_data?: string | null
          metadata?: Json
          node_type?: string | null
          organization_id?: string | null
          output_data?: string | null
          process_id: string
          risk_notes?: string | null
          step_order?: number
          title: string
          tool_action_id?: string | null
          tool_id?: string | null
          tool_name?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_type?: string | null
          canvas_x?: number | null
          canvas_y?: number | null
          capture_json?: Json
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          input_data?: string | null
          metadata?: Json
          node_type?: string | null
          organization_id?: string | null
          output_data?: string | null
          process_id?: string
          risk_notes?: string | null
          step_order?: number
          title?: string
          tool_action_id?: string | null
          tool_id?: string | null
          tool_name?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_step_actor_member_id_fkey"
            columns: ["actor_member_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_actor_member_id_fkey"
            columns: ["actor_member_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_tool_action_id_fkey"
            columns: ["tool_action_id"]
            isOneToOne: false
            referencedRelation: "tool_action"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_step_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_template: {
        Row: {
          archived_at: string | null
          capture_json: Json
          category: string | null
          complexity: string | null
          created_at: string
          created_by: string | null
          department_hint: string | null
          description: string | null
          diagram_json: Json
          id: string
          is_active: boolean
          metadata: Json
          name: string
          organization_id: string | null
          recommended_tools: Json
          risk_tier: string | null
          slug: string | null
          tags: Json
          template_json: Json
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          capture_json?: Json
          category?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          department_hint?: string | null
          description?: string | null
          diagram_json?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          organization_id?: string | null
          recommended_tools?: Json
          risk_tier?: string | null
          slug?: string | null
          tags?: Json
          template_json?: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          capture_json?: Json
          category?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          department_hint?: string | null
          description?: string | null
          diagram_json?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          organization_id?: string | null
          recommended_tools?: Json
          risk_tier?: string | null
          slug?: string | null
          tags?: Json
          template_json?: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_template_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_template_alias: {
        Row: {
          alias: string
          created_at: string
          id: string
          template_id: string
          workspace_id: string | null
        }
        Insert: {
          alias: string
          created_at?: string
          id?: string
          template_id: string
          workspace_id?: string | null
        }
        Update: {
          alias?: string
          created_at?: string
          id?: string
          template_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_template_alias_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "process_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_alias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_alias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_service: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string | null
          delivery_complexity: number | null
          departments: Json
          description: string | null
          id: string
          lifecycle: string | null
          metadata: Json
          name: string
          organization_id: string | null
          revenue_contribution: number | null
          strategic_importance: number | null
          target_customer: string | null
          tools: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          delivery_complexity?: number | null
          departments?: Json
          description?: string | null
          id?: string
          lifecycle?: string | null
          metadata?: Json
          name: string
          organization_id?: string | null
          revenue_contribution?: number | null
          strategic_importance?: number | null
          target_customer?: string | null
          tools?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          delivery_complexity?: number | null
          departments?: Json
          description?: string | null
          id?: string
          lifecycle?: string | null
          metadata?: Json
          name?: string
          organization_id?: string | null
          revenue_contribution?: number | null
          strategic_importance?: number | null
          target_customer?: string | null
          tools?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_service_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_service_workspace_id_fkey"
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_workspace_id_fkey"
            columns: ["default_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_assessment: {
        Row: {
          canonical_knowledge_owner_user_id: string | null
          created_at: string
          culture_score: number | null
          culture_stage: string | null
          decision_authority: string | null
          delivery_posture: string | null
          governance_body: string | null
          has_ai_owner: boolean
          literacy_coverage: string | null
          organization_id: string | null
          organization_score: number | null
          organization_stage: string | null
          risk_register: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          canonical_knowledge_owner_user_id?: string | null
          created_at?: string
          culture_score?: number | null
          culture_stage?: string | null
          decision_authority?: string | null
          delivery_posture?: string | null
          governance_body?: string | null
          has_ai_owner?: boolean
          literacy_coverage?: string | null
          organization_id?: string | null
          organization_score?: number | null
          organization_stage?: string | null
          risk_register?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          canonical_knowledge_owner_user_id?: string | null
          created_at?: string
          culture_score?: number | null
          culture_stage?: string | null
          decision_authority?: string | null
          delivery_posture?: string | null
          governance_body?: string | null
          has_ai_owner?: boolean
          literacy_coverage?: string | null
          organization_id?: string | null
          organization_score?: number | null
          organization_stage?: string | null
          risk_register?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_assessment_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readiness_assessment_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            referencedRelation: "organization"
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
      roadmap_item: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          dependencies: Json
          effort: number | null
          id: string
          impact: number | null
          name: string
          opportunity_id: string | null
          organization_id: string | null
          owner_user_id: string | null
          priority: string | null
          status: string
          timeline: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          dependencies?: Json
          effort?: number | null
          id?: string
          impact?: number | null
          name: string
          opportunity_id?: string | null
          organization_id?: string | null
          owner_user_id?: string | null
          priority?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          dependencies?: Json
          effort?: number | null
          id?: string
          impact?: number | null
          name?: string
          opportunity_id?: string | null
          organization_id?: string | null
          owner_user_id?: string | null
          priority?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_item_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_item_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_item_workspace_id_fkey"
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
            referencedRelation: "organization"
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
      strategic_priority: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          horizon: string | null
          id: string
          metadata: Json
          name: string
          operational_risks: Json
          organization_id: string | null
          position: number
          primary_reason: string | null
          priorities: Json
          priority_departments: Json
          status: string | null
          top_goals: Json
          updated_at: string
          weights: Json
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horizon?: string | null
          id?: string
          metadata?: Json
          name: string
          operational_risks?: Json
          organization_id?: string | null
          position?: number
          primary_reason?: string | null
          priorities?: Json
          priority_departments?: Json
          status?: string | null
          top_goals?: Json
          updated_at?: string
          weights?: Json
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          horizon?: string | null
          id?: string
          metadata?: Json
          name?: string
          operational_risks?: Json
          organization_id?: string | null
          position?: number
          primary_reason?: string | null
          priorities?: Json
          priority_departments?: Json
          status?: string | null
          top_goals?: Json
          updated_at?: string
          weights?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_priority_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_priority_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool: {
        Row: {
          api_available: boolean | null
          archived_at: string | null
          catalog_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          criticality: string | null
          data_stored: string | null
          departments: Json
          id: string
          integration_status: number | null
          main_use_case: string | null
          metadata: Json
          name: string
          notes: string | null
          organization_id: string | null
          owner_user_id: string | null
          pain_level: number | null
          slug: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          api_available?: boolean | null
          archived_at?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          data_stored?: string | null
          departments?: Json
          id?: string
          integration_status?: number | null
          main_use_case?: string | null
          metadata?: Json
          name: string
          notes?: string | null
          organization_id?: string | null
          owner_user_id?: string | null
          pain_level?: number | null
          slug?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          api_available?: boolean | null
          archived_at?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          data_stored?: string | null
          departments?: Json
          id?: string
          integration_status?: number | null
          main_use_case?: string | null
          metadata?: Json
          name?: string
          notes?: string | null
          organization_id?: string | null
          owner_user_id?: string | null
          pain_level?: number | null
          slug?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "tool_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_action: {
        Row: {
          archived_at: string | null
          business_action: string
          business_object: string
          capability_type: string
          catalog_action_id: string | null
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          organization_id: string | null
          tool_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          business_action: string
          business_object: string
          capability_type: string
          catalog_action_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string | null
          tool_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          business_action?: string
          business_object?: string
          capability_type?: string
          catalog_action_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string | null
          tool_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_action_catalog_action_id_fkey"
            columns: ["catalog_action_id"]
            isOneToOne: false
            referencedRelation: "tool_action_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_action_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_action_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_action_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_action_catalog: {
        Row: {
          action_family: string
          automation_readiness: string | null
          business_action: string
          business_object: string
          business_use_case: string | null
          capability_type: string
          confidence_level: string | null
          created_at: string
          data_sensitivity: string | null
          evidence_notes: string | null
          evidence_url: string | null
          id: string
          input_data_needed: string | null
          integration_found: string
          integration_source: string
          is_active: boolean
          needs_manual_review: boolean
          operation_group: string | null
          output_data_created: string | null
          process_mapping_category: string | null
          raw_source_label: string | null
          tool_category: string | null
          tool_description: string | null
          tool_id: string | null
          tool_name: string
          tool_slug: string
          tool_source: string | null
          trigger_event: string | null
        }
        Insert: {
          action_family: string
          automation_readiness?: string | null
          business_action: string
          business_object: string
          business_use_case?: string | null
          capability_type: string
          confidence_level?: string | null
          created_at?: string
          data_sensitivity?: string | null
          evidence_notes?: string | null
          evidence_url?: string | null
          id?: string
          input_data_needed?: string | null
          integration_found?: string
          integration_source?: string
          is_active?: boolean
          needs_manual_review?: boolean
          operation_group?: string | null
          output_data_created?: string | null
          process_mapping_category?: string | null
          raw_source_label?: string | null
          tool_category?: string | null
          tool_description?: string | null
          tool_id?: string | null
          tool_name: string
          tool_slug: string
          tool_source?: string | null
          trigger_event?: string | null
        }
        Update: {
          action_family?: string
          automation_readiness?: string | null
          business_action?: string
          business_object?: string
          business_use_case?: string | null
          capability_type?: string
          confidence_level?: string | null
          created_at?: string
          data_sensitivity?: string | null
          evidence_notes?: string | null
          evidence_url?: string | null
          id?: string
          input_data_needed?: string | null
          integration_found?: string
          integration_source?: string
          is_active?: boolean
          needs_manual_review?: boolean
          operation_group?: string | null
          output_data_created?: string | null
          process_mapping_category?: string | null
          raw_source_label?: string | null
          tool_category?: string | null
          tool_description?: string | null
          tool_id?: string | null
          tool_name?: string
          tool_slug?: string
          tool_source?: string | null
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_action_catalog_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_action_catalog_import_rejection: {
        Row: {
          created_at: string
          id: string
          import_batch_id: string | null
          raw_payload: Json | null
          rejection_reason: string | null
          source_row_number: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          import_batch_id?: string | null
          raw_payload?: Json | null
          rejection_reason?: string | null
          source_row_number?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          import_batch_id?: string | null
          raw_payload?: Json | null
          rejection_reason?: string | null
          source_row_number?: number | null
        }
        Relationships: []
      }
      tool_action_catalog_import_stage: {
        Row: {
          action_family: string | null
          automation_readiness: string | null
          business_action: string | null
          business_object: string | null
          business_use_case: string | null
          capability_type: string | null
          confidence_level: string | null
          created_at: string
          data_sensitivity: string | null
          evidence_notes: string | null
          evidence_url: string | null
          id: string
          import_batch_id: string | null
          input_data_needed: string | null
          integration_found: string | null
          integration_source: string | null
          is_active: boolean
          needs_manual_review: boolean
          operation_group: string | null
          output_data_created: string | null
          process_mapping_category: string | null
          raw_source_label: string | null
          source_row_number: number | null
          tool_category: string | null
          tool_description: string | null
          tool_id: string | null
          tool_name: string | null
          tool_slug: string | null
          tool_source: string | null
          trigger_event: string | null
        }
        Insert: {
          action_family?: string | null
          automation_readiness?: string | null
          business_action?: string | null
          business_object?: string | null
          business_use_case?: string | null
          capability_type?: string | null
          confidence_level?: string | null
          created_at?: string
          data_sensitivity?: string | null
          evidence_notes?: string | null
          evidence_url?: string | null
          id?: string
          import_batch_id?: string | null
          input_data_needed?: string | null
          integration_found?: string | null
          integration_source?: string | null
          is_active?: boolean
          needs_manual_review?: boolean
          operation_group?: string | null
          output_data_created?: string | null
          process_mapping_category?: string | null
          raw_source_label?: string | null
          source_row_number?: number | null
          tool_category?: string | null
          tool_description?: string | null
          tool_id?: string | null
          tool_name?: string | null
          tool_slug?: string | null
          tool_source?: string | null
          trigger_event?: string | null
        }
        Update: {
          action_family?: string | null
          automation_readiness?: string | null
          business_action?: string | null
          business_object?: string | null
          business_use_case?: string | null
          capability_type?: string | null
          confidence_level?: string | null
          created_at?: string
          data_sensitivity?: string | null
          evidence_notes?: string | null
          evidence_url?: string | null
          id?: string
          import_batch_id?: string | null
          input_data_needed?: string | null
          integration_found?: string | null
          integration_source?: string | null
          is_active?: boolean
          needs_manual_review?: boolean
          operation_group?: string | null
          output_data_created?: string | null
          process_mapping_category?: string | null
          raw_source_label?: string | null
          source_row_number?: number | null
          tool_category?: string | null
          tool_description?: string | null
          tool_id?: string | null
          tool_name?: string | null
          tool_slug?: string | null
          tool_source?: string | null
          trigger_event?: string | null
        }
        Relationships: []
      }
      tool_catalog: {
        Row: {
          category: string
          created_at: string
          icon_key: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          source: string
          trigger_capable: boolean
        }
        Insert: {
          category: string
          created_at?: string
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          source?: string
          trigger_capable?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          icon_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          source?: string
          trigger_capable?: boolean
        }
        Relationships: []
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "use_case_approvals_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: true
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_case_approvals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_case_approvals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
            referencedRelation: "organization"
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
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault: {
        Row: {
          agent_constitution: Json
          archived_at: string | null
          audience: string | null
          audience_id: string | null
          core_context: Json
          created_at: string
          id: string
          is_readonly: boolean
          isolation: string
          jurisdiction: string | null
          knowledge_config: Json
          metadata: Json
          name: string
          organization_id: string | null
          owner: string | null
          purpose: string | null
          references_vault_ids: Json
          residency: string | null
          routing_rules: Json
          sensitivity_ceiling: string | null
          source_client_id: string | null
          source_department_id: string | null
          status: string
          tier: number | null
          updated_at: string
          vault_key: string | null
          vault_references: Json
          vault_type: string
          workspace_id: string
        }
        Insert: {
          agent_constitution?: Json
          archived_at?: string | null
          audience?: string | null
          audience_id?: string | null
          core_context?: Json
          created_at?: string
          id?: string
          is_readonly?: boolean
          isolation?: string
          jurisdiction?: string | null
          knowledge_config?: Json
          metadata?: Json
          name: string
          organization_id?: string | null
          owner?: string | null
          purpose?: string | null
          references_vault_ids?: Json
          residency?: string | null
          routing_rules?: Json
          sensitivity_ceiling?: string | null
          source_client_id?: string | null
          source_department_id?: string | null
          status?: string
          tier?: number | null
          updated_at?: string
          vault_key?: string | null
          vault_references?: Json
          vault_type?: string
          workspace_id: string
        }
        Update: {
          agent_constitution?: Json
          archived_at?: string | null
          audience?: string | null
          audience_id?: string | null
          core_context?: Json
          created_at?: string
          id?: string
          is_readonly?: boolean
          isolation?: string
          jurisdiction?: string | null
          knowledge_config?: Json
          metadata?: Json
          name?: string
          organization_id?: string | null
          owner?: string | null
          purpose?: string | null
          references_vault_ids?: Json
          residency?: string | null
          routing_rules?: Json
          sensitivity_ceiling?: string | null
          source_client_id?: string | null
          source_department_id?: string | null
          status?: string
          tier?: number | null
          updated_at?: string
          vault_key?: string | null
          vault_references?: Json
          vault_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audience"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_source_client_id_fkey"
            columns: ["source_client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_source_department_id_fkey"
            columns: ["source_department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_reference: {
        Row: {
          archived_at: string | null
          created_at: string
          entity_id: string | null
          entity_key: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string | null
          title: string
          vault_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          title: string
          vault_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          title?: string
          vault_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_reference_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_reference_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_reference_workspace_id_fkey"
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
          archived_at: string | null
          created_at: string
          department_id: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invited_by: string | null
          last_error: string | null
          last_name: string | null
          manager_id: string | null
          manager_member_id: string | null
          organization_id: string | null
          position: string | null
          queued_at: string | null
          role: string
          send_state: string
          sent_at: string | null
          status: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_error?: string | null
          last_name?: string | null
          manager_id?: string | null
          manager_member_id?: string | null
          organization_id?: string | null
          position?: string | null
          queued_at?: string | null
          role: string
          send_state?: string
          sent_at?: string | null
          status?: string
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_error?: string | null
          last_name?: string | null
          manager_id?: string | null
          manager_member_id?: string | null
          organization_id?: string | null
          position?: string | null
          queued_at?: string | null
          role?: string
          send_state?: string
          sent_at?: string | null
          status?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_member_id_fkey"
            columns: ["manager_member_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_member_id_fkey"
            columns: ["manager_member_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
          archived_at: string | null
          department_id: string | null
          id: string
          invited_by: string | null
          joined_at: string
          languages: string[]
          manager_id: string | null
          manager_member_id: string | null
          organization_id: string | null
          role: string
          role_context: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          department_id?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          languages?: string[]
          manager_id?: string | null
          manager_member_id?: string | null
          organization_id?: string | null
          role: string
          role_context?: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          department_id?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          languages?: string[]
          manager_id?: string | null
          manager_member_id?: string | null
          organization_id?: string | null
          role?: string
          role_context?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_department_fk"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_member_id_fkey"
            columns: ["manager_member_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_member_id_fkey"
            columns: ["manager_member_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "organization"
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
          owner_membership_id: string | null
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
          owner_membership_id?: string | null
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
          owner_membership_id?: string | null
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
      invitation: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          archived_at: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          expires_at: string | null
          first_name: string | null
          id: string | null
          invited_by: string | null
          last_name: string | null
          manager_id: string | null
          organization_id: string | null
          position: string | null
          role: string | null
          send_state: string | null
          status: string | null
          token: string | null
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          archived_at?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string | null
          invited_by?: string | null
          last_name?: string | null
          manager_id?: string | null
          organization_id?: string | null
          position?: string | null
          role?: string | null
          send_state?: string | null
          status?: string | null
          token?: string | null
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          archived_at?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string | null
          invited_by?: string | null
          last_name?: string | null
          manager_id?: string | null
          organization_id?: string | null
          position?: string | null
          role?: string | null
          send_state?: string | null
          status?: string | null
          token?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_member_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_manager_member_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      membership: {
        Row: {
          archived_at: string | null
          created_at: string | null
          department_id: string | null
          id: string | null
          manager_id: string | null
          organization_id: string | null
          role: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          manager_id?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          manager_id?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_department_fk"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_member_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_manager_member_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          owner_membership_id: string | null
          plan: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          owner_membership_id?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          owner_membership_id?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: {
          archived_at: string | null
          department_id: string | null
          id: string
          invited_by: string | null
          joined_at: string
          languages: string[]
          manager_id: string | null
          manager_member_id: string | null
          organization_id: string | null
          role: string
          role_context: Json
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
      admin_overview: { Args: { p_org_id?: string }; Returns: Json }
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
          owner_membership_id: string | null
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
      decide_process: {
        Args: { p_decision: string; p_note?: string; p_process_id: string }
        Returns: {
          approved_at: string | null
          archived_at: string | null
          capture: Json
          capture_json: Json
          created_at: string
          created_by: string
          data_value: number | null
          department_id: string | null
          description: string | null
          diagram_json: Json
          ebitda_impact: number | null
          effort_savings: number | null
          error_reduction: number | null
          id: string
          maturity_stage: string | null
          name: string
          organization_id: string | null
          owner_member_id: string | null
          risk_tier: string | null
          score_json: Json
          scores: Json
          status: Database["public"]["Enums"]["process_status"]
          submitted_at: string | null
          template_id: string | null
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "process"
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
      workspace_build_overview: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
    }
    Enums: {
      membership_role: "owner" | "admin" | "manager" | "member" | "viewer"
      process_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "changes_requested"
        | "approved"
        | "merged"
        | "archived"
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
      membership_role: ["owner", "admin", "manager", "member", "viewer"],
      process_status: [
        "draft",
        "submitted",
        "under_review",
        "changes_requested",
        "approved",
        "merged",
        "archived",
      ],
    },
  },
} as const
