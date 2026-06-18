import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ValuationCardProps {
  valorRebanho: number;
  animaisCount: number;
  precoArroba: string;
  onPrecoChange: (val: string) => void;
}

export function ValuationCard({ valorRebanho, animaisCount, precoArroba, onPrecoChange }: ValuationCardProps) {
  return (
    <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-2xl p-5 border border-success/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-success" />
            <h2 className="text-base font-display text-foreground">Valor Estimado do Rebanho</h2>
          </div>
          <p className="text-3xl font-bold text-success">
            R$ {valorRebanho.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {animaisCount} animais • Rendimento carcaça: 50%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Preço da @:</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input
              type="number"
              value={precoArroba}
              onChange={e => onPrecoChange(e.target.value)}
              className="w-24 h-10"
              step="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
