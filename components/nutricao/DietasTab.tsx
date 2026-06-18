import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useDietas, useCreateDieta, useDeleteDieta } from '@/hooks/useDietas';
import { useInsumos } from '@/hooks/useInsumos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Copy, Package, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS_ANIMAL = [
  { value: 'bezerro', label: '🐄 Bezerro' },
  { value: 'recria', label: '🐂 Recria' },
  { value: 'engorda', label: '🥩 Engorda' },
  { value: 'vaca_lactante', label: '🍼 Vaca Lactante' },
];

interface IngredienteRow {
  id: string;
  dieta_id: string;
  insumo_id: string;
  quantidade_kg: number;
}

function useAllIngredientes() {
  return useQuery({
    queryKey: ['all_dieta_ingredientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dieta_ingredientes').select('*');
      if (error) throw error;
      return data as IngredienteRow[];
    },
  });
}

export default function DietasTab() {
  const { data: dietas = [] } = useDietas();
  const { data: insumos = [] } = useInsumos();
  const { data: allIngredientes = [], refetch: refetchIng } = useAllIngredientes();
  const createDieta = useCreateDieta();
  const deleteDieta = useDeleteDieta();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', custo_kg: '', categoria_animal: 'engorda' });
  const [selectedDieta, setSelectedDieta] = useState<string | null>(null);
  const [showIng, setShowIng] = useState(false);
  const [ingForm, setIngForm] = useState({ insumo_id: '', quantidade_kg: '' });

  const openNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '', custo_kg: '', categoria_animal: 'engorda' });
    setShowForm(true);
  };

  const openEdit = (d: any) => {
    setEditingId(d.id);
    setForm({ nome: d.nome, descricao: d.descricao || '', custo_kg: d.custo_kg != null ? String(d.custo_kg) : '', categoria_animal: d.categoria_animal || 'engorda' });
    setShowForm(true);
  };

  const handleDuplicate = async (d: any) => {
    const ings = allIngredientes.filter(i => i.dieta_id === d.id);
    const { data: newDieta, error } = await supabase.from('dietas').insert({
      nome: `${d.nome} (cópia)`, descricao: d.descricao, custo_kg: d.custo_kg,
      categoria_animal: d.categoria_animal, status: 'ativo',
    } as any).select().single();
    if (error || !newDieta) { toast.error('Erro ao duplicar'); return; }
    if (ings.length > 0) {
      await supabase.from('dieta_ingredientes').insert(
        ings.map(i => ({ dieta_id: (newDieta as any).id, insumo_id: i.insumo_id, quantidade_kg: i.quantidade_kg }))
      );
    }
    qc.invalidateQueries({ queryKey: ['dietas'] });
    refetchIng();
    toast.success('Dieta duplicada!');
  };

  const toggleStatus = async (d: any) => {
    const newStatus = d.status === 'ativo' ? 'inativo' : 'ativo';
    await supabase.from('dietas').update({ status: newStatus } as any).eq('id', d.id);
    qc.invalidateQueries({ queryKey: ['dietas'] });
    toast.success(newStatus === 'ativo' ? 'Dieta ativada!' : 'Dieta desativada!');
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Informe o nome'); return; }
    const payload: any = {
      nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      custo_kg: form.custo_kg ? parseFloat(form.custo_kg) : null,
      categoria_animal: form.categoria_animal,
    };
    if (editingId) {
      await supabase.from('dietas').update(payload).eq('id', editingId);
      qc.invalidateQueries({ queryKey: ['dietas'] });
      toast.success('Dieta atualizada!');
    } else {
      createDieta.mutate(payload);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleAddIng = async () => {
    if (!ingForm.insumo_id || !ingForm.quantidade_kg || !selectedDieta) return;
    await supabase.from('dieta_ingredientes').insert({
      dieta_id: selectedDieta, insumo_id: ingForm.insumo_id, quantidade_kg: parseFloat(ingForm.quantidade_kg),
    });
    toast.success('Ingrediente adicionado!');
    setIngForm({ insumo_id: '', quantidade_kg: '' });
    setShowIng(false);
    refetchIng();
    recalcCusto(selectedDieta);
  };

  const handleDeleteIng = async (id: string, dietaId: string) => {
    await supabase.from('dieta_ingredientes').delete().eq('id', id);
    refetchIng();
    recalcCusto(dietaId);
    toast.success('Ingrediente removido!');
  };

  const recalcCusto = async (dietaId: string) => {
    const { data: ings } = await supabase.from('dieta_ingredientes').select('*').eq('dieta_id', dietaId);
    if (!ings) return;
    const custoTotal = ings.reduce((sum, ing) => {
      const insumo = insumos.find(i => i.id === ing.insumo_id);
      return sum + (Number(ing.quantidade_kg) * (insumo ? Number(insumo.preco_compra) : 0));
    }, 0);
    await supabase.from('dietas').update({ custo_kg: custoTotal } as any).eq('id', dietaId);
    qc.invalidateQueries({ queryKey: ['dietas'] });
  };

  const getInsumoNome = (id: string) => insumos.find(i => i.id === id)?.nome || '?';
  const getInsumoPreco = (id: string) => Number(insumos.find(i => i.id === id)?.preco_compra || 0);
  const getCatLabel = (v: string) => CATEGORIAS_ANIMAL.find(c => c.value === v)?.label || v;
  const selectedIngs = allIngredientes.filter(i => i.dieta_id === selectedDieta);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Nova Dieta
        </Button>
      </div>

      {dietas.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 text-muted-foreground text-sm">
          Nenhuma dieta cadastrada. <Button variant="outline" className="mt-4" onClick={openNew}>Cadastrar Dieta</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dietas.map((d: any) => {
            const ings = allIngredientes.filter(i => i.dieta_id === d.id);
            const custoTotal = ings.reduce((s, i) => s + Number(i.quantidade_kg) * getInsumoPreco(i.insumo_id), 0);
            const totalKg = ings.reduce((s, i) => s + Number(i.quantidade_kg), 0);
            const isSelected = selectedDieta === d.id;
            const isInactive = d.status === 'inativo';

            return (
              <Card key={d.id} className={`transition-all cursor-pointer ${isSelected ? 'ring-2 ring-accent' : ''} ${isInactive ? 'opacity-60' : ''}`}
                onClick={() => setSelectedDieta(isSelected ? null : d.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{d.nome}</CardTitle>
                      {isInactive && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); toggleStatus(d); }}>
                        {isInactive ? <Power className="w-3.5 h-3.5 text-success" /> : <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); handleDuplicate(d); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(d); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); deleteDieta.mutate(d.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="outline" className="text-xs">{getCatLabel(d.categoria_animal)}</Badge>
                  {d.descricao && <p className="text-xs text-muted-foreground">{d.descricao}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{ings.length} ingrediente{ings.length !== 1 ? 's' : ''} · {totalKg.toFixed(1)} kg</span>
                    <span className="font-bold text-accent">R$ {custoTotal.toFixed(2)}/dia</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ingredientes Panel */}
      {selectedDieta && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <h3 className="font-display text-foreground">Ingredientes: {dietas.find((d: any) => d.id === selectedDieta)?.nome}</h3>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => setShowIng(true)}>
              <Plus className="w-3 h-3" /> Ingrediente
            </Button>
          </div>
          {selectedIngs.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum ingrediente adicionado.</div>
          ) : (
            <div className="divide-y divide-border/50">
              {selectedIngs.map(ing => {
                const custo = Number(ing.quantidade_kg) * getInsumoPreco(ing.insumo_id);
                return (
                  <div key={ing.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{getInsumoNome(ing.insumo_id)}</p>
                      <p className="text-xs text-muted-foreground">{Number(ing.quantidade_kg)} kg · R$ {custo.toFixed(2)}/dia</p>
                    </div>
                    <button onClick={() => handleDeleteIng(ing.id, ing.dieta_id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <div className="px-5 py-3 bg-muted/20 flex justify-between text-sm">
                <span className="text-muted-foreground">Total: {selectedIngs.reduce((s, i) => s + Number(i.quantidade_kg), 0).toFixed(1)} kg</span>
                <span className="font-bold text-accent">R$ {selectedIngs.reduce((s, i) => s + Number(i.quantidade_kg) * getInsumoPreco(i.insumo_id), 0).toFixed(2)}/animal/dia</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingId ? 'Editar Dieta' : 'Nova Dieta'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input placeholder="Ex: Engorda - Fase Final" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria Animal</Label>
              <Select value={form.categoria_animal} onValueChange={v => setForm({ ...form, categoria_animal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_ANIMAL.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={createDieta.isPending}>
                {editingId ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ingrediente Dialog */}
      <Dialog open={showIng} onOpenChange={setShowIng}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl">Adicionar Ingrediente</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Insumo do Depósito *</Label>
              <Select value={ingForm.insumo_id} onValueChange={v => setIngForm({ ...ingForm, insumo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {insumos.filter(i => {
                    const cat = (i.categoria || '').toLowerCase();
                    return cat === 'alimento' || cat === 'alimentos' || cat.includes('raç') || cat.includes('racao') || cat === 'ração';
                  }).map(i => <SelectItem key={i.id} value={i.id}>{i.nome} (R$ {Number(i.preco_compra).toFixed(2)}/{i.unidade})</SelectItem>)}
                  {insumos.filter(i => {
                    const cat = (i.categoria || '').toLowerCase();
                    return cat === 'alimento' || cat === 'alimentos' || cat.includes('raç') || cat.includes('racao') || cat === 'ração';
                  }).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum insumo com categoria "alimento" ou "ração". Cadastre no Depósito.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quantidade (kg/animal/dia) *</Label>
              <Input type="number" step="0.1" placeholder="Ex: 5" value={ingForm.quantidade_kg} onChange={e => setIngForm({ ...ingForm, quantidade_kg: e.target.value })} />
            </div>
            {ingForm.insumo_id && ingForm.quantidade_kg && (
              <div className="bg-accent/10 rounded-xl p-3 text-sm">
                <span className="text-muted-foreground">Custo: </span>
                <span className="font-bold text-accent">R$ {(parseFloat(ingForm.quantidade_kg) * getInsumoPreco(ingForm.insumo_id)).toFixed(2)}/animal/dia</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowIng(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAddIng}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
