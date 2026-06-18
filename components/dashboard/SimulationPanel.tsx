import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface SimulationPanelProps {
  mediaPeso: number;
  gmdMedio: number;
  animaisCount: number;
  precoArroba: number;
}

export function SimulationPanel({ mediaPeso, gmdMedio, animaisCount, precoArroba }: SimulationPanelProps) {
  const [pesoAbate, setPesoAbate] = useState('540');
  const [novoPrecoArroba, setNovoPrecoArroba] = useState(String(precoArroba));

  const pesoMeta = parseFloat(pesoAbate) || 540;
  const newPrice = parseFloat(novoPrecoArroba) || precoArroba;

  // Days to target weight
  const kgFaltando = pesoMeta - mediaPeso;
  const diasParaAbate = gmdMedio > 0 && kgFaltando > 0 ? Math.ceil(kgFaltando / gmdMedio) : 0;

  // Valuation at new price
  const valorSimulado = animaisCount * ((mediaPeso * 0.5) / 15) * newPrice;

  // Valuation at current price
  const valorAtual = animaisCount * ((mediaPeso * 0.5) / 15) * precoArroba;
  const diferenca = valorSimulado - valorAtual;

  return (
    <Card className="rounded-2xl border-border/50 border-dashed border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          Simulador "E Se..."
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Days to slaughter */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Peso de abate (kg)</label>
          <Input
            type="number"
            value={pesoAbate}
            onChange={e => setPesoAbate(e.target.value)}
            className="h-9"
          />
          {diasParaAbate > 0 ? (
            <p className="text-sm">
              Com GMD de <span className="font-semibold text-accent">{gmdMedio.toFixed(2)}</span> kg/dia,
              faltam <Badge variant="secondary" className="mx-1">{diasParaAbate} dias</Badge>
              para atingir {pesoMeta} kg
            </p>
          ) : mediaPeso >= pesoMeta ? (
            <p className="text-sm text-success font-medium">✅ Peso médio já atingiu a meta!</p>
          ) : (
            <p className="text-sm text-muted-foreground">Insira dados para simular</p>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Price simulation */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Novo preço da @ (R$)</label>
          <Input
            type="number"
            value={novoPrecoArroba}
            onChange={e => setNovoPrecoArroba(e.target.value)}
            className="h-9"
            step="10"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor simulado:</span>
            <span className="text-sm font-bold text-card-foreground">
              R$ {valorSimulado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          {diferenca !== 0 && (
            <p className={`text-xs font-medium ${diferenca > 0 ? 'text-success' : 'text-destructive'}`}>
              {diferenca > 0 ? '↑' : '↓'} R$ {Math.abs(diferenca).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em relação ao valor atual
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
