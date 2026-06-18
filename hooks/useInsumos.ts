import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InsumoRow {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  codigo_barras: string | null;
  codigo_ean: string | null;
  minimo: number;
  categoria: string | null;
  fornecedor: string | null;
  preco_compra: number;
  quantidade_por_embalagem: number | null;
  created_at: string | null;
}

export interface MovimentacaoRow {
  id: string;
  insumo_id: string;
  tipo: string;
  quantidade: number;
  data: string;
  observacao: string | null;
  created_at: string | null;
}

export function useInsumos() {
  return useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insumos').select('*').order('nome');
      if (error) throw error;
      return data as InsumoRow[];
    },
  });
}

export function useMovimentacoes() {
  return useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('movimentacoes_estoque').select('*').order('data', { ascending: false }).limit(50);
      if (error) throw error;
      return data as MovimentacaoRow[];
    },
  });
}

export function useCreateInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (insumo: Omit<InsumoRow, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('insumos').insert(insumo);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insumos'] }); toast.success('Material cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar material'),
  });
}

export function useUpdateInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsumoRow> & { id: string }) => {
      const { error } = await supabase.from('insumos').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insumos'] }); toast.success('Material atualizado!'); },
    onError: () => toast.error('Erro ao atualizar material'),
  });
}

export function useDeleteInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insumos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insumos'] }); toast.success('Material removido!'); },
    onError: () => toast.error('Erro ao remover material'),
  });
}

export function useCreateMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Omit<MovimentacaoRow, 'id' | 'created_at'>) => {
      // Update insumo quantity
      const { data: insumo } = await supabase.from('insumos').select('quantidade').eq('id', mov.insumo_id).single();
      if (insumo) {
        const novaQtd = mov.tipo === 'entrada' 
          ? insumo.quantidade + mov.quantidade 
          : Math.max(0, insumo.quantidade - mov.quantidade);
        await supabase.from('insumos').update({ quantidade: novaQtd }).eq('id', mov.insumo_id);
      }
      const { error } = await supabase.from('movimentacoes_estoque').insert(mov);
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['insumos'] }); 
      qc.invalidateQueries({ queryKey: ['movimentacoes'] }); 
      toast.success('Movimentação registrada!'); 
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  });
}
