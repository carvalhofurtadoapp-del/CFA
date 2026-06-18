import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';

interface DashboardFiltersProps {
  periodo: string;
  setPeriodo: (v: string) => void;
  lote: string;
  setLote: (v: string) => void;
  lotes: { id: string; nome: string }[];
}

export function DashboardFilters({ periodo, setPeriodo, lote, setLote, lotes }: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filtros:</span>
      </div>
      <Select value={periodo} onValueChange={setPeriodo}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
          <SelectItem value="365">Último ano</SelectItem>
          <SelectItem value="all">Todo período</SelectItem>
        </SelectContent>
      </Select>
      <Select value={lote} onValueChange={setLote}>
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Todos os lotes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os lotes</SelectItem>
          {lotes.map(l => (
            <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
