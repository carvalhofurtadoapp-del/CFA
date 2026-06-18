import { useState } from 'react';
import { Plus, Loader2, Users, Calendar, Package, X, CheckCircle, Pencil, Apple, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PesagemQuickDialog } from '@/components/PesagemQuickDialog';
import { useLotesConfinamento, useAnimaisConfinamento, useCreateLote, useAddAnimalToLote, useRegistrarConsumo, useConsumoRacao } from '@/hooks/useConfinamento';
import { useAnimais, useUpdateAnimal } from '@/hooks/useAnimais';
import { usePesagens, useCreatePesagem } from '@/hooks/usePesagens';
import { useInsumos } from '@/hooks/useInsumos';
import { useDietas } from '@/hooks/useDietas';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ConfinamentoPage() {
  const { data: lotes = [], isLoading } = useLotesConfinamento();
  const { data: allAnimaisConf = [] } = useAnimaisConfinamento();
  const { data: animais = [] } = useAnimais();
  const { data: allPesagens = [] } = usePesagens();
  const { data: insumos = [] } = useInsumos();
  const { data: allConsumo = [] } = useConsumoRacao();
  const { data: dietas = [] } = useDietas();
  const createLote = useCreateLote();
  const addAnimalToLote = useAddAnimalToLote();
  const registrarConsumo = useRegistrarConsumo();
  const updateAnimal = useUpdateAnimal();
  const createPesagem = useCreatePesagem();
  const qc = useQueryClient();

  const [newLoteOpen, setNewLoteOpen] = useState(false);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [consumoOpen, setConsumoOpen] = useState(false);
  const [saidaOpen, setSaidaOpen] = useState(false);
  const [closeLoteOpen, setCloseLoteOpen] = useState(false);
  const [editLoteOpen, setEditLoteOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [selectedAnimalConf, setSelectedAnimalConf] = useState<string | null>(null);
  const [pesagemAnimalId, setPesagemAnimalId] = useState<string | null>(null);
  const [ganhoDiaDates, setGanhoDiaDates] = useState<Record<string, string>>({});

  const [loteForm, setLoteForm] = useState({ nome: '', data_inicio: new Date().toISOString().split('T')[0], previsao_saida: '', racao_insumo_id: '', dieta_id: '' });
  const [editLoteForm, setEditLoteForm] = useState({ nome: '', data_inicio: '', previsao_saida: '', racao_insumo_id: '', dieta_id: '' });
  const [animalForm, setAnimalForm] = useState({ animal_id: '', peso_entrada: '', previsao_saida: '' });
  const [consumoForm, setConsumoForm] = useState({ insumo_id: '', quantidade: '', data: new Date().toISOString().split('T')[0] });
  const [saidaForm, setSaidaForm] = useState({ peso_saida: '', data_saida: new Date().toISOString().split('T')[0] });

  const handleCreateLote = async () => {
    if (!loteForm.nome) return;
    await createLote.mutateAsync({
      nome: loteForm.nome,
      data_inicio: loteForm.data_inicio,
      previsao_saida: loteForm.previsao_saida || null,
      racao_insumo_id: loteForm.racao_insumo_id || null,
      dieta_id: (loteForm.dieta_id && loteForm.dieta_id !== '_none') ? loteForm.dieta_id : null,
      status: 'ativo',
    });
    setLoteForm({ nome: '', data_inicio: new Date().toISOString().split('T')[0], previsao_saida: '', racao_insumo_id: '', dieta_id: '' });
    setNewLoteOpen(false);
  };

  const handleEditLote = async () => {
    if (!selectedLote || !editLoteForm.nome) return;
    await supabase.from('lotes_confinamento').update({
      nome: editLoteForm.nome,
      data_inicio: editLoteForm.data_inicio,
      previsao_saida: editLoteForm.previsao_saida || null,
      racao_insumo_id: editLoteForm.racao_insumo_id || null,
      dieta_id: (editLoteForm.dieta_id && editLoteForm.dieta_id !== '_none') ? editLoteForm.dieta_id : null,
    } as any).eq('id', selectedLote);
    qc.invalidateQueries({ queryKey: ['lotes_confinamento'] });
    toast.success('Lote atualizado!');
    setEditLoteOpen(false);
  };

  const handleAddAnimal = async () => {
    if (!animalForm.animal_id || !animalForm.peso_entrada || !selectedLote) return;
    await addAnimalToLote.mutateAsync({
      animal_id: animalForm.animal_id,
      lote_id: selectedLote,
      data_entrada: new Date().toISOString().split('T')[0],
      peso_entrada: parseFloat(animalForm.peso_entrada),
      previsao_saida: animalForm.previsao_saida || null,
      data_saida: null,
      peso_saida: null,
      status: 'ativo',
    });
    // Mark animal as confined
    await updateAnimal.mutateAsync({ id: animalForm.animal_id, data_confinamento: new Date().toISOString().split('T')[0] });
    setAnimalForm({ animal_id: '', peso_entrada: '', previsao_saida: '' });
    setAddAnimalOpen(false);
  };

  const handleConsumo = async () => {
    if (!consumoForm.insumo_id || !consumoForm.quantidade || !selectedLote) return;
    const lote = lotes.find(l => l.id === selectedLote);
    await registrarConsumo.mutateAsync({
      lote_id: selectedLote,
      insumo_id: consumoForm.insumo_id,
      quantidade: parseFloat(consumoForm.quantidade),
      data: consumoForm.data,
      lote_nome: lote?.nome,
    });
    setConsumoForm({ insumo_id: '', quantidade: '', data: new Date().toISOString().split('T')[0] });
    setConsumoOpen(false);
  };

  const handleSaidaAnimal = async () => {
    if (!selectedAnimalConf || !saidaForm.peso_saida) { toast.error('Informe o peso de saída'); return; }
    const ac = allAnimaisConf.find(a => a.id === selectedAnimalConf);
    if (!ac) return;

    // Update animais_confinamento
    await supabase.from('animais_confinamento').update({
      status: 'finalizado',
      peso_saida: parseFloat(saidaForm.peso_saida),
      data_saida: saidaForm.data_saida,
    }).eq('id', selectedAnimalConf);

    // Clear animal confinamento date
    await updateAnimal.mutateAsync({ id: ac.animal_id, data_confinamento: null });

    // Register weight
    await createPesagem.mutateAsync({
      animal_id: ac.animal_id,
      peso: parseFloat(saidaForm.peso_saida),
      data: saidaForm.data_saida,
      gmd: null,
    });

    qc.invalidateQueries({ queryKey: ['animais_confinamento'] });
    toast.success('Animal retirado do confinamento!');
    setSaidaOpen(false);
    setSaidaForm({ peso_saida: '', data_saida: new Date().toISOString().split('T')[0] });
    setSelectedAnimalConf(null);
  };

  const handleCloseLote = async () => {
    if (!selectedLote) return;
    // Finalize all active animals in this lote
    const loteAnimais = allAnimaisConf.filter(ac => ac.lote_id === selectedLote && ac.status === 'ativo');
    for (const ac of loteAnimais) {
      await supabase.from('animais_confinamento').update({ status: 'finalizado', data_saida: new Date().toISOString().split('T')[0] }).eq('id', ac.id);
      await updateAnimal.mutateAsync({ id: ac.animal_id, data_confinamento: null });
    }
    // Close lote
    await supabase.from('lotes_confinamento').update({ status: 'finalizado' }).eq('id', selectedLote);
    qc.invalidateQueries({ queryKey: ['lotes_confinamento'] });
    qc.invalidateQueries({ queryKey: ['animais_confinamento'] });
    toast.success('Lote finalizado!');
    setCloseLoteOpen(false);
    setSelectedLote(null);
  };

  // Animals not yet in any active confinamento
  const confinedAnimalIds = new Set(allAnimaisConf.filter(ac => ac.status === 'ativo').map(ac => ac.animal_id));
  const availableAnimals = animais.filter(a => a.status === 'ativo' && !confinedAnimalIds.has(a.id));

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const activeLotes = lotes.filter(l => l.status === 'ativo');
  const finishedLotes = lotes.filter(l => l.status !== 'ativo');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Confinamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de lotes, peso e consumo de ração</p>
        </div>
        <Button onClick={() => setNewLoteOpen(true)} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Novo Lote
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Lotes Ativos</p>
          <p className="text-2xl font-bold text-foreground">{activeLotes.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Animais Confinados</p>
          <p className="text-2xl font-bold text-foreground">{allAnimaisConf.filter(a => a.status === 'ativo').length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gado Disponível</p>
          <p className="text-2xl font-bold text-foreground">{availableAnimals.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Lotes Finalizados</p>
          <p className="text-2xl font-bold text-foreground">{finishedLotes.length}</p>
        </div>
      </div>

      {/* Active Lotes */}
      {activeLotes.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <p className="text-4xl mb-3">🏗️</p>
          <p className="text-muted-foreground">Nenhum lote de confinamento ativo.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie um lote para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeLotes.map(lote => {
            const loteAnimais = allAnimaisConf.filter(ac => ac.lote_id === lote.id && ac.status === 'ativo');
            const loteConsumo = allConsumo.filter(c => c.lote_id === lote.id);
            const totalConsumoKg = loteConsumo.reduce((sum, c) => sum + Number(c.quantidade), 0);
            const racaoNome = lote.racao_insumo_id ? insumos.find(i => i.id === lote.racao_insumo_id)?.nome : null;
            const diasAtivos = Math.max(1, Math.ceil((Date.now() - new Date(lote.data_inicio).getTime()) / (1000 * 60 * 60 * 24)));

            // Ganho total do lote (soma dos ganhos individuais com base na última pesagem)
            const ganhoTotalLote = loteAnimais.reduce((sum, ac) => {
              const ps = allPesagens.filter(p => p.animal_id === ac.animal_id).sort((a, b) => a.data.localeCompare(b.data));
              const ultimo = ps.length > 0 ? Number(ps[ps.length - 1].peso) : Number(ac.peso_entrada);
              return sum + (ultimo - Number(ac.peso_entrada));
            }, 0);

            // Ganho do dia (data selecionável por lote, padrão = hoje)
            const todayStr = new Date().toISOString().split('T')[0];
            const ganhoDiaDate = ganhoDiaDates[lote.id] || todayStr;
            const ganhoDoDia = loteAnimais.reduce((sum, ac) => {
              const ps = allPesagens
                .filter(p => p.animal_id === ac.animal_id)
                .sort((a, b) => a.data.localeCompare(b.data));
              const pesagemDoDia = ps.find(p => p.data === ganhoDiaDate);
              if (!pesagemDoDia) return sum;
              const anteriores = ps.filter(p => p.data < ganhoDiaDate);
              const pesoAnterior = anteriores.length > 0
                ? Number(anteriores[anteriores.length - 1].peso)
                : Number(ac.peso_entrada);
              return sum + (Number(pesagemDoDia.peso) - pesoAnterior);
            }, 0);
            const temPesagemNoDia = loteAnimais.some(ac =>
              allPesagens.some(p => p.animal_id === ac.animal_id && p.data === ganhoDiaDate)
            );

            return (
              <div key={lote.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/50">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-display text-card-foreground truncate">{lote.nome}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold uppercase tracking-wide">Ativo</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Início: <span className="text-foreground font-medium">{format(new Date(lote.data_inicio + 'T00:00:00'), 'dd/MM/yyyy')}</span></span>
                        {lote.previsao_saida && (
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Previsão: <span className="text-foreground font-medium">{format(new Date(lote.previsao_saida + 'T00:00:00'), 'dd/MM/yyyy')}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumo rápido */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Animais</p>
                      <p className="text-base font-bold text-card-foreground">{loteAnimais.length}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dias</p>
                      <p className="text-base font-bold text-card-foreground">{diasAtivos}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ganho total</p>
                      <p className={`text-base font-bold ${ganhoTotalLote >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {ganhoTotalLote >= 0 ? '+' : ''}{ganhoTotalLote.toFixed(0)} kg
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[44px]" onClick={() => {
                      setSelectedLote(lote.id);
                      setEditLoteForm({ nome: lote.nome, data_inicio: lote.data_inicio, previsao_saida: lote.previsao_saida || '', racao_insumo_id: lote.racao_insumo_id || '', dieta_id: (lote as any).dieta_id || '' });
                      setEditLoteOpen(true);
                    }}>
                      <Pencil className="w-4 h-4" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[44px]" onClick={() => { setSelectedLote(lote.id); setAddAnimalOpen(true); }}>
                      <Plus className="w-4 h-4" /> Animal
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[44px]" onClick={() => { setSelectedLote(lote.id); setConsumoOpen(true); }}>
                      <Package className="w-4 h-4" /> Ração
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[44px] border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedLote(lote.id); setCloseLoteOpen(true); }}>
                      <X className="w-4 h-4" /> Fechar
                    </Button>
                  </div>
                </div>

                {/* Indicadores */}
                <div className="px-5 py-4 bg-muted/20 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indicadores do lote</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ração</p>
                      <p className="text-sm font-semibold text-card-foreground mt-0.5 break-words leading-tight" title={racaoNome || ''}>{racaoNome || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Consumo total</p>
                      <p className="text-sm font-semibold text-card-foreground mt-0.5">{totalConsumoKg.toFixed(1)} <span className="text-[10px] text-muted-foreground">kg</span></p>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Kg/cab/dia</p>
                      <p className="text-sm font-semibold text-card-foreground mt-0.5">
                        {loteAnimais.length > 0 && diasAtivos > 0 ? (totalConsumoKg / loteAnimais.length / diasAtivos).toFixed(2) : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ganho total</p>
                      <p className={`text-sm font-bold mt-0.5 ${ganhoTotalLote >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {ganhoTotalLote >= 0 ? '+' : ''}{ganhoTotalLote.toFixed(1)} <span className="text-[10px] text-muted-foreground">kg</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ganho do dia</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-muted/60 text-[10px] font-medium text-foreground"
                              aria-label="Selecionar data"
                            >
                              <Calendar className="w-3 h-3" />
                              {format(new Date(ganhoDiaDate + 'T00:00:00'), "dd/MM", { locale: ptBR })}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarPicker
                              mode="single"
                              selected={new Date(ganhoDiaDate + 'T00:00:00')}
                              onSelect={(d) => {
                                if (d) setGanhoDiaDates(prev => ({ ...prev, [lote.id]: d.toISOString().split('T')[0] }));
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className={`text-sm font-bold mt-0.5 ${!temPesagemNoDia ? 'text-muted-foreground' : ganhoDoDia >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {temPesagemNoDia ? <>{ganhoDoDia >= 0 ? '+' : ''}{ganhoDoDia.toFixed(1)} <span className="text-[10px] text-muted-foreground">kg</span></> : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Última atualização</p>
                      <p className="text-sm font-semibold text-card-foreground mt-0.5">
                        {(() => {
                          const last = loteConsumo[0]?.data;
                          return last ? format(new Date(last + 'T00:00:00'), 'dd/MM/yyyy') : '—';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animais */}
                {loteAnimais.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Animais do lote</p>
                    <div className="space-y-2">
                      {loteAnimais.map(ac => {
                        const animal = animais.find(a => a.id === ac.animal_id);
                        const pesagensAnimal = allPesagens.filter(p => p.animal_id === ac.animal_id).sort((a, b) => a.data.localeCompare(b.data));
                        const ultimoPeso = pesagensAnimal.length > 0 ? Number(pesagensAnimal[pesagensAnimal.length - 1].peso) : ac.peso_entrada;
                        const diasConf = Math.max(1, Math.ceil((Date.now() - new Date(ac.data_entrada).getTime()) / (1000 * 60 * 60 * 24)));
                        const gmd = ((ultimoPeso - ac.peso_entrada) / diasConf).toFixed(2);
                        const ganhoTotal = (ultimoPeso - ac.peso_entrada).toFixed(1);

                        return (
                          <div key={ac.id} className="rounded-xl border border-border/50 bg-muted/10 p-3">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xl">{animal?.sexo === 'macho' ? '🐂' : '🐄'}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-card-foreground truncate">{animal?.nome || animal?.brinco || '—'}</p>
                                  <p className="text-[11px] text-muted-foreground">Entrada: {ac.peso_entrada} kg • {diasConf} dias</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="rounded-lg bg-card border border-border/50 px-2 py-1.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Peso atual</p>
                                <p className="text-sm font-semibold text-card-foreground">{ultimoPeso} <span className="text-[10px] text-muted-foreground">kg</span></p>
                              </div>
                              <div className="rounded-lg bg-card border border-border/50 px-2 py-1.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">GMD</p>
                                <p className={`text-sm font-semibold ${Number(gmd) >= 0.5 ? 'text-success' : 'text-warning'}`}>{gmd}</p>
                              </div>
                              <div className="rounded-lg bg-card border border-border/50 px-2 py-1.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase">Ganho</p>
                                <p className={`text-sm font-semibold ${Number(ganhoTotal) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {Number(ganhoTotal) >= 0 ? '+' : ''}{ganhoTotal} <span className="text-[10px] text-muted-foreground">kg</span>
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[42px] border-info/40 text-info hover:bg-info/10" onClick={() => { setSelectedAnimalConf(ac.id); setSaidaOpen(true); }}>
                                <CheckCircle className="w-4 h-4" /> Saída
                              </Button>
                              <Button size="sm" className="gap-1.5 rounded-xl min-h-[42px] bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setPesagemAnimalId(ac.animal_id)}>
                                <Weight className="w-4 h-4" /> Kg
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Finished Lotes */}
      {finishedLotes.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3">📋 Lotes Finalizados</h2>
          <div className="space-y-3">
            {finishedLotes.map(lote => {
              const loteAnimais = allAnimaisConf.filter(ac => ac.lote_id === lote.id);
              return (
                <div key={lote.id} className="bg-card rounded-2xl p-4 border border-border/50 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{lote.nome}</p>
                      <p className="text-xs text-muted-foreground">{lote.data_inicio} • {loteAnimais.length} animais</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Finalizado</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Lote Dialog */}
      <Dialog open={newLoteOpen} onOpenChange={setNewLoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Novo Lote de Confinamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do Lote *</Label>
              <Input placeholder="Ex: Lote 01 - Nelore" value={loteForm.nome} onChange={e => setLoteForm({ ...loteForm, nome: e.target.value })} className="text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data de Início</Label>
                <Input type="date" value={loteForm.data_inicio} onChange={e => setLoteForm({ ...loteForm, data_inicio: e.target.value })} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Previsão de Saída</Label>
                <Input type="date" value={loteForm.previsao_saida} onChange={e => setLoteForm({ ...loteForm, previsao_saida: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ração Principal</Label>
              <Select value={loteForm.racao_insumo_id} onValueChange={v => setLoteForm({ ...loteForm, racao_insumo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma ração" /></SelectTrigger>
                <SelectContent>
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome} ({i.quantidade} {i.unidade})</SelectItem>
                  ))}
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum insumo com categoria "ração" encontrado. Cadastre no Depósito com a categoria "ração".</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dieta Vinculada</Label>
              <Select value={loteForm.dieta_id} onValueChange={v => setLoteForm({ ...loteForm, dieta_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma dieta (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {dietas.filter((d: any) => d.status === 'ativo').map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome} ({d.categoria_animal})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setNewLoteOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreateLote} disabled={createLote.isPending}>
                {createLote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Lote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Animal Dialog */}
      <Dialog open={addAnimalOpen} onOpenChange={setAddAnimalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Adicionar Animal ao Lote</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Animal *</Label>
              <Select value={animalForm.animal_id} onValueChange={v => setAnimalForm({ ...animalForm, animal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um animal" /></SelectTrigger>
                <SelectContent>
                  {availableAnimals.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.sexo === 'macho' ? '🐂' : '🐄'} {a.nome || a.brinco} ({a.brinco})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Peso de Entrada (kg) *</Label>
                <Input type="number" placeholder="Ex: 380" value={animalForm.peso_entrada} onChange={e => setAnimalForm({ ...animalForm, peso_entrada: e.target.value })} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Previsão de Saída</Label>
                <Input type="date" value={animalForm.previsao_saida} onChange={e => setAnimalForm({ ...animalForm, previsao_saida: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAddAnimalOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAddAnimal} disabled={addAnimalToLote.isPending}>
                {addAnimalToLote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consumo Dialog */}
      <Dialog open={consumoOpen} onOpenChange={setConsumoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Registrar Consumo de Ração</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Insumo/Ração *</Label>
              <Select value={consumoForm.insumo_id} onValueChange={v => setConsumoForm({ ...consumoForm, insumo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma ração" /></SelectTrigger>
                <SelectContent>
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome} (Estoque: {i.quantidade} {i.unidade})</SelectItem>
                  ))}
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum insumo com categoria "ração". Cadastre no Depósito.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade (kg) *</Label>
                <Input type="number" placeholder="Ex: 50" value={consumoForm.quantidade} onChange={e => setConsumoForm({ ...consumoForm, quantidade: e.target.value })} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={consumoForm.data} onChange={e => setConsumoForm({ ...consumoForm, data: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConsumoOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleConsumo} disabled={registrarConsumo.isPending}>
                {registrarConsumo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saída Animal Dialog */}
      <Dialog open={saidaOpen} onOpenChange={(open) => { setSaidaOpen(open); if (!open) { setSelectedAnimalConf(null); setSaidaForm({ peso_saida: '', data_saida: new Date().toISOString().split('T')[0] }); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl">Registrar Saída do Confinamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedAnimalConf && (() => {
              const ac = allAnimaisConf.find(a => a.id === selectedAnimalConf);
              const animal = ac ? animais.find(a => a.id === ac.animal_id) : null;
              return ac ? (
                <div className="bg-info/10 rounded-xl p-4 text-sm">
                  <p className="font-medium text-card-foreground">{animal?.sexo === 'macho' ? '🐂' : '🐄'} {animal?.nome || animal?.brinco}</p>
                  <p className="text-xs text-muted-foreground mt-1">Entrada: {ac.peso_entrada} kg em {ac.data_entrada}</p>
                </div>
              ) : null;
            })()}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Peso de Saída (kg) *</Label>
              <Input type="number" placeholder="Ex: 520" value={saidaForm.peso_saida} onChange={e => setSaidaForm({ ...saidaForm, peso_saida: e.target.value })} className="text-foreground h-14 text-lg font-semibold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data de Saída</Label>
              <Input type="date" value={saidaForm.data_saida} onChange={e => setSaidaForm({ ...saidaForm, data_saida: e.target.value })} className="text-foreground" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSaidaOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-info text-info-foreground hover:bg-info/90" onClick={handleSaidaAnimal}>
                Confirmar Saída
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Lote Dialog */}
      <Dialog open={closeLoteOpen} onOpenChange={setCloseLoteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl">Fechar Lote</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-destructive/10 rounded-xl p-4 text-sm">
              <p className="font-medium text-card-foreground">⚠️ Atenção</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os animais ativos deste lote serão retirados do confinamento. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCloseLoteOpen(false)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleCloseLote}>
                Fechar Lote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lote Dialog */}
      <Dialog open={editLoteOpen} onOpenChange={setEditLoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Editar Lote</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do Lote *</Label>
              <Input value={editLoteForm.nome} onChange={e => setEditLoteForm({ ...editLoteForm, nome: e.target.value })} className="text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data de Início</Label>
                <Input type="date" value={editLoteForm.data_inicio} onChange={e => setEditLoteForm({ ...editLoteForm, data_inicio: e.target.value })} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Previsão de Saída</Label>
                <Input type="date" value={editLoteForm.previsao_saida} onChange={e => setEditLoteForm({ ...editLoteForm, previsao_saida: e.target.value })} className="text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ração Principal</Label>
              <Select value={editLoteForm.racao_insumo_id} onValueChange={v => setEditLoteForm({ ...editLoteForm, racao_insumo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma ração" /></SelectTrigger>
                <SelectContent>
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome} ({i.quantidade} {i.unidade})</SelectItem>
                  ))}
                  {insumos.filter(i => i.categoria?.toLowerCase().includes('raç') || i.categoria?.toLowerCase().includes('racao') || i.categoria?.toLowerCase() === 'ração').length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum insumo com categoria "ração". Cadastre no Depósito.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dieta Vinculada</Label>
              <Select value={editLoteForm.dieta_id} onValueChange={v => setEditLoteForm({ ...editLoteForm, dieta_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma dieta (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {dietas.filter((d: any) => d.status === 'ativo').map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome} ({d.categoria_animal})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditLoteOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleEditLote}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PesagemQuickDialog
        animalId={pesagemAnimalId}
        animalNome={(() => {
          const a = animais.find(x => x.id === pesagemAnimalId);
          return a ? (a.nome || a.brinco) : undefined;
        })()}
        open={!!pesagemAnimalId}
        onOpenChange={(v) => { if (!v) setPesagemAnimalId(null); }}
      />
    </div>
  );
}