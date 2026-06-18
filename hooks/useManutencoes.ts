import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManutencaoRow {
  id: string;
  equipamento_id: string;
  descricao: string;
  valor: number;
  data: string;
  created_at: string | null;
}

export function useManutencoes(equipamentoId?: string) {
  return useQuery({
    queryKey: ['manutencoes', equipamentoId],
    queryFn: async () => {
      let query = supabase.from('manutencoes_equipamento' as any).select('*').order('data', { ascending: false });
      if (equipamentoId) {
        query = query.eq('equipamento_id', equipamentoId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ManutencaoRow[];
    },
  });
}

export function useCreateManutencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { equipamento_id: string; descricao: string; valor: number; data: string; equipamento_nome: string }) => {
      // 1. Insert maintenance record
      const { error: mErr } = await supabase.from('manutencoes_equipamento' as any).insert({
        equipamento_id: m.equipamento_id,
        descricao: m.descricao,
        valor: m.valor,
        data: m.data,
      } as any);
      if (mErr) throw mErr;

      // 2. Auto-create expense in gastos
      const { error: gErr } = await supabase.from('gastos').insert({
        descricao: `Manutenção ${m.equipamento_nome}: ${m.descricao}`,
        categoria: 'Manutenção',
        valor: m.valor,
        data: m.data,
        tipo: 'saida',
      });
      if (gErr) throw gErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manutencoes'] });
      qc.invalidateQueries({ queryKey: ['gastos'] });
      toast.success('Manutenção registrada e lançada no fluxo de caixa!');
    },
    onError: () => toast.error('Erro ao registrar manutenção'),
  });
}

export function useDeleteManutencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manutencoes_equipamento' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manutencoes'] });
      toast.success('Manutenção removida!');
    },
    onError: () => toast.error('Erro ao remover manutenção'),
  });
}
