import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnimalRow {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  data_nascimento: string;
  pai: string | null;
  mae: string | null;
  foto: string | null;
  sexo: string;
  status: string;
  created_at: string | null;
  data_desmama: string | null;
  data_confinamento: string | null;
  preco_compra: number;
  preco_venda: number;
  lote_rebanho_id: string | null;
  mojando: boolean;
  mojando_meses: number | null;
  mojando_data_inicio: string | null;
  observacao: string | null;
}

export function useAnimais() {
  return useQuery({
    queryKey: ['animais'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animais').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as AnimalRow[];
    },
  });
}

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: ['animais', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('animais').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as AnimalRow;
    },
  });
}

export function useCreateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (animal: Omit<AnimalRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('animais').insert(animal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['animais'] }); toast.success('Animal cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar animal'),
  });
}

export function useUpdateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AnimalRow> & { id: string }) => {
      const { error } = await supabase.from('animais').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['animais'] }); toast.success('Animal atualizado!'); },
    onError: () => toast.error('Erro ao atualizar animal'),
  });
}

export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('animais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['animais'] }); toast.success('Animal removido!'); },
    onError: () => toast.error('Erro ao remover animal'),
  });
}
