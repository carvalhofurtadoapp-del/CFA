import { useNavigate } from 'react-router-dom';
import { Weight, Timer, ShoppingCart, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Nova Pesagem', icon: Weight, to: '/rebanho', color: 'text-info' },
    { label: 'Iniciar Confinamento', icon: Timer, to: '/confinamento', color: 'text-primary' },
    { label: 'Comprar Insumos', icon: ShoppingCart, to: '/deposito', color: 'text-accent' },
    { label: 'Registrar Venda', icon: Receipt, to: '/financeiro', color: 'text-success' },
  ];

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">⚡ Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-muted/50"
              onClick={() => navigate(action.to)}
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
