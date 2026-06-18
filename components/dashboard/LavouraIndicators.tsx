import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, MapPin, DollarSign, TrendingUp } from 'lucide-react';

interface LavouraIndicatorsProps {
  talhoesAtivos: number;
  areaTotal: number;
  custoTotal: number;
  faturamento: number;
}

export function LavouraIndicators({ talhoesAtivos, areaTotal, custoTotal, faturamento }: LavouraIndicatorsProps) {
  const lucro = faturamento - custoTotal;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Sprout className="w-4 h-4 text-success" />
          Indicadores da Lavoura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-success/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-success" /> Talhões Ativos</span>
            <span className="text-sm font-semibold text-foreground">{talhoesAtivos} ({areaTotal.toFixed(1)} ha)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="w-4 h-4 text-destructive" /> Custo Total</span>
            <span className="text-sm font-semibold text-destructive">R$ {custoTotal.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-info/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="w-4 h-4 text-info" /> Faturamento</span>
            <span className="text-sm font-semibold text-info">R$ {faturamento.toLocaleString('pt-BR')}</span>
          </div>
          <div className={`flex items-center justify-between p-3 rounded-xl ${lucro >= 0 ? 'bg-success/5' : 'bg-destructive/5'}`}>
            <span className="text-sm font-medium text-card-foreground">Lucro Lavoura</span>
            <span className={`text-xl font-bold ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {lucro.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
