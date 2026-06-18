import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartTypeToggle, type ChartType } from './ChartTypeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CashFlowChartProps {
  data: { mes: string; entradas: number; saidas: number }[];
}

type Series = 'both' | 'entradas' | 'saidas';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  const [type, setType] = useState<ChartType>('bar');
  const [series, setSeries] = useState<Series>('both');

  const showEntradas = series === 'both' || series === 'entradas';
  const showSaidas = series === 'both' || series === 'saidas';

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value: number, name: string) => [
          `R$ ${value.toLocaleString('pt-BR')}`,
          name === 'entradas' ? 'Entradas' : 'Saídas',
        ]}
      />
      <Legend formatter={(v) => (v === 'entradas' ? 'Entradas' : 'Saídas')} />
    </>
  );

  const renderChart = () => {
    if (type === 'line') {
      return (
        <LineChart data={data}>
          {common}
          {showEntradas && <Line type="monotone" dataKey="entradas" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 4 }} />}
          {showSaidas && <Line type="monotone" dataKey="saidas" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4 }} />}
        </LineChart>
      );
    }
    if (type === 'area') {
      return (
        <AreaChart data={data}>
          {common}
          {showEntradas && <Area type="monotone" dataKey="entradas" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" strokeWidth={2} />}
          {showSaidas && <Area type="monotone" dataKey="saidas" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" strokeWidth={2} />}
        </AreaChart>
      );
    }
    return (
      <BarChart data={data}>
        {common}
        {showEntradas && <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />}
        {showSaidas && <Bar dataKey="saidas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />}
      </BarChart>
    );
  };

  const seriesBtn = (val: Series, label: string, colorClass: string) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setSeries(val)}
      className={cn(
        'h-7 px-2.5 text-xs rounded-md',
        series === val ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className={cn('w-2 h-2 rounded-full mr-1.5', colorClass)} />
      {label}
    </Button>
  );

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base font-display">Fluxo de Caixa Mensal</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-muted/50 p-0.5">
            {seriesBtn('both', 'Ambos', 'bg-foreground/40')}
            {seriesBtn('entradas', 'Entradas', 'bg-success')}
            {seriesBtn('saidas', 'Saídas', 'bg-destructive')}
          </div>
          <ChartTypeToggle value={type} onChange={setType} />
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>{renderChart()}</ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            Sem dados financeiros disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}
