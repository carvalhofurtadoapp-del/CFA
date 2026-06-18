import { useState, useMemo } from 'react';
import { useAnimais } from '@/hooks/useAnimais';
import { usePesagens } from '@/hooks/usePesagens';
import { useGastos } from '@/hooks/useGastos';
import { useVacinas } from '@/hooks/useVacinas';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { useInsumos } from '@/hooks/useInsumos';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { useLotesRebanho } from '@/hooks/useLotesRebanho';
import { useTalhoes } from '@/hooks/useTalhoes';
import { useFuncionarios, useAllDiasTrabalhados } from '@/hooks/useFuncionarios';
import { Loader2, Syringe, Package, Calendar, TrendingUp } from 'lucide-react';

import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { ValuationCard } from '@/components/dashboard/ValuationCard';
import { WeightChart } from '@/components/dashboard/WeightChart';
import { GmdChart } from '@/components/dashboard/GmdChart';
import { HerdCompositionChart } from '@/components/dashboard/HerdCompositionChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { AlertsList, type AlertItem } from '@/components/dashboard/AlertsList';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SimulationPanel } from '@/components/dashboard/SimulationPanel';
import { PatrimonioCard } from '@/components/dashboard/PatrimonioCard';
import { GastosPorCategoria } from '@/components/dashboard/GastosPorCategoria';
import { LavouraIndicators } from '@/components/dashboard/LavouraIndicators';
import { LancamentosPopup } from '@/components/financeiro/LancamentosPopup';

export default function DashboardPage() {
  const { data: animais = [], isLoading: loadingAnimais } = useAnimais();
  const { data: pesagens = [], isLoading: loadingPesagens } = usePesagens();
  const { data: gastos = [] } = useGastos();
  const { data: vacinas = [] } = useVacinas();
  const { data: equipamentos = [] } = useEquipamentos();
  const { data: insumos = [] } = useInsumos();
  const { data: lotes = [] } = useLotesConfinamento();
  const { data: animaisConfinamento = [] } = useAnimaisConfinamento();
  const { data: lotesRebanho = [] } = useLotesRebanho();
  const { data: talhoes = [] } = useTalhoes();
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: diasTrabalhados = [] } = useAllDiasTrabalhados();

  const [precoArroba, setPrecoArroba] = useState(() => localStorage.getItem('preco_arroba') || '300');
  const [periodo, setPeriodo] = useState('all');
  const [loteFilter, setLoteFilter] = useState('all');
  const [drilldownCat, setDrilldownCat] = useState<string | null>(null);

  if (loadingAnimais || loadingPesagens) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const handlePrecoArrobaChange = (val: string) => { setPrecoArroba(val); localStorage.setItem('preco_arroba', val); };

  const cutoffDate = periodo === 'all' ? null : new Date(Date.now() - parseInt(periodo) * 86400000).toISOString().split('T')[0];
  const filterByDate = <T extends { data: string }>(arr: T[]) => cutoffDate ? arr.filter(i => i.data >= cutoffDate) : arr;

  const filteredPesagens = filterByDate(pesagens);
  const filteredGastos = filterByDate(gastos);

  const animaisAtivos = animais.filter(a => a.status === 'ativo');
  const totalAtivos = animaisAtivos.length;
  const confinados = animais.filter(a => a.data_confinamento && a.status === 'ativo').length;

  // Latest weight per animal
  const pesoPorAnimal = new Map<string, number>();
  pesagens.slice().reverse().forEach(p => { if (!pesoPorAnimal.has(p.animal_id)) pesoPorAnimal.set(p.animal_id, Number(p.peso)); });

  const pesosAtivos = animaisAtivos.map(a => pesoPorAnimal.get(a.id)).filter(Boolean) as number[];
  const mediaPeso = pesosAtivos.length ? Math.round(pesosAtivos.reduce((s, p) => s + p, 0) / pesosAtivos.length) : 0;

  const gmds = filteredPesagens.filter(p => p.gmd).map(p => Number(p.gmd));
  const gmdMedioNum = gmds.length ? gmds.reduce((s, g) => s + g, 0) / gmds.length : 0;
  const gmdMedio = gmdMedioNum.toFixed(2);

  // Financial
  const mesAtual = new Date().toISOString().substring(0, 7);
  const totalEntradas = filteredGastos.filter(g => g.tipo === 'entrada').reduce((s, g) => s + Number(g.valor), 0);
  const totalSaidas = filteredGastos.filter(g => g.tipo === 'saida').reduce((s, g) => s + Number(g.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  const vendasMes = gastos.filter(g => g.tipo === 'entrada' && g.data.startsWith(mesAtual)).reduce((s, g) => s + Number(g.valor), 0);

  // Gastos do mês
  const gastosMes = gastos.filter(g => g.data.startsWith(mesAtual));
  const totalGastoMes = gastosMes.filter(g => g.tipo === 'saida').reduce((s, g) => s + Number(g.valor), 0);
  const faturamentoMes = gastosMes.filter(g => g.tipo === 'entrada').reduce((s, g) => s + Number(g.valor), 0);
  const lucroMes = faturamentoMes - totalGastoMes;

  // Custo funcionários no mês
  const funcAtivos = funcionarios.filter((f: any) => f.status === 'ativo');
  const custoFuncMes = funcAtivos.reduce((sum: number, f: any) => {
    if (f.forma_pagamento === 'mensal') return sum + Number(f.valor_pagamento);
    const dias = diasTrabalhados.filter((d: any) => d.funcionario_id === f.id && d.data.startsWith(mesAtual));
    return sum + dias.length * Number(f.valor_pagamento);
  }, 0);

  // Valuation
  const arrobaPrice = parseFloat(precoArroba) || 0;
  let valorRebanho = 0;
  animaisAtivos.forEach(a => { const peso = pesoPorAnimal.get(a.id) || 0; valorRebanho += ((peso * 0.5) / 15) * arrobaPrice; });

  // Patrimônio total
  const valorEquipamentos = equipamentos.reduce((s, e: any) => s + (Number(e.valor_compra) || 0), 0);
  const valorInsumos = insumos.reduce((s, i: any) => s + (Number(i.quantidade) * (Number((i as any).preco_compra) || 0)), 0);
  const patrimonioTotal = valorRebanho + valorEquipamentos + valorInsumos;

  // Gastos por categoria
  const categorias = new Map<string, number>();
  gastosMes.filter(g => g.tipo === 'saida').forEach(g => {
    const cat = g.categoria || 'outros';
    categorias.set(cat, (categorias.get(cat) || 0) + Number(g.valor));
  });
  if (custoFuncMes > 0) categorias.set('funcionários', (categorias.get('funcionários') || 0) + custoFuncMes);
  const categoriasData = Array.from(categorias.entries()).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);

  // Weight chart
  const pesosPorMes = new Map<string, { total: number; count: number }>();
  filteredPesagens.forEach(p => { const m = p.data.substring(0, 7); const e = pesosPorMes.get(m) || { total: 0, count: 0 }; e.total += Number(p.peso); e.count += 1; pesosPorMes.set(m, e); });
  const weightChartData = Array.from(pesosPorMes.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([mes, { total, count }]) => ({ mes: mes.substring(5) + '/' + mes.substring(2, 4), peso: Math.round(total / count) }));

  // GMD chart
  const gmdPorMes = new Map<string, { total: number; count: number }>();
  filteredPesagens.filter(p => p.gmd).forEach(p => { const m = p.data.substring(0, 7); const e = gmdPorMes.get(m) || { total: 0, count: 0 }; e.total += Number(p.gmd); e.count += 1; gmdPorMes.set(m, e); });
  const gmdChartData = Array.from(gmdPorMes.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([mes, { total, count }]) => ({ mes: mes.substring(5) + '/' + mes.substring(2, 4), gmd: parseFloat((total / count).toFixed(2)) }));

  // Cash flow chart
  const cashByMonth = new Map<string, { entradas: number; saidas: number }>();
  filteredGastos.forEach(g => { const m = g.data.substring(0, 7); const e = cashByMonth.get(m) || { entradas: 0, saidas: 0 }; if (g.tipo === 'entrada') e.entradas += Number(g.valor); else e.saidas += Number(g.valor); cashByMonth.set(m, e); });
  const cashFlowData = Array.from(cashByMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, { entradas, saidas }]) => ({ mes: mes.substring(5) + '/' + mes.substring(2, 4), entradas: Math.round(entradas), saidas: Math.round(saidas) }));

  const machos = animaisAtivos.filter(a => a.sexo === 'macho').length;
  const femeas = animaisAtivos.filter(a => a.sexo === 'femea').length;

  // Alerts
  const alertItems: AlertItem[] = [];
  const hoje = new Date().toISOString().split('T')[0];
  const vacinasPendentes = vacinas.filter(v => v.status === 'pendente');
  if (vacinasPendentes.length > 0) alertItems.push({ icon: Syringe, label: `${vacinasPendentes.length} vacina(s) pendente(s)`, detail: vacinasPendentes.slice(0, 2).map(v => v.nome).join(', '), color: 'text-destructive', priority: 'critical' });
  const insumosAbaixo = insumos.filter(i => Number(i.quantidade) <= Number(i.minimo) && Number(i.minimo) > 0);
  if (insumosAbaixo.length > 0) alertItems.push({ icon: Package, label: `${insumosAbaixo.length} insumo(s) abaixo do mínimo`, detail: insumosAbaixo.slice(0, 2).map(i => i.nome).join(', '), color: 'text-destructive', priority: 'critical' });
  const manutencaoProxima = equipamentos.filter(e => e.proxima_manutencao && e.proxima_manutencao <= hoje);
  if (manutencaoProxima.length > 0) alertItems.push({ icon: Calendar, label: `${manutencaoProxima.length} manutenção(ões) atrasada(s)`, detail: manutencaoProxima.slice(0, 2).map(e => e.nome).join(', '), color: 'text-info', priority: 'warning' });
  const lowGmd = gmds.filter(g => g < 0.5);
  if (lowGmd.length > 0) alertItems.push({ icon: TrendingUp, label: `${lowGmd.length} pesagem(ns) com GMD baixo`, detail: 'GMD < 0.5 kg/dia detectado', color: 'text-warning', priority: 'warning' });

  const lotesOptions = lotes.map(l => ({ id: l.id, nome: l.nome }));

  // Lavoura data
  const talhoesAtivos = talhoes.filter((t: any) => t.status === 'ativo');
  const areaTotal = talhoes.reduce((s, t: any) => s + Number(t.area_hectares), 0);
  const custoLavoura = talhoes.reduce((s, t: any) => s + (Number(t.custo_sementes) || 0) + (Number(t.custo_fertilizantes) || 0) + (Number(t.custo_defensivos) || 0) + (Number(t.custo_mao_obra) || 0) + (Number(t.custo_maquinas) || 0), 0);
  const faturamentoLavoura = talhoes.reduce((s, t: any) => s + (Number(t.valor_venda_producao) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua propriedade</p>
        </div>
        <DashboardFilters periodo={periodo} setPeriodo={setPeriodo} lote={loteFilter} setLote={setLoteFilter} lotes={lotesOptions} />
      </div>

      <KpiCards totalAtivos={totalAtivos} mediaPeso={mediaPeso} gmdMedio={gmdMedio} alertCount={alertItems.length} confinados={confinados} valorRebanho={valorRebanho} vendasMes={vendasMes} hasAlerts={alertItems.length > 0} />

      {/* Patrimônio + P&L Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PatrimonioCard patrimonioTotal={patrimonioTotal} valorRebanho={valorRebanho} valorEquipamentos={valorEquipamentos} valorInsumos={valorInsumos} />
        <FinancialSummary totalEntradas={faturamentoMes} totalSaidas={totalGastoMes + custoFuncMes} saldo={lucroMes - custoFuncMes} totalMovimentacoes={gastosMes.length} label="Resultado do Mês" />
      </div>

      <ValuationCard valorRebanho={valorRebanho} animaisCount={animaisAtivos.length} precoArroba={precoArroba} onPrecoChange={handlePrecoArrobaChange} />

      {/* Gastos por Categoria + Lavoura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GastosPorCategoria data={categoriasData} onCategoryClick={(nome) => setDrilldownCat(nome)} />
        <LavouraIndicators talhoesAtivos={talhoesAtivos.length} areaTotal={areaTotal} custoTotal={custoLavoura} faturamento={faturamentoLavoura} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeightChart data={weightChartData} />
        <GmdChart pesagens={pesagens} animais={animais} lotesConfinamento={lotes} animaisConfinamento={animaisConfinamento} lotesRebanho={lotesRebanho} cutoffDate={cutoffDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><CashFlowChart data={cashFlowData} /></div>
        <HerdCompositionChart machos={machos} femeas={femeas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertsList alerts={alertItems} />
        <FinancialSummary totalEntradas={totalEntradas} totalSaidas={totalSaidas} saldo={saldo} totalMovimentacoes={filteredGastos.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuickActions />
        <SimulationPanel mediaPeso={mediaPeso} gmdMedio={gmdMedioNum} animaisCount={animaisAtivos.length} precoArroba={arrobaPrice} />
      </div>

      <LancamentosPopup
        open={!!drilldownCat}
        onClose={() => setDrilldownCat(null)}
        title={drilldownCat ? `Categoria: ${drilldownCat}` : ''}
        subtitle="Mês atual"
        lancamentos={drilldownCat && drilldownCat !== 'funcionários'
          ? gastosMes.filter(g => g.tipo === 'saida' && (g.categoria || 'outros').toLowerCase() === drilldownCat.toLowerCase())
          : []}
      />
    </div>
  );
}
