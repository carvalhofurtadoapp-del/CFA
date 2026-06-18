import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EquipamentoRow {
  id: string;
  nome: string;
  tipo: string;
  valor_compra: number;
  valor_residual: number;
  vida_util_anos: number;
  data_compra: string;
  status: string;
  proxima_manutencao: string | null;
  observacao: string | null;
  created_at: string | null;
}

export function useEquipamentos() {
  return useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipamentos' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as EquipamentoRow[];
    },
  });
}

export function useCreateEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eq: Omit<EquipamentoRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('equipamentos' as any).insert(eq as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipamentos'] }); toast.success('Equipamento cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar equipamento'),
  });
}

export function useUpdateEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipamentoRow> & { id: string }) => {
      const { error } = await supabase.from('equipamentos' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipamentos'] }); toast.success('Equipamento atualizado!'); },
    onError: () => toast.error('Erro ao atualizar equipamento'),
  });
}

export function useDeleteEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipamentos' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipamentos'] }); toast.success('Equipamento removido!'); },
    onError: () => toast.error('Erro ao remover equipamento'),
  });
}

export function calcularDepreciacaoMensal(valorCompra: number, valorResidual: number, vidaUtilAnos: number): number {
  if (vidaUtilAnos <= 0) return 0;
  return (valorCompra - valorResidual) / (vidaUtilAnos * 12);
}

export function calcularValorAtual(valorCompra: number, valorResidual: number, vidaUtilAnos: number, dataCompra: string): number {
  const mesesPassados = Math.floor((Date.now() - new Date(dataCompra).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const depMensal = calcularDepreciacaoMensal(valorCompra, valorResidual, vidaUtilAnos);
  const valorAtual = valorCompra - (depMensal * mesesPassados);
  return Math.max(valorAtual, valorResidual);
}
