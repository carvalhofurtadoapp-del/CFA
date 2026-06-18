import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plus, Weight, TrendingUp, Calendar, Pencil, Trash2, Save, Loader2, Syringe, Clock, DollarSign, Timer, Baby, Fence } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimal, useUpdateAnimal, useDeleteAnimal } from '@/hooks/useAnimais';
import { usePesagens, useCreatePesagem } from '@/hooks/usePesagens';
import { useLotesConfinamento, useAddAnimalToLote } from '@/hooks/useConfinamento';
import { useVacinas } from '@/hooks/useVacinas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ParentCombobox } from '@/components/ParentCombobox';
import { BrincoTag } from '@/components/BrincoTag';
import { toast } from 'sonner';

export default function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isGestor = role === 'gestor';

  const { data: animal, isLoading } = useAnimal(id);
  const { data: pesagens = [] } = usePesagens(id);
  const { data: allVacinas = [] } = useVacinas();
  const { data: lotes = [] } = useLotesConfinamento();
  const createPesagem = useCreatePesagem();
  const updateAnimal = useUpdateAnimal();
  const deleteAnimalMutation = useDeleteAnimal();
  const addAnimalToLote = useAddAnimalToLote();

  const animalVacinas = allVacinas.filter(v => v.animal_id === id);

  const [novoPeso, setNovoPeso] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [desmamaConfirm, setDesmamaConfirm] = useState(false);
  const [desmamaPeso, setDesmamaPeso] = useState('');
  const [confinamentoConfirm, setConfinamentoConfirm] = useState(false);
  const [confLoteId, setConfLoteId] = useState('');
  const [confPesoEntrada, setConfPesoEntrada] = useState('');

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!animal) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🐄</p>
        <p className="text-muted-foreground">Animal não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/rebanho')} className="mt-4">Voltar ao rebanho</Button>
      </div>
    );
  }

  const startEdit = () => {
    setEditForm({
      brinco: animal.brinco,
      nome: animal.nome || '',
      raca: animal.raca,
      sexo: animal.sexo,
      data_nascimento: animal.data_nascimento,
      pai: animal.pai || '',
      mae: animal.mae || '',
      status: animal.status,
      data_desmama: (animal as any).data_desmama || '',
      data_confinamento: (animal as any).data_confinamento || '',
      preco_compra: String((animal as any).preco_compra || '0'),
      preco_venda: String((animal as any).preco_venda || '0'),
      mojando: animal.mojando ? 'true' : 'false',
      mojando_meses: String(animal.mojando_meses || ''),
      observacao: animal.observacao || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm.brinco || !editForm.raca) return;
    const isMojando = editForm.mojando === 'true';
    const mojantoMeses = isMojando ? parseFloat(editForm.mojando_meses) || 0 : null;
    let mojandoDataInicio: string | null = null;
    if (isMojando && mojantoMeses) {
      const d = new Date();
      d.setDate(d.getDate() - mojantoMeses * 30);
      mojandoDataInicio = d.toISOString().split('T')[0];
    }
    await updateAnimal.mutateAsync({
      id: animal.id,
      brinco: editForm.brinco,
      nome: editForm.nome || null,
      raca: editForm.raca,
      sexo: editForm.sexo,
      data_nascimento: editForm.data_nascimento,
      pai: editForm.pai || null,
      mae: editForm.mae || null,
      status: editForm.status,
      data_desmama: editForm.data_desmama || null,
      data_confinamento: editForm.data_confinamento || null,
      preco_compra: parseFloat(editForm.preco_compra) || 0,
      preco_venda: parseFloat(editForm.preco_venda) || 0,
      mojando: isMojando,
      mojando_meses: mojantoMeses,
      mojando_data_inicio: mojandoDataInicio,
      observacao: editForm.observacao || null,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteAnimalMutation.mutateAsync(animal.id);
    navigate('/rebanho');
  };

  const addPesagem = async () => {
    if (!novoPeso) return;
    const peso = parseFloat(novoPeso);
    const lastPesagem = pesagens[pesagens.length - 1];
    let gmd: number | null = null;

    if (lastPesagem) {
      const diffDays = Math.ceil((new Date(novaData).getTime() - new Date(lastPesagem.data).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        gmd = parseFloat(((peso - Number(lastPesagem.peso)) / diffDays).toFixed(2));
      }
    }

    await createPesagem.mutateAsync({ animal_id: animal.id, peso, data: novaData, gmd });
    setNovoPeso('');
  };

  const ultimoPeso = pesagens.length ? Number(pesagens[pesagens.length - 1].peso) : null;
  const gmdValues = pesagens.filter(p => p.gmd).map(p => Number(p.gmd));
  const gmd = gmdValues.length ? (gmdValues.reduce((a, b) => a + b, 0) / gmdValues.length).toFixed(2) : null;

  // Confinement days
  const dataConf = (animal as any).data_confinamento;
  const diasConfinamento = dataConf ? Math.max(0, Math.ceil((Date.now() - new Date(dataConf).getTime()) / (1000 * 60 * 60 * 24))) : null;

  const precoCompra = Number((animal as any).preco_compra) || 0;
  const precoVenda = Number((animal as any).preco_venda) || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/rebanho')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao rebanho
        </button>
        {isGestor && (
          <div className="flex flex-wrap gap-2">
            {!animal.data_desmama && (
              <Button variant="outline" size="sm" onClick={() => setDesmamaConfirm(true)} className="gap-1.5 rounded-xl border-warning/30 text-warning hover:bg-warning/10">
                <Baby className="w-3.5 h-3.5" /> Iniciar Desmama
              </Button>
            )}
            {!animal.data_confinamento && (
              <Button variant="outline" size="sm" onClick={() => setConfinamentoConfirm(true)} className="gap-1.5 rounded-xl border-info/30 text-info hover:bg-info/10">
                <Fence className="w-3.5 h-3.5" /> Iniciar Confinamento
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5 rounded-xl">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)} className="gap-1.5 rounded-xl">
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </Button>
          </div>
        )}
      </div>

      {/* Animal Info Card */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <div className="flex items-start gap-4">
          <BrincoTag brinco={animal.brinco} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-display text-card-foreground">{animal.nome || animal.brinco}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Brinco: <span className="font-mono">{animal.brinco}</span> • {animal.raca} • {animal.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
              <span className="text-muted-foreground"><Calendar className="w-3.5 h-3.5 inline mr-1" />Nasc: {animal.data_nascimento}</span>
              {animal.pai && <span className="text-muted-foreground">Pai: {animal.pai}</span>}
              {animal.mae && <span className="text-muted-foreground">Mãe: {animal.mae}</span>}
              {(animal as any).data_desmama && <span className="text-muted-foreground">Desmama: {(animal as any).data_desmama}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Weight className="w-3.5 h-3.5" /> Último Peso
            </div>
            <p className="text-xl font-bold text-card-foreground">{ultimoPeso ? `${ultimoPeso} kg` : '—'}</p>
          </div>
          <div className="bg-success/5 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> GMD
            </div>
            <p className="text-xl font-bold text-success">{gmd ? `${gmd} kg/dia` : '—'}</p>
          </div>
          {diasConfinamento !== null && (
            <div className="bg-info/5 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Timer className="w-3.5 h-3.5" /> Confinamento
              </div>
              <p className="text-xl font-bold text-info">{diasConfinamento} dias</p>
            </div>
          )}
          {(precoCompra > 0 || precoVenda > 0) && (
            <div className="bg-accent/5 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" /> Ticket
              </div>
              <p className="text-xl font-bold text-accent">
                {precoVenda > 0 && precoCompra > 0
                  ? `R$ ${(precoVenda - precoCompra).toLocaleString('pt-BR')}`
                  : precoCompra > 0 ? `C: R$ ${precoCompra.toLocaleString('pt-BR')}` : `V: R$ ${precoVenda.toLocaleString('pt-BR')}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vaccines Section */}
      {animalVacinas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
            <Syringe className="w-4 h-4 text-warning" />
            <h2 className="text-lg font-display text-card-foreground">Vacinação</h2>
          </div>
          <div className="divide-y divide-border/50">
            {animalVacinas.map(v => (
              <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground text-sm">{v.nome}</p>
                  {v.data_aplicacao && <p className="text-xs text-muted-foreground">Aplicada: {v.data_aplicacao}</p>}
                  {v.data_proxima && <p className="text-xs text-warning flex items-center gap-1"><Clock className="w-3 h-3" />Próxima: {v.data_proxima}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status === 'pendente' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                  {v.status === 'pendente' ? 'Pendente' : 'Concluída'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nova Pesagem */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <h2 className="text-lg font-display text-card-foreground mb-4">Nova Pesagem</h2>
        <div className="flex flex-col gap-3">
          <Input
            type="number"
            placeholder="Digite o peso em kg"
            value={novoPeso}
            onChange={(e) => setNovoPeso(e.target.value)}
            style={{ color: '#000', fontSize: '18px', height: '56px' }}
            className="w-full rounded-xl !h-14 !text-lg font-semibold bg-background border-2 border-input focus:border-accent placeholder:text-muted-foreground/50 placeholder:font-normal"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} style={{ color: '#000', height: '48px' }} className="flex-1 rounded-xl !h-12 bg-background border-2 border-input" />
            <Button onClick={addPesagem} className="gap-2 rounded-xl h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 text-base" disabled={createPesagem.isPending}>
              {createPesagem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Registrar</>}
            </Button>
          </div>
        </div>
        {pesagens.length > 0 && novoPeso && (
          <div className="mt-3 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
            Diferença: {(parseFloat(novoPeso) - (ultimoPeso || 0)).toFixed(1)} kg desde a última pesagem
          </div>
        )}
      </div>

      {/* Histórico de Pesagens */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-display text-card-foreground">Histórico de Pesagens</h2>
        </div>
        {pesagens.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm text-center">Nenhuma pesagem registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Peso</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">GMD</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pesagens.map((p, idx) => {
                  const prev = idx > 0 ? pesagens[idx - 1] : null;
                  const diff = prev ? Number(p.peso) - Number(prev.peso) : null;
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-card-foreground">{p.data}</td>
                      <td className="px-4 py-3 font-medium text-card-foreground">{Number(p.peso)} kg</td>
                      <td className="px-4 py-3">{p.gmd ? <span className="text-success font-medium">{Number(p.gmd)} kg/dia</span> : '—'}</td>
                      <td className="px-4 py-3">
                        {diff !== null ? (
                          <span className={diff >= 0 ? 'text-success' : 'text-destructive'}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(1)} kg
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar Animal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Brinco</Label>
                <Input value={editForm.brinco || ''} onChange={e => setEditForm({ ...editForm, brinco: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editForm.nome || ''} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Raça</Label>
                <Input value={editForm.raca || ''} onChange={e => setEditForm({ ...editForm, raca: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sexo</Label>
                <Select value={editForm.sexo} onValueChange={v => setEditForm({ ...editForm, sexo: v })}>
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
                <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                <Input type="date" value={editForm.data_nascimento || ''} onChange={e => setEditForm({ ...editForm, data_nascimento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data de Desmama</Label>
                <Input type="date" value={editForm.data_desmama || ''} onChange={e => setEditForm({ ...editForm, data_desmama: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pai</Label>
                <ParentCombobox value={editForm.pai || ''} onChange={v => setEditForm({ ...editForm, pai: v })} filterSexo="macho" excludeId={animal.id} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mãe</Label>
                <ParentCombobox value={editForm.mae || ''} onChange={v => setEditForm({ ...editForm, mae: v })} filterSexo="femea" excludeId={animal.id} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Início Confinamento</Label>
                <Input type="date" value={editForm.data_confinamento || ''} onChange={e => setEditForm({ ...editForm, data_confinamento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="morto">Morto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preço Compra (R$)</Label>
                <Input type="number" value={editForm.preco_compra || ''} onChange={e => setEditForm({ ...editForm, preco_compra: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preço Venda (R$)</Label>
                <Input type="number" value={editForm.preco_venda || ''} onChange={e => setEditForm({ ...editForm, preco_venda: e.target.value })} />
              </div>
            </div>
            {editForm.sexo === 'femea' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Está Mojando?</Label>
                  <Select value={editForm.mojando} onValueChange={v => setEditForm({ ...editForm, mojando: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Não</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.mojando === 'true' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Meses de Gestação</Label>
                    <Input type="number" min="0" max="12" value={editForm.mojando_meses || ''} onChange={e => setEditForm({ ...editForm, mojando_meses: e.target.value })} />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editForm.observacao || ''}
                onChange={e => setEditForm({ ...editForm, observacao: e.target.value })}
                placeholder="Observações sobre o animal..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveEdit} disabled={updateAnimal.isPending}>
                {updateAnimal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Salvar</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remover Animal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover <strong>{animal.nome || animal.brinco}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete} disabled={deleteAnimalMutation.isPending}>
              {deleteAnimalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1.5" /> Remover</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desmama Confirm Dialog */}
      <Dialog open={desmamaConfirm} onOpenChange={setDesmamaConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Baby className="w-5 h-5 text-warning" /> Iniciar Desmama
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/10 rounded-xl p-4 text-sm">
              <p className="font-medium text-card-foreground">
                {animal.sexo === 'macho' ? '🐂' : '🐄'} {animal.nome || animal.brinco}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                A data de desmama será registrada como hoje ({new Date().toISOString().split('T')[0]}).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Registrar pesagem da desmama (kg)</Label>
              <Input
                type="number"
                placeholder="Digite o peso atual"
                value={desmamaPeso}
                onChange={e => setDesmamaPeso(e.target.value)}
                className="h-14 text-lg font-semibold text-foreground bg-background border-2 border-input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setDesmamaConfirm(false); setDesmamaPeso(''); }}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-warning text-warning-foreground hover:bg-warning/90" onClick={async () => {
                const todayStr = new Date().toISOString().split('T')[0];
                await updateAnimal.mutateAsync({ id: animal.id, data_desmama: todayStr });
                if (desmamaPeso) {
                  await createPesagem.mutateAsync({ animal_id: animal.id, peso: parseFloat(desmamaPeso), data: todayStr, gmd: null });
                }
                setDesmamaConfirm(false);
                setDesmamaPeso('');
              }} disabled={updateAnimal.isPending}>
                {updateAnimal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Desmama'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confinamento Confirm Dialog */}
      <Dialog open={confinamentoConfirm} onOpenChange={(open) => { setConfinamentoConfirm(open); if (!open) { setConfLoteId(''); setConfPesoEntrada(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Fence className="w-5 h-5 text-info" /> Iniciar Confinamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-info/10 rounded-xl p-4 text-sm">
              <p className="font-medium text-card-foreground">
                {animal.sexo === 'macho' ? '🐂' : '🐄'} {animal.nome || animal.brinco}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione o lote e registre o peso de entrada para iniciar o confinamento.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lote de Confinamento *</Label>
              <Select value={confLoteId} onValueChange={setConfLoteId}>
                <SelectTrigger><SelectValue placeholder="Selecione um lote" /></SelectTrigger>
                <SelectContent>
                  {lotes.filter(l => l.status === 'ativo').map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lotes.filter(l => l.status === 'ativo').length === 0 && (
                <p className="text-xs text-destructive">Nenhum lote ativo. Crie um lote na aba Confinamento primeiro.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Peso de Entrada (kg) *</Label>
              <Input
                type="number"
                placeholder="Ex: 380"
                value={confPesoEntrada}
                onChange={e => setConfPesoEntrada(e.target.value)}
                style={{ color: '#000', fontSize: '18px', height: '56px' }}
                className="rounded-xl !h-14 !text-lg font-semibold bg-background border-2 border-input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfinamentoConfirm(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-info text-info-foreground hover:bg-info/90" onClick={async () => {
                if (!confLoteId || !confPesoEntrada) {
                  toast.error('Selecione um lote e informe o peso de entrada.');
                  return;
                }
                const todayStr = new Date().toISOString().split('T')[0];
                await updateAnimal.mutateAsync({ id: animal.id, data_confinamento: todayStr });
                await addAnimalToLote.mutateAsync({
                  animal_id: animal.id,
                  lote_id: confLoteId,
                  data_entrada: todayStr,
                  peso_entrada: parseFloat(confPesoEntrada),
                  previsao_saida: null,
                  data_saida: null,
                  peso_saida: null,
                  status: 'ativo',
                });
                setConfinamentoConfirm(false);
                setConfLoteId('');
                setConfPesoEntrada('');
                navigate('/confinamento');
              }} disabled={updateAnimal.isPending || addAnimalToLote.isPending}>
                {(updateAnimal.isPending || addAnimalToLote.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Iniciar Confinamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
