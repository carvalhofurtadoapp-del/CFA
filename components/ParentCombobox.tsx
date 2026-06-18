import { useState, useRef, useEffect } from 'react';
import { useAnimais } from '@/hooks/useAnimais';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

interface ParentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterSexo?: 'macho' | 'femea';
  excludeId?: string;
}

export function ParentCombobox({ value, onChange, placeholder = 'Selecione ou digite', filterSexo, excludeId }: ParentComboboxProps) {
  const { data: animais = [] } = useAnimais();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const candidates = animais
    .filter(a => a.status === 'ativo')
    .filter(a => !excludeId || a.id !== excludeId)
    .filter(a => !filterSexo || a.sexo === filterSexo)
    .filter(a => {
      if (!search) return true;
      const s = search.toLowerCase();
      return a.nome?.toLowerCase().includes(s) || a.brinco.toLowerCase().includes(s);
    });

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {open && candidates.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {candidates.slice(0, 10).map(a => (
            <button
              key={a.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
              onClick={() => { onChange(a.nome || a.brinco); setSearch(a.nome || a.brinco); setOpen(false); }}
            >
              <span className="text-xs">{a.sexo === 'macho' ? '🐂' : '🐄'}</span>
              <span className="font-medium text-popover-foreground">{a.nome || a.brinco}</span>
              <span className="text-xs text-muted-foreground ml-auto">{a.brinco}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
