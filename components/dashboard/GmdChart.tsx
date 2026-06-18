import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartTypeToggle, type ChartType } from './ChartTypeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Filter } from 'lucide-react';

interface PesagemLite {
  animal_id: string;
  data: string;
  gmd: number | null;
}

interface AnimalLite {
  id: string;
  brinco: string;
  nome?: string | null;
  status: string;
}

interface LoteConfLite {
  id: string;
  nome: string;
}

interface AnimalConfLite {
  animal_id: string;
  lote_id: string;
  status: string;
}

interface LoteRebanhoLite {
  id: string;
  nome: string;
}

interface AnimalLiteWithLote extends AnimalLite {
  lote_rebanho_id?: string | null;
}

interface GmdChartProps {
  pesagens: PesagemLite[];
  animais: AnimalLiteWithLote[];
  lotesConfinamento?: LoteConfLite[];
  animaisConfinamento?: AnimalConfLite[];
  lotesRebanho?: LoteRebanhoLite[];
  cutoffDate?: string | null;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
};

export function GmdChart({ pesagens, animais, lotesConfinamento = [], animaisConfinamento = [], lotesRebanho = [], cutoffDate = null }: GmdChartProps) {
  const [type, setType] = useState<ChartType>('area');
  const [scope, setScope] = useState<'all' | 'pasto' | 'lote' | 'animais'>('all');
  const [loteId, setLoteId] = useState<string>('');
  const [pastoId, setPastoId] = useState<string>('');
  const [selectedAnimais, setSelectedAnimais] = useState<string[]>([]);

  const animaisAtivos = useMemo(() => animais.filter(a => a.status === 'ativo'), [animais]);

  // Determine which animal IDs to include
  const animalIdsFilter = useMemo<Set<string> | null>(() => {
    if (scope === 'all') return null;
    if (scope === 'lote') {
      if (!loteId) return new Set();
      const ids = animaisConfinamento.filter(ac => ac.lote_id === loteId).map(ac => ac.animal_id);
      return new Set(ids);
    }
    if (scope === 'pasto') {
      if (!pastoId) return new Set();
      const ids = animais.filter(a => (a.lote_rebanho_id || '') === pastoId).map(a => a.id);
      return new Set(ids);
    }
    return new Set(selectedAnimais);
  }, [scope, loteId, pastoId, selectedAnimais, animaisConfinamento, animais]);

  const data = useMemo(() => {
    const filtered = pesagens.filter(p => {
      if (!p.gmd) return false;
      if (cutoffDate && p.data < cutoffDate) return false;
      if (animalIdsFilter && !animalIdsFilter.has(p.animal_id)) return false;
      return true;
    });
    const map = new Map<string, { total: number; count: number }>();
    filtered.forEach(p => {
      const m = p.data.substring(0, 7);
      const e = map.get(m) || { total: 0, count: 0 };
      e.total += Number(p.gmd);
      e.count += 1;
      map.set(m, e);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([mes, { total, count }]) => ({ mes: mes.substring(5) + '/' + mes.substring(2, 4), gmd: parseFloat((total / count).toFixed(2)) }));
  }, [pesagens, cutoffDate, animalIdsFilter]);

  const toggleAnimal = (id: string) => {
    setSelectedAnimais(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 'auto']} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} kg/dia`, 'GMD']} />
      <ReferenceLine y={0.5} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: 'Mín 0.5', fill: 'hsl(var(--warning))', fontSize: 10 }} />
    </>
  );

  const renderChart = () => {
    if (type === 'line') {
      return (
        <LineChart data={data}>
          {common}
          <Line type="monotone" dataKey="gmd" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--accent))' }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }
    if (type === 'bar') {
      return (
        <BarChart data={data}>
          {common}
          <Bar dataKey="gmd" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }
    return (
      <AreaChart data={data}>
        {common}
        <Area type="monotone" dataKey="gmd" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--accent))' }} />
      </AreaChart>
    );
  };

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-display">Evolução do GMD (kg/dia)</CardTitle>
          <ChartTypeToggle value={type} onChange={setType} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            Filtro:
          </div>
          <Select value={scope} onValueChange={(v: any) => { setScope(v); setLoteId(''); setPastoId(''); setSelectedAnimais([]); }}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os animais</SelectItem>
              <SelectItem value="pasto" disabled={lotesRebanho.length === 0}>Por pasto (rebanho)</SelectItem>
              <SelectItem value="lote" disabled={lotesConfinamento.length === 0}>Por lote (confinamento)</SelectItem>
              <SelectItem value="animais">Selecionar animais</SelectItem>
            </SelectContent>
          </Select>

          {scope === 'pasto' && (
            <Select value={pastoId} onValueChange={setPastoId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Selecione um pasto" />
              </SelectTrigger>
              <SelectContent>
                {lotesRebanho.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === 'lote' && (
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Selecione um lote" />
              </SelectTrigger>
              <SelectContent>
                {lotesConfinamento.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === 'animais' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {selectedAnimais.length > 0 ? `${selectedAnimais.length} selecionado(s)` : 'Escolher animais'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-xs font-medium">Animais ativos</span>
                  {selectedAnimais.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedAnimais([])}>Limpar</Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {animaisAtivos.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Nenhum animal ativo</p>
                  ) : animaisAtivos.map(a => (
                    <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={selectedAnimais.includes(a.id)} onCheckedChange={() => toggleAnimal(a.id)} />
                      <span className="text-xs flex-1">
                        <span className="font-medium">{a.brinco}</span>
                        {a.nome && <span className="text-muted-foreground"> · {a.nome}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {animalIdsFilter && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {animalIdsFilter.size} animal(is)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>{renderChart()}</ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm text-center px-4">
            {scope !== 'all' && animalIdsFilter && animalIdsFilter.size === 0
              ? 'Selecione um lote ou animais para visualizar'
              : 'Sem dados de GMD disponíveis para o filtro selecionado'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
