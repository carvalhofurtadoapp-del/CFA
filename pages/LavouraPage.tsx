import { useState } from 'react';
import { useTalhoes, useCreateTalhao, useDeleteTalhao } from '@/hooks/useTalhoes';
import { useFornecedores } from '@/hooks/useFornecedores';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sprout, Plus, Trash2, Loader2, MapPin, Pencil, DollarSign, TrendingUp, ShoppingCart, History, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { gerarNotaVendaLavoura } from '@/lib/notaPdf';
import { useQuery } from '@tanstack/react-query';

export default function LavouraPage() {
  const { data: talhoes = [], isLoading } = useTalhoes();
  const { data: fornecedoresList = [] } = useFornecedores();

  // Sales history (entradas in 'Venda Lavoura' category)
  const { data: vendasLavoura = [] } = useQuery({
    queryKey: ['vendas-lavoura'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gastos').select('*').eq('categoria', 'Venda Lavoura').eq('tipo', 'entrada').order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // History dialog state
  const [showHistory, setShowHistory] = useState(false);
  const [historyTalhao, setHistoryTalhao] = useState<any>(null);
  const createTalhao = useCreateTalhao();
  const deleteTalhao = useDeleteTalhao();
  const qc = useQueryClient();

  // Sale dialog state
  const [showSale, setShowSale] = useState(false);
  const [saleTalhao, setSaleTalhao] = useState<any>(null);
  const [saleForm, setSaleForm] = useState({ quantidade: '', valor: '', fornecedor: '', data: new Date().toISOString().split('T')[0], observacao: '' });

  const openSale = (t: any) => {
    setSaleTalhao(t);
    setSaleForm({ quantidade: '', valor: '', fornecedor: '', data: new Date().toISOString().split('T')[0], observacao: '' });
    setShowSale(true);
  };

  const handleSale = async () => {
    if (!saleTalhao) return;
    const valor = parseFloat(saleForm.valor);
    const qtd = parseFloat(saleForm.quantidade);
    if (!valor || valor <= 0) { toast.error('Informe o valor da venda'); return; }
    if (!qtd || qtd <= 0) { toast.error('Informe a quantidade vendida'); return; }
    const unidade = saleTalhao.unidade_producao || 'sacas';
    const desc = `Venda de ${saleTalhao.cultura || 'produção'} — ${saleTalhao.nome} (${qtd} ${unidade})${saleForm.observacao ? ' · ' + saleForm.observacao : ''}`;
    // 1) Create entrada in fluxo de caixa
    const { error: gErr } = await supabase.from('gastos').insert({
      descricao: desc,
      categoria: 'Venda Lavoura',
      valor,
      tipo: 'entrada',
      data: saleForm.data,
      fornecedor: saleForm.fornecedor || null,
    });
    if (gErr) { toast.error('Erro ao registrar venda no fluxo de caixa'); return; }
    // 2) Update talhão: accumulate produção and valor_venda
    const novaProducao = (Number(saleTalhao.producao_real) || 0) + qtd;
    const novoValor = (Number(saleTalhao.valor_venda_producao) || 0) + valor;
    await supabase.from('talhoes').update({
      producao_real: novaProducao,
      valor_venda_producao: novoValor,
      status: 'colhido',
    } as any).eq('id', saleTalhao.id);
    qc.invalidateQueries({ queryKey: ['talhoes'] });
    qc.invalidateQueries({ queryKey: ['gastos'] });
    qc.invalidateQueries({ queryKey: ['vendas-lavoura'] });
    toast.success('Venda registrada e lançada no fluxo de caixa!');
    setShowSale(false);
  };

  const openHistory = (t: any) => {
    setHistoryTalhao(t);
    setShowHistory(true);
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '', area: '', cultura: '', dataPlantio: '', previsaoColheita: '',
    status: 'ativo', observacao: '',
    custo_sementes: '', custo_fertilizantes: '', custo_defensivos: '',
    tipo_mao_obra: 'proprio' as 'proprio' | 'extra',
    custo_mao_obra: '', custo_maquinas: '',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      nome: '', area: '', cultura: '', dataPlantio: '', previsaoColheita: '',
      status: 'ativo', observacao: '',
      custo_sementes: '', custo_fertilizantes: '', custo_defensivos: '',
      tipo_mao_obra: 'proprio',
      custo_mao_obra: '', custo_maquinas: '',
    });
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      nome: t.nome,
      area: String(t.area_hectares),
      cultura: t.cultura || '',
      dataPlantio: t.data_plantio || '',
      previsaoColheita: t.previsao_colheita || '',
      status: t.status,
      observacao: t.observacao || '',
      custo_sementes: t.custo_sementes ? String(t.custo_sementes) : '',
      custo_fertilizantes: t.custo_fertilizantes ? String(t.custo_fertilizantes) : '',
      custo_defensivos: t.custo_defensivos ? String(t.custo_defensivos) : '',
      tipo_mao_obra: Number(t.custo_mao_obra) > 0 ? 'extra' : 'proprio',
      custo_mao_obra: t.custo_mao_obra ? String(t.custo_mao_obra) : '',
      custo_maquinas: t.custo_maquinas ? String(t.custo_maquinas) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.area) return;
    const payload: any = {
      nome: form.nome.trim(),
      area_hectares: parseFloat(form.area),
      cultura: form.cultura.trim() || null,
      data_plantio: form.dataPlantio || null,
      previsao_colheita: form.previsaoColheita || null,
      status: form.status,
      observacao: form.observacao.trim() || null,
      custo_sementes: parseFloat(form.custo_sementes) || 0,
      custo_fertilizantes: parseFloat(form.custo_fertilizantes) || 0,
      custo_defensivos: parseFloat(form.custo_defensivos) || 0,
      custo_mao_obra: form.tipo_mao_obra === 'extra' ? (parseFloat(form.custo_mao_obra) || 0) : 0,
      custo_maquinas: parseFloat(form.custo_maquinas) || 0,
    };
    if (editingId) {
      const { error } = await supabase.from('talhoes').update(payload as any).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      qc.invalidateQueries({ queryKey: ['talhoes'] });
      toast.success('Talhão atualizado!');
    } else {
      createTalhao.mutate(payload);
    }
    setShowForm(false);
    resetForm();
  };

  const statusColor = (s: string) => {
    if (s === 'ativo') return 'bg-success/10 text-success';
    if (s === 'colhido') return 'bg-info/10 text-info';
    return 'bg-muted text-muted-foreground';
  };

  const areaTotal = talhoes.reduce((s, t) => s + Number(t.area_hectares), 0);
  const ativos = talhoes.filter(t => t.status === 'ativo').length;

  // Financial calcs
  const custoTotal = talhoes.reduce((s, t: any) => {
    return s + (Number(t.custo_sementes) || 0) + (Number(t.custo_fertilizantes) || 0) + (Number(t.custo_defensivos) || 0) + (Number(t.custo_mao_obra) || 0) + (Number(t.custo_maquinas) || 0);
  }, 0);
  const faturamentoTotal = talhoes.reduce((s, t: any) => s + (Number(t.valor_venda_producao) || 0), 0);
  const lucroTotal = faturamentoTotal - custoTotal;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Lavoura</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de talhões, custos e produção</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Novo Talhão
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Ativos</p>
          <p className="text-xl font-bold text-foreground">{ativos}</p>
        </div>
        <div className="bg-info/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Área Total</p>
          <p className="text-xl font-bold text-foreground">{areaTotal.toFixed(1)} ha</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Total Talhões</p>
          <p className="text-xl font-bold text-foreground">{talhoes.length}</p>
        </div>
        <div className="bg-destructive/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Custo Total</p>
          <p className="text-xl font-bold text-destructive">R$ {custoTotal.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Faturamento</p>
          <p className="text-xl font-bold text-success">R$ {faturamentoTotal.toLocaleString('pt-BR')}</p>
        </div>
        <div className={`${lucroTotal >= 0 ? 'bg-success/5' : 'bg-destructive/5'} rounded-2xl p-4 border border-border/50`}>
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={`text-xl font-bold ${lucroTotal >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {lucroTotal.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {talhoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sprout className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum talhão cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talhoes.map((t: any) => {
            const custoT = (Number(t.custo_sementes) || 0) + (Number(t.custo_fertilizantes) || 0) + (Number(t.custo_defensivos) || 0) + (Number(t.custo_mao_obra) || 0) + (Number(t.custo_maquinas) || 0);
            const lucro = (Number(t.valor_venda_producao) || 0) - custoT;
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-success" />
                      <CardTitle className="text-base">{t.nome}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-success hover:bg-success/10" onClick={() => openSale(t)} title="Vender produção">
                        <ShoppingCart className="w-3.5 h-3.5" /> Vender
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openHistory(t)} title="Histórico de vendas"><History className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteTalhao.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{Number(t.area_hectares).toFixed(1)} hectares</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.cultura && <Badge variant="secondary">{t.cultura}</Badge>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                  </div>
                  {t.data_plantio && <p className="text-xs text-muted-foreground">Plantio: {new Date(t.data_plantio + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                  {t.previsao_colheita && <p className="text-xs text-muted-foreground">Colheita prev.: {new Date(t.previsao_colheita + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                  {custoT > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <DollarSign className="w-3 h-3 text-destructive" />
                        <span className="text-muted-foreground">Custo: </span>
                        <span className="font-medium text-destructive">R$ {custoT.toLocaleString('pt-BR')}</span>
                      </div>
                      {Number(t.valor_venda_producao) > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span className="text-muted-foreground">Lucro: </span>
                          <span className={`font-medium ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {lucro.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {t.producao_real && <p className="text-xs text-muted-foreground">Produção: {Number(t.producao_real)} {t.unidade_producao || 'sacas'}</p>}
                    </div>
                  )}
                  {t.observacao && <p className="text-xs text-muted-foreground italic">{t.observacao}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingId ? 'Editar Talhão' : 'Novo Talhão'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome *</Label>
                <Input placeholder="Nome do talhão" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Área (ha) *</Label>
                <Input placeholder="10.5" type="number" step="0.1" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cultura</Label>
                <Input placeholder="milho, soja..." value={form.cultura} onChange={e => setForm({ ...form, cultura: e.target.value })} />
              </div>
              {editingId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="colhido">Colhido</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data Plantio</Label>
                <Input type="date" value={form.dataPlantio} onChange={e => setForm({ ...form, dataPlantio: e.target.value })} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prev. Colheita</Label>
                <Input type="date" value={form.previsaoColheita} onChange={e => setForm({ ...form, previsaoColheita: e.target.value })} className="text-foreground" />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <p className="text-sm font-medium text-foreground mb-3">💰 Custos da Safra</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sementes (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.custo_sementes} onChange={e => setForm({ ...form, custo_sementes: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fertilizantes (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.custo_fertilizantes} onChange={e => setForm({ ...form, custo_fertilizantes: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Defensivos (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.custo_defensivos} onChange={e => setForm({ ...form, custo_defensivos: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Tipo de Mão de Obra</Label>
                  <Select value={form.tipo_mao_obra} onValueChange={(v: 'proprio' | 'extra') => setForm({ ...form, tipo_mao_obra: v, custo_mao_obra: v === 'proprio' ? '' : form.custo_mao_obra })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprio">Funcionário próprio (sem custo extra)</SelectItem>
                      <SelectItem value="extra">Mão de obra extra (informar valor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.tipo_mao_obra === 'extra' && (
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Valor Mão de Obra Extra (R$)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={form.custo_mao_obra} onChange={e => setForm({ ...form, custo_mao_obra: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Máquinas (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.custo_maquinas} onChange={e => setForm({ ...form, custo_maquinas: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Observação (opcional)" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={createTalhao.isPending}>
                {createTalhao.isPending ? 'Salvando...' : (editingId ? 'Salvar' : 'Cadastrar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={showSale} onOpenChange={setShowSale}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-success" /> Vender Produção
            </DialogTitle>
          </DialogHeader>
          {saleTalhao && (
            <p className="text-sm text-muted-foreground">
              Talhão <strong className="text-foreground">{saleTalhao.nome}</strong>
              {saleTalhao.cultura && <> · {saleTalhao.cultura}</>}
            </p>
          )}
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade *</Label>
                <Input type="number" step="0.1" placeholder="0" value={saleForm.quantidade} onChange={e => setSaleForm({ ...saleForm, quantidade: e.target.value })} />
                <p className="text-[10px] text-muted-foreground">Unidade: {saleTalhao?.unidade_producao || 'sacas'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor Total (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={saleForm.valor} onChange={e => setSaleForm({ ...saleForm, valor: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Comprador / Fornecedor</Label>
              <Select value={saleForm.fornecedor || '_none'} onValueChange={v => setSaleForm({ ...saleForm, fornecedor: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {fornecedoresList.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data da Venda</Label>
              <Input type="date" value={saleForm.data} onChange={e => setSaleForm({ ...saleForm, data: e.target.value })} className="text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Opcional" value={saleForm.observacao} onChange={e => setSaleForm({ ...saleForm, observacao: e.target.value })} />
            </div>
            <div className="bg-success/5 rounded-xl p-3 text-xs text-muted-foreground border border-success/20">
              💡 Será criada uma <strong>entrada</strong> no fluxo de caixa na categoria <strong>Venda Lavoura</strong> e a produção/faturamento do talhão serão atualizados.
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowSale(false)}>Cancelar</Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl gap-2"
                onClick={async () => {
                  const valor = parseFloat(saleForm.valor);
                  const qtd = parseFloat(saleForm.quantidade);
                  if (!valor || valor <= 0) { toast.error('Informe o valor da venda'); return; }
                  if (!qtd || qtd <= 0) { toast.error('Informe a quantidade vendida'); return; }
                  await gerarNotaVendaLavoura({
                    talhaoNome: saleTalhao?.nome || '',
                    cultura: saleTalhao?.cultura,
                    quantidade: qtd,
                    unidade: saleTalhao?.unidade_producao || 'sacas',
                    valor,
                    comprador: saleForm.fornecedor,
                    data: saleForm.data,
                    observacao: saleForm.observacao,
                  });
                  toast.success('Nota de venda gerada!');
                }}
              >
                <FileDown className="w-4 h-4" /> Baixar Nota PDF
              </Button>
              <Button className="flex-1 rounded-xl bg-success text-success-foreground hover:bg-success/90" onClick={handleSale}>Registrar Venda</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Histórico — {historyTalhao?.nome}
            </DialogTitle>
          </DialogHeader>
          {historyTalhao && (() => {
            const vendas = (vendasLavoura as any[]).filter(v => v.descricao?.includes(`— ${historyTalhao.nome} (`) || v.descricao?.includes(`- ${historyTalhao.nome} (`));
            const custoT = (Number(historyTalhao.custo_sementes) || 0) + (Number(historyTalhao.custo_fertilizantes) || 0) + (Number(historyTalhao.custo_defensivos) || 0) + (Number(historyTalhao.custo_mao_obra) || 0) + (Number(historyTalhao.custo_maquinas) || 0);
            const totalVendido = vendas.reduce((s, v) => s + Number(v.valor || 0), 0);
            const lucro = totalVendido - custoT;
            return (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-destructive/5 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground">Custo Total</p>
                    <p className="text-sm font-bold text-destructive">R$ {custoT.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-success/5 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground">Vendido</p>
                    <p className="text-sm font-bold text-success">R$ {totalVendido.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className={`${lucro >= 0 ? 'bg-success/5' : 'bg-destructive/5'} rounded-xl p-3 border border-border/50`}>
                    <p className="text-[10px] text-muted-foreground">Lucro</p>
                    <p className={`text-sm font-bold ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {lucro.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">📋 Vendas registradas ({vendas.length})</p>
                  {vendas.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">Nenhuma venda registrada ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {vendas.map(v => (
                        <div key={v.id} className="border border-border/50 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-success">R$ {Number(v.valor).toLocaleString('pt-BR')}</span>
                            <span className="text-muted-foreground">{new Date(v.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-muted-foreground">{v.descricao}</p>
                          {v.fornecedor && <p className="text-muted-foreground">Comprador: <strong className="text-foreground">{v.fornecedor}</strong></p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">💰 Detalhamento de Custos</p>
                  <div className="space-y-1 text-xs">
                    {Number(historyTalhao.custo_sementes) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Sementes</span><span>R$ {Number(historyTalhao.custo_sementes).toLocaleString('pt-BR')}</span></div>}
                    {Number(historyTalhao.custo_fertilizantes) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Fertilizantes</span><span>R$ {Number(historyTalhao.custo_fertilizantes).toLocaleString('pt-BR')}</span></div>}
                    {Number(historyTalhao.custo_defensivos) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Defensivos</span><span>R$ {Number(historyTalhao.custo_defensivos).toLocaleString('pt-BR')}</span></div>}
                    {Number(historyTalhao.custo_mao_obra) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Mão de obra extra</span><span>R$ {Number(historyTalhao.custo_mao_obra).toLocaleString('pt-BR')}</span></div>}
                    {Number(historyTalhao.custo_maquinas) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Máquinas</span><span>R$ {Number(historyTalhao.custo_maquinas).toLocaleString('pt-BR')}</span></div>}
                    {custoT === 0 && <p className="text-muted-foreground italic">Nenhum custo registrado.</p>}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
