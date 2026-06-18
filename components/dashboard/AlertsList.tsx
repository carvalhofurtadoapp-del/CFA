import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ChevronRight, Syringe, Package, Calendar, TrendingUp } from 'lucide-react';

export interface AlertItem {
  icon: typeof Syringe;
  label: string;
  detail: string;
  color: string;
  priority: 'critical' | 'warning' | 'info';
}

interface AlertsListProps {
  alerts: AlertItem[];
}

const priorityBg: Record<string, string> = {
  critical: 'bg-destructive/5 border-l-4 border-l-destructive',
  warning: 'bg-warning/5 border-l-4 border-l-warning',
  info: 'bg-info/5 border-l-4 border-l-info',
};

export function AlertsList({ alerts }: AlertsListProps) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Alertas Recentes
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alerta, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:opacity-80 ${priorityBg[alerta.priority]}`}>
                <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0 ${alerta.color}`}>
                  <alerta.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground">{alerta.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{alerta.detail}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <span className="text-3xl mb-2">✅</span>
            <p className="text-sm">Nenhum alerta no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
