import { useMemo } from 'react';
import { useDietas } from '@/hooks/useDietas';
import { useInsumos } from '@/hooks/useInsumos';
import { usePesagens } from '@/hooks/usePesagens';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { useAnimais } from '@/hooks/useAnimais';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Package, Activity, CheckCircle } from 'lucide-react';

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

const COLORS = ['hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--destructive))'];

export default function NutricaoDashboard() {
  const { data: lotes = [] } = useLotesConfinamento();
  const { data: animaisConf = [] } = useAnimaisConfinamento();
  const { data: consumos = [] } = useConsumos();
  const { data: pesagens = [] } = usePesagens();
  const { data: insumos = [] } = useInsumos();
  const { data: dietas = [] } = useDietas();
  const { data: ingredientes = [] } = useAllIngredientes();
  const { data: animais = [] } = useAnimais();

  const getInsumoPreco = (id: string) => Number(insumos.find(i => i.id === id)?.preco_compra || 0);
  const lotesAtivos = lotes.filter(l => l.status === 'ativo');

  // Consumo por lote chart
  const consumoPorLote = useMemo(() => {
    return lotesAtivos.map(l => {
      const total = consumos.filter(c => c.lote_id === l.id).reduce((s, c) => s + Number(c.quantidade) - Number((c as any).sobras || 0), 0);
      return { nome: l.nome, consumo: Math.round(total) };
    }).filter(x => x.consumo > 0);
  }, [lotesAtivos, consumos]);

  // GMD por lote
  const gmdPorLote = useMemo(() => {
    return lotesAtivos.map(l => {
      const animalIds = animaisConf.filter(a => a.lote_id === l.id && a.status === 'ativo').map(a => a.animal_id);
      const gmds = animalIds.map(id => {
        const ps = pesagens.filter(p => p.animal_id === id && p.gmd).sort((a, b) => b.data.localeCompare(a.data));
        return ps.length > 0 ? Number(ps[0].gmd) : 0;
      }).filter(g => g > 0);
      const avg = gmds.length > 0 ? gmds.reduce((s, g) => s + g, 0) / gmds.length : 0;
      return { nome: l.nome, gmd: parseFloat(avg.toFixed(2)) };
    }).filter(x => x.gmd > 0);
  }, [lotesAtivos, animaisConf, pesagens]);

  // Custo por lote (pie)
  const custoPorLote = useMemo(() => {
    return lotesAtivos.map(l => {
      const total = consumos.filter(c => c.lote_id === l.id).reduce((s, c) => {
        return s + (Number(c.quantidade) - Number((c as any).sobras || 0)) * getInsumoPreco(c.insumo_id);
      }, 0);
      return { nome: l.nome, custo: Math.round(total) };
    }).filter(x => x.custo > 0);
  }, [lotesAtivos, consumos, insumos]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; msg: string }[] = [];
    // Low stock
    insumos.filter(i => Number(i.quantidade) <= Number(i.minimo) && Number(i.minimo) > 0).forEach(i => {
      list.push({ type: 'danger', msg: `Estoque baixo: ${i.nome} (${Number(i.quantidade)} ${i.unidade})` });
    });
    // High cost diets
    (dietas as any[]).filter(d => d.status === 'ativo').forEach(d => {
      const ings = ingredientes.filter(i => i.dieta_id === d.id);
      const custo = ings.reduce((s, i) => s + Number(i.quantidade_kg) * getInsumoPreco(i.insumo_id), 0);
      if (custo > 20) list.push({ type: 'warning', msg: `Dieta "${d.nome}" com custo elevado: R$ ${custo.toFixed(2)}/animal/dia` });
    });
    // Low GMD
    lotesAtivos.forEach(l => {
      const animalIds = animaisConf.filter(a => a.lote_id === l.id && a.status === 'ativo').map(a => a.animal_id);
      const gmds = animalIds.map(id => {
        const ps = pesagens.filter(p => p.animal_id === id && p.gmd).sort((a, b) => b.data.localeCompare(a.data));
        return ps.length > 0 ? Number(ps[0].gmd) : 0;
      }).filter(g => g > 0);
      const avg = gmds.length > 0 ? gmds.reduce((s, g) => s + g, 0) / gmds.length : 0;
      if (avg > 0 && avg < 0.5) list.push({ type: 'warning', msg: `Queda no ganho de peso: ${l.nome} (GMD: ${avg.toFixed(2)} kg/dia)` });
    });
    return list;
  }, [insumos, dietas, ingredientes, lotesAtivos, animaisConf, pesagens]);

  const totalAnimaisConf = animaisConf.filter(a => a.status === 'ativo').length;
  const consumoTotal = consumos.reduce((s, c) => s + Number(c.quantidade) - Number((c as any).sobras || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Activity className="w-3.5 h-3.5 text-primary" /> Animais Confinados</div>
          <p className="text-xl font-bold text-foreground">{totalAnimaisConf}</p>
        </div>
        <div className="bg-accent/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Package className="w-3.5 h-3.5 text-accent" /> Consumo Total</div>
          <p className="text-xl font-bold text-accent">{consumoTotal.toFixed(0)} kg</p>
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendingUp className="w-3.5 h-3.5 text-success" /> Dietas Ativas</div>
          <p className="text-xl font-bold text-success">{(dietas as any[]).filter(d => d.status === 'ativo').length}</p>
        </div>
        <div className={`rounded-2xl p-4 border border-border/50 ${alerts.filter(a => a.type === 'danger').length > 0 ? 'bg-destructive/5' : 'bg-success/5'}`}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            {alerts.length > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle className="w-3.5 h-3.5 text-success" />}
            Alertas
          </div>
          <p className={`text-xl font-bold ${alerts.length > 0 ? 'text-destructive' : 'text-success'}`}>{alerts.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-xl p-3 text-sm flex items-center gap-2 ${
              a.type === 'danger' ? 'bg-destructive/10 text-destructive' : a.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consumo por lote */}
        {consumoPorLote.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Consumo por Lote (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={consumoPorLote}>
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="consumo" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* GMD por lote */}
        {gmdPorLote.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">GMD por Lote (kg/dia)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gmdPorLote}>
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="gmd" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Custo por lote pie */}
        {custoPorLote.length > 0 && (
          <Card className="rounded-2xl md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Distribuição de Custos por Lote</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={custoPorLote} dataKey="custo" nameKey="nome" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {custoPorLote.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {custoPorLote.map((item, i) => (
                    <div key={item.nome} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.nome}:</span>
                      <span className="font-medium text-foreground">R$ {item.custo.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {consumoPorLote.length === 0 && gmdPorLote.length === 0 && (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            Registre consumos e pesagens para visualizar os gráficos.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
