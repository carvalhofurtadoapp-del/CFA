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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      animais: {
        Row: {
          brinco: string
          created_at: string | null
          data_confinamento: string | null
          data_desmama: string | null
          data_nascimento: string
          foto: string | null
          id: string
          lote_rebanho_id: string | null
          mae: string | null
          mojando: boolean
          mojando_data_inicio: string | null
          mojando_meses: number | null
          nome: string | null
          observacao: string | null
          pai: string | null
          preco_compra: number | null
          preco_venda: number | null
          raca: string
          sexo: string
          status: string
        }
        Insert: {
          brinco: string
          created_at?: string | null
          data_confinamento?: string | null
          data_desmama?: string | null
          data_nascimento: string
          foto?: string | null
          id?: string
          lote_rebanho_id?: string | null
          mae?: string | null
          mojando?: boolean
          mojando_data_inicio?: string | null
          mojando_meses?: number | null
          nome?: string | null
          observacao?: string | null
          pai?: string | null
          preco_compra?: number | null
          preco_venda?: number | null
          raca: string
          sexo?: string
          status?: string
        }
        Update: {
          brinco?: string
          created_at?: string | null
          data_confinamento?: string | null
          data_desmama?: string | null
          data_nascimento?: string
          foto?: string | null
          id?: string
          lote_rebanho_id?: string | null
          mae?: string | null
          mojando?: boolean
          mojando_data_inicio?: string | null
          mojando_meses?: number | null
          nome?: string | null
          observacao?: string | null
          pai?: string | null
          preco_compra?: number | null
          preco_venda?: number | null
          raca?: string
          sexo?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "animais_lote_rebanho_id_fkey"
            columns: ["lote_rebanho_id"]
            isOneToOne: false
            referencedRelation: "lotes_rebanho"
            referencedColumns: ["id"]
          },
        ]
      }
      animais_confinamento: {
        Row: {
          animal_id: string
          created_at: string | null
          data_entrada: string
          data_saida: string | null
          id: string
          lote_id: string
          peso_entrada: number
          peso_saida: number | null
          previsao_saida: string | null
          status: string
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          data_entrada?: string
          data_saida?: string | null
          id?: string
          lote_id: string
          peso_entrada: number
          peso_saida?: number | null
          previsao_saida?: string | null
          status?: string
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          data_entrada?: string
          data_saida?: string | null
          id?: string
          lote_id?: string
          peso_entrada?: number
          peso_saida?: number | null
          previsao_saida?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "animais_confinamento_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_confinamento_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_confinamento"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          config_key: string
          config_value: string
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_usuarios: {
        Row: {
          abas_permitidas: string[] | null
          created_at: string | null
          foto: string | null
          id: string
          login: string
          nome: string
          role: string
          senha: string
          status: string
        }
        Insert: {
          abas_permitidas?: string[] | null
          created_at?: string | null
          foto?: string | null
          id?: string
          login: string
          nome: string
          role?: string
          senha: string
          status?: string
        }
        Update: {
          abas_permitidas?: string[] | null
          created_at?: string | null
          foto?: string | null
          id?: string
          login?: string
          nome?: string
          role?: string
          senha?: string
          status?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          created_at: string
          dia_desconto: number
          icone: string | null
          id: string
          nome: string
          status: string
          valor: number
        }
        Insert: {
          created_at?: string
          dia_desconto: number
          icone?: string | null
          id?: string
          nome: string
          status?: string
          valor?: number
        }
        Update: {
          created_at?: string
          dia_desconto?: number
          icone?: string | null
          id?: string
          nome?: string
          status?: string
          valor?: number
        }
        Relationships: []
      }
      consumo_racao: {
        Row: {
          created_at: string | null
          data: string
          id: string
          insumo_id: string
          lote_id: string
          quantidade: number
          sobras: number
        }
        Insert: {
          created_at?: string | null
          data?: string
          id?: string
          insumo_id: string
          lote_id: string
          quantidade: number
          sobras?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          insumo_id?: string
          lote_id?: string
          quantidade?: number
          sobras?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumo_racao_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_racao_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_confinamento"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_trabalhados: {
        Row: {
          created_at: string | null
          data: string
          funcionario_id: string
          horas: number
          id: string
          observacao: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string
          funcionario_id: string
          horas?: number
          id?: string
          observacao?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          funcionario_id?: string
          horas?: number
          id?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dias_trabalhados_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      dieta_ingredientes: {
        Row: {
          created_at: string | null
          dieta_id: string
          id: string
          insumo_id: string
          quantidade_kg: number
        }
        Insert: {
          created_at?: string | null
          dieta_id: string
          id?: string
          insumo_id: string
          quantidade_kg?: number
        }
        Update: {
          created_at?: string | null
          dieta_id?: string
          id?: string
          insumo_id?: string
          quantidade_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "dieta_ingredientes_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dieta_ingredientes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      dietas: {
        Row: {
          categoria_animal: string
          created_at: string | null
          custo_kg: number | null
          descricao: string | null
          id: string
          nome: string
          status: string
        }
        Insert: {
          categoria_animal?: string
          created_at?: string | null
          custo_kg?: number | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string
        }
        Update: {
          categoria_animal?: string
          created_at?: string | null
          custo_kg?: number | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          created_at: string | null
          data_compra: string
          horas_trabalhadas: number
          id: string
          nome: string
          observacao: string | null
          proxima_manutencao: string | null
          status: string
          tipo: string
          valor_compra: number
          valor_residual: number
          vida_util_anos: number
        }
        Insert: {
          created_at?: string | null
          data_compra?: string
          horas_trabalhadas?: number
          id?: string
          nome: string
          observacao?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo?: string
          valor_compra?: number
          valor_residual?: number
          vida_util_anos?: number
        }
        Update: {
          created_at?: string | null
          data_compra?: string
          horas_trabalhadas?: number
          id?: string
          nome?: string
          observacao?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo?: string
          valor_compra?: number
          valor_residual?: number
          vida_util_anos?: number
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          created_at: string | null
          data_inicio: string
          forma_pagamento: string
          funcao: string
          id: string
          nome: string
          observacao: string | null
          status: string
          valor_pagamento: number
        }
        Insert: {
          created_at?: string | null
          data_inicio?: string
          forma_pagamento?: string
          funcao?: string
          id?: string
          nome: string
          observacao?: string | null
          status?: string
          valor_pagamento?: number
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          forma_pagamento?: string
          funcao?: string
          id?: string
          nome?: string
          observacao?: string | null
          status?: string
          valor_pagamento?: number
        }
        Relationships: []
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string | null
          data: string
          descricao: string
          fornecedor: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data: string
          descricao: string
          fornecedor?: string | null
          id?: string
          tipo?: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      historico: {
        Row: {
          created_at: string | null
          data: string
          descricao: string
          detalhes: string | null
          entidade: string
          entidade_id: string
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data: string
          descricao: string
          detalhes?: string | null
          entidade: string
          entidade_id: string
          id?: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          data?: string
          descricao?: string
          detalhes?: string | null
          entidade?: string
          entidade_id?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      insumos: {
        Row: {
          categoria: string | null
          codigo_barras: string | null
          codigo_ean: string | null
          created_at: string | null
          fornecedor: string | null
          id: string
          minimo: number
          nome: string
          preco_compra: number
          quantidade: number
          quantidade_por_embalagem: number | null
          unidade: string
        }
        Insert: {
          categoria?: string | null
          codigo_barras?: string | null
          codigo_ean?: string | null
          created_at?: string | null
          fornecedor?: string | null
          id?: string
          minimo?: number
          nome: string
          preco_compra?: number
          quantidade?: number
          quantidade_por_embalagem?: number | null
          unidade: string
        }
        Update: {
          categoria?: string | null
          codigo_barras?: string | null
          codigo_ean?: string | null
          created_at?: string | null
          fornecedor?: string | null
          id?: string
          minimo?: number
          nome?: string
          preco_compra?: number
          quantidade?: number
          quantidade_por_embalagem?: number | null
          unidade?: string
        }
        Relationships: []
      }
      lotes_confinamento: {
        Row: {
          created_at: string | null
          data_inicio: string
          dieta_id: string | null
          id: string
          nome: string
          previsao_saida: string | null
          racao_insumo_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          data_inicio?: string
          dieta_id?: string | null
          id?: string
          nome: string
          previsao_saida?: string | null
          racao_insumo_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          dieta_id?: string | null
          id?: string
          nome?: string
          previsao_saida?: string | null
          racao_insumo_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_confinamento_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_confinamento_racao_insumo_id_fkey"
            columns: ["racao_insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_rebanho: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      manutencoes_equipamento: {
        Row: {
          created_at: string | null
          data: string
          descricao: string
          equipamento_id: string
          id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data?: string
          descricao: string
          equipamento_id: string
          id?: string
          valor?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          descricao?: string
          equipamento_id?: string
          id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_equipamento_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          data: string
          id: string
          insumo_id: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          insumo_id: string
          observacao?: string | null
          quantidade: number
          tipo?: string
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          insumo_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      pesagens: {
        Row: {
          animal_id: string
          created_at: string | null
          data: string
          gmd: number | null
          id: string
          peso: number
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          data: string
          gmd?: number | null
          id?: string
          peso: number
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          data?: string
          gmd?: number | null
          id?: string
          peso?: number
        }
        Relationships: [
          {
            foreignKeyName: "pesagens_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          usuario_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          usuario_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "app_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_servico: {
        Row: {
          created_at: string | null
          duracao_minutos: number | null
          equipamento_id: string
          fim: string | null
          id: string
          inicio: string
          status: string
        }
        Insert: {
          created_at?: string | null
          duracao_minutos?: number | null
          equipamento_id: string
          fim?: string | null
          id?: string
          inicio?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          duracao_minutos?: number | null
          equipamento_id?: string
          fim?: string | null
          id?: string
          inicio?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_servico_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      talhoes: {
        Row: {
          area_hectares: number
          created_at: string | null
          cultura: string | null
          custo_defensivos: number
          custo_fertilizantes: number
          custo_mao_obra: number
          custo_maquinas: number
          custo_sementes: number
          data_plantio: string | null
          id: string
          nome: string
          observacao: string | null
          previsao_colheita: string | null
          producao_real: number | null
          status: string
          unidade_producao: string | null
          valor_venda_producao: number | null
        }
        Insert: {
          area_hectares?: number
          created_at?: string | null
          cultura?: string | null
          custo_defensivos?: number
          custo_fertilizantes?: number
          custo_mao_obra?: number
          custo_maquinas?: number
          custo_sementes?: number
          data_plantio?: string | null
          id?: string
          nome: string
          observacao?: string | null
          previsao_colheita?: string | null
          producao_real?: number | null
          status?: string
          unidade_producao?: string | null
          valor_venda_producao?: number | null
        }
        Update: {
          area_hectares?: number
          created_at?: string | null
          cultura?: string | null
          custo_defensivos?: number
          custo_fertilizantes?: number
          custo_mao_obra?: number
          custo_maquinas?: number
          custo_sementes?: number
          data_plantio?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          previsao_colheita?: string | null
          producao_real?: number | null
          status?: string
          unidade_producao?: string | null
          valor_venda_producao?: number | null
        }
        Relationships: []
      }
      tratamentos: {
        Row: {
          animal_id: string
          created_at: string | null
          custo: number
          data_fim: string | null
          data_inicio: string
          descricao: string
          diagnostico: string | null
          id: string
          medicamento: string | null
          observacao: string | null
          status: string
          tipo: string
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          custo?: number
          data_fim?: string | null
          data_inicio?: string
          descricao: string
          diagnostico?: string | null
          id?: string
          medicamento?: string | null
          observacao?: string | null
          status?: string
          tipo?: string
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          custo?: number
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          diagnostico?: string | null
          id?: string
          medicamento?: string | null
          observacao?: string | null
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamentos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      vacinas: {
        Row: {
          animal_id: string
          created_at: string | null
          data_aplicacao: string | null
          data_proxima: string | null
          id: string
          nome: string
          status: string
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          data_aplicacao?: string | null
          data_proxima?: string | null
          id?: string
          nome: string
          status?: string
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          data_aplicacao?: string | null
          data_proxima?: string | null
          id?: string
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacinas_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
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
