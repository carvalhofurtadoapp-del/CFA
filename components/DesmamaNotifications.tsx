import { useEffect, useState } from 'react';
import { useAnimais } from '@/hooks/useAnimais';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAnimal } from '@/hooks/useAnimais';
import { useCreatePesagem } from '@/hooks/usePesagens';
import { Bell, Weight, Baby } from 'lucide-react';
import { toast } from 'sonner';

export function DesmamaNotifications() {
  const { data: animais = [] } = useAnimais();
  const updateAnimal = useUpdateAnimal();
  const createPesagem = useCreatePesagem();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [confirmAnimal, setConfirmAnimal] = useState<any>(null);
  const [peso, setPeso] = useState('');

  // Find animals that are 7+ months old without desmama date
  const today = new Date();
  const desmamaAnimals = animais.filter(a => {
    if (a.status !== 'ativo') return false;
    if (a.data_desmama) return false; // Already weaned
    if (dismissed.has(a.id)) return false;
    const birth = new Date(a.data_nascimento);
    const monthsDiff = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return monthsDiff >= 7;
  });

  useEffect(() => {
    if (desmamaAnimals.length > 0 && !confirmAnimal) {
      // Show toast for each animal needing desmama
      desmamaAnimals.forEach(animal => {
        toast.info(
          `🍼 ${animal.nome || animal.brinco} atingiu 7 meses! Hora da desmama.`,
          {
            duration: 8000,
            action: {
              label: 'Confirmar',
              onClick: () => setConfirmAnimal(animal),
            },
          }
        );
      });
    }
  }, [desmamaAnimals.length]);

  const handleConfirmDesmama = async () => {
    if (!confirmAnimal) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // Update animal with desmama date
    await updateAnimal.mutateAsync({
      id: confirmAnimal.id,
      data_desmama: todayStr,
    });

    // If weight provided, register pesagem
    if (peso) {
      await createPesagem.mutateAsync({
        animal_id: confirmAnimal.id,
        peso: parseFloat(peso),
        data: todayStr,
        gmd: null,
      });
    }

    toast.success(`Desmama de ${confirmAnimal.nome || confirmAnimal.brinco} confirmada!`);
    setDismissed(prev => new Set([...prev, confirmAnimal.id]));
    setConfirmAnimal(null);
    setPeso('');
  };

  return (
    <Dialog open={!!confirmAnimal} onOpenChange={() => { setConfirmAnimal(null); setPeso(''); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Baby className="w-5 h-5 text-warning" /> Confirmar Desmama
          </DialogTitle>
        </DialogHeader>
        {confirmAnimal && (
          <div className="space-y-4 mt-2">
            <div className="bg-warning/10 rounded-xl p-4 text-sm">
              <p className="font-medium text-card-foreground">
                {confirmAnimal.sexo === 'macho' ? '🐂' : '🐄'} {confirmAnimal.nome || confirmAnimal.brinco}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nascido em {confirmAnimal.data_nascimento} — atingiu 7 meses de idade.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Weight className="w-3 h-3" /> Peso atual (kg)
              </Label>
              <Input
                type="number"
                placeholder="Registrar pesagem da desmama"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="text-foreground h-12 text-base"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setConfirmAnimal(null); setPeso(''); setDismissed(prev => new Set([...prev, confirmAnimal.id])); }}>
                Adiar
              </Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleConfirmDesmama}>
                Confirmar Desmama
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
