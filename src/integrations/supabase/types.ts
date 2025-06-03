export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addendums: {
        Row: {
          contract_id: string
          created_at: string
          data_assinatura: string
          id: string
          justificativa: string
          numero: string
          prazo_anterior: number | null
          prazo_novo: number | null
          tipo: string
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          data_assinatura: string
          id?: string
          justificativa: string
          numero: string
          prazo_anterior?: number | null
          prazo_novo?: number | null
          tipo: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          data_assinatura?: string
          id?: string
          justificativa?: string
          numero?: string
          prazo_anterior?: number | null
          prazo_novo?: number | null
          tipo?: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addendums_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contratada: string
          contratante: string
          created_at: string
          data_assinatura: string
          fiscal_substituto: string | null
          fiscal_titular: string | null
          garantia_tipo: string
          garantia_valor: number
          garantia_vencimento: string | null
          id: string
          modalidade: string
          numero: string
          objeto: string
          observacoes: string | null
          prazo_execucao: number
          prazo_unidade: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          contratada: string
          contratante: string
          created_at?: string
          data_assinatura: string
          fiscal_substituto?: string | null
          fiscal_titular?: string | null
          garantia_tipo?: string
          garantia_valor?: number
          garantia_vencimento?: string | null
          id?: string
          modalidade?: string
          numero: string
          objeto: string
          observacoes?: string | null
          prazo_execucao?: number
          prazo_unidade?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          contratada?: string
          contratante?: string
          created_at?: string
          data_assinatura?: string
          fiscal_substituto?: string | null
          fiscal_titular?: string | null
          garantia_tipo?: string
          garantia_valor?: number
          garantia_vencimento?: string | null
          id?: string
          modalidade?: string
          numero?: string
          objeto?: string
          observacoes?: string | null
          prazo_execucao?: number
          prazo_unidade?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          contract_id: string
          created_at: string
          data_upload: string
          id: string
          nome: string
          tipo: string
          url: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          data_upload?: string
          id?: string
          nome: string
          tipo: string
          url: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          data_upload?: string
          id?: string
          nome?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          contract_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          numero: string
          observacoes: string | null
          status: string
          valor: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          numero: string
          observacoes?: string | null
          status?: string
          valor: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
