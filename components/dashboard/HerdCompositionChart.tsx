import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['hsl(210, 70%, 50%)', 'hsl(28, 60%, 52%)'];

interface HerdCompositionChartProps {
  machos: number;
  femeas: number;
}

export function HerdCompositionChart({ machos, femeas }: HerdCompositionChartProps) {
  const pieData = [
    { name: 'Machos', value: machos },
    { name: 'Fêmeas', value: femeas },
  ];
  const total = machos + femeas;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display">Composição do Rebanho</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[0] }} />
                <span className="text-sm text-muted-foreground">♂ {machos}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[1] }} />
                <span className="text-sm text-muted-foreground">♀ {femeas}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
            Sem animais ativos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
