import { useMemo } from 'react';
import { useDietas } from '@/hooks/useDietas';
import { useInsumos } from '@/hooks/useInsumos';
import { usePesagens } from '@/hooks/usePesagens';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

function useAllIngredientes() {
  return useQuery({
    queryKey: ['all_dieta_ingredientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dieta_ingredientes').select('*');
      if (error) throw error;
      return data;
    },
  });
}

function useConsumos() {
  return useQuery({
    queryKey: ['consumo_racao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consumo_racao').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export default function CustosTab() {
  const { data: dietas = [] } = useDietas();
  const { data: insumos = [] } = useInsumos();
  const { data: ingredientes = [] } = useAllIngredientes();
  const { data: lotes = [] } = useLotesConfinamento();
  const { data: animaisConf = [] } = useAnimaisConfinamento();
  const { data: consumos = [] } = useConsumos();
  const { data: pesagens = [] } = usePesagens();

  const getInsumoPreco = (id: string) => Number(insumos.find(i => i.id === id)?.preco_compra || 0);

  const dietaCustos = useMemo(() => {
    return dietas.map((d: any) => {
      const ings = ingredientes.filter(i => i.dieta_id === d.id);
      const custoDiario = ings.reduce((s, i) => s + Number(i.quantidade_kg) * getInsumoPreco(i.insumo_id), 0);
      return { ...d, custoDiario, nIngredientes: ings.length };
    });
  }, [dietas, ingredientes, insumos]);

  const loteCustos = useMemo(() => {
    return lotes.filter(l => l.status === 'ativo').map(lote => {
      const nAnimais = animaisConf.filter(a => a.lote_id === lote.id && a.status === 'ativo').length;
      const animalIds = animaisConf.filter(a => a.lote_id === lote.id && a.status === 'ativo').map(a => a.animal_id);
      
      // Custo by consumo real
      const loteConsumos = consumos.filter(c => c.lote_id === lote.id);
      const consumoTotal = loteConsumos.reduce((s, c) => s + Number(c.quantidade) - Number((c as any).sobras || 0), 0);
      const custoConsumo = loteConsumos.reduce((s, c) => {
        const preco = getInsumoPreco(c.insumo_id);
        return s + (Number(c.quantidade) - Number((c as any).sobras || 0)) * preco;
      }, 0);

      // Ganho de peso
      const ganhoTotal = animalIds.reduce((s, animalId) => {
        const pesoEntrada = animaisConf.find(a => a.animal_id === animalId)?.peso_entrada || 0;
        const ps = pesagens.filter(p => p.animal_id === animalId).sort((a, b) => a.data.localeCompare(b.data));
        const pesoAtual = ps.length > 0 ? Number(ps[ps.length - 1].peso) : Number(pesoEntrada);
        return s + (pesoAtual - Number(pesoEntrada));
      }, 0);

      const custoPorKgGanho = ganhoTotal > 0 ? custoConsumo / ganhoTotal : 0;
      const custoPorAnimalDia = nAnimais > 0 && loteConsumos.length > 0 ? custoConsumo / nAnimais / Math.max(1, loteConsumos.length) : 0;

      return { lote, nAnimais, custoConsumo, custoPorAnimalDia, custoPorKgGanho, ganhoTotal };
    });
  }, [lotes, animaisConf, consumos, pesagens, insumos]);

  const custoTotalGeral = loteCustos.reduce((s, l) => s + l.custoConsumo, 0);

  return (
    <div className="space-y-4">
      {/* Global summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-accent/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><DollarSign className="w-3.5 h-3.5 text-accent" /> Custo Total Nutrição</div>
          <p className="text-xl font-bold text-accent">R$ {custoTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><BarChart3 className="w-3.5 h-3.5 text-primary" /> Dietas Cadastradas</div>
          <p className="text-xl font-bold text-foreground">{dietas.length}</p>
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendingUp className="w-3.5 h-3.5 text-success" /> Lotes Ativos</div>
          <p className="text-xl font-bold text-foreground">{loteCustos.length}</p>
        </div>
      </div>

      {/* Custo por Dieta */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="font-display text-sm text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-accent" /> Custo por Dieta</h3>
        </div>
        {dietaCustos.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma dieta cadastrada.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {dietaCustos.sort((a, b) => b.custoDiario - a.custoDiario).map(d => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{d.nome}</p>
                  <p className="text-xs text-muted-foreground">{d.nIngredientes} ingrediente{d.nIngredientes !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${d.custoDiario > 15 ? 'text-destructive' : 'text-accent'}`}>R$ {d.custoDiario.toFixed(2)}/animal/dia</p>
                  <p className="text-[10px] text-muted-foreground">R$ {(d.custoDiario * 30).toFixed(2)}/mês</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custo por Lote */}
      {loteCustos.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50">
            <h3 className="font-display text-sm text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" /> Custo por Lote</h3>
          </div>
          <div className="divide-y divide-border/50">
            {loteCustos.map(({ lote, nAnimais, custoConsumo, custoPorAnimalDia, custoPorKgGanho }) => (
              <div key={lote.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-card-foreground">{lote.nome}</p>
                    <Badge variant="outline" className="text-[10px]">{nAnimais} animais</Badge>
                  </div>
                  <p className="text-sm font-bold text-accent">R$ {custoConsumo.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/20 rounded-lg p-2">
                    <span className="text-muted-foreground">Custo/animal/dia: </span>
                    <span className="font-medium text-foreground">R$ {custoPorAnimalDia.toFixed(2)}</span>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2">
                    <span className="text-muted-foreground">Custo/kg ganho: </span>
                    <span className={`font-medium ${custoPorKgGanho > 0 && custoPorKgGanho <= 8 ? 'text-success' : custoPorKgGanho > 8 ? 'text-destructive' : 'text-foreground'}`}>
                      {custoPorKgGanho > 0 ? `R$ ${custoPorKgGanho.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
