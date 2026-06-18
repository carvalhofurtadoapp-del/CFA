import { LineChart as LineIcon, BarChart3, AreaChart as AreaIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChartType = 'line' | 'bar' | 'area';

interface ChartTypeToggleProps {
  value: ChartType;
  onChange: (v: ChartType) => void;
  options?: ChartType[];
}

const ICONS: Record<ChartType, typeof LineIcon> = {
  line: LineIcon,
  bar: BarChart3,
  area: AreaIcon,
};

const LABELS: Record<ChartType, string> = {
  line: 'Linha',
  bar: 'Barras',
  area: 'Área',
};

export function ChartTypeToggle({ value, onChange, options = ['line', 'bar', 'area'] }: ChartTypeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-muted/50 p-0.5">
      {options.map((opt) => {
        const Icon = ICONS[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            title={LABELS[opt]}
            className={cn(
              'h-7 px-2 inline-flex items-center justify-center rounded-md transition-colors text-xs',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
