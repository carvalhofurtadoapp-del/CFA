import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { GastoRow } from '@/hooks/useGastos';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  lancamentos: GastoRow[];
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function LancamentosPopup({ open, onClose, title, subtitle, lancamentos }: Props) {
  const sorted = [...lancamentos].sort((a, b) => b.data.localeCompare(a.data));
  const total = sorted.reduce((s, l) => s + Number(l.valor), 0);
  const entradas = sorted.filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
  const saidas = sorted.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-success/5 border border-border/50 rounded-xl py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Entradas</div>
            <div className="text-sm font-bold text-success">R$ {entradas.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-destructive/5 border border-border/50 rounded-xl py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Saídas</div>
            <div className="text-sm font-bold text-destructive">R$ {saidas.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-xl py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total ({sorted.length})</div>
            <div className="text-sm font-bold text-foreground">R$ {total.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {sorted.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">Nenhum lançamento encontrado.</div>
          ) : (
            <div className="divide-y divide-border/50">
              {sorted.map(l => (
                <div key={l.id} className="flex items-center gap-3 py-2.5">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${l.tipo === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {l.tipo === 'entrada' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground truncate">{l.descricao}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{fmtDate(l.data)}</span>
                      {l.fornecedor && <span>· {l.fornecedor}</span>}
                      <span className="capitalize">· {l.categoria}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold whitespace-nowrap ${l.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                    {l.tipo === 'entrada' ? '+' : '-'} R$ {Number(l.valor).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}