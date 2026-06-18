import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, List, Plus, Loader2, FolderOpen, Pencil, Trash2, ArrowRightLeft, CheckSquare, X, Baby, Factory, DollarSign, TrendingUp, Weight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAnimais, useCreateAnimal, useUpdateAnimal } from '@/hooks/useAnimais';
import { useCreatePesagem, usePesagens } from '@/hooks/usePesagens';
import { useLotesRebanho, useCreateLoteRebanho, useUpdateLoteRebanho } from '@/hooks/useLotesRebanho';
import { DeleteLoteDialog } from '@/components/rebanho/DeleteLoteDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParentCombobox } from '@/components/ParentCombobox';
import { BrincoTag } from '@/components/BrincoTag';
import { PesagemQuickDialog } from '@/components/PesagemQuickDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function RebanhoPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loteDialogOpen, setLoteDialogOpen] = useState(false);
  const [editLoteDialogOpen, setEditLoteDialogOpen] = useState(false);
  const [selectedLoteFilter, setSelectedLoteFilter] = useState<string>('todos');
  const [origemDialogOpen, setOrigemDialogOpen] = useState(false);
  const [origem, setOrigem] = useState<'compra' | 'filhote' | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [bulkDesmamaDialogOpen, setBulkDesmamaDialogOpen] = useState(false);
  const [bulkConfinamentoDialogOpen, setBulkConfinamentoDialogOpen] = useState(false);
  const [bulkTargetPasto, setBulkTargetPasto] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [form, setForm] = useState({
    brinco: '', nome: '', raca: '', data_nascimento: '', pai: '', mae: '', sexo: 'macho' as string,
    peso_inicial: '', lote_rebanho_id: '', mojando: false, mojando_meses: '', observacao: '',
    fornecedor_nome: '', valor_compra: '', telefone_vendedor: '',
  });
  const [loteForm, setLoteForm] = useState({ nome: '', descricao: '' });
  const [editLoteForm, setEditLoteForm] = useState({ id: '', nome: '', descricao: '' });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: animals = [], isLoading } = useAnimais();
  const { data: allPesagens = [] } = usePesagens();
  const { data: lotes = [] } = useLotesRebanho();
  const createAnimal = useCreateAnimal();
  const updateAnimal = useUpdateAnimal();
  const createLote = useCreateLoteRebanho();
  const updateLote = useUpdateLoteRebanho();
  const [deleteLoteTarget, setDeleteLoteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [singleSaleAnimalId, setSingleSaleAnimalId] = useState<string | null>(null);
  const [pesagemAnimalId, setPesagemAnimalId] = useState<string | null>(null);

  const latestWeightMap = useMemo(() => {
    const grouped: Record<string, { peso: number; data: string }[]> = {};
    allPesagens.forEach(p => {
      if (!grouped[p.animal_id]) grouped[p.animal_id] = [];
      grouped[p.animal_id].push({ peso: p.peso, data: p.data });
    });
    const result: Record<string, number> = {};
    Object.entries(grouped).forEach(([id, arr]) => {
      arr.sort((a, b) => b.data.localeCompare(a.data));
      result[id] = arr[0].peso;
    });
    return result;
  }, [allPesagens]);

  const gmdMap = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    allPesagens.forEach(p => {
      if (p.gmd != null) {
        if (!grouped[p.animal_id]) grouped[p.animal_id] = [];
        grouped[p.animal_id].push(Number(p.gmd));
      }
    });
    const result: Record<string, number> = {};
    Object.entries(grouped).forEach(([id, arr]) => {
      result[id] = arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    return result;
  }, [allPesagens]);

  const getAge = (dataNascimento: string) => {
    const birth = new Date(dataNascimento);
    const today = new Date();
    const totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years > 0) return `${years}a ${months}m`;
    return `${months}m`;
  };

  const getDesmamaStatus = (animal: typeof animals[0]) => {
    if (animal.status !== 'ativo' || animal.data_desmama) return 'normal';
    const birth = new Date(animal.data_nascimento);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (monthsDiff >= 7) return 'overdue';
    return 'nursing';
  };

  const filtered = animals.filter(a => {
    const matchesSearch = a.brinco.toLowerCase().includes(search.toLowerCase()) ||
      a.nome?.toLowerCase().includes(search.toLowerCase()) ||
      a.raca.toLowerCase().includes(search.toLowerCase());
    const matchesLote = selectedLoteFilter === 'todos' ||
      (selectedLoteFilter === 'sem-lote' ? !(a as any).lote_rebanho_id : (a as any).lote_rebanho_id === selectedLoteFilter);
    return matchesSearch && matchesLote;
  });

  const statusColor = (s: string) => {
    if (s === 'ativo') return 'bg-success/15 text-success border border-success/20';
    if (s === 'vendido') return 'bg-info/15 text-info border border-info/20';
    return 'bg-destructive/15 text-destructive border border-destructive/20';
  };

  const desmamaCardClass = (animal: typeof animals[0]) => {
    const ds = getDesmamaStatus(animal);
    if (ds === 'overdue') return 'bg-destructive/10 border-destructive/30 hover:border-destructive/50';
    if (ds === 'nursing') return 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50';
    if (animal.data_confinamento) return 'bg-info/5 border-info/20 hover:border-info/40';
    return 'bg-card border-border/50 hover:border-accent/30';
  };

  const createPesagem = useCreatePesagem();

  const addAnimal = async () => {
    if (!form.brinco || !form.raca || !form.data_nascimento) return;
    if (origem === 'compra' && (!form.fornecedor_nome || !form.valor_compra)) {
      toast.error('Preencha o nome do fornecedor e valor da compra');
      return;
    }
    const mojandoMeses = form.mojando && form.mojando_meses ? parseFloat(form.mojando_meses) : 0;
    const mojandoDataInicio = form.mojando ? new Date(Date.now() - mojandoMeses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;
    const result = await createAnimal.mutateAsync({
      brinco: form.brinco,
      nome: form.nome || null,
      raca: form.raca,
      data_nascimento: form.data_nascimento,
      pai: form.pai || null,
      mae: form.mae || null,
      sexo: form.sexo,
      foto: null,
      status: 'ativo',
      data_desmama: origem === 'compra' ? new Date().toISOString().split('T')[0] : null,
      data_confinamento: null,
      preco_compra: origem === 'compra' && form.valor_compra ? parseFloat(form.valor_compra) : 0,
      preco_venda: 0,
      lote_rebanho_id: null,
      mojando: form.mojando,
      mojando_meses: mojandoMeses,
      mojando_data_inicio: mojandoDataInicio,
      observacao: [
        origem === 'compra' ? `[Compra] Fornecedor: ${form.fornecedor_nome}${form.telefone_vendedor ? ` | Tel: ${form.telefone_vendedor}` : ''}` : null,
        form.observacao || null,
      ].filter(Boolean).join('\n') || null,
    });
    if (form.lote_rebanho_id && result?.id) {
      await supabase.from('animais').update({ lote_rebanho_id: form.lote_rebanho_id } as any).eq('id', result.id);
      qc.invalidateQueries({ queryKey: ['animais'] });
    }
    if (form.peso_inicial && result?.id) {
      await createPesagem.mutateAsync({
        animal_id: result.id,
        peso: parseFloat(form.peso_inicial),
        data: form.data_nascimento,
        gmd: null,
      });
    }
    setForm({ brinco: '', nome: '', raca: '', data_nascimento: '', pai: '', mae: '', sexo: 'macho', peso_inicial: '', lote_rebanho_id: '', mojando: false, mojando_meses: '', observacao: '', fornecedor_nome: '', valor_compra: '', telefone_vendedor: '' });
    setOrigem(null);
    setDialogOpen(false);
  };

  const handleCreateLote = async () => {
    if (!loteForm.nome) return;
    await createLote.mutateAsync({ nome: loteForm.nome, descricao: loteForm.descricao || null });
    setLoteForm({ nome: '', descricao: '' });
    setLoteDialogOpen(false);
  };

  const handleEditLote = async () => {
    if (!editLoteForm.nome) return;
    await updateLote.mutateAsync({ id: editLoteForm.id, nome: editLoteForm.nome, descricao: editLoteForm.descricao || null });
    setEditLoteDialogOpen(false);
  };

  const handleDeleteLote = (lote: { id: string; nome: string }) => {
    setDeleteLoteTarget(lote);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const targetId = bulkTargetPasto === 'sem-pasto' ? null : bulkTargetPasto || null;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('animais').update({ lote_rebanho_id: targetId } as any).eq('id', id);
    }
    qc.invalidateQueries({ queryKey: ['animais'] });
    toast.success(`${ids.length} animal(is) movido(s) de pasto!`);
    setBulkProcessing(false);
    setBulkTargetPasto('');
    setBulkMoveDialogOpen(false);
    exitSelectionMode();
  };

  const handleBulkDesmama = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const today = new Date().toISOString().split('T')[0];
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('animais').update({ data_desmama: today } as any).eq('id', id);
    }
    qc.invalidateQueries({ queryKey: ['animais'] });
    toast.success(`Desmama registrada para ${ids.length} animal(is)!`);
    setBulkProcessing(false);
    setBulkDesmamaDialogOpen(false);
    exitSelectionMode();
  };

  const handleBulkConfinamento = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const today = new Date().toISOString().split('T')[0];
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('animais').update({ data_confinamento: today } as any).eq('id', id);
    }
    qc.invalidateQueries({ queryKey: ['animais'] });
    toast.success(`Confinamento registrado para ${ids.length} animal(is)!`);
    setBulkProcessing(false);
    setBulkConfinamentoDialogOpen(false);
    exitSelectionMode();
  };

  const totalAtivos = animals.filter(a => a.status === 'ativo').length;
  const totalMachos = animals.filter(a => a.sexo === 'macho' && a.status === 'ativo').length;
  const totalFemeas = animals.filter(a => a.sexo === 'femea' && a.status === 'ativo').length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const getLoteName = (loteId: string | null) => {
    if (!loteId) return null;
    return lotes.find(l => l.id === loteId)?.nome || null;
  };

  const renderAnimalCard = (animal: typeof animals[0]) => (
    <div
      key={animal.id}
      onClick={() => {
        if (selectionMode) { toggleSelect(animal.id); return; }
        navigate(`/rebanho/${animal.id}`);
      }}
      className={`rounded-2xl p-5 border hover:shadow-lg transition-all cursor-pointer group ${desmamaCardClass(animal)} ${selectionMode && selectedIds.has(animal.id) ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        {selectionMode && (
          <Checkbox checked={selectedIds.has(animal.id)} onCheckedChange={() => toggleSelect(animal.id)} className="mt-1 mr-2" />
        )}
          <div className="flex items-center gap-1.5">
            <BrincoTag brinco={animal.brinco} size="md" />
            {animal.status === 'ativo' && !selectionMode && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSingleSaleAnimalId(animal.id); }}
                  className="w-8 h-8 rounded-full bg-success/15 hover:bg-success/25 text-success flex items-center justify-center transition-colors"
                  title="Vender este animal"
                  aria-label="Vender este animal"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        <div className="flex flex-col items-end gap-1.5">
          {animal.status === 'ativo' && !selectionMode && (
            <button
              onClick={(e) => { e.stopPropagation(); setPesagemAnimalId(animal.id); }}
              className="h-10 pl-3 pr-4 rounded-full bg-accent text-accent-foreground flex items-center gap-1.5 transition-all text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              title="Registrar pesagem"
              aria-label="Registrar pesagem"
            >
              <Weight className="w-4 h-4" /> Kg
            </button>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(animal.status)}`}>
            {animal.status}
          </span>
          {getDesmamaStatus(animal) === 'nursing' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-700 font-medium">🍼 Amamentando</span>
          )}
          {getDesmamaStatus(animal) === 'overdue' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">⚠️ Desmama atrasada</span>
          )}
          {(animal as any).mojando && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
              🤰 Mojando {(() => {
                const inicio = (animal as any).mojando_data_inicio;
                if (!inicio) return '';
                const diff = Math.floor((Date.now() - new Date(inicio).getTime()) / (30 * 24 * 60 * 60 * 1000));
                return `${diff}m`;
              })()}
            </span>
          )}
        </div>
      </div>
      <p className="font-semibold text-card-foreground group-hover:text-accent transition-colors text-lg">{animal.nome || animal.brinco}</p>
      <p className="text-sm text-muted-foreground mt-0.5">Brinco: {animal.brinco}</p>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground flex-wrap">
        <span className="bg-muted/60 px-2.5 py-1 rounded-lg">{animal.raca}</span>
        <span className="bg-muted/60 px-2.5 py-1 rounded-lg">{animal.sexo === 'macho' ? '♂' : '♀'}</span>
        <span className="bg-muted/60 px-2.5 py-1 rounded-lg">📅 {getAge(animal.data_nascimento)}</span>
        {latestWeightMap[animal.id] && (
          <span className="bg-muted/60 px-2.5 py-1 rounded-lg">⚖️ {latestWeightMap[animal.id]} kg</span>
        )}
        {(animal as any).lote_rebanho_id && (
          <span className="bg-accent/15 text-accent px-2.5 py-1 rounded-lg font-medium">🌿 {getLoteName((animal as any).lote_rebanho_id)}</span>
        )}
        {animal.data_confinamento && (
          <span className="bg-info/15 text-info px-2.5 py-1 rounded-lg font-medium">🏗️ Confinado</span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> GMD
        </span>
        <span className={`font-semibold ${gmdMap[animal.id] != null ? (gmdMap[animal.id] >= 0.5 ? 'text-success' : 'text-warning') : 'text-muted-foreground'}`}>
          {gmdMap[animal.id] != null ? `${gmdMap[animal.id].toFixed(2)} kg/dia` : '—'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Gestão de Rebanho</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">{totalAtivos} ativos</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-info/10 text-info">♂ {totalMachos}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">♀ {totalFemeas}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!selectionMode ? (
            <>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => { setSelectionMode(true); setSelectedIds(new Set()); }}>
                <CheckSquare className="w-4 h-4" /> Selecionar
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setLoteDialogOpen(true)}>
                <FolderOpen className="w-4 h-4" /> Gerenciar Pastos
              </Button>
              <Button className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setOrigemDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Novo Animal
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={selectAllFiltered}>
                <CheckSquare className="w-4 h-4" /> {selectedIds.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setBulkMoveDialogOpen(true)} disabled={selectedIds.size === 0}>
                <ArrowRightLeft className="w-4 h-4" /> Mover ({selectedIds.size})
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setBulkDesmamaDialogOpen(true)} disabled={selectedIds.size === 0}>
                <Baby className="w-4 h-4" /> Desmama ({selectedIds.size})
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setBulkConfinamentoDialogOpen(true)} disabled={selectedIds.size === 0}>
                <Factory className="w-4 h-4" /> Confinamento ({selectedIds.size})
              </Button>
              <Button variant="ghost" className="gap-2 rounded-xl text-destructive" onClick={exitSelectionMode}>
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </>
          )}
          {/* Dialog de seleção de origem */}
          <Dialog open={origemDialogOpen} onOpenChange={setOrigemDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Origem do Animal</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">De onde vem este animal?</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-6 rounded-xl border-2 hover:border-accent hover:bg-accent/5"
                  onClick={() => { setOrigem('filhote'); setOrigemDialogOpen(false); setDialogOpen(true); }}
                >
                  <span className="text-2xl">🐄</span>
                  <span className="font-semibold">Filhote</span>
                  <span className="text-xs text-muted-foreground">Nasceu na fazenda</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-6 rounded-xl border-2 hover:border-accent hover:bg-accent/5"
                  onClick={() => { setOrigem('compra'); setOrigemDialogOpen(false); setDialogOpen(true); }}
                >
                  <span className="text-2xl">🛒</span>
                  <span className="font-semibold">Compra</span>
                  <span className="text-xs text-muted-foreground">Adquirido de terceiros</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setOrigem(null); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Cadastrar Novo Animal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Brinco *</Label>
                    <Input placeholder="Ex: BR-007" value={form.brinco} onChange={e => setForm({ ...form, brinco: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Nome</Label>
                    <Input placeholder="Nome do animal" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Raça *</Label>
                    <Input placeholder="Ex: Nelore" value={form.raca} onChange={e => setForm({ ...form, raca: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Sexo *</Label>
                    <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="macho">♂ Macho</SelectItem>
                        <SelectItem value="femea">♀ Fêmea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Data de Nascimento *</Label>
                    <Input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} className="text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Peso Inicial (kg)</Label>
                    <Input type="number" placeholder="Ex: 35" value={form.peso_inicial} onChange={e => setForm({ ...form, peso_inicial: e.target.value })} className="text-foreground h-11 text-base" />
                  </div>
                </div>
                {lotes.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Pasto</Label>
                    <Select value={form.lote_rebanho_id} onValueChange={(v) => setForm({ ...form, lote_rebanho_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um pasto (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {lotes.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Pai</Label>
                    <ParentCombobox value={form.pai} onChange={v => setForm({ ...form, pai: v })} placeholder="Selecione ou digite" filterSexo="macho" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Mãe</Label>
                    <ParentCombobox value={form.mae} onChange={v => setForm({ ...form, mae: v })} placeholder="Selecione ou digite" filterSexo="femea" />
                  </div>
                </div>
                {form.sexo === 'femea' && (
                  <div className="space-y-3 bg-muted/30 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mojando"
                        checked={form.mojando}
                        onCheckedChange={(checked) => setForm({ ...form, mojando: !!checked, mojando_meses: checked ? form.mojando_meses : '' })}
                      />
                      <Label htmlFor="mojando" className="text-sm font-medium cursor-pointer">🤰 Está mojando?</Label>
                    </div>
                    {form.mojando && (
                      <div className="space-y-1.5 pl-6">
                        <Label className="text-xs font-medium text-muted-foreground">Quantos meses de gestação?</Label>
                        <Input type="number" placeholder="Ex: 3" min="0" max="12" value={form.mojando_meses} onChange={e => setForm({ ...form, mojando_meses: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
                {origem === 'compra' && (
                  <div className="space-y-3 bg-muted/30 rounded-xl p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🛒 Dados da Compra</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Nome do Fornecedor *</Label>
                        <Input placeholder="Ex: João Silva" value={form.fornecedor_nome} onChange={e => setForm({ ...form, fornecedor_nome: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Valor da Compra (R$) *</Label>
                        <Input type="number" placeholder="Ex: 3500" value={form.valor_compra} onChange={e => setForm({ ...form, valor_compra: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Telefone do Vendedor (opcional)</Label>
                      <Input placeholder="Ex: (11) 99999-9999" value={form.telefone_vendedor} onChange={e => setForm({ ...form, telefone_vendedor: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Observação</Label>
                  <Textarea placeholder="Observações sobre o animal (opcional)" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} className="min-h-[60px]" />
                </div>
                {origem !== 'compra' && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                    🍼 A desmama será calculada automaticamente — 7 meses após o nascimento, você receberá um aviso.
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={addAnimal} disabled={createAnimal.isPending}>
                    {createAnimal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lote filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedLoteFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedLoteFilter === 'todos' ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}`}
        >
          Todos ({animals.length})
        </button>
        {lotes.map(lote => {
          const count = animals.filter(a => (a as any).lote_rebanho_id === lote.id).length;
          return (
            <button
              key={lote.id}
              onClick={() => setSelectedLoteFilter(lote.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedLoteFilter === lote.id ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}`}
            >
              {lote.nome} ({count})
            </button>
          );
        })}
        <button
          onClick={() => setSelectedLoteFilter('sem-lote')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedLoteFilter === 'sem-lote' ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}`}
        >
          Sem pasto ({animals.filter(a => !(a as any).lote_rebanho_id).length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por brinco, nome ou raça..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
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
          <p className="text-4xl mb-3">🐄</p>
          <p className="text-muted-foreground">Nenhum animal encontrado.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(renderAnimalCard)}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  {selectionMode && <th className="px-2 py-3 w-8"></th>}
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Animal</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brinco</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Raça</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Pasto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Idade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Peso</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((animal) => {
                  const ds = getDesmamaStatus(animal);
                  const rowBg = ds === 'overdue' ? 'bg-destructive/10' : ds === 'nursing' ? 'bg-yellow-500/10' : '';
                  const isSelected = selectedIds.has(animal.id);
                  return (
                    <tr
                      key={animal.id}
                      onClick={() => {
                        if (selectionMode) { toggleSelect(animal.id); return; }
                        navigate(`/rebanho/${animal.id}`);
                      }}
                      className={`hover:bg-muted/20 cursor-pointer transition-colors ${rowBg} ${selectionMode && isSelected ? 'bg-accent/10' : ''}`}
                    >
                      {selectionMode && (
                        <td className="px-2 py-3">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(animal.id)} />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BrincoTag brinco={animal.brinco} size="sm" />
                          {animal.status === 'ativo' && !selectionMode && (
                            <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPesagemAnimalId(animal.id); }}
                            className="h-7 pl-1.5 pr-2 rounded-full bg-accent text-accent-foreground flex items-center gap-0.5 transition-all text-[10px] font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 shrink-0"
                            title="Registrar pesagem"
                            aria-label="Registrar pesagem"
                          >
                            <Weight className="w-3.5 h-3.5" /> Kg
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSingleSaleAnimalId(animal.id); }}
                            className="w-7 h-7 rounded-full bg-success/15 hover:bg-success/25 text-success flex items-center justify-center transition-colors shrink-0"
                            title="Vender este animal"
                            aria-label="Vender este animal"
                          >
                            <DollarSign className="w-3 h-3" />
                          </button>
                            </>
                          )}
                          <span className="font-medium text-card-foreground">{animal.nome || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{animal.brinco}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{animal.raca}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{getLoteName((animal as any).lote_rebanho_id) || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{getAge(animal.data_nascimento)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{latestWeightMap[animal.id] ? `${latestWeightMap[animal.id]} kg` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(animal.status)}`}>{animal.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gerenciar Pastos Dialog */}
      <Dialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Gerenciar Pastos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              <Input placeholder="Nome do novo pasto" value={loteForm.nome} onChange={e => setLoteForm({ ...loteForm, nome: e.target.value })} className="flex-1" />
              <Button onClick={handleCreateLote} disabled={createLote.isPending || !loteForm.nome} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Input placeholder="Descrição (opcional)" value={loteForm.descricao} onChange={e => setLoteForm({ ...loteForm, descricao: e.target.value })} />

            {lotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pasto criado ainda.</p>
            ) : (
              <div className="space-y-2">
                {lotes.map(lote => {
                  const count = animals.filter(a => (a as any).lote_rebanho_id === lote.id).length;
                  return (
                    <div key={lote.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{lote.nome}</p>
                        <p className="text-xs text-muted-foreground">{count} animais{lote.descricao ? ` • ${lote.descricao}` : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                          setEditLoteForm({ id: lote.id, nome: lote.nome, descricao: lote.descricao || '' });
                          setEditLoteDialogOpen(true);
                        }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteLote({ id: lote.id, nome: lote.nome })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editar Pasto Dialog */}
      <Dialog open={editLoteDialogOpen} onOpenChange={setEditLoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar Pasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input value={editLoteForm.nome} onChange={e => setEditLoteForm({ ...editLoteForm, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input value={editLoteForm.descricao} onChange={e => setEditLoteForm({ ...editLoteForm, descricao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditLoteDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleEditLote}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={bulkMoveDialogOpen} onOpenChange={setBulkMoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Mover {selectedIds.size} Animal(is) de Pasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Selecione o pasto de destino para os {selectedIds.size} animais selecionados.</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pasto de destino</Label>
              <Select value={bulkTargetPasto} onValueChange={v => setBulkTargetPasto(v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o pasto destino" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-pasto">Sem pasto</SelectItem>
                  {lotes.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBulkMoveDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleBulkMove} disabled={!bulkTargetPasto || bulkProcessing}>
                {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Mover ${selectedIds.size}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Desmama Dialog */}
      <Dialog open={bulkDesmamaDialogOpen} onOpenChange={setBulkDesmamaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Registrar Desmama</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Deseja registrar a desmama para <strong>{selectedIds.size}</strong> animal(is) selecionados? A data de desmama será definida como hoje.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBulkDesmamaDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleBulkDesmama} disabled={bulkProcessing}>
                {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Desmama'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Confinamento Dialog */}
      <Dialog open={bulkConfinamentoDialogOpen} onOpenChange={setBulkConfinamentoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Registrar Confinamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Deseja registrar o confinamento para <strong>{selectedIds.size}</strong> animal(is) selecionados? A data de confinamento será definida como hoje.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBulkConfinamentoDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleBulkConfinamento} disabled={bulkProcessing}>
                {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Confinamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lote Dialog (with realocar/vender flow) */}
      <DeleteLoteDialog
        open={!!deleteLoteTarget}
        onOpenChange={(v) => { if (!v) setDeleteLoteTarget(null); }}
        lote={deleteLoteTarget}
        animais={animals as any}
        lotes={lotes.map(l => ({ id: l.id, nome: l.nome }))}
        latestWeightMap={latestWeightMap}
        onDeleted={() => {
          if (selectedLoteFilter === deleteLoteTarget?.id) setSelectedLoteFilter('todos');
          setDeleteLoteTarget(null);
        }}
      />

      {/* Single Animal Sale Dialog */}
      <DeleteLoteDialog
        open={!!singleSaleAnimalId}
        onOpenChange={(v) => { if (!v) setSingleSaleAnimalId(null); }}
        lote={null}
        animais={animals as any}
        lotes={lotes.map(l => ({ id: l.id, nome: l.nome }))}
        latestWeightMap={latestWeightMap}
        mode="single-sale"
        singleAnimalId={singleSaleAnimalId}
        onDeleted={() => setSingleSaleAnimalId(null)}
      />

      <PesagemQuickDialog
        animalId={pesagemAnimalId}
        animalNome={(() => {
          const a = animals.find(x => x.id === pesagemAnimalId);
          return a ? (a.nome || a.brinco) : undefined;
        })()}
        open={!!pesagemAnimalId}
        onOpenChange={(v) => { if (!v) setPesagemAnimalId(null); }}
      />
    </div>
  );
}
