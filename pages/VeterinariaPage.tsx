import { useState } from 'react';
import { useVacinas, useUpdateVacina } from '@/hooks/useVacinas';
import { useAnimais } from '@/hooks/useAnimais';
import { useTratamentos, useCreateTratamento, useUpdateTratamento, useDeleteTratamento } from '@/hooks/useTratamentos';
import { useInsumos } from '@/hooks/useInsumos';
import { useLotesRebanho } from '@/hooks/useLotesRebanho';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Syringe, Loader2, Plus, Search, Stethoscope, AlertTriangle, Pill, Users, Warehouse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function VeterinariaPage() {
  const { data: vacinas = [], isLoading: loadV } = useVacinas();
  const { data: animais = [] } = useAnimais();
  const { data: insumos = [] } = useInsumos();
  const { data: lotesRebanho = [] } = useLotesRebanho();
  const { data: lotesConf = [] } = useLotesConfinamento();
  const { data: animaisConf = [] } = useAnimaisConfinamento();
  const { data: tratamentos = [], isLoading: loadT } = useTratamentos();
  const updateVacina = useUpdateVacina();
  const createTratamento = useCreateTratamento();
  const updateTratamento = useUpdateTratamento();
  const deleteTratamento = useDeleteTratamento();
  const qc = useQueryClient();

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({ modo: 'animal' as 'animal' | 'lote' | 'confinamento', animal_id: '', lote_id: '', confinamento_id: '', insumo_id: '', nome_manual: '', data_proxima: '', excluidos: [] as string[] });
  const [showExcluir, setShowExcluir] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tratamento state
  const [showTrat, setShowTrat] = useState(false);
  const [tratForm, setTratForm] = useState({
    animal_id: '', tipo: 'tratamento', descricao: '', diagnostico: '', medicamento: '',
    data_inicio: new Date().toISOString().split('T')[0], custo: '', observacao: '',
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    await updateVacina.mutateAsync({
      id,
      status: currentStatus === 'pendente' ? 'concluida' : 'pendente',
      data_aplicacao: currentStatus === 'pendente' ? new Date().toISOString().split('T')[0] : null,
    });
  };

  const vacinasInsumos = insumos.filter(i => i.categoria === 'medicamento' || i.categoria === 'vacina' || i.nome.toLowerCase().includes('vacina'));

  const handleCreate = async () => {
    const nomeVacina = (form.insumo_id && form.insumo_id !== '_none')
      ? insumos.find(i => i.id === form.insumo_id)?.nome || ''
      : form.nome_manual;
    if (!nomeVacina) { toast.error('Selecione ou informe a vacina'); return; }

    setSaving(true);
    try {
      let targetAnimais: string[] = [];

      if (form.modo === 'animal') {
        if (!form.animal_id) { toast.error('Selecione um animal'); setSaving(false); return; }
        targetAnimais = [form.animal_id];
      } else if (form.modo === 'lote') {
        if (!form.lote_id) { toast.error('Selecione um pasto/lote'); setSaving(false); return; }
        targetAnimais = animaisAtivos.filter(a => a.lote_rebanho_id === form.lote_id && !form.excluidos.includes(a.id)).map(a => a.id);
        if (targetAnimais.length === 0) { toast.error('Nenhum animal neste pasto'); setSaving(false); return; }
      } else {
        if (!form.confinamento_id) { toast.error('Selecione o confinamento'); setSaving(false); return; }
        targetAnimais = animaisConf
          .filter(ac => ac.lote_id === form.confinamento_id && ac.status === 'ativo' && !form.excluidos.includes(ac.animal_id))
          .map(ac => ac.animal_id);
        if (targetAnimais.length === 0) { toast.error('Nenhum animal neste confinamento'); setSaving(false); return; }
      }

      // Insert vaccines for all target animals
      const inserts = targetAnimais.map(animal_id => ({
        animal_id, nome: nomeVacina,
        data_proxima: form.data_proxima || null,
        data_aplicacao: new Date().toISOString().split('T')[0],
        status: 'concluida' as const,
      }));
      const { error } = await supabase.from('vacinas').insert(inserts);
      if (error) { toast.error('Erro ao cadastrar vacina'); setSaving(false); return; }

      // Subtract from stock if insumo selected
      if (form.insumo_id && form.insumo_id !== '_none') {
        const qtdUsada = targetAnimais.length; // 1 dose per animal
        const insumo = insumos.find(i => i.id === form.insumo_id);
        if (insumo) {
          const novaQtd = Math.max(0, Number(insumo.quantidade) - qtdUsada);
          await supabase.from('insumos').update({ quantidade: novaQtd }).eq('id', form.insumo_id);
          await supabase.from('movimentacoes_estoque').insert({
            insumo_id: form.insumo_id, tipo: 'saida', quantidade: qtdUsada,
            data: new Date().toISOString().split('T')[0],
            observacao: `Vacinação: ${nomeVacina} (${targetAnimais.length} animal${targetAnimais.length > 1 ? 'is' : ''})`,
          });
          qc.invalidateQueries({ queryKey: ['insumos'] });
          qc.invalidateQueries({ queryKey: ['movimentacoes'] });
        }
      }

      qc.invalidateQueries({ queryKey: ['vacinas'] });
      toast.success(`Vacina aplicada em ${targetAnimais.length} animal${targetAnimais.length > 1 ? 'is' : ''}!`);
      setForm({ modo: 'animal', animal_id: '', lote_id: '', confinamento_id: '', insumo_id: '', nome_manual: '', data_proxima: '', excluidos: [] });
      setShowNew(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTratamento = async () => {
    if (!tratForm.animal_id || !tratForm.descricao) { toast.error('Preencha animal e descrição'); return; }
    await createTratamento.mutateAsync({
      animal_id: tratForm.animal_id,
      tipo: tratForm.tipo,
      descricao: tratForm.descricao,
      diagnostico: tratForm.diagnostico || null,
      medicamento: tratForm.medicamento || null,
      data_inicio: tratForm.data_inicio,
      data_fim: null,
      custo: parseFloat(tratForm.custo) || 0,
      status: 'em_andamento',
      observacao: tratForm.observacao || null,
    });
    setShowTrat(false);
    setTratForm({ animal_id: '', tipo: 'tratamento', descricao: '', diagnostico: '', medicamento: '', data_inicio: new Date().toISOString().split('T')[0], custo: '', observacao: '' });
  };

  const finalizarTratamento = async (id: string) => {
    await updateTratamento.mutateAsync({ id, status: 'finalizado', data_fim: new Date().toISOString().split('T')[0] });
  };

  const getAnimalName = (animalId: string) => {
    const animal = animais.find(a => a.id === animalId);
    return animal ? `${animal.nome || animal.brinco} (${animal.brinco})` : animalId;
  };

  const animaisAtivos = animais.filter(a => a.status === 'ativo');
  const hoje = new Date().toISOString().split('T')[0];

  // Filter vacinas
  let filtered = vacinas;
  if (filterStatus !== 'all') filtered = filtered.filter(v => v.status === filterStatus);
  if (search) {
    filtered = filtered.filter(v => {
      const animalName = getAnimalName(v.animal_id).toLowerCase();
      return v.nome.toLowerCase().includes(search.toLowerCase()) || animalName.includes(search.toLowerCase());
    });
  }
  const pendentes = filtered.filter(v => v.status === 'pendente');
  const concluidas = filtered.filter(v => v.status === 'concluida');

  // Stats
  const totalPendentes = vacinas.filter(v => v.status === 'pendente').length;
  const totalConcluidas = vacinas.filter(v => v.status === 'concluida').length;
  const vencidas = vacinas.filter(v => v.status === 'pendente' && v.data_proxima && v.data_proxima < hoje).length;
  const tratAtivos = tratamentos.filter(t => t.status === 'em_andamento').length;
  const custoTratamentos = tratamentos.reduce((s, t) => s + Number(t.custo), 0);

  if (loadV || loadT) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Controle Veterinário</h1>
          <p className="text-sm text-muted-foreground mt-1">Vacinações, tratamentos e saúde do rebanho</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTrat(true)} variant="outline" className="gap-2 rounded-xl">
            <Stethoscope className="w-4 h-4" /> Novo Tratamento
          </Button>
          <Button onClick={() => setShowNew(true)} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4" /> Nova Vacina
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-warning/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5 text-warning" /> Vacinas Pend.</div>
          <p className="text-xl font-bold text-warning">{totalPendentes}</p>
          {vencidas > 0 && <p className="text-xs text-destructive mt-1">⚠️ {vencidas} vencida(s)</p>}
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CheckCircle className="w-3.5 h-3.5 text-success" /> Concluídas</div>
          <p className="text-xl font-bold text-success">{totalConcluidas}</p>
        </div>
        <div className="bg-destructive/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Stethoscope className="w-3.5 h-3.5 text-destructive" /> Trat. Ativos</div>
          <p className="text-xl font-bold text-destructive">{tratAtivos}</p>
        </div>
        <div className="bg-info/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Pill className="w-3.5 h-3.5 text-info" /> Total Trat.</div>
          <p className="text-xl font-bold text-foreground">{tratamentos.length}</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><AlertTriangle className="w-3.5 h-3.5 text-primary" /> Custo Trat.</div>
          <p className="text-xl font-bold text-foreground">R$ {custoTratamentos.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <Tabs defaultValue="vacinas">
        <TabsList className="rounded-xl">
          <TabsTrigger value="vacinas" className="rounded-lg">Vacinações</TabsTrigger>
          <TabsTrigger value="tratamentos" className="rounded-lg">Tratamentos & Doenças</TabsTrigger>
        </TabsList>

        <TabsContent value="vacinas" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar vacina ou animal..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pendentes.length > 0 && (
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground mb-3">⚠️ Pendentes</h2>
              <div className="space-y-3">
                {pendentes.map(v => (
                  <div key={v.id} className={`bg-card rounded-2xl p-4 border flex items-center justify-between gap-4 ${v.data_proxima && v.data_proxima < hoje ? 'border-destructive/30' : 'border-warning/20'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Syringe className={`w-5 h-5 shrink-0 ${v.data_proxima && v.data_proxima < hoje ? 'text-destructive' : 'text-warning'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground truncate">{v.nome}</p>
                        <p className="text-sm text-muted-foreground truncate">{getAnimalName(v.animal_id)}</p>
                        {v.data_proxima && <p className={`text-xs ${v.data_proxima < hoje ? 'text-destructive font-medium' : 'text-warning'}`}>{v.data_proxima < hoje ? '⚠️ Vencida: ' : 'Prevista: '}{v.data_proxima}</p>}
                      </div>
                    </div>
                    <button onClick={() => toggleStatus(v.id, v.status)} className="px-3 py-1.5 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors shrink-0">Concluir</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {concluidas.length > 0 && (
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground mb-3">✅ Concluídas</h2>
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vacina</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Animal</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {concluidas.map(v => (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-card-foreground">{v.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getAnimalName(v.animal_id)}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.data_aplicacao || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
              <Syringe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma vacina encontrada.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tratamentos" className="space-y-4 mt-4">
          {tratamentos.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
              <Stethoscope className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum tratamento registrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tratamentos.map(t => (
                <div key={t.id} className={`bg-card rounded-2xl p-4 border ${t.status === 'em_andamento' ? 'border-warning/30' : 'border-border/50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={t.tipo === 'doenca' ? 'bg-destructive/10 text-destructive border-0' : 'bg-info/10 text-info border-0'}>
                          {t.tipo === 'doenca' ? '🦠 Doença' : '💊 Tratamento'}
                        </Badge>
                        <Badge variant="secondary" className={t.status === 'em_andamento' ? 'bg-warning/10 text-warning border-0' : 'bg-success/10 text-success border-0'}>
                          {t.status === 'em_andamento' ? 'Em Andamento' : 'Finalizado'}
                        </Badge>
                      </div>
                      <p className="font-medium text-card-foreground">{t.descricao}</p>
                      <p className="text-sm text-muted-foreground">{getAnimalName(t.animal_id)}</p>
                      {t.diagnostico && <p className="text-xs text-muted-foreground mt-1">Diagnóstico: {t.diagnostico}</p>}
                      {t.medicamento && <p className="text-xs text-muted-foreground">Medicamento: {t.medicamento}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Início: {new Date(t.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        {t.data_fim && <span>Fim: {new Date(t.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                        {Number(t.custo) > 0 && <span className="font-medium text-foreground">R$ {Number(t.custo).toLocaleString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {t.status === 'em_andamento' && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => finalizarTratamento(t.id)}>Finalizar</Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTratamento.mutate(t.id)}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Vaccine Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Aplicar Vacina</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Modo: animal ou lote */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Aplicar em</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant={form.modo === 'animal' ? 'default' : 'outline'} className="rounded-xl gap-2"
                  onClick={() => setForm({ ...form, modo: 'animal', lote_id: '', confinamento_id: '', excluidos: [] })}>
                  <Syringe className="w-4 h-4" /> Animal
                </Button>
                <Button variant={form.modo === 'lote' ? 'default' : 'outline'} className="rounded-xl gap-2"
                  onClick={() => setForm({ ...form, modo: 'lote', animal_id: '', confinamento_id: '', excluidos: [] })}>
                  <Users className="w-4 h-4" /> Pasto
                </Button>
                <Button variant={form.modo === 'confinamento' ? 'default' : 'outline'} className="rounded-xl gap-2"
                  onClick={() => setForm({ ...form, modo: 'confinamento', animal_id: '', lote_id: '', excluidos: [] })}>
                  <Warehouse className="w-4 h-4" /> Confinam.
                </Button>
              </div>
            </div>

            {form.modo === 'animal' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Animal *</Label>
                <Select value={form.animal_id} onValueChange={v => setForm({ ...form, animal_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um animal" /></SelectTrigger>
                  <SelectContent>
                    {animaisAtivos.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.sexo === 'macho' ? '🐂' : '🐄'} {a.nome || a.brinco} ({a.brinco})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.modo === 'lote' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pasto/Lote *</Label>
                <Select value={form.lote_id} onValueChange={v => setForm({ ...form, lote_id: v, excluidos: [] })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o pasto" /></SelectTrigger>
                  <SelectContent>
                    {lotesRebanho.map(l => {
                      const count = animaisAtivos.filter(a => a.lote_rebanho_id === l.id).length;
                      return <SelectItem key={l.id} value={l.id}>{l.nome} ({count} animais)</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                {form.lote_id && (() => {
                  const lotAnimals = animaisAtivos.filter(a => a.lote_rebanho_id === form.lote_id);
                  const incluidos = lotAnimals.filter(a => !form.excluidos.includes(a.id)).length;
                  return (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground">
                          Aplicar em <strong className="text-foreground">{incluidos}</strong> de {lotAnimals.length} animais
                        </p>
                        <button type="button" className="text-accent font-medium hover:underline" onClick={() => setShowExcluir(s => !s)}>
                          {showExcluir ? 'Ocultar' : 'Editar lista'}
                        </button>
                      </div>
                      {showExcluir && (
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-muted/10 p-2 space-y-1">
                          {lotAnimals.map(a => {
                            const excluido = form.excluidos.includes(a.id);
                            return (
                              <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 cursor-pointer text-sm">
                                <Checkbox checked={!excluido} onCheckedChange={(v) => {
                                  setForm(prev => ({
                                    ...prev,
                                    excluidos: v ? prev.excluidos.filter(id => id !== a.id) : [...prev.excluidos, a.id],
                                  }));
                                }} />
                                <span className={excluido ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                  {a.sexo === 'macho' ? '🐂' : '🐄'} {a.nome || a.brinco} ({a.brinco})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {form.modo === 'confinamento' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Confinamento *</Label>
                <Select value={form.confinamento_id} onValueChange={v => setForm({ ...form, confinamento_id: v, excluidos: [] })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o confinamento" /></SelectTrigger>
                  <SelectContent>
                    {lotesConf.filter(l => l.status === 'ativo').map(l => {
                      const count = animaisConf.filter(ac => ac.lote_id === l.id && ac.status === 'ativo').length;
                      return <SelectItem key={l.id} value={l.id}>{l.nome} ({count} animais)</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                {form.confinamento_id && (() => {
                  const confAtivos = animaisConf.filter(ac => ac.lote_id === form.confinamento_id && ac.status === 'ativo');
                  const incluidos = confAtivos.filter(ac => !form.excluidos.includes(ac.animal_id)).length;
                  return (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground">
                          Aplicar em <strong className="text-foreground">{incluidos}</strong> de {confAtivos.length} animais
                        </p>
                        <button type="button" className="text-accent font-medium hover:underline" onClick={() => setShowExcluir(s => !s)}>
                          {showExcluir ? 'Ocultar' : 'Editar lista'}
                        </button>
                      </div>
                      {showExcluir && (
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-muted/10 p-2 space-y-1">
                          {confAtivos.map(ac => {
                            const a = animais.find(x => x.id === ac.animal_id);
                            if (!a) return null;
                            const excluido = form.excluidos.includes(a.id);
                            return (
                              <label key={ac.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 cursor-pointer text-sm">
                                <Checkbox checked={!excluido} onCheckedChange={(v) => {
                                  setForm(prev => ({
                                    ...prev,
                                    excluidos: v ? prev.excluidos.filter(id => id !== a.id) : [...prev.excluidos, a.id],
                                  }));
                                }} />
                                <span className={excluido ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                  {a.sexo === 'macho' ? '🐂' : '🐄'} {a.nome || a.brinco} ({a.brinco})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vacina do Estoque</Label>
              <Select value={form.insumo_id} onValueChange={v => setForm({ ...form, insumo_id: v, nome_manual: '' })}>
                <SelectTrigger><SelectValue placeholder="Selecione do depósito (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Não usar do estoque</SelectItem>
                  {vacinasInsumos.map(i => (
                    <SelectItem key={i.id} value={i.id}>💉 {i.nome} ({Number(i.quantidade)} {i.unidade})</SelectItem>
                  ))}
                  {vacinasInsumos.length === 0 && insumos.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome} ({Number(i.quantidade)} {i.unidade})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(!form.insumo_id || form.insumo_id === '_none') && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome da Vacina *</Label>
                <Input placeholder="Ex: Aftosa, Brucelose, Raiva" value={form.nome_manual} onChange={e => setForm({ ...form, nome_manual: e.target.value })} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Prevista (próxima dose)</Label>
              <Input type="date" value={form.data_proxima} onChange={e => setForm({ ...form, data_proxima: e.target.value })} className="text-foreground" />
            </div>

            {/* Summary */}
            {(() => {
              const countTarget = form.modo === 'animal'
                ? (form.animal_id ? 1 : 0)
                : form.modo === 'lote'
                  ? animaisAtivos.filter(a => a.lote_rebanho_id === form.lote_id && !form.excluidos.includes(a.id)).length
                  : animaisConf.filter(ac => ac.lote_id === form.confinamento_id && ac.status === 'ativo' && !form.excluidos.includes(ac.animal_id)).length;
              const hasTarget = form.modo === 'animal' ? !!form.animal_id : form.modo === 'lote' ? !!form.lote_id : !!form.confinamento_id;
              const hasVacina = form.insumo_id && form.insumo_id !== '_none' ? true : !!form.nome_manual;
              if (!hasTarget || !hasVacina) return null;
              return (
              <div className="bg-accent/10 rounded-xl p-3 text-sm space-y-1">
                <p className="font-medium text-foreground">Resumo:</p>
                <p className="text-muted-foreground">
                  Vacina: <strong className="text-foreground">{form.insumo_id && form.insumo_id !== '_none' ? insumos.find(i => i.id === form.insumo_id)?.nome : form.nome_manual}</strong>
                </p>
                <p className="text-muted-foreground">
                  Animais: <strong className="text-foreground">{countTarget}</strong>
                </p>
                {form.insumo_id && form.insumo_id !== '_none' && (
                  <p className="text-muted-foreground">
                    Saída do estoque: <strong className="text-foreground">{countTarget} dose(s)</strong>
                  </p>
                )}
              </div>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Concluir Vacinação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Treatment Dialog */}
      <Dialog open={showTrat} onOpenChange={setShowTrat}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Registrar Tratamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Animal *</Label>
              <Select value={tratForm.animal_id} onValueChange={v => setTratForm({ ...tratForm, animal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um animal" /></SelectTrigger>
                <SelectContent>
                  {animaisAtivos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.sexo === 'macho' ? '🐂' : '🐄'} {a.nome || a.brinco} ({a.brinco})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={tratForm.tipo} onValueChange={v => setTratForm({ ...tratForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tratamento">Tratamento</SelectItem>
                    <SelectItem value="doenca">Doença</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data Início</Label>
                <Input type="date" value={tratForm.data_inicio} onChange={e => setTratForm({ ...tratForm, data_inicio: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição *</Label>
              <Input placeholder="Descreva o tratamento" value={tratForm.descricao} onChange={e => setTratForm({ ...tratForm, descricao: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Diagnóstico</Label>
              <Input placeholder="Diagnóstico (opcional)" value={tratForm.diagnostico} onChange={e => setTratForm({ ...tratForm, diagnostico: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Medicamento</Label>
                <Input placeholder="Nome do medicamento" value={tratForm.medicamento} onChange={e => setTratForm({ ...tratForm, medicamento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Custo (R$)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={tratForm.custo} onChange={e => setTratForm({ ...tratForm, custo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Input placeholder="Observação (opcional)" value={tratForm.observacao} onChange={e => setTratForm({ ...tratForm, observacao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowTrat(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreateTratamento} disabled={createTratamento.isPending}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
