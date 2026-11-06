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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      Bill: {
        Row: {
          cost: number
          created_at: string
          day: number | null
          endDate: string | null
          id: number
          isCostVariable: boolean
          name: string
          startDate: string | null
          updated_at: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          day?: number | null
          endDate?: string | null
          id?: number
          isCostVariable?: boolean
          name?: string
          startDate?: string | null
          updated_at?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          day?: number | null
          endDate?: string | null
          id?: number
          isCostVariable?: boolean
          name?: string
          startDate?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Expense: {
        Row: {
          cost: number
          created_at: string
          date: string
          id: number
          name: string
          pay_period_id: number | null
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          id?: number
          name?: string
          pay_period_id?: number | null
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          id?: number
          name?: string
          pay_period_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Expense_pay_period_id_fkey"
            columns: ["pay_period_id"]
            isOneToOne: false
            referencedRelation: "PayPeriod"
            referencedColumns: ["id"]
          },
        ]
      }
      IncomeSource: {
        Row: {
          amount: number
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      PayPeriod: {
        Row: {
          created_at: string
          end_date: string
          id: number
          leftover: number
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string
          id?: number
          leftover?: number
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          leftover?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      PayPeriodIncomeSource: {
        Row: {
          income_source_id: number
          pay_period_id: number
        }
        Insert: {
          income_source_id: number
          pay_period_id: number
        }
        Update: {
          income_source_id?: number
          pay_period_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "PayPeriodIncomeSource_income_source_id_fkey"
            columns: ["income_source_id"]
            isOneToOne: false
            referencedRelation: "IncomeSource"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PayPeriodIncomeSource_pay_period_id_fkey"
            columns: ["pay_period_id"]
            isOneToOne: false
            referencedRelation: "PayPeriod"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
