import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { useDietas } from '@/hooks/useDietas';
import { useInsumos } from '@/hooks/useInsumos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Utensils, TrendingDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConsumoRow {
  id: string;
  lote_id: string;
  insumo_id: string;
  quantidade: number;
  sobras: number;
  data: string;
}

function useConsumos() {
  return useQuery({
    queryKey: ['consumo_racao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consumo_racao').select('*').order('data', { ascending: false }).limit(100);
      if (error) throw error;
      return data as ConsumoRow[];
    },
  });
}

export default function ConsumoTab() {
  const { data: lotes = [] } = useLotesConfinamento();
  const { data: animaisConf = [] } = useAnimaisConfinamento();
  const { data: dietas = [] } = useDietas();
  const { data: insumos = [] } = useInsumos();
  const { data: consumos = [] } = useConsumos();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lote_id: '', insumo_id: '', quantidade: '', sobras: '0', data: new Date().toISOString().split('T')[0] });

  const lotesAtivos = lotes.filter(l => l.status === 'ativo');

  const handleSave = async () => {
    if (!form.lote_id || !form.insumo_id || !form.quantidade) { toast.error('Preencha os campos obrigatórios'); return; }
    const qty = parseFloat(form.quantidade);
    const sobras = parseFloat(form.sobras) || 0;
    const consumoReal = qty - sobras;

    // Insert consumo
    const { error } = await supabase.from('consumo_racao').insert({
      lote_id: form.lote_id, insumo_id: form.insumo_id, quantidade: qty, sobras, data: form.data,
    } as any);
    if (error) { toast.error('Erro ao registrar'); return; }

    // Update stock
    const { data: insumo } = await supabase.from('insumos').select('quantidade').eq('id', form.insumo_id).single();
    if (insumo) {
      await supabase.from('insumos').update({ quantidade: Math.max(0, Number(insumo.quantidade) - consumoReal) }).eq('id', form.insumo_id);
    }
    const loteNome = lotes.find(l => l.id === form.lote_id)?.nome || '';
    await supabase.from('movimentacoes_estoque').insert({
      insumo_id: form.insumo_id, tipo: 'saida', quantidade: consumoReal,
      data: form.data, observacao: `Consumo nutrição - Lote: ${loteNome}`,
    });

    qc.invalidateQueries({ queryKey: ['consumo_racao'] });
    qc.invalidateQueries({ queryKey: ['insumos'] });
    qc.invalidateQueries({ queryKey: ['movimentacoes'] });
    toast.success('Consumo registrado!');
    setShowForm(false);
    setForm({ lote_id: '', insumo_id: '', quantidade: '', sobras: '0', data: new Date().toISOString().split('T')[0] });
  };

  const getInsumoNome = (id: string) => insumos.find(i => i.id === id)?.nome || '?';
  const getLoteNome = (id: string) => lotes.find(l => l.id === id)?.nome || '?';
  const getAnimaisNoLote = (loteId: string) => animaisConf.filter(a => a.lote_id === loteId && a.status === 'ativo').length;

  // Summary per lote
  const loteSummary = lotesAtivos.map(lote => {
    const loteConsumos = consumos.filter(c => c.lote_id === lote.id);
    const totalConsumo = loteConsumos.reduce((s, c) => s + Number(c.quantidade) - Number(c.sobras || 0), 0);
    const totalSobras = loteConsumos.reduce((s, c) => s + Number(c.sobras || 0), 0);
    const nAnimais = getAnimaisNoLote(lote.id);
    const consumoPorAnimal = nAnimais > 0 ? totalConsumo / nAnimais : 0;
    const eficiencia = loteConsumos.length > 0 ? ((totalConsumo / (totalConsumo + totalSobras)) * 100) : 0;
    return { lote, totalConsumo, totalSobras, nAnimais, consumoPorAnimal, eficiencia, registros: loteConsumos.length };
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Registrar Consumo
        </Button>
      </div>

      {loteSummary.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum lote de confinamento ativo. Crie lotes na aba de Confinamento.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loteSummary.map(({ lote, totalConsumo, totalSobras, nAnimais, consumoPorAnimal, eficiencia, registros }) => (
            <Card key={lote.id} className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-accent" /> {lote.nome}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{nAnimais} animais</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Consumo Total</p>
                    <p className="font-bold text-foreground">{totalConsumo.toFixed(0)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Consumo/Animal</p>
                    <p className="font-bold text-foreground">{consumoPorAnimal.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sobras</p>
                    <p className={`font-bold ${totalSobras > 0 ? 'text-warning' : 'text-success'}`}>{totalSobras.toFixed(0)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Eficiência</p>
                    <p className={`font-bold ${eficiencia >= 90 ? 'text-success' : eficiencia >= 70 ? 'text-warning' : 'text-destructive'}`}>
                      {eficiencia > 0 ? `${eficiencia.toFixed(0)}%` : '—'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{registros} registro{registros !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent consumos */}
      {consumos.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50">
            <h3 className="font-display text-foreground text-sm">Últimos Registros</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
            {consumos.slice(0, 20).map(c => (
              <div key={c.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-card-foreground font-medium">{getLoteNome(c.lote_id)} — {getInsumoNome(c.insumo_id)}</p>
                  <p className="text-xs text-muted-foreground">{c.data}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{Number(c.quantidade)} kg</p>
                  {Number(c.sobras) > 0 && <p className="text-xs text-warning">Sobra: {Number(c.sobras)} kg</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Registrar Consumo</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lote *</Label>
              <Select value={form.lote_id} onValueChange={v => setForm({ ...form, lote_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o lote" /></SelectTrigger>
                <SelectContent>
                  {lotesAtivos.map(l => <SelectItem key={l.id} value={l.id}>{l.nome} ({getAnimaisNoLote(l.id)} animais)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alimento (ração) *</Label>
              <Select value={form.insumo_id} onValueChange={v => setForm({ ...form, insumo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione do depósito" /></SelectTrigger>
                <SelectContent>
                  {insumos.filter(i => {
                    const cat = (i.categoria || '').toLowerCase();
                    return cat === 'alimento' || cat === 'alimentos' || cat.includes('raç') || cat.includes('racao') || cat === 'ração';
                  }).map(i => <SelectItem key={i.id} value={i.id}>{i.nome} ({Number(i.quantidade)} {i.unidade})</SelectItem>)}
                  {insumos.filter(i => {
                    const cat = (i.categoria || '').toLowerCase();
                    return cat === 'alimento' || cat === 'alimentos' || cat.includes('raç') || cat.includes('racao') || cat === 'ração';
                  }).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum insumo com categoria "alimento" ou "ração". Cadastre no Depósito.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Qtd fornecida (kg) *</Label>
                <Input type="number" placeholder="Ex: 200" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sobras (kg)</Label>
                <Input type="number" placeholder="0" value={form.sobras} onChange={e => setForm({ ...form, sobras: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="text-foreground" />
              </div>
            </div>
            {form.quantidade && (
              <div className="bg-accent/10 rounded-xl p-3 text-sm">
                Consumo real: <span className="font-bold text-accent">{(parseFloat(form.quantidade) - parseFloat(form.sobras || '0')).toFixed(1)} kg</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
