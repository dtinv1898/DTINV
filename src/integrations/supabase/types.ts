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
      budgets: {
        Row: {
          created_at: string
          electricity: number | null
          fidelity_bond: number | null
          fuel: number | null
          general_services: number | null
          grand_total: number | null
          ict_internet: number | null
          id: string
          insurance: number | null
          internet: number | null
          janitorial: number | null
          landline: number | null
          mobile: number | null
          office_supplies: number | null
          other_mooe: number | null
          other_supplies: number | null
          postage: number | null
          printing: number | null
          professional_services: number | null
          program_id: string
          ps: number | null
          q1: number | null
          q2: number | null
          q3: number | null
          q4: number | null
          rents_building: number | null
          rents_vehicle: number | null
          repairs_ict: number | null
          repairs_office: number | null
          repairs_transport: number | null
          representation: number | null
          taxes: number | null
          total: number | null
          total_mooe: number | null
          training: number | null
          traveling: number | null
          water: number | null
        }
        Insert: {
          created_at?: string
          electricity?: number | null
          fidelity_bond?: number | null
          fuel?: number | null
          general_services?: number | null
          grand_total?: number | null
          ict_internet?: number | null
          id?: string
          insurance?: number | null
          internet?: number | null
          janitorial?: number | null
          landline?: number | null
          mobile?: number | null
          office_supplies?: number | null
          other_mooe?: number | null
          other_supplies?: number | null
          postage?: number | null
          printing?: number | null
          professional_services?: number | null
          program_id: string
          ps?: number | null
          q1?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          rents_building?: number | null
          rents_vehicle?: number | null
          repairs_ict?: number | null
          repairs_office?: number | null
          repairs_transport?: number | null
          representation?: number | null
          taxes?: number | null
          total?: number | null
          total_mooe?: number | null
          training?: number | null
          traveling?: number | null
          water?: number | null
        }
        Update: {
          created_at?: string
          electricity?: number | null
          fidelity_bond?: number | null
          fuel?: number | null
          general_services?: number | null
          grand_total?: number | null
          ict_internet?: number | null
          id?: string
          insurance?: number | null
          internet?: number | null
          janitorial?: number | null
          landline?: number | null
          mobile?: number | null
          office_supplies?: number | null
          other_mooe?: number | null
          other_supplies?: number | null
          postage?: number | null
          printing?: number | null
          professional_services?: number | null
          program_id?: string
          ps?: number | null
          q1?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          rents_building?: number | null
          rents_vehicle?: number | null
          repairs_ict?: number | null
          repairs_office?: number | null
          repairs_transport?: number | null
          representation?: number | null
          taxes?: number | null
          total?: number | null
          total_mooe?: number | null
          training?: number | null
          traveling?: number | null
          water?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      oorc_data: {
        Row: {
          accomp_apr: number | null
          accomp_aug: number | null
          accomp_dec: number | null
          accomp_feb: number | null
          accomp_jan: number | null
          accomp_jul: number | null
          accomp_jun: number | null
          accomp_mar: number | null
          accomp_may: number | null
          accomp_nov: number | null
          accomp_oct: number | null
          accomp_q1: number | null
          accomp_q2: number | null
          accomp_q3: number | null
          accomp_q4: number | null
          accomp_sem1: number | null
          accomp_sem2: number | null
          accomp_sep: number | null
          annual_target: number | null
          category: string | null
          created_at: string
          division_id: string
          id: string
          indicator: string
          oo: string | null
          pct_accomp: number | null
          program: string | null
          target_apr: number | null
          target_aug: number | null
          target_dec: number | null
          target_feb: number | null
          target_jan: number | null
          target_jul: number | null
          target_jun: number | null
          target_mar: number | null
          target_may: number | null
          target_nov: number | null
          target_oct: number | null
          target_q1: number | null
          target_q2: number | null
          target_q3: number | null
          target_q4: number | null
          target_sem1: number | null
          target_sem2: number | null
          target_sep: number | null
        }
        Insert: {
          accomp_apr?: number | null
          accomp_aug?: number | null
          accomp_dec?: number | null
          accomp_feb?: number | null
          accomp_jan?: number | null
          accomp_jul?: number | null
          accomp_jun?: number | null
          accomp_mar?: number | null
          accomp_may?: number | null
          accomp_nov?: number | null
          accomp_oct?: number | null
          accomp_q1?: number | null
          accomp_q2?: number | null
          accomp_q3?: number | null
          accomp_q4?: number | null
          accomp_sem1?: number | null
          accomp_sem2?: number | null
          accomp_sep?: number | null
          annual_target?: number | null
          category?: string | null
          created_at?: string
          division_id: string
          id?: string
          indicator: string
          oo?: string | null
          pct_accomp?: number | null
          program?: string | null
          target_apr?: number | null
          target_aug?: number | null
          target_dec?: number | null
          target_feb?: number | null
          target_jan?: number | null
          target_jul?: number | null
          target_jun?: number | null
          target_mar?: number | null
          target_may?: number | null
          target_nov?: number | null
          target_oct?: number | null
          target_q1?: number | null
          target_q2?: number | null
          target_q3?: number | null
          target_q4?: number | null
          target_sem1?: number | null
          target_sem2?: number | null
          target_sep?: number | null
        }
        Update: {
          accomp_apr?: number | null
          accomp_aug?: number | null
          accomp_dec?: number | null
          accomp_feb?: number | null
          accomp_jan?: number | null
          accomp_jul?: number | null
          accomp_jun?: number | null
          accomp_mar?: number | null
          accomp_may?: number | null
          accomp_nov?: number | null
          accomp_oct?: number | null
          accomp_q1?: number | null
          accomp_q2?: number | null
          accomp_q3?: number | null
          accomp_q4?: number | null
          accomp_sem1?: number | null
          accomp_sem2?: number | null
          accomp_sep?: number | null
          annual_target?: number | null
          category?: string | null
          created_at?: string
          division_id?: string
          id?: string
          indicator?: string
          oo?: string | null
          pct_accomp?: number | null
          program?: string | null
          target_apr?: number | null
          target_aug?: number | null
          target_dec?: number | null
          target_feb?: number | null
          target_jan?: number | null
          target_jul?: number | null
          target_jun?: number | null
          target_mar?: number | null
          target_may?: number | null
          target_nov?: number | null
          target_oct?: number | null
          target_q1?: number | null
          target_q2?: number | null
          target_q3?: number | null
          target_q4?: number | null
          target_sem1?: number | null
          target_sem2?: number | null
          target_sep?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oorc_data_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      pgs_data: {
        Row: {
          accomp_apr: number | null
          accomp_aug: number | null
          accomp_dec: number | null
          accomp_feb: number | null
          accomp_jan: number | null
          accomp_jul: number | null
          accomp_jun: number | null
          accomp_mar: number | null
          accomp_may: number | null
          accomp_nov: number | null
          accomp_oct: number | null
          accomp_q1: number | null
          accomp_q2: number | null
          accomp_q3: number | null
          accomp_q4: number | null
          accomp_sem1: number | null
          accomp_sem2: number | null
          accomp_sep: number | null
          accomp_to_date: number | null
          created_at: string
          cy_target: number | null
          division_id: string
          id: string
          measure_no: number | null
          pct_accomp: number | null
          perspective: string | null
          strategic_measure: string
          strategic_objective: string | null
          target_apr: number | null
          target_aug: number | null
          target_dec: number | null
          target_feb: number | null
          target_jan: number | null
          target_jul: number | null
          target_jun: number | null
          target_mar: number | null
          target_may: number | null
          target_nov: number | null
          target_oct: number | null
          target_q1: number | null
          target_q2: number | null
          target_q3: number | null
          target_q4: number | null
          target_sem1: number | null
          target_sem2: number | null
          target_sep: number | null
          target_to_date: number | null
        }
        Insert: {
          accomp_apr?: number | null
          accomp_aug?: number | null
          accomp_dec?: number | null
          accomp_feb?: number | null
          accomp_jan?: number | null
          accomp_jul?: number | null
          accomp_jun?: number | null
          accomp_mar?: number | null
          accomp_may?: number | null
          accomp_nov?: number | null
          accomp_oct?: number | null
          accomp_q1?: number | null
          accomp_q2?: number | null
          accomp_q3?: number | null
          accomp_q4?: number | null
          accomp_sem1?: number | null
          accomp_sem2?: number | null
          accomp_sep?: number | null
          accomp_to_date?: number | null
          created_at?: string
          cy_target?: number | null
          division_id: string
          id?: string
          measure_no?: number | null
          pct_accomp?: number | null
          perspective?: string | null
          strategic_measure: string
          strategic_objective?: string | null
          target_apr?: number | null
          target_aug?: number | null
          target_dec?: number | null
          target_feb?: number | null
          target_jan?: number | null
          target_jul?: number | null
          target_jun?: number | null
          target_mar?: number | null
          target_may?: number | null
          target_nov?: number | null
          target_oct?: number | null
          target_q1?: number | null
          target_q2?: number | null
          target_q3?: number | null
          target_q4?: number | null
          target_sem1?: number | null
          target_sem2?: number | null
          target_sep?: number | null
          target_to_date?: number | null
        }
        Update: {
          accomp_apr?: number | null
          accomp_aug?: number | null
          accomp_dec?: number | null
          accomp_feb?: number | null
          accomp_jan?: number | null
          accomp_jul?: number | null
          accomp_jun?: number | null
          accomp_mar?: number | null
          accomp_may?: number | null
          accomp_nov?: number | null
          accomp_oct?: number | null
          accomp_q1?: number | null
          accomp_q2?: number | null
          accomp_q3?: number | null
          accomp_q4?: number | null
          accomp_sem1?: number | null
          accomp_sem2?: number | null
          accomp_sep?: number | null
          accomp_to_date?: number | null
          created_at?: string
          cy_target?: number | null
          division_id?: string
          id?: string
          measure_no?: number | null
          pct_accomp?: number | null
          perspective?: string | null
          strategic_measure?: string
          strategic_objective?: string | null
          target_apr?: number | null
          target_aug?: number | null
          target_dec?: number | null
          target_feb?: number | null
          target_jan?: number | null
          target_jul?: number | null
          target_jun?: number | null
          target_mar?: number | null
          target_may?: number | null
          target_nov?: number | null
          target_oct?: number | null
          target_q1?: number | null
          target_q2?: number | null
          target_q3?: number | null
          target_q4?: number | null
          target_sem1?: number | null
          target_sem2?: number | null
          target_sep?: number | null
          target_to_date?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pgs_data_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          activity: string
          created_at: string
          date_of_implementation: string | null
          id: string
          indicator: string | null
          organizational_outcome: string
          program_name: string | null
          responsible_person: string | null
          responsible_person_name: string | null
          sub_industry: string | null
          upload_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          date_of_implementation?: string | null
          id?: string
          indicator?: string | null
          organizational_outcome: string
          program_name?: string | null
          responsible_person?: string | null
          responsible_person_name?: string | null
          sub_industry?: string | null
          upload_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          date_of_implementation?: string | null
          id?: string
          indicator?: string | null
          organizational_outcome?: string
          program_name?: string | null
          responsible_person?: string | null
          responsible_person_name?: string | null
          sub_industry?: string | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      responsible_persons: {
        Row: {
          created_at: string
          division_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsible_persons_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          apr: number | null
          apr_actual: number | null
          aug: number | null
          aug_actual: number | null
          created_at: string
          dec: number | null
          dec_actual: number | null
          feb: number | null
          feb_actual: number | null
          first_sem_actual: number | null
          first_sem_target: number | null
          id: string
          jan: number | null
          jan_actual: number | null
          jul: number | null
          jul_actual: number | null
          jun: number | null
          jun_actual: number | null
          mar: number | null
          mar_actual: number | null
          may: number | null
          may_actual: number | null
          nov: number | null
          nov_actual: number | null
          oct: number | null
          oct_actual: number | null
          program_id: string
          q1: number | null
          q1_actual: number | null
          q2: number | null
          q2_actual: number | null
          q3: number | null
          q3_actual: number | null
          q4: number | null
          q4_actual: number | null
          second_sem_actual: number | null
          second_sem_target: number | null
          sep: number | null
          sep_actual: number | null
          total: number | null
          total_actual: number | null
        }
        Insert: {
          apr?: number | null
          apr_actual?: number | null
          aug?: number | null
          aug_actual?: number | null
          created_at?: string
          dec?: number | null
          dec_actual?: number | null
          feb?: number | null
          feb_actual?: number | null
          first_sem_actual?: number | null
          first_sem_target?: number | null
          id?: string
          jan?: number | null
          jan_actual?: number | null
          jul?: number | null
          jul_actual?: number | null
          jun?: number | null
          jun_actual?: number | null
          mar?: number | null
          mar_actual?: number | null
          may?: number | null
          may_actual?: number | null
          nov?: number | null
          nov_actual?: number | null
          oct?: number | null
          oct_actual?: number | null
          program_id: string
          q1?: number | null
          q1_actual?: number | null
          q2?: number | null
          q2_actual?: number | null
          q3?: number | null
          q3_actual?: number | null
          q4?: number | null
          q4_actual?: number | null
          second_sem_actual?: number | null
          second_sem_target?: number | null
          sep?: number | null
          sep_actual?: number | null
          total?: number | null
          total_actual?: number | null
        }
        Update: {
          apr?: number | null
          apr_actual?: number | null
          aug?: number | null
          aug_actual?: number | null
          created_at?: string
          dec?: number | null
          dec_actual?: number | null
          feb?: number | null
          feb_actual?: number | null
          first_sem_actual?: number | null
          first_sem_target?: number | null
          id?: string
          jan?: number | null
          jan_actual?: number | null
          jul?: number | null
          jul_actual?: number | null
          jun?: number | null
          jun_actual?: number | null
          mar?: number | null
          mar_actual?: number | null
          may?: number | null
          may_actual?: number | null
          nov?: number | null
          nov_actual?: number | null
          oct?: number | null
          oct_actual?: number | null
          program_id?: string
          q1?: number | null
          q1_actual?: number | null
          q2?: number | null
          q2_actual?: number | null
          q3?: number | null
          q3_actual?: number | null
          q4?: number | null
          q4_actual?: number | null
          second_sem_actual?: number | null
          second_sem_target?: number | null
          sep?: number | null
          sep_actual?: number | null
          total?: number | null
          total_actual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          division_id: string
          file_name: string
          file_path: string | null
          id: string
          responsible_person_id: string | null
          uploaded_at: string
          year: number
        }
        Insert: {
          division_id: string
          file_name: string
          file_path?: string | null
          id?: string
          responsible_person_id?: string | null
          uploaded_at?: string
          year?: number
        }
        Update: {
          division_id?: string
          file_name?: string
          file_path?: string | null
          id?: string
          responsible_person_id?: string | null
          uploaded_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "uploads_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "responsible_persons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
