import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GastoRow {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: string;
  fornecedor: string | null;
  created_at: string | null;
}

export function useGastos() {
  return useQuery({
    queryKey: ['gastos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gastos').select('*').order('data', { ascending: false });
      if (error) throw error;
      return data as GastoRow[];
    },
  });
}

export function useCreateGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gasto: Omit<GastoRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('gastos').insert(gasto).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gastos'] }); toast.success('Movimentação salva!'); },
    onError: () => toast.error('Erro ao salvar movimentação'),
  });
}
