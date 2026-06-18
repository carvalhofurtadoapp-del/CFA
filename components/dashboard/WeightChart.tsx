import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTypeToggle, type ChartType } from './ChartTypeToggle';

interface WeightChartProps {
  data: { mes: string; peso: number }[];
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

export function WeightChart({ data }: WeightChartProps) {
  const [type, setType] = useState<ChartType>('line');

  const renderChart = () => {
    const common = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kg`, 'Peso Médio']} />
      </>
    );
    if (type === 'bar') {
      return (
        <BarChart data={data}>
          {common}
          <Bar dataKey="peso" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }
    if (type === 'area') {
      return (
        <AreaChart data={data}>
          {common}
          <Area type="monotone" dataKey="peso" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
        </AreaChart>
      );
    }
    return (
      <LineChart data={data}>
        {common}
        <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={3}
          dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }} activeDot={{ r: 7 }} />
      </LineChart>
    );
  };

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base font-display">Evolução do Peso Médio (kg)</CardTitle>
        <ChartTypeToggle value={type} onChange={setType} />
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>{renderChart()}</ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            Sem dados de pesagem disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}
