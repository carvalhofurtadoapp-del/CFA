import { useState, useEffect, useCallback } from 'react';
import { useEquipamentos, useCreateEquipamento, useDeleteEquipamento, calcularDepreciacaoMensal, calcularValorAtual } from '@/hooks/useEquipamentos';
import { useSessoesAtivas, useIniciarServico, useFinalizarServico } from '@/hooks/useSessoesServico';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tractor, Plus, Trash2, Loader2, TrendingDown, Wrench, Pencil, Play, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ManutencaoDialog from '@/components/equipamentos/ManutencaoDialog';

const TIPOS_EQUIPAMENTO = ['Trator', 'Colheitadeira', 'Caminhão', 'Implemento', 'Veículo', 'Outro'];

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}min`;
}

function ActiveTimer({ inicio }: { inicio: string }) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(inicio).getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(inicio).getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [inicio]);

  return (
    <span className="font-mono text-sm font-bold text-success animate-pulse">
      {formatDuration(elapsed)}
    </span>
  );
}

export default function EquipamentosPage() {
  const { data: equipamentos = [], isLoading } = useEquipamentos();
  const { data: sessoesAtivas = [] } = useSessoesAtivas();
  const createEquipamento = useCreateEquipamento();
  const deleteEquipamento = useDeleteEquipamento();
  const iniciarServico = useIniciarServico();
  const finalizarServico = useFinalizarServico();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manutEq, setManutEq] = useState<{ id: string; nome: string } | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Outro');
  const [valorCompra, setValorCompra] = useState('');
  const [valorResidual, setValorResidual] = useState('');
  const [vidaUtil, setVidaUtil] = useState('10');
  const [dataCompra, setDataCompra] = useState('');
  const [proximaManutencao, setProximaManutencao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [statusEq, setStatusEq] = useState('ativo');

  const resetForm = () => {
    setEditingId(null); setNome(''); setTipo('Outro'); setValorCompra(''); setValorResidual('');
    setVidaUtil('10'); setDataCompra(''); setProximaManutencao(''); setObservacao(''); setStatusEq('ativo');
  };

  const openEdit = (eq: typeof equipamentos[0]) => {
    setEditingId(eq.id);
    setNome(eq.nome);
    setTipo(eq.tipo);
    setValorCompra(String(eq.valor_compra));
    setValorResidual(String(eq.valor_residual));
    setVidaUtil(String(eq.vida_util_anos));
    setDataCompra(eq.data_compra);
    setProximaManutencao(eq.proxima_manutencao || '');
    setObservacao(eq.observacao || '');
    setStatusEq(eq.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !valorCompra || !dataCompra) return;
    const payload = {
      nome: nome.trim(),
      tipo,
      valor_compra: parseFloat(valorCompra),
      valor_residual: parseFloat(valorResidual || '0'),
      vida_util_anos: parseInt(vidaUtil || '10'),
      data_compra: dataCompra,
      status: statusEq,
      proxima_manutencao: proximaManutencao || null,
      observacao: observacao.trim() || null,
    };
    if (editingId) {
      const { error } = await supabase.from('equipamentos').update(payload as any).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento atualizado!');
    } else {
      createEquipamento.mutate(payload, { onSuccess: () => {} });
    }
    setShowForm(false);
    resetForm();
  };

  const handleIniciarServico = async (eqId: string, eqNome: string) => {
    await iniciarServico.mutateAsync(eqId);
  };

  const handleFinalizarServico = async (sessaoId: string) => {
    await finalizarServico.mutateAsync(sessaoId);
  };

  const getSessaoAtiva = (eqId: string) => sessoesAtivas.find(s => s.equipamento_id === eqId);

  const patrimonioTotal = equipamentos.reduce((s, e) => s + calcularValorAtual(Number(e.valor_compra), Number(e.valor_residual), e.vida_util_anos, e.data_compra), 0);
  const depreciacaoMensalTotal = equipamentos.reduce((s, e) => s + calcularDepreciacaoMensal(Number(e.valor_compra), Number(e.valor_residual), e.vida_util_anos), 0);
  const hoje = new Date().toISOString().split('T')[0];
  const manutencaoAtrasada = equipamentos.filter(e => e.proxima_manutencao && e.proxima_manutencao <= hoje).length;
  const equipamentosAtivos = sessoesAtivas.length;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Equipamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Patrimônio, depreciação e horímetro</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Novo Equipamento
        </Button>
      </div>

      {/* Floating timer banner for active sessions */}
      {sessoesAtivas.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
          <div className="bg-card border border-success/40 rounded-2xl shadow-lg shadow-success/10 p-3 space-y-2">
            {sessoesAtivas.map((sessao) => {
              const eq = equipamentos.find(e => e.id === sessao.equipamento_id);
              return (
                <div key={sessao.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse flex-shrink-0" />
                    <Tractor className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{eq?.nome || 'Equipamento'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ActiveTimer inicio={sessao.inicio} />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-lg gap-1 h-7 text-xs px-2"
                      onClick={() => handleFinalizarServico(sessao.id)}
                      disabled={finalizarServico.isPending}
                    >
                      <Square className="w-3 h-3" />
                      Parar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Patrimônio Atual</p>
          <p className="text-xl font-bold text-foreground">R$ {patrimonioTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-warning/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Depreciação/mês</p>
          <p className="text-xl font-bold text-warning">R$ {depreciacaoMensalTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-info/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Equipamentos</p>
          <p className="text-xl font-bold text-foreground">{equipamentos.length}</p>
        </div>
        {equipamentosAtivos > 0 && (
          <div className="bg-success/5 rounded-2xl p-4 border border-success/20">
            <p className="text-xs text-muted-foreground">Em Serviço</p>
            <p className="text-xl font-bold text-success">{equipamentosAtivos}</p>
          </div>
        )}
        {manutencaoAtrasada > 0 && (
          <div className="bg-destructive/5 rounded-2xl p-4 border border-destructive/20">
            <p className="text-xs text-muted-foreground">Manutenção Atrasada</p>
            <p className="text-xl font-bold text-destructive">{manutencaoAtrasada}</p>
          </div>
        )}
      </div>

      {equipamentos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tractor className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum equipamento cadastrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>Cadastrar Equipamento</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipamentos.map((eq) => {
            const valorAtual = calcularValorAtual(Number(eq.valor_compra), Number(eq.valor_residual), eq.vida_util_anos, eq.data_compra);
            const depMensal = calcularDepreciacaoMensal(Number(eq.valor_compra), Number(eq.valor_residual), eq.vida_util_anos);
            const manutAtrasada = eq.proxima_manutencao && eq.proxima_manutencao <= hoje;
            const sessaoAtiva = getSessaoAtiva(eq.id);
            const horasTrabalhadas = Number((eq as any).horas_trabalhadas || 0);
            return (
              <Card key={eq.id} className={`hover:shadow-md transition-shadow ${manutAtrasada ? 'border-destructive/30' : ''} ${sessaoAtiva ? 'border-success/50 ring-1 ring-success/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tractor className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">{eq.nome}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{eq.tipo}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Manutenções" onClick={() => setManutEq({ id: eq.id, nome: eq.nome })}>
                        <Wrench className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(eq)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteEquipamento.mutate(eq.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Valor Compra</p>
                      <p className="font-medium">R$ {Number(eq.valor_compra).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Valor Atual</p>
                      <p className="font-medium text-info">R$ {valorAtual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      <TrendingDown className="w-3 h-3" />
                      <span className="text-xs">-R$ {depMensal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Horímetro: {formatHours(horasTrabalhadas)}</span>
                    </div>
                    {eq.proxima_manutencao && (
                      <div className={`flex items-center gap-1 ${manutAtrasada ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Wrench className="w-3 h-3" />
                        <span className="text-xs">{manutAtrasada ? '⚠️ ' : ''}Manut: {new Date(eq.proxima_manutencao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  {eq.observacao && <p className="text-xs text-muted-foreground italic">{eq.observacao}</p>}

                  {/* Timer Section */}
                  <div className="pt-2 border-t border-border/50">
                    {sessaoAtiva ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <span className="text-xs text-muted-foreground">Em serviço:</span>
                          <ActiveTimer inicio={sessaoAtiva.inicio} />
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-lg gap-1.5 h-8"
                          onClick={() => handleFinalizarServico(sessaoAtiva.id)}
                          disabled={finalizarServico.isPending}
                        >
                          <Square className="w-3 h-3" />
                          Finalizar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-lg gap-1.5 h-8 border-success/30 text-success hover:bg-success/10 hover:text-success"
                        onClick={() => handleIniciarServico(eq.id, eq.nome)}
                        disabled={iniciarServico.isPending}
                      >
                        <Play className="w-3 h-3" />
                        Iniciar Serviço
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Nome do equipamento" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EQUIPAMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editingId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusEq} onValueChange={setStatusEq}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor de compra (R$) *</Label>
                <Input placeholder="0" type="number" value={valorCompra} onChange={e => setValorCompra(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor residual (R$)</Label>
                <Input placeholder="0" type="number" value={valorResidual} onChange={e => setValorResidual(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Vida útil (anos)</Label>
                <Input placeholder="10" type="number" value={vidaUtil} onChange={e => setVidaUtil(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data de compra *</Label>
                <Input type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)} className="text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Próxima Manutenção</Label>
                <Input type="date" value={proximaManutencao} onChange={e => setProximaManutencao(e.target.value)} className="text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Observação</Label>
                <Input placeholder="Opcional" value={observacao} onChange={e => setObservacao(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={createEquipamento.isPending}>
                {createEquipamento.isPending ? 'Salvando...' : (editingId ? 'Salvar' : 'Cadastrar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {manutEq && (
        <ManutencaoDialog
          open={!!manutEq}
          onOpenChange={(open) => { if (!open) setManutEq(null); }}
          equipamentoId={manutEq.id}
          equipamentoNome={manutEq.nome}
        />
      )}
    </div>
  );
}
