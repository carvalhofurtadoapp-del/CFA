import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoteConfinamento {
  id: string;
  nome: string;
  data_inicio: string;
  previsao_saida: string | null;
  racao_insumo_id: string | null;
  dieta_id: string | null;
  status: string;
  created_at: string | null;
}

export interface AnimalConfinamento {
  id: string;
  animal_id: string;
  lote_id: string;
  data_entrada: string;
  peso_entrada: number;
  previsao_saida: string | null;
  data_saida: string | null;
  peso_saida: number | null;
  status: string;
  created_at: string | null;
}

export interface ConsumoRacao {
  id: string;
  lote_id: string;
  insumo_id: string;
  quantidade: number;
  data: string;
  created_at: string | null;
}

export function useLotesConfinamento() {
  return useQuery({
    queryKey: ['lotes_confinamento'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lotes_confinamento').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoteConfinamento[];
    },
  });
}

export function useAnimaisConfinamento(loteId?: string) {
  return useQuery({
    queryKey: ['animais_confinamento', loteId],
    queryFn: async () => {
      let query = supabase.from('animais_confinamento').select('*').order('created_at', { ascending: false });
      if (loteId) query = query.eq('lote_id', loteId);
      const { data, error } = await query;
      if (error) throw error;
      return data as AnimalConfinamento[];
    },
  });
}

export function useCreateLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lote: Omit<LoteConfinamento, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('lotes_confinamento').insert(lote).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes_confinamento'] }); toast.success('Lote criado!'); },
    onError: () => toast.error('Erro ao criar lote'),
  });
}

export function useAddAnimalToLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<AnimalConfinamento, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('animais_confinamento').insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['animais_confinamento'] });
      qc.invalidateQueries({ queryKey: ['animais'] });
      toast.success('Animal adicionado ao confinamento!');
    },
    onError: () => toast.error('Erro ao adicionar animal'),
  });
}

export function useRegistrarConsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consumo: Omit<ConsumoRacao, 'id' | 'created_at'> & { lote_nome?: string }) => {
      const { lote_nome, ...consumoData } = consumo;
      // Insert consumo
      const { error } = await supabase.from('consumo_racao').insert(consumoData);
      if (error) throw error;
      // Dar baixa no estoque
      const { data: insumo, error: insumoError } = await supabase.from('insumos').select('quantidade').eq('id', consumo.insumo_id).single();
      if (!insumoError && insumo) {
        await supabase.from('insumos').update({ quantidade: Math.max(0, Number(insumo.quantidade) - consumo.quantidade) }).eq('id', consumo.insumo_id);
      }
      // Registrar movimentação de estoque com nome do lote
      await supabase.from('movimentacoes_estoque').insert({
        insumo_id: consumo.insumo_id,
        tipo: 'saida',
        quantidade: consumo.quantidade,
        data: consumo.data,
        observacao: lote_nome ? `Consumo confinamento - Lote: ${lote_nome}` : 'Consumo confinamento',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumo_racao'] });
      qc.invalidateQueries({ queryKey: ['insumos'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes_estoque'] });
      toast.success('Consumo registrado e estoque atualizado!');
    },
    onError: () => toast.error('Erro ao registrar consumo'),
  });
}

export function useConsumoRacao(loteId?: string) {
  return useQuery({
    queryKey: ['consumo_racao', loteId],
    queryFn: async () => {
      let query = supabase.from('consumo_racao').select('*').order('data', { ascending: false });
      if (loteId) query = query.eq('lote_id', loteId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ConsumoRacao[];
    },
  });
}
