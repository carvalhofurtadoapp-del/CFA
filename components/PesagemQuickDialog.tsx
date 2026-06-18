import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, Loader2, Weight, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { usePesagens, useCreatePesagem } from '@/hooks/usePesagens';
import { toast } from 'sonner';

interface PesagemQuickDialogProps {
  animalId: string | null;
  animalNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Entry {
  id: string;
  peso: string;
  data: Date;
}

const makeEntry = (): Entry => ({
  id: Math.random().toString(36).slice(2),
  peso: '',
  data: new Date(),
});

export function PesagemQuickDialog({ animalId, animalNome, open, onOpenChange }: PesagemQuickDialogProps) {
  const { data: pesagens = [] } = usePesagens(animalId || undefined);
  const createPesagem = useCreatePesagem();
  const [entries, setEntries] = useState<Entry[]>([makeEntry()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setEntries([makeEntry()]);
  }, [open, animalId]);

  const sorted = [...pesagens].sort((a, b) => a.data.localeCompare(b.data));
  const ultimoPeso = sorted.length ? Number(sorted[sorted.length - 1].peso) : null;
  const gmdValues = sorted.filter(p => p.gmd != null).map(p => Number(p.gmd));
  const gmd = gmdValues.length ? (gmdValues.reduce((a, b) => a + b, 0) / gmdValues.length).toFixed(2) : null;

  const addEntry = () => setEntries(prev => [...prev, makeEntry()]);
  const removeEntry = (id: string) =>
    setEntries(prev => (prev.length === 1 ? prev : prev.filter(e => e.id !== id)));
  const updateEntry = (id: string, patch: Partial<Entry>) =>
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));

  const handleSave = async () => {
    if (!animalId) return;
    const valid = entries.filter(e => e.peso && !isNaN(parseFloat(e.peso)));
    if (valid.length === 0) {
      toast.error('Informe ao menos uma pesagem válida');
      return;
    }
    setSaving(true);
    try {
      // Process chronologically and compute GMD against last known
      const ordered = [...valid].sort((a, b) => a.data.getTime() - b.data.getTime());
      let lastKnown: { peso: number; data: string } | null = sorted.length
        ? { peso: Number(sorted[sorted.length - 1].peso), data: sorted[sorted.length - 1].data }
        : null;

      for (const e of ordered) {
        const peso = parseFloat(e.peso);
        const dataStr = format(e.data, 'yyyy-MM-dd');
        let gmdValue: number | null = null;
        if (lastKnown) {
          const diffDays = Math.ceil((new Date(dataStr).getTime() - new Date(lastKnown.data).getTime()) / 86400000);
          if (diffDays > 0) {
            gmdValue = parseFloat(((peso - lastKnown.peso) / diffDays).toFixed(2));
          }
        }
        await createPesagem.mutateAsync({ animal_id: animalId, peso, data: dataStr, gmd: gmdValue });
        lastKnown = { peso, data: dataStr };
      }
      toast.success(`${ordered.length} pesagem(ns) registrada(s)!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao registrar pesagens');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg truncate">Insira a pesagem</DialogTitle>
              {animalNome && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{animalNome}</p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={addEntry}
              className="h-9 w-9 rounded-full shrink-0 border-accent/40 text-accent hover:bg-accent/10"
              title="Adicionar mais uma pesagem"
              aria-label="Adicionar mais uma pesagem"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Weight className="w-3 h-3" /> Último Peso
              </div>
              <p className="text-base font-semibold text-card-foreground mt-1">
                {ultimoPeso != null ? `${ultimoPeso} kg` : '—'}
              </p>
            </div>
            <div className="bg-success/5 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="w-3 h-3" /> GMD
              </div>
              <p className="text-base font-semibold text-success mt-1">
                {gmd ? `${gmd} kg/dia` : '—'}
              </p>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="bg-muted/20 rounded-xl p-3 space-y-2 border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Pesagem {idx + 1}
                  </span>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive/70 hover:text-destructive p-1"
                      aria-label="Remover pesagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Peso"
                      value={entry.peso}
                      onChange={e => updateEntry(entry.id, { peso: e.target.value })}
                      className="h-12 text-base font-semibold pr-12 rounded-xl"
                      autoFocus={idx === entries.length - 1}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      Kg
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 rounded-xl justify-start gap-2 sm:w-40',
                          !entry.data && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="w-4 h-4 shrink-0" />
                        <span className="text-sm">
                          {entry.data ? format(entry.data, 'dd/MM/yyyy', { locale: ptBR }) : 'Data'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="end">
                      <Calendar
                        mode="single"
                        selected={entry.data}
                        onSelect={d => d && updateEntry(entry.id, { data: d })}
                        initialFocus
                        locale={ptBR}
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}
          </div>

          {/* Historic */}
          {sorted.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Pesagens registradas ({sorted.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {[...sorted].reverse().map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(p.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-card-foreground">{Number(p.peso)} kg</span>
                      {p.gmd != null && (
                        <span className="text-success">{Number(p.gmd)} kg/d</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2 sticky bottom-0 bg-background border-t border-border/50">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Salvar</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}