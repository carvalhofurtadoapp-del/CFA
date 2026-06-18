import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface FinancialSummaryProps {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  totalMovimentacoes: number;
  label?: string;
}

export function FinancialSummary({ totalEntradas, totalSaidas, saldo, totalMovimentacoes, label }: FinancialSummaryProps) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-accent" />
          {label || 'Resumo Financeiro'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-success/5">
            <span className="text-sm text-muted-foreground">Entradas</span>
            <span className="text-sm font-semibold text-success">R$ {totalEntradas.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5">
            <span className="text-sm text-muted-foreground">Saídas</span>
            <span className="text-sm font-semibold text-destructive">R$ {totalSaidas.toLocaleString('pt-BR')}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm font-medium text-card-foreground">Saldo</span>
            <span className={`text-xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {saldo.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">{totalMovimentacoes} movimentações registradas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
