import { useNavigate } from 'react-router-dom';
import { Beef, Weight, TrendingUp, AlertTriangle, Timer, DollarSign } from 'lucide-react';

interface KpiCardsProps {
  totalAtivos: number;
  mediaPeso: number;
  gmdMedio: string;
  alertCount: number;
  confinados: number;
  valorRebanho: number;
  vendasMes: number;
  hasAlerts: boolean;
}

export function KpiCards({ totalAtivos, mediaPeso, gmdMedio, alertCount, confinados, valorRebanho, vendasMes, hasAlerts }: KpiCardsProps) {
  const navigate = useNavigate();

  const topCards = [
    { title: 'Cabeças Ativas', value: totalAtivos, icon: Beef, color: 'text-primary', bg: 'bg-primary/5', to: '/rebanho' },
    { title: 'Peso Médio', value: `${mediaPeso} kg`, icon: Weight, color: 'text-info', bg: 'bg-info/5', to: '/rebanho' },
    { title: 'GMD Médio', value: `${gmdMedio} kg/dia`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/5', to: '/rebanho' },
    { title: 'Alertas', value: alertCount, icon: AlertTriangle, color: hasAlerts ? 'text-warning' : 'text-muted-foreground', bg: hasAlerts ? 'bg-warning/5' : 'bg-muted/50', to: null },
  ];

  const bottomCards = [
    { title: 'Confinados', value: confinados, icon: Timer, color: 'text-primary', bg: 'bg-primary/5', to: '/confinamento' },
    { title: 'Valor Rebanho', value: `R$ ${valorRebanho.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-success', bg: 'bg-success/5', to: '/financeiro' },
    { title: 'Vendas no Mês', value: `R$ ${vendasMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/5', to: '/financeiro' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topCards.map((card) => (
          <div
            key={card.title}
            onClick={() => card.to && navigate(card.to)}
            className={`${card.bg} rounded-2xl p-4 sm:p-5 border border-border/50 transition-all hover:shadow-md ${card.to ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{card.title}</p>
              <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-card-foreground">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bottomCards.map((card) => (
          <div
            key={card.title}
            onClick={() => card.to && navigate(card.to)}
            className={`${card.bg} rounded-2xl p-4 border border-border/50 transition-all hover:shadow-md cursor-pointer hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <card.icon className="w-3.5 h-3.5" />
              {card.title}
            </div>
            <p className={`text-lg font-bold text-card-foreground`}>{card.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
