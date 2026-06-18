import { useState } from 'react';
import { useInsumos, useMovimentacoes, useCreateInsumo, useUpdateInsumo, useDeleteInsumo, useCreateMovimentacao } from '@/hooks/useInsumos';
import { Package, AlertTriangle, Plus, Minus, Barcode, Search, LayoutGrid, List, Pencil, Trash2, Loader2, ArrowLeftRight, History, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DepositoPage() {
  const { data: insumos = [], isLoading } = useInsumos();
  const { data: movimentacoes = [] } = useMovimentacoes();
  const createInsumo = useCreateInsumo();
  const updateInsumo = useUpdateInsumo();
  const deleteInsumo = useDeleteInsumo();
  const createMovimentacao = useCreateMovimentacao();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedInsumo, setSelectedInsumo] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [tipoMov, setTipoMov] = useState<string>('entrada');
  const [observacao, setObservacao] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMovDialog, setShowMovDialog] = useState(false);
  const [movSearch, setMovSearch] = useState('');
  const [movInsumoId, setMovInsumoId] = useState('');
  const [movTipo, setMovTipo] = useState<string>('entrada');
  const [movQtd, setMovQtd] = useState('');
  const [movDestino, setMovDestino] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '', quantidade: '', unidade: 'kg', minimo: '', codigo_ean: '',
    fornecedor: '', preco_compra: '', quantidade_por_embalagem: '', categoria: 'geral',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<'materiais' | 'historico'>('materiais');
  const [histSearch, setHistSearch] = useState('');
  const [histTipo, setHistTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');

  const filtered = insumos.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i as any).codigo_ean?.includes(search) ||
    (i as any).codigo_barras?.includes(search)
  );

  const movimentar = async () => {
    if (!selectedInsumo || !quantidade) return;
    await createMovimentacao.mutateAsync({
      insumo_id: selectedInsumo,
      tipo: tipoMov,
      quantidade: parseFloat(quantidade),
      data: new Date().toISOString().split('T')[0],
      observacao: observacao || null,
    });
    setQuantidade(''); setObservacao(''); setSelectedInsumo(null);
  };

  const handleMovDialog = async () => {
    if (!movInsumoId || !movQtd) return;
    await createMovimentacao.mutateAsync({
      insumo_id: movInsumoId,
      tipo: movTipo,
      quantidade: parseFloat(movQtd),
      data: new Date().toISOString().split('T')[0],
      observacao: movDestino || null,
    });
    setMovInsumoId(''); setMovQtd(''); setMovDestino(''); setMovSearch(''); setMovTipo('entrada');
    setShowMovDialog(false);
  };

  const movFilteredInsumos = insumos.filter(i =>
    i.nome.toLowerCase().includes(movSearch.toLowerCase()) ||
    (i as any).codigo_ean?.includes(movSearch)
  );

  const openNew = () => {
    setEditingId(null);
    setForm({ nome: '', quantidade: '', unidade: 'kg', minimo: '', codigo_ean: '', fornecedor: '', preco_compra: '', quantidade_por_embalagem: '', categoria: 'geral' });
    setShowForm(true);
  };

  const openEdit = (insumo: any) => {
    setEditingId(insumo.id);
    setForm({
      nome: insumo.nome,
      quantidade: String(insumo.quantidade),
      unidade: insumo.unidade,
      minimo: String(insumo.minimo),
      codigo_ean: insumo.codigo_ean || '',
      fornecedor: insumo.fornecedor || '',
      preco_compra: insumo.preco_compra ? String(insumo.preco_compra) : '',
      quantidade_por_embalagem: insumo.quantidade_por_embalagem ? String(insumo.quantidade_por_embalagem) : '',
      categoria: insumo.categoria || 'geral',
    });
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!form.nome || !form.quantidade || !form.unidade) return;
    const payload: any = {
      nome: form.nome,
      quantidade: parseFloat(form.quantidade),
      unidade: form.unidade,
      minimo: parseFloat(form.minimo) || 0,
      codigo_ean: form.codigo_ean || null,
      codigo_barras: null,
      fornecedor: form.fornecedor || null,
      preco_compra: parseFloat(form.preco_compra) || 0,
      quantidade_por_embalagem: form.quantidade_por_embalagem ? parseFloat(form.quantidade_por_embalagem) : null,
      categoria: form.categoria || 'geral',
    };
    if (editingId) {
      await updateInsumo.mutateAsync({ id: editingId, ...payload });
    } else {
      await createInsumo.mutateAsync(payload);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteInsumo.mutateAsync(deleteId);
    setDeleteId(null);
  };

  // Value calcs
  const valorEstoque = insumos.reduce((s, i: any) => s + (Number(i.quantidade) * (Number(i.preco_compra) || 0)), 0);

  const unidades = ['kg', 'litros', 'unidade', 'caixa', 'metro', 'rolo', 'm²', 'saco', 'dose'];

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Depósito</h1>
          <p className="text-sm text-muted-foreground mt-1">{insumos.length} materiais cadastrados • Valor est.: R$ {valorEstoque.toLocaleString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMovDialog(true)} className="gap-2 rounded-xl">
            <ArrowLeftRight className="w-4 h-4" /> Movimentação
          </Button>
          <Button onClick={openNew} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Novo Material
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'materiais' | 'historico')} className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="materiais" className="gap-2 rounded-lg"><Package className="w-4 h-4" /> Materiais</TabsTrigger>
          <TabsTrigger value="historico" className="gap-2 rounded-lg"><History className="w-4 h-4" /> Histórico ({movimentacoes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="space-y-4 mt-0">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou código EAN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-muted-foreground">Nenhum material encontrado.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((insumo: any) => {
            const baixo = Number(insumo.quantidade) <= Number(insumo.minimo) && Number(insumo.minimo) > 0;
            return (
              <div key={insumo.id} className={`bg-card rounded-2xl p-5 border transition-all ${baixo ? 'border-warning/50' : 'border-border/50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Package className="w-5 h-5 text-muted-foreground" />
                    {insumo.categoria && insumo.categoria !== 'geral' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-2">{insumo.categoria}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {baixo && <span className="flex items-center gap-1 text-xs text-warning font-medium"><AlertTriangle className="w-3 h-3" /> Baixo</span>}
                    <button onClick={() => openEdit(insumo)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(insumo.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="font-semibold text-card-foreground">{insumo.nome}</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">{Number(insumo.quantidade)} <span className="text-sm font-normal text-muted-foreground">{insumo.unidade}</span></p>
                {insumo.quantidade_por_embalagem && (
                  <p className="text-xs text-muted-foreground">({Number(insumo.quantidade_por_embalagem)} un/embalagem)</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Mínimo: {Number(insumo.minimo)} {insumo.unidade}</p>
                {Number(insumo.preco_compra) > 0 && (
                  <p className="text-xs text-muted-foreground">Preço: R$ {Number(insumo.preco_compra).toFixed(2)}/{insumo.unidade}</p>
                )}
                {insumo.fornecedor && <p className="text-xs text-muted-foreground">Fornecedor: {insumo.fornecedor}</p>}
                {insumo.codigo_ean && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono flex items-center gap-1"><Barcode className="w-3 h-3" /> {insumo.codigo_ean}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setSelectedInsumo(insumo.id); setTipoMov('entrada'); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Entrada
                  </button>
                  <button onClick={() => { setSelectedInsumo(insumo.id); setTipoMov('saida'); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
                    <Minus className="w-3.5 h-3.5" /> Saída
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Material</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Preço</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fornecedor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((insumo: any) => {
                  const baixo = Number(insumo.quantidade) <= Number(insumo.minimo) && Number(insumo.minimo) > 0;
                  return (
                    <tr key={insumo.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground">{insumo.nome}</td>
                      <td className="px-4 py-3 text-card-foreground">{Number(insumo.quantidade)} {insumo.unidade}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{Number(insumo.preco_compra) > 0 ? `R$ ${Number(insumo.preco_compra).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{insumo.fornecedor || '—'}</td>
                      <td className="px-4 py-3">
                        {baixo ? (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-warning/15 text-warning border border-warning/20">Baixo</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-success/15 text-success border border-success/20">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedInsumo(insumo.id); setTipoMov('entrada'); }} className="p-1.5 rounded-lg hover:bg-success/10 text-success"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedInsumo(insumo.id); setTipoMov('saida'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Minus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(insumo)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(insumo.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-0">
          {(() => {
            const filteredMovs = movimentacoes.filter(m => {
              if (histTipo !== 'todos' && m.tipo !== histTipo) return false;
              if (histSearch) {
                const insumo = insumos.find(i => i.id === m.insumo_id);
                const nome = (insumo?.nome || '').toLowerCase();
                const obs = (m.observacao || '').toLowerCase();
                const term = histSearch.toLowerCase();
                if (!nome.includes(term) && !obs.includes(term)) return false;
              }
              return true;
            });
            const totalEntradas = filteredMovs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.quantidade), 0);
            const totalSaidas = filteredMovs.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.quantidade), 0);

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-card rounded-2xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground">Movimentações</p>
                    <p className="text-2xl font-bold text-card-foreground mt-1">{filteredMovs.length}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDownCircle className="w-3 h-3 text-success" /> Total entradas</p>
                    <p className="text-2xl font-bold text-success mt-1">{totalEntradas.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border/50 p-4 col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="w-3 h-3 text-destructive" /> Total saídas</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{totalSaidas.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar por material ou observação..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} className="pl-10 rounded-xl" />
                  </div>
                  <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
                    {(['todos', 'entrada', 'saida'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setHistTipo(t)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${histTipo === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMovs.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-muted-foreground">Nenhuma movimentação encontrada.</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Material</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredMovs.map(m => {
                            const insumo = insumos.find(i => i.id === m.insumo_id);
                            const dataFmt = m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
                            return (
                              <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dataFmt}</td>
                                <td className="px-4 py-3 text-card-foreground font-medium">{insumo?.nome || 'Removido'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${m.tipo === 'entrada' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                                    {m.tipo === 'entrada' ? <><ArrowDownCircle className="w-3 h-3" /> Entrada</> : <><ArrowUpCircle className="w-3 h-3" /> Saída</>}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-card-foreground whitespace-nowrap">
                                  {Number(m.quantidade)} {insumo?.unidade || ''}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{m.observacao || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Movement Modal */}
      <Dialog open={!!selectedInsumo} onOpenChange={(open) => !open && setSelectedInsumo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{tipoMov === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{insumos.find(i => i.id === selectedInsumo)?.nome}</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quantidade</Label>
              <Input type="number" placeholder="Quantidade" value={quantidade} onChange={e => setQuantidade(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Observação (opcional)" value={observacao} onChange={e => setObservacao(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedInsumo(null)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl" onClick={movimentar} disabled={createMovimentacao.isPending}>
              {createMovimentacao.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Material Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Nome do material" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="racao">Ração</SelectItem>
                    <SelectItem value="medicamento">Medicamento</SelectItem>
                    <SelectItem value="insumo_agricola">Insumo Agrícola</SelectItem>
                    <SelectItem value="combustivel">Combustível</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                <Input placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade *</Label>
                <Input type="number" placeholder="0" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unidade *</Label>
                <Select value={form.unidade} onValueChange={v => setForm({ ...form, unidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input type="number" placeholder="0" value={form.minimo} onChange={e => setForm({ ...form, minimo: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preço Compra (R$)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.preco_compra} onChange={e => setForm({ ...form, preco_compra: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Qtd por Embalagem</Label>
                <Input type="number" placeholder="Ex: 12" value={form.quantidade_por_embalagem} onChange={e => setForm({ ...form, quantidade_por_embalagem: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código EAN</Label>
              <Input placeholder="7891234567890" value={form.codigo_ean} onChange={e => setForm({ ...form, codigo_ean: e.target.value })} className="font-mono" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl" onClick={saveForm} disabled={createInsumo.isPending || updateInsumo.isPending}>
              {(createInsumo.isPending || updateInsumo.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Salvar' : 'Cadastrar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remover Material</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza? Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete} disabled={deleteInsumo.isPending}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movimentação Dialog */}
      <Dialog open={showMovDialog} onOpenChange={setShowMovDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Buscar produto (nome ou EAN)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou código EAN..."
                  value={movSearch}
                  onChange={e => setMovSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Produto *</Label>
              <Select value={movInsumoId} onValueChange={v => setMovInsumoId(v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {movFilteredInsumos.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome} ({Number(i.quantidade)} {i.unidade}){(i as any).codigo_ean ? ` — ${(i as any).codigo_ean}` : ''}
                    </SelectItem>
                  ))}
                  {movFilteredInsumos.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum produto encontrado.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo *</Label>
                <Select value={movTipo} onValueChange={v => setMovTipo(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">📥 Entrada</SelectItem>
                    <SelectItem value="saida">📤 Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade *</Label>
                <Input type="number" placeholder="Ex: 50" value={movQtd} onChange={e => setMovQtd(e.target.value)} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Destino / Observação</Label>
              <Input placeholder="Ex: Pasto 3, Confinamento Lote 01..." value={movDestino} onChange={e => setMovDestino(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowMovDialog(false)}>Cancelar</Button>
              <Button
                className={`flex-1 rounded-xl ${movTipo === 'entrada' ? 'bg-success text-success-foreground hover:bg-success/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
                onClick={handleMovDialog}
                disabled={createMovimentacao.isPending || !movInsumoId || !movQtd}
              >
                {createMovimentacao.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : movTipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
