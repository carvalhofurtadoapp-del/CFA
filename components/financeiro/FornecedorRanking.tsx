import { useState } from 'react';
import { TrendingDown, Truck, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RankItem { nome: string; total: number }

interface FornecedorRankingProps {
  data: RankItem[];
  totalSaidas: number;
  categoriasData?: RankItem[];
  onItemClick?: (view: 'fornecedor' | 'categoria', nome: string) => void;
}

export function FornecedorRanking({ data, totalSaidas, categoriasData = [], onItemClick }: FornecedorRankingProps) {
  const [view, setView] = useState<'fornecedor' | 'categoria'>('fornecedor');
  const current = view === 'fornecedor' ? data : categoriasData;
  const maxVal = current[0]?.total || 1;
  const title = view === 'fornecedor' ? 'Gastos por Fornecedor' : 'Gastos por Categoria';

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
        </div>
        <div className="inline-flex rounded-lg bg-muted/50 p-0.5">
          <Button
            size="sm"
            variant={view === 'fornecedor' ? 'default' : 'ghost'}
            onClick={() => setView('fornecedor')}
            className="h-7 px-2.5 text-xs gap-1.5 rounded-md"
          >
            <Truck className="w-3.5 h-3.5" /> Fornecedor
          </Button>
          <Button
            size="sm"
            variant={view === 'categoria' ? 'default' : 'ghost'}
            onClick={() => setView('categoria')}
            className="h-7 px-2.5 text-xs gap-1.5 rounded-md"
          >
            <Tags className="w-3.5 h-3.5" /> Categoria
          </Button>
        </div>
      </div>
      {current.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">Sem dados disponíveis</div>
      ) : (
        <div className="space-y-3">
          {current.slice(0, 8).map((f, i) => {
            const pct = totalSaidas > 0 ? (f.total / totalSaidas) * 100 : 0;
            const barWidth = (f.total / maxVal) * 100;
            return (
              <button
                type="button"
                key={f.nome}
                onClick={() => onItemClick?.(view, f.nome)}
                className="w-full text-left space-y-1 p-1.5 -mx-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground font-medium truncate mr-2">
                    <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                    {f.nome}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                    <span className="font-semibold text-destructive">R$ {f.total.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/60 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
