import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FuncionarioRow {
  id: string;
  nome: string;
  funcao: string;
  data_inicio: string;
  forma_pagamento: string;
  valor_pagamento: number;
  status: string;
  observacao: string | null;
  created_at: string | null;
}

export interface DiaTrabalhado {
  id: string;
  funcionario_id: string;
  data: string;
  horas: number;
  observacao: string | null;
  created_at: string | null;
}

export function useFuncionarios() {
  return useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('funcionarios' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FuncionarioRow[];
    },
  });
}

export function useCreateFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Omit<FuncionarioRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('funcionarios' as any).insert(f as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funcionarios'] }); toast.success('Funcionário cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar funcionário'),
  });
}

export function useUpdateFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuncionarioRow> & { id: string }) => {
      const { error } = await supabase.from('funcionarios' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funcionarios'] }); toast.success('Funcionário atualizado!'); },
    onError: () => toast.error('Erro ao atualizar'),
  });
}

export function useDeleteFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funcionarios'] }); toast.success('Funcionário removido!'); },
    onError: () => toast.error('Erro ao remover'),
  });
}

export function useDiasTrabalhados(funcionarioId?: string) {
  return useQuery({
    queryKey: ['dias_trabalhados', funcionarioId],
    enabled: !!funcionarioId,
    queryFn: async () => {
      const { data, error } = await supabase.from('dias_trabalhados' as any).select('*').eq('funcionario_id', funcionarioId!).order('data', { ascending: false });
      if (error) throw error;
      return data as unknown as DiaTrabalhado[];
    },
  });
}

export function useAllDiasTrabalhados() {
  return useQuery({
    queryKey: ['dias_trabalhados'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dias_trabalhados' as any).select('*').order('data', { ascending: false });
      if (error) throw error;
      return data as unknown as DiaTrabalhado[];
    },
  });
}

export function useCreateDiaTrabalhado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Omit<DiaTrabalhado, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('dias_trabalhados' as any).insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dias_trabalhados'] }); toast.success('Dia registrado!'); },
    onError: () => toast.error('Erro ao registrar dia'),
  });
}
