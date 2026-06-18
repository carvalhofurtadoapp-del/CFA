import { useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';

export interface ExtratoItem {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string;
  fornecedor: string | null;
  valor: number;
  tipo: string;
}

interface Props {
  items: ExtratoItem[];
  getCategoriaIcon: (cat: string) => string;
  onEdit: (item: ExtratoItem) => void;
  onDelete: (id: string) => void;
}

// Get Monday of the ISO week containing the date
function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function fmtFullDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
}

export function ExtratoSemanal({ items, getCategoriaIcon, onEdit, onDelete }: Props) {
  const groups = useMemo(() => {
    // Sort desc by date
    const sorted = [...items].sort((a, b) => b.data.localeCompare(a.data));
    const map = new Map<string, ExtratoItem[]>();
    for (const it of sorted) {
      const [y, m, d] = it.data.split('-').map(Number);
      const start = startOfWeek(new Date(y, m - 1, d));
      const key = start.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => {
        const [y, m, d] = key.split('-').map(Number);
        const start = new Date(y, m - 1, d);
        const end = endOfWeek(start);
        const entradas = list.filter(i => i.tipo === 'entrada').reduce((s, i) => s + Number(i.valor), 0);
        const saidas = list.filter(i => i.tipo === 'saida').reduce((s, i) => s + Number(i.valor), 0);
        return { key, start, end, list, entradas, saidas, saldo: entradas - saidas };
      });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 px-4 py-12 text-center text-muted-foreground text-sm">
        Nenhuma movimentação no período selecionado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.key} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {/* Week header */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 border-b border-border/50 flex-wrap">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Semana de {fmtDate(g.start)} – {fmtDate(g.end)}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-success font-medium">+ R$ {g.entradas.toLocaleString('pt-BR')}</span>
              <span className="text-destructive font-medium">- R$ {g.saidas.toLocaleString('pt-BR')}</span>
              <span className={`font-semibold ${g.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                Saldo: R$ {g.saldo.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Entries */}
          <div className="divide-y divide-border/50">
            {g.list.map(it => (
              <div key={it.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${it.tipo === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {it.tipo === 'entrada' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-card-foreground truncate">{it.descricao}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {getCategoriaIcon(it.categoria)} {it.categoria}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{fmtFullDate(it.data)}</span>
                    {it.fornecedor && <span>· {it.fornecedor}</span>}
                  </div>
                </div>
                <div className={`text-sm font-semibold whitespace-nowrap ${it.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                  {it.tipo === 'entrada' ? '+' : '-'} R$ {Number(it.valor).toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(it)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(it.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Remover">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}