import { useInsumos } from '@/hooks/useInsumos';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function EstoqueTab() {
  const { data: insumos = [] } = useInsumos();

  // Filter to feed-related items primarily, but show all
  const sorted = [...insumos].sort((a, b) => {
    const aLow = Number(a.quantidade) <= Number(a.minimo);
    const bLow = Number(b.quantidade) <= Number(b.minimo);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    return a.nome.localeCompare(b.nome);
  });

  const baixoEstoque = insumos.filter(i => Number(i.quantidade) <= Number(i.minimo) && Number(i.minimo) > 0);
  const totalItens = insumos.length;
  const totalValor = insumos.reduce((s, i) => s + Number(i.quantidade) * Number(i.preco_compra), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Itens no Depósito</p>
          <p className="text-xl font-bold text-foreground">{totalItens}</p>
        </div>
        <div className="bg-accent/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
          <p className="text-xl font-bold text-accent">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`rounded-2xl p-4 border border-border/50 ${baixoEstoque.length > 0 ? 'bg-destructive/5' : 'bg-success/5'}`}>
          <p className="text-xs text-muted-foreground mb-1">Estoque Baixo</p>
          <p className={`text-xl font-bold ${baixoEstoque.length > 0 ? 'text-destructive' : 'text-success'}`}>{baixoEstoque.length}</p>
        </div>
        <div className="bg-success/5 rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">OK</p>
          <p className="text-xl font-bold text-success">{totalItens - baixoEstoque.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {baixoEstoque.length > 0 && (
        <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Estoque Baixo — Atenção!</span>
          </div>
          <div className="space-y-1">
            {baixoEstoque.map(i => (
              <p key={i.id} className="text-xs text-destructive/80">
                • <strong>{i.nome}</strong>: {Number(i.quantidade)} {i.unidade} (mín: {Number(i.minimo)})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="font-display text-sm text-foreground">Todos os Insumos</h3>
        </div>
        <div className="divide-y divide-border/50">
          {sorted.map(i => {
            const qty = Number(i.quantidade);
            const min = Number(i.minimo);
            const isLow = qty <= min && min > 0;
            const pct = min > 0 ? Math.min((qty / (min * 3)) * 100, 100) : 100;
            return (
              <div key={i.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isLow ? <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle className="w-3.5 h-3.5 text-success" />}
                    <span className="text-sm font-medium text-card-foreground">{i.nome}</span>
                    {i.categoria && <Badge variant="outline" className="text-[10px]">{i.categoria}</Badge>}
                  </div>
                  <span className={`text-sm font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>{qty} {i.unidade}</span>
                </div>
                {min > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className={`h-1.5 flex-1 ${isLow ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                    <span className="text-[10px] text-muted-foreground">min: {min}</span>
                  </div>
                )}
                {Number(i.preco_compra) > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    R$ {Number(i.preco_compra).toFixed(2)}/{i.unidade} · Total: R$ {(qty * Number(i.preco_compra)).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
