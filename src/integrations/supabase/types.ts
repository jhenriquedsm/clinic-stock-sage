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
      administracoes: {
        Row: {
          created_at: string
          data_administracao: string
          dose_aplicada: number
          id: string
          medicamento_id: string
          movimentacao_id: string | null
          observacoes: string | null
          paciente_nome: string
          responsavel: string | null
          unidade_dose: string
          unidades_consumidas: number
          via_administracao: string | null
        }
        Insert: {
          created_at?: string
          data_administracao?: string
          dose_aplicada: number
          id?: string
          medicamento_id: string
          movimentacao_id?: string | null
          observacoes?: string | null
          paciente_nome: string
          responsavel?: string | null
          unidade_dose: string
          unidades_consumidas?: number
          via_administracao?: string | null
        }
        Update: {
          created_at?: string
          data_administracao?: string
          dose_aplicada?: number
          id?: string
          medicamento_id?: string
          movimentacao_id?: string | null
          observacoes?: string | null
          paciente_nome?: string
          responsavel?: string | null
          unidade_dose?: string
          unidades_consumidas?: number
          via_administracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administracoes_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administracoes_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_configuracao: {
        Row: {
          dias_aviso_vencimento: number
          id: string
          quantidade_minima_global: number
        }
        Insert: {
          dias_aviso_vencimento?: number
          id?: string
          quantidade_minima_global?: number
        }
        Update: {
          dias_aviso_vencimento?: number
          id?: string
          quantidade_minima_global?: number
        }
        Relationships: []
      }
      medicamentos: {
        Row: {
          apresentacao: string | null
          categoria: string | null
          concentracao: string | null
          controlado: boolean
          created_at: string
          data_fabricacao: string | null
          data_validade: string
          fabricante: string | null
          id: string
          localizacao: string | null
          nome: string
          numero_lote: string
          observacoes: string | null
          principio_ativo: string | null
          quantidade_atual: number
          quantidade_minima: number
          requer_refrigeracao: boolean
          updated_at: string
        }
        Insert: {
          apresentacao?: string | null
          categoria?: string | null
          concentracao?: string | null
          controlado?: boolean
          created_at?: string
          data_fabricacao?: string | null
          data_validade: string
          fabricante?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          numero_lote: string
          observacoes?: string | null
          principio_ativo?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          requer_refrigeracao?: boolean
          updated_at?: string
        }
        Update: {
          apresentacao?: string | null
          categoria?: string | null
          concentracao?: string | null
          controlado?: boolean
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string
          fabricante?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          numero_lote?: string
          observacoes?: string | null
          principio_ativo?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          requer_refrigeracao?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          data_movimentacao: string
          id: string
          medicamento_id: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          responsavel: string | null
          tipo: string
        }
        Insert: {
          data_movimentacao?: string
          id?: string
          medicamento_id: string
          motivo?: string | null
          observacoes?: string | null
          quantidade: number
          responsavel?: string | null
          tipo: string
        }
        Update: {
          data_movimentacao?: string
          id?: string
          medicamento_id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          responsavel?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registrar_administracao: {
        Args: {
          p_medicamento_id: string
          p_paciente_nome: string
          p_dose_aplicada: number
          p_unidade_dose: string
          p_unidades_consumidas: number
          p_data_administracao?: string
          p_responsavel?: string | null
          p_via_administracao?: string | null
          p_observacoes?: string | null
        }
        Returns: Json
      }
      registrar_movimentacao: {
        Args: {
          p_medicamento_id: string
          p_tipo: string
          p_quantidade: number
          p_motivo?: string | null
          p_responsavel?: string | null
          p_observacoes?: string | null
        }
        Returns: Json
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
