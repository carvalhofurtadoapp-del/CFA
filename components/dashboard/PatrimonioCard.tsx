import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Beef, Tractor, Package } from 'lucide-react';

interface PatrimonioCardProps {
  patrimonioTotal: number;
  valorRebanho: number;
  valorEquipamentos: number;
  valorInsumos: number;
}

export function PatrimonioCard({ patrimonioTotal, valorRebanho, valorEquipamentos, valorInsumos }: PatrimonioCardProps) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Landmark className="w-4 h-4 text-accent" />
          Patrimônio Total da Fazenda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-foreground mb-4">R$ {patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-success/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><Beef className="w-4 h-4 text-success" /> Rebanho</span>
            <span className="text-sm font-semibold text-success">R$ {valorRebanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-info/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><Tractor className="w-4 h-4 text-info" /> Equipamentos</span>
            <span className="text-sm font-semibold text-info">R$ {valorEquipamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-warning/5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="w-4 h-4 text-warning" /> Insumos em Estoque</span>
            <span className="text-sm font-semibold text-warning">R$ {valorInsumos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
