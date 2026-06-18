import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface GastosPorCategoriaProps {
  data: { nome: string; valor: number }[];
  onCategoryClick?: (nome: string) => void;
}

const COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
];

export function GastosPorCategoria({ data, onCategoryClick }: GastosPorCategoriaProps) {
  const total = data.reduce((s, d) => s + d.valor, 0);

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Gastos por Categoria (Mês)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="flex gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={30}
                  onClick={(d: any) => onCategoryClick?.(d.nome)}
                  className={onCategoryClick ? 'cursor-pointer' : ''}
                >
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[140px]">
              {data.map((cat, i) => (
                <button
                  type="button"
                  key={cat.nome}
                  onClick={() => onCategoryClick?.(cat.nome)}
                  disabled={!onCategoryClick}
                  className="w-full flex items-center justify-between text-sm p-1 -mx-1 rounded-md enabled:hover:bg-muted/40 enabled:cursor-pointer transition-colors disabled:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground capitalize">{cat.nome}</span>
                  </div>
                  <span className="font-medium text-card-foreground">R$ {cat.valor.toLocaleString('pt-BR')}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
            Sem gastos no mês
          </div>
        )}
      </CardContent>
    </Card>
  );
}
