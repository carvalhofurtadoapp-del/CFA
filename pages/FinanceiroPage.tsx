import { useState, useEffect } from 'react';
import { useGastos, useCreateGasto } from '@/hooks/useGastos';
import { useFornecedores, useCreateFornecedor } from '@/hooks/useFornecedores';
import { useInsumos } from '@/hooks/useInsumos';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, Pencil, Trash2, Search, Truck, Package, CalendarRange, CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FornecedorRanking } from '@/components/financeiro/FornecedorRanking';
import { ExtratoSemanal } from '@/components/financeiro/ExtratoSemanal';
import { LancamentosPopup } from '@/components/financeiro/LancamentosPopup';

interface AssinaturaRow {
  id: string;
  nome: string;
  dia_desconto: number;
  valor: number;
  icone: string | null;
  status: string;
}

const ASSINATURA_ICONS = ['💳','📺','🎬','🎵','📡','☁️','📞','📱','💻','🛰️','📰','📚','🏋️','🛡️','🔒','💡','💧','⚡','🚜','🐄','🌾','🧾','💰','🏦'];

const CATEGORIAS_PADRAO = [
  { nome: 'Óleo Diesel', icone: '⛽' },
  { nome: 'Ração', icone: '🌾' },
  { nome: 'Medicamentos', icone: '💊' },
  { nome: 'Manutenção', icone: '🔧' },
  { nome: 'Mão de Obra', icone: '👷' },
  { nome: 'Venda de Gado', icone: '🐄' },
  { nome: 'Compra de Gado', icone: '🐂' },
  { nome: 'Sementes/Insumos', icone: '🌱' },
  { nome: 'Impostos', icone: '💰' },
  { nome: 'FGTS', icone: '🏦' },
  { nome: 'INSS', icone: '🧾' },
  { nome: 'Outros', icone: '📦' },
];

const CUSTOM_CAT_KEY = 'gastos_categorias_custom';
const loadCustomCats = (): { nome: string; icone: string }[] => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CAT_KEY) || '[]'); } catch { return []; }
};

export default function FinanceiroPage() {
  const { data: gastos = [], isLoading } = useGastos();
  const { data: fornecedoresList = [], isLoading: loadingFornecedores } = useFornecedores();
  const { data: insumosList = [] } = useInsumos();
  const createGasto = useCreateGasto();
  const createFornecedor = useCreateFornecedor();
  const qc = useQueryClient();

  // Custom categories
  const [customCats, setCustomCats] = useState(loadCustomCats);
  const CATEGORIAS = [...CATEGORIAS_PADRAO, ...customCats];
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatNome, setNewCatNome] = useState('');
  const [newCatIcone, setNewCatIcone] = useState('🏷️');

  // Movimentações state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterFornecedor, setFilterFornecedor] = useState('all');
  const [filterPeriodo, setFilterPeriodo] = useState<'mes' | '15d' | '90d' | 'all' | 'custom'>('mes');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [form, setForm] = useState({ descricao: '', categoria: CATEGORIAS_PADRAO[0].nome, valor: '', tipo: 'saida' as string, data: new Date().toISOString().split('T')[0], fornecedor: '' });
  const [estoqueEnabled, setEstoqueEnabled] = useState(false);
  const [estoqueQtd, setEstoqueQtd] = useState('');
  const [estoqueUnidade, setEstoqueUnidade] = useState('un');
  // Tax (imposto) for entradas
  const [impostoEnabled, setImpostoEnabled] = useState(false);
  const [impostoValor, setImpostoValor] = useState('');

  // Drilldown popup
  const [drilldown, setDrilldown] = useState<{ view: 'fornecedor' | 'categoria'; nome: string } | null>(null);

  const saveNewCategory = () => {
    const nome = newCatNome.trim();
    if (!nome) { toast.error('Informe um nome'); return; }
    if (CATEGORIAS.some(c => c.nome.toLowerCase() === nome.toLowerCase())) { toast.error('Categoria já existe'); return; }
    const updated = [...customCats, { nome, icone: newCatIcone || '🏷️' }];
    setCustomCats(updated);
    localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(updated));
    setForm(f => ({ ...f, categoria: nome }));
    setNewCatNome(''); setNewCatIcone('🏷️'); setShowNewCat(false);
    toast.success('Categoria criada!');
  };

  // Fornecedores state
  const [showFornecedorForm, setShowFornecedorForm] = useState(false);
  const [editingFornecedorId, setEditingFornecedorId] = useState<string | null>(null);
  const [deleteFornecedorId, setDeleteFornecedorId] = useState<string | null>(null);
  const [searchFornecedor, setSearchFornecedor] = useState('');
  const [fornecedorForm, setFornecedorForm] = useState({ nome: '', telefone: '', cnpj: '', email: '' });

  // Assinaturas state
  const [assinaturas, setAssinaturas] = useState<AssinaturaRow[]>([]);
  const [loadingAssinaturas, setLoadingAssinaturas] = useState(true);
  const [showAssinaturaForm, setShowAssinaturaForm] = useState(false);
  const [editingAssinaturaId, setEditingAssinaturaId] = useState<string | null>(null);
  const [deleteAssinaturaId, setDeleteAssinaturaId] = useState<string | null>(null);
  const [assinaturaForm, setAssinaturaForm] = useState({ nome: '', dia_desconto: '5', valor: '', icone: '💳' });

  const reloadAssinaturas = async () => {
    setLoadingAssinaturas(true);
    const { data, error } = await supabase.from('assinaturas' as any).select('*').order('dia_desconto', { ascending: true });
    if (!error && data) setAssinaturas(data as unknown as AssinaturaRow[]);
    setLoadingAssinaturas(false);
  };

  // Load on mount
  useEffect(() => { reloadAssinaturas(); }, []);

  const openNewAssinatura = () => {
    setEditingAssinaturaId(null);
    setAssinaturaForm({ nome: '', dia_desconto: '5', valor: '', icone: '💳' });
    setShowAssinaturaForm(true);
  };

  const openEditAssinatura = (a: AssinaturaRow) => {
    setEditingAssinaturaId(a.id);
    setAssinaturaForm({ nome: a.nome, dia_desconto: String(a.dia_desconto), valor: String(a.valor), icone: a.icone || '💳' });
    setShowAssinaturaForm(true);
  };

  const saveAssinatura = async () => {
    const nome = assinaturaForm.nome.trim();
    const dia = parseInt(assinaturaForm.dia_desconto, 10);
    const valor = parseFloat(assinaturaForm.valor);
    if (!nome) { toast.error('Informe o nome'); return; }
    if (!dia || dia < 1 || dia > 31) { toast.error('Dia deve ser entre 1 e 31'); return; }
    if (isNaN(valor) || valor <= 0) { toast.error('Informe um valor válido'); return; }
    const payload = { nome, dia_desconto: dia, valor, icone: assinaturaForm.icone || '💳' };
    if (editingAssinaturaId) {
      const { error } = await supabase.from('assinaturas' as any).update(payload).eq('id', editingAssinaturaId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Assinatura atualizada!');
    } else {
      const { error } = await supabase.from('assinaturas' as any).insert(payload);
      if (error) { toast.error('Erro ao salvar'); return; }
      toast.success('Assinatura adicionada!');
    }
    setShowAssinaturaForm(false);
    setEditingAssinaturaId(null);
    reloadAssinaturas();
  };

  const handleDeleteAssinatura = async () => {
    if (!deleteAssinaturaId) return;
    const { error } = await supabase.from('assinaturas' as any).delete().eq('id', deleteAssinaturaId);
    if (error) { toast.error('Erro ao remover'); return; }
    toast.success('Assinatura removida!');
    setDeleteAssinaturaId(null);
    reloadAssinaturas();
  };

  const totalAssinaturas = assinaturas.reduce((s, a) => s + Number(a.valor), 0);

  // Filter gastos
  let filtered = gastos;
  if (filterPeriodo === 'custom' && customRange?.from) {
    const fromIso = format(customRange.from, 'yyyy-MM-dd');
    const toIso = format(customRange.to ?? customRange.from, 'yyyy-MM-dd');
    filtered = filtered.filter(g => g.data >= fromIso && g.data <= toIso);
  } else if (filterPeriodo !== 'all' && filterPeriodo !== 'custom') {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let cutoff: Date;
    if (filterPeriodo === 'mes') {
      cutoff = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (filterPeriodo === '15d') {
      cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 15);
    } else {
      cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 90);
    }
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    filtered = filtered.filter(g => g.data >= cutoffIso);
  }
  const filteredByPeriod = filtered;
  if (filterTipo !== 'all') filtered = filtered.filter(g => g.tipo === filterTipo);
  if (filterCategoria !== 'all') filtered = filtered.filter(g => g.categoria === filterCategoria);
  if (filterFornecedor !== 'all') filtered = filtered.filter(g => g.fornecedor === filterFornecedor);
  if (search) filtered = filtered.filter(g => g.descricao.toLowerCase().includes(search.toLowerCase()) || (g.fornecedor && g.fornecedor.toLowerCase().includes(search.toLowerCase())));

  const periodoLabel =
    filterPeriodo === 'mes' ? 'Mês atual' :
    filterPeriodo === '15d' ? 'Últimos 15 dias' :
    filterPeriodo === '90d' ? 'Últimos 90 dias' :
    filterPeriodo === 'all' ? 'Todo o período' :
    customRange?.from ? `${format(customRange.from, 'dd/MM/yyyy')} – ${format(customRange.to ?? customRange.from, 'dd/MM/yyyy')}` : 'Período personalizado';

  const drilldownItems = drilldown
    ? filteredByPeriod.filter(g => drilldown.view === 'fornecedor'
        ? (g.fornecedor || 'Sem fornecedor') === drilldown.nome
        : (g.categoria || 'outros').toLowerCase() === drilldown.nome.toLowerCase())
    : [];

  const totalEntradas = gastos.filter(g => g.tipo === 'entrada').reduce((s, g) => s + Number(g.valor), 0);
  const totalSaidas = gastos.filter(g => g.tipo === 'saida').reduce((s, g) => s + Number(g.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const fornecedorMap = new Map<string, number>();
  gastos.filter(g => g.tipo === 'saida' && g.fornecedor).forEach(g => {
    const current = fornecedorMap.get(g.fornecedor!) || 0;
    fornecedorMap.set(g.fornecedor!, current + Number(g.valor));
  });
  const fornecedorRanking = [...fornecedorMap.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const categoriaMap = new Map<string, number>();
  gastos.filter(g => g.tipo === 'saida').forEach(g => {
    const cat = g.categoria || 'Outros';
    categoriaMap.set(cat, (categoriaMap.get(cat) || 0) + Number(g.valor));
  });
  const categoriaRanking = [...categoriaMap.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const openNew = (tipo: 'entrada' | 'saida' = 'saida') => {
    setEditingId(null);
    setForm({ descricao: '', categoria: CATEGORIAS[0].nome, valor: '', tipo, data: new Date().toISOString().split('T')[0], fornecedor: '' });
    setEstoqueEnabled(false); setEstoqueQtd(''); setEstoqueUnidade('un');
    setImpostoEnabled(false); setImpostoValor('');
    setShowForm(true);
  };

  const openEdit = (g: typeof gastos[0]) => {
    setEditingId(g.id);
    setForm({ descricao: g.descricao, categoria: g.categoria, valor: String(g.valor), tipo: g.tipo, data: g.data, fornecedor: g.fornecedor || '' });
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!form.descricao || !form.valor) return;
    const payload = { descricao: form.descricao, categoria: form.categoria, valor: parseFloat(form.valor), tipo: form.tipo, data: form.data, fornecedor: form.fornecedor || null };
    if (editingId) {
      const { error } = await supabase.from('gastos').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      qc.invalidateQueries({ queryKey: ['gastos'] });
      toast.success('Movimentação atualizada!');
    } else {
      await createGasto.mutateAsync(payload);

      // Auto-add to inventory if enabled
      if (estoqueEnabled && estoqueQtd && form.tipo === 'saida') {
        const qty = parseFloat(estoqueQtd);
        if (qty > 0) {
          // Check if insumo already exists with same name
          const existing = insumosList.find(i => i.nome.toLowerCase() === form.descricao.toLowerCase());
          if (existing) {
            // Update quantity
            await supabase.from('insumos').update({ quantidade: existing.quantidade + qty }).eq('id', existing.id);
            await supabase.from('movimentacoes_estoque').insert({
              insumo_id: existing.id, tipo: 'entrada', quantidade: qty,
              data: form.data, observacao: `Compra via fluxo de caixa`,
            });
          } else {
            // Create new insumo
            const { data: newInsumo } = await supabase.from('insumos').insert({
              nome: form.descricao, quantidade: qty, unidade: estoqueUnidade,
              minimo: 0, preco_compra: parseFloat(form.valor) / qty,
              categoria: form.categoria === 'Ração' ? 'racao' : 'geral',
              fornecedor: form.fornecedor || null,
            }).select().single();
            if (newInsumo) {
              await supabase.from('movimentacoes_estoque').insert({
                insumo_id: newInsumo.id, tipo: 'entrada', quantidade: qty,
                data: form.data, observacao: `Compra via fluxo de caixa`,
              });
            }
          }
          qc.invalidateQueries({ queryKey: ['insumos'] });
          qc.invalidateQueries({ queryKey: ['movimentacoes'] });
          toast.success('Produto adicionado ao estoque!');
        }
      }

      // Auto-create tax expense (imposto) for entradas
      if (impostoEnabled && impostoValor && form.tipo === 'entrada') {
        const tax = parseFloat(impostoValor);
        if (tax > 0) {
          await supabase.from('gastos').insert({
            descricao: `Imposto sobre: ${form.descricao}`,
            categoria: 'Impostos',
            valor: tax,
            tipo: 'saida',
            data: form.data,
            fornecedor: null,
          });
          qc.invalidateQueries({ queryKey: ['gastos'] });
          toast.success('Imposto registrado como saída');
        }
      }
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('gastos').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao remover'); return; }
    qc.invalidateQueries({ queryKey: ['gastos'] });
    toast.success('Movimentação removida!');
    setDeleteId(null);
  };

  const getCategoriaIcon = (cat: string) => CATEGORIAS.find(c => c.nome === cat)?.icone || '📦';
  const allCategories = [...new Set([...CATEGORIAS.map(c => c.nome), ...gastos.map(g => g.categoria)])];
  const allFornecedores = [...new Set(gastos.map(g => g.fornecedor).filter(Boolean))] as string[];

  // Fornecedores CRUD
  const filteredFornecedores = fornecedoresList.filter(f =>
    f.nome.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
    (f.cnpj && f.cnpj.includes(searchFornecedor)) ||
    (f.email && f.email.toLowerCase().includes(searchFornecedor.toLowerCase()))
  );

  const openNewFornecedor = () => {
    setEditingFornecedorId(null);
    setFornecedorForm({ nome: '', telefone: '', cnpj: '', email: '' });
    setShowFornecedorForm(true);
  };

  const openEditFornecedor = (f: typeof fornecedoresList[0]) => {
    setEditingFornecedorId(f.id);
    setFornecedorForm({ nome: f.nome, telefone: f.telefone || '', cnpj: f.cnpj || '', email: f.email || '' });
    setShowFornecedorForm(true);
  };

  const saveFornecedor = async () => {
    if (!fornecedorForm.nome) return;
    const payload = { nome: fornecedorForm.nome, telefone: fornecedorForm.telefone || null, cnpj: fornecedorForm.cnpj || null, email: fornecedorForm.email || null };
    if (editingFornecedorId) {
      const { error } = await supabase.from('fornecedores').update(payload).eq('id', editingFornecedorId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      qc.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor atualizado!');
    } else {
      await createFornecedor.mutateAsync(payload);
    }
    setShowFornecedorForm(false);
    setEditingFornecedorId(null);
  };

  const handleDeleteFornecedor = async () => {
    if (!deleteFornecedorId) return;
    const { error } = await supabase.from('fornecedores').delete().eq('id', deleteFornecedorId);
    if (error) { toast.error('Erro ao remover'); return; }
    qc.invalidateQueries({ queryKey: ['fornecedores'] });
    toast.success('Fornecedor removido!');
    setDeleteFornecedorId(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground mt-1">{gastos.length} movimentações · {fornecedoresList.length} fornecedores</p>
      </div>

      <Tabs defaultValue="movimentacoes" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="movimentacoes" className="rounded-lg">
            <DollarSign className="w-4 h-4 mr-1.5" /> Movimentações
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="rounded-lg">
            <Truck className="w-4 h-4 mr-1.5" /> Fornecedores
          </TabsTrigger>
          <TabsTrigger value="assinaturas" className="rounded-lg">
            <Repeat className="w-4 h-4 mr-1.5" /> Assinaturas
          </TabsTrigger>
        </TabsList>

        {/* === MOVIMENTAÇÕES TAB === */}
        <TabsContent value="movimentacoes" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button onClick={() => openNew('entrada')} className="gap-2 rounded-xl bg-success text-white hover:bg-success/90 min-h-[44px] min-w-[140px] text-base font-semibold">
              <ArrowUpCircle className="w-5 h-5" /> Entrada
            </Button>
            <Button onClick={() => openNew('saida')} className="gap-2 rounded-xl bg-destructive text-white hover:bg-destructive/90 min-h-[44px] min-w-[140px] text-base font-semibold">
              <ArrowDownCircle className="w-5 h-5" /> Saída
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-success/5 rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><ArrowUpCircle className="w-4 h-4 text-success" /> Entradas</div>
              <p className="text-xl font-bold text-success">R$ {totalEntradas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-destructive/5 rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><ArrowDownCircle className="w-4 h-4 text-destructive" /> Saídas</div>
              <p className="text-xl font-bold text-destructive">R$ {totalSaidas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-accent/5 rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><DollarSign className="w-4 h-4 text-accent" /> Saldo</div>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {saldo.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {(fornecedorRanking.length > 0 || categoriaRanking.length > 0) && (
            <FornecedorRanking
              data={fornecedorRanking}
              categoriasData={categoriaRanking}
              totalSaidas={totalSaidas}
              onItemClick={(view, nome) => setDrilldown({ view, nome })}
            />
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar descrição ou fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={filterPeriodo} onValueChange={(v) => setFilterPeriodo(v as typeof filterPeriodo)}>
              <SelectTrigger className="w-[170px] rounded-xl">
                <CalendarRange className="w-4 h-4 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Mês atual</SelectItem>
                <SelectItem value="15d">Últimos 15 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Tudo</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {filterPeriodo === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal rounded-xl min-w-[240px]',
                      !customRange?.from && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {customRange?.from ? (
                      customRange.to ? (
                        <>
                          {format(customRange.from, 'dd/MM/yy', { locale: ptBR })} – {format(customRange.to, 'dd/MM/yy', { locale: ptBR })}
                        </>
                      ) : (
                        format(customRange.from, 'dd/MM/yy', { locale: ptBR })
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            )}
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[160px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {allCategories.map(c => <SelectItem key={c} value={c}>{getCategoriaIcon(c)} {c}</SelectItem>)}
              </SelectContent>
            </Select>
            {allFornecedores.length > 0 && (
              <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                <SelectTrigger className="w-[160px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos fornecedores</SelectItem>
                  {allFornecedores.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <ExtratoSemanal
            items={filtered}
            getCategoriaIcon={getCategoriaIcon}
            onEdit={(g) => openEdit(g as typeof gastos[0])}
            onDelete={(id) => setDeleteId(id)}
          />
        </TabsContent>

        {/* === FORNECEDORES TAB === */}
        <TabsContent value="fornecedores" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CNPJ ou e-mail..." value={searchFornecedor} onChange={e => setSearchFornecedor(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Button onClick={openNewFornecedor} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4" /> Novo Fornecedor
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">CNPJ</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">E-mail</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredFornecedores.map(f => (
                    <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-card-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                          {f.nome}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{f.telefone || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.cnpj || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.email || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditFornecedor(f)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteFornecedorId(f.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFornecedores.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum fornecedor encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* === ASSINATURAS TAB === */}
        <TabsContent value="assinaturas" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="bg-accent/5 rounded-2xl px-5 py-4 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Repeat className="w-4 h-4 text-accent" /> Total mensal recorrente
              </div>
              <p className="text-xl font-bold text-foreground">R$ {totalAssinaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">{assinaturas.length} {assinaturas.length === 1 ? 'assinatura ativa' : 'assinaturas ativas'}</p>
            </div>
            <Button onClick={openNewAssinatura} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4" /> Nova Assinatura
            </Button>
          </div>

          {loadingAssinaturas ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : assinaturas.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
              <Repeat className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione pagamentos recorrentes como streaming, internet, software, etc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assinaturas.map(a => (
                <div key={a.id} className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3 hover:border-accent/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center text-2xl shrink-0">
                    {a.icone || '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">Todo dia {a.dia_desconto}</p>
                    <p className="text-sm font-bold text-destructive mt-0.5">R$ {Number(a.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEditAssinatura(a)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteAssinaturaId(a.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Movimentação Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingId ? 'Editar Movimentação' : form.tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saída'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição *</Label>
              <Input placeholder="Ex: Óleo Diesel - Trator" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fornecedor</Label>
              <Select value={form.fornecedor || '_none'} onValueChange={v => setForm({ ...form, fornecedor: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {fornecedoresList.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className="text-lg font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <div className="flex gap-2">
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.nome} value={c.nome}>{c.icone} {c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" className="shrink-0 rounded-md border-accent/40 text-accent hover:bg-accent/10" title="Criar nova categoria" onClick={() => setShowNewCat(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Estoque integration - only for new expenses (purchases) */}
            {!editingId && form.tipo === 'saida' && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="estoque-check"
                    checked={estoqueEnabled}
                    onCheckedChange={(v) => setEstoqueEnabled(!!v)}
                  />
                  <label htmlFor="estoque-check" className="text-sm font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Adicionar ao estoque (depósito)
                  </label>
                </div>
                {estoqueEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantidade *</Label>
                      <Input type="number" placeholder="Ex: 100" value={estoqueQtd} onChange={e => setEstoqueQtd(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unidade</Label>
                      <Select value={estoqueUnidade} onValueChange={setEstoqueUnidade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="L">Litro</SelectItem>
                          <SelectItem value="rolo">Rolo</SelectItem>
                          <SelectItem value="saco">Saco</SelectItem>
                          <SelectItem value="cx">Caixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Imposto integration - only for new entradas */}
            {!editingId && form.tipo === 'entrada' && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="imposto-check"
                    checked={impostoEnabled}
                    onCheckedChange={(v) => setImpostoEnabled(!!v)}
                  />
                  <label htmlFor="imposto-check" className="text-sm font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                    💰 Pagar imposto sobre esta entrada?
                  </label>
                </div>
                {impostoEnabled && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valor do Imposto (R$) *</Label>
                    <Input type="number" step="0.01" placeholder="0,00" value={impostoValor} onChange={e => setImpostoValor(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Será criada uma saída automática na categoria <strong>Impostos</strong>.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveForm} disabled={createGasto.isPending}>
              {createGasto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Salvar' : 'Cadastrar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Movimentação Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Remover Movimentação</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover esta movimentação?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fornecedor Form Dialog */}
      <Dialog open={showFornecedorForm} onOpenChange={setShowFornecedorForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingFornecedorId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Ex: Agro Center" value={fornecedorForm.nome} onChange={e => setFornecedorForm({ ...fornecedorForm, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={fornecedorForm.telefone} onChange={e => setFornecedorForm({ ...fornecedorForm, telefone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">CNPJ</Label>
              <Input placeholder="00.000.000/0000-00" value={fornecedorForm.cnpj} onChange={e => setFornecedorForm({ ...fornecedorForm, cnpj: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input placeholder="contato@fornecedor.com" value={fornecedorForm.email} onChange={e => setFornecedorForm({ ...fornecedorForm, email: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowFornecedorForm(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveFornecedor} disabled={createFornecedor.isPending}>
              {createFornecedor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingFornecedorId ? 'Salvar' : 'Cadastrar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={showNewCat} onOpenChange={setShowNewCat}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Nova Categoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Ex: Energia Elétrica" value={newCatNome} onChange={e => setNewCatNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ícone</Label>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-muted/30 rounded-xl border border-border/50 max-h-40 overflow-y-auto">
                {['🏷️','💡','⚡','💧','🔥','🚜','🚛','🌽','🌾','🌱','🐄','🐂','🐖','🐑','🐔','🥛','💊','💉','🔧','🔨','🛠️','⛽','📦','🧰','🏠','🏥','📱','💻','💰','💵','💸','📊','📈','📉','🧾','🏦','🌧️','☀️','🌡️','🪵','🌳','🍃','🥬','🥕','🍅','🥚','🧴','🛒'].map(emo => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setNewCatIcone(emo)}
                    className={`text-xl p-1.5 rounded-lg hover:bg-accent/20 transition-colors ${newCatIcone === emo ? 'bg-accent/30 ring-2 ring-accent' : ''}`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Selecionado:</span>
                <span className="text-2xl">{newCatIcone}</span>
              </div>
            </div>
            {customCats.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categorias personalizadas</Label>
                <div className="flex flex-wrap gap-1.5">
                  {customCats.map(c => (
                    <span key={c.nome} className="inline-flex items-center gap-1 text-xs bg-muted/50 rounded-full pl-2 pr-1 py-0.5">
                      {c.icone} {c.nome}
                      <button onClick={() => { const u = customCats.filter(x => x.nome !== c.nome); setCustomCats(u); localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(u)); }} className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNewCat(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveNewCategory}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Fornecedor Confirm */}
      <Dialog open={!!deleteFornecedorId} onOpenChange={(open) => !open && setDeleteFornecedorId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Remover Fornecedor</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este fornecedor?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteFornecedorId(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeleteFornecedor}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assinatura Form Dialog */}
      <Dialog open={showAssinaturaForm} onOpenChange={setShowAssinaturaForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingAssinaturaId ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Ex: Internet, Netflix, Software..." value={assinaturaForm.nome} onChange={e => setAssinaturaForm({ ...assinaturaForm, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dia do desconto *</Label>
                <Input type="number" min={1} max={31} placeholder="5" value={assinaturaForm.dia_desconto} onChange={e => setAssinaturaForm({ ...assinaturaForm, dia_desconto: e.target.value })} />
                <p className="text-[11px] text-muted-foreground">Dia do mês (1 a 31)</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={assinaturaForm.valor} onChange={e => setAssinaturaForm({ ...assinaturaForm, valor: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ícone</Label>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-muted/30 rounded-xl border border-border/50 max-h-40 overflow-y-auto">
                {ASSINATURA_ICONS.map(emo => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setAssinaturaForm({ ...assinaturaForm, icone: emo })}
                    className={`text-xl p-1.5 rounded-lg hover:bg-accent/20 transition-colors ${assinaturaForm.icone === emo ? 'bg-accent/30 ring-2 ring-accent' : ''}`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Selecionado:</span>
                <span className="text-2xl">{assinaturaForm.icone}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAssinaturaForm(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveAssinatura}>
              {editingAssinaturaId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Assinatura Confirm */}
      <Dialog open={!!deleteAssinaturaId} onOpenChange={(open) => !open && setDeleteAssinaturaId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Remover Assinatura</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover esta assinatura?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteAssinaturaId(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeleteAssinatura}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      <LancamentosPopup
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        title={drilldown ? `${drilldown.view === 'fornecedor' ? 'Fornecedor' : 'Categoria'}: ${drilldown.nome}` : ''}
        subtitle={`Período: ${periodoLabel}`}
        lancamentos={drilldownItems}
      />
    </div>
  );
}
