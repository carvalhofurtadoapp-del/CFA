import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessaoServicoRow {
  id: string;
  equipamento_id: string;
  inicio: string;
  fim: string | null;
  duracao_minutos: number;
  status: string;
  created_at: string | null;
}

export function useSessoesAtivas() {
  return useQuery({
    queryKey: ['sessoes_servico', 'ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessoes_servico')
        .select('*')
        .eq('status', 'ativo');
      if (error) throw error;
      return data as SessaoServicoRow[];
    },
    refetchInterval: 30000, // refresh every 30s to keep timers updated
  });
}

export function useIniciarServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (equipamentoId: string) => {
      const { data, error } = await supabase
        .from('sessoes_servico')
        .insert({ equipamento_id: equipamentoId, status: 'ativo' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessoes_servico'] });
      toast.success('Serviço iniciado!');
    },
    onError: () => toast.error('Erro ao iniciar serviço'),
  });
}

export function useFinalizarServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessaoId: string) => {
      // Get the session to calculate duration
      const { data: sessao, error: fetchErr } = await supabase
        .from('sessoes_servico')
        .select('*')
        .eq('id', sessaoId)
        .single();
      if (fetchErr || !sessao) throw fetchErr || new Error('Sessão não encontrada');

      const inicio = new Date(sessao.inicio).getTime();
      const fim = Date.now();
      const duracaoMinutos = Math.round((fim - inicio) / 60000);

      // Update session
      const { error: updateErr } = await supabase
        .from('sessoes_servico')
        .update({ fim: new Date(fim).toISOString(), duracao_minutos: duracaoMinutos, status: 'finalizado' })
        .eq('id', sessaoId);
      if (updateErr) throw updateErr;

      // Add duration to equipment total hours
      const horasAdicionadas = duracaoMinutos / 60;
      const { data: equip } = await supabase
        .from('equipamentos')
        .select('horas_trabalhadas')
        .eq('id', sessao.equipamento_id)
        .single();

      const horasAtuais = Number(equip?.horas_trabalhadas || 0);
      const { error: eqErr } = await supabase
        .from('equipamentos')
        .update({ horas_trabalhadas: horasAtuais + horasAdicionadas })
        .eq('id', sessao.equipamento_id);
      if (eqErr) throw eqErr;

      return { duracaoMinutos, equipamentoId: sessao.equipamento_id };
    },
    onSuccess: ({ duracaoMinutos }) => {
      qc.invalidateQueries({ queryKey: ['sessoes_servico'] });
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      const h = Math.floor(duracaoMinutos / 60);
      const m = duracaoMinutos % 60;
      toast.success(`Serviço finalizado! Duração: ${h}h ${m}min`);
    },
    onError: () => toast.error('Erro ao finalizar serviço'),
  });
}
