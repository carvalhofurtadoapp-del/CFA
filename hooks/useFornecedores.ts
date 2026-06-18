import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FornecedorRow {
  id: string;
  nome: string;
  telefone: string | null;
  cnpj: string | null;
  email: string | null;
  created_at: string | null;
}

export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
      if (error) throw error;
      return data as FornecedorRow[];
    },
  });
}

export function useCreateFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Omit<FornecedorRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('fornecedores').insert(f).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fornecedores'] }); toast.success('Fornecedor cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar fornecedor'),
  });
}
