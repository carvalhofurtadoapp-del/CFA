import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DietaRow {
  id: string;
  nome: string;
  descricao: string | null;
  custo_kg: number | null;
  created_at: string | null;
}

export interface DietaIngredienteRow {
  id: string;
  dieta_id: string;
  insumo_id: string;
  quantidade_kg: number;
  created_at: string | null;
}

export function useDietas() {
  return useQuery({
    queryKey: ['dietas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dietas' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DietaRow[];
    },
  });
}

export function useCreateDieta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Omit<DietaRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('dietas' as any).insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dietas'] }); toast.success('Dieta cadastrada!'); },
    onError: () => toast.error('Erro ao cadastrar dieta'),
  });
}

export function useDeleteDieta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dietas' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dietas'] }); toast.success('Dieta removida!'); },
    onError: () => toast.error('Erro ao remover dieta'),
  });
}
