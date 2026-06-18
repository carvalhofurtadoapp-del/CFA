import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wrench, Trash2, Plus, Loader2 } from 'lucide-react';
import { useManutencoes, useCreateManutencao, useDeleteManutencao, ManutencaoRow } from '@/hooks/useManutencoes';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  equipamentoNome: string;
}

export default function ManutencaoDialog({ open, onOpenChange, equipamentoId, equipamentoNome }: Props) {
  const { data: manutencoes = [], isLoading } = useManutencoes(equipamentoId);
  const createManutencao = useCreateManutencao();
  const deleteManutencao = useDeleteManutencao();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);

  const totalGasto = manutencoes.reduce((s, m) => s + Number(m.valor), 0);

  const handleSave = () => {
    if (!descricao.trim() || !valor) return;
    createManutencao.mutate({
      equipamento_id: equipamentoId,
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      data,
      equipamento_nome: equipamentoNome,
    }, {
      onSuccess: () => {
        setDescricao('');
        setValor('');
        setData(new Date().toISOString().split('T')[0]);
        setShowForm(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Manutenções — {equipamentoNome}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-muted-foreground">
            Total gasto: <span className="font-bold text-foreground">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <Button size="sm" className="gap-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5" /> Nova
          </Button>
        </div>

        {showForm && (
          <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/30 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Peça / Serviço *</Label>
              <Input placeholder="Ex: Troca de óleo, filtro..." value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" placeholder="0" value={valor} onChange={e => setValor(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} className="text-foreground" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={createManutencao.isPending}>
                {createManutencao.isPending ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : manutencoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma manutenção registrada</p>
        ) : (
          <div className="space-y-2 mt-2">
            {manutencoes.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.descricao}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteManutencao.mutate(m.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
