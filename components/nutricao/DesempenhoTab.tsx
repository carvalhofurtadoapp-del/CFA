import { useMemo } from 'react';
import { useAnimais } from '@/hooks/useAnimais';
import { usePesagens } from '@/hooks/usePesagens';
import { useLotesConfinamento, useAnimaisConfinamento } from '@/hooks/useConfinamento';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Weight, Activity } from 'lucide-react';

interface ConsumoRow { lote_id: string; quantidade: number; sobras: number; data: string; }

function useConsumos() {
  return useQuery({
    queryKey: ['consumo_racao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consumo_racao').select('*');
      if (error) throw error;
      return data as ConsumoRow[];
    },
  });
}

export default function DesempenhoTab() {
  const { data: animais = [] } = useAnimais();
  const { data: pesagens = [] } = usePesagens();
  const { data: lotes = [] } = useLotesConfinamento();
  const { data: animaisConf = [] } = useAnimaisConfinamento();
  const { data: consumos = [] } = useConsumos();

  const lotesAtivos = lotes.filter(l => l.status === 'ativo');

  const loteDesempenho = useMemo(() => {
    return lotesAtivos.map(lote => {
      const animaisNoLote = animaisConf.filter(a => a.lote_id === lote.id && a.status === 'ativo');
      const animalIds = animaisNoLote.map(a => a.animal_id);

      // Collect pesagens per animal
      const pesoData = animalIds.map(animalId => {
        const ps = pesagens.filter(p => p.animal_id === animalId).sort((a, b) => a.data.localeCompare(b.data));
        const pesoInicial = animaisNoLote.find(a => a.animal_id === animalId)?.peso_entrada || (ps.length > 0 ? Number(ps[0].peso) : 0);
        const pesoAtual = ps.length > 0 ? Number(ps[ps.length - 1].peso) : pesoInicial;
        const gmds = ps.filter(p => p.gmd).map(p => Number(p.gmd));
        const gmd = gmds.length > 0 ? gmds[gmds.length - 1] : 0;
        const animal = animais.find(a => a.id === animalId);
        return { animalId, brinco: animal?.brinco || '?', pesoInicial, pesoAtual, gmd, ganho: pesoAtual - pesoInicial };
      });

      const gmdMedio = pesoData.length > 0 ? pesoData.reduce((s, p) => s + p.gmd, 0) / pesoData.length : 0;
      const ganhoMedio = pesoData.length > 0 ? pesoData.reduce((s, p) => s + p.ganho, 0) / pesoData.length : 0;

      // Conversão alimentar
      const loteConsumos = consumos.filter(c => c.lote_id === lote.id);
      const consumoTotal = loteConsumos.reduce((s, c) => s + Number(c.quantidade) - Number(c.sobras || 0), 0);
      const ganhoTotal = pesoData.reduce((s, p) => s + p.ganho, 0);
      const conversaoAlimentar = ganhoTotal > 0 ? consumoTotal / ganhoTotal : 0;

      return { lote, animais: pesoData, gmdMedio, ganhoMedio, conversaoAlimentar, nAnimais: pesoData.length };
    });
  }, [lotesAtivos, animaisConf, pesagens, animais, consumos]);

  return (
    <div className="space-y-4">
      {loteDesempenho.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum lote de confinamento ativo com animais.
        </CardContent></Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const totalAnimais = loteDesempenho.reduce((s, l) => s + l.nAnimais, 0);
              const gmdGeral = totalAnimais > 0 ? loteDesempenho.reduce((s, l) => s + l.gmdMedio * l.nAnimais, 0) / totalAnimais : 0;
              const ganhoGeral = totalAnimais > 0 ? loteDesempenho.reduce((s, l) => s + l.ganhoMedio * l.nAnimais, 0) / totalAnimais : 0;
              const caGeral = loteDesempenho.filter(l => l.conversaoAlimentar > 0);
              const caMedia = caGeral.length > 0 ? caGeral.reduce((s, l) => s + l.conversaoAlimentar, 0) / caGeral.length : 0;
              return (
                <>
                  <div className="bg-primary/5 rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Weight className="w-3.5 h-3.5 text-primary" /> Animais</div>
                    <p className="text-xl font-bold text-foreground">{totalAnimais}</p>
                  </div>
                  <div className={`rounded-2xl p-4 border border-border/50 ${gmdGeral >= 1 ? 'bg-success/5' : 'bg-warning/5'}`}>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendingUp className="w-3.5 h-3.5 text-success" /> GMD Médio</div>
                    <p className={`text-xl font-bold ${gmdGeral >= 1 ? 'text-success' : 'text-warning'}`}>{gmdGeral.toFixed(2)} kg/dia</p>
                  </div>
                  <div className="bg-accent/5 rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Activity className="w-3.5 h-3.5 text-accent" /> Ganho Médio</div>
                    <p className="text-xl font-bold text-accent">{ganhoGeral.toFixed(1)} kg</p>
                  </div>
                  <div className={`rounded-2xl p-4 border border-border/50 ${caMedia > 0 && caMedia <= 6 ? 'bg-success/5' : 'bg-muted/5'}`}>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendingDown className="w-3.5 h-3.5" /> Conv. Alimentar</div>
                    <p className="text-xl font-bold text-foreground">{caMedia > 0 ? `${caMedia.toFixed(1)}:1` : '—'}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Per-lot detail */}
          {loteDesempenho.map(({ lote, animais: animalData, gmdMedio, ganhoMedio, conversaoAlimentar, nAnimais }) => (
            <Card key={lote.id} className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{lote.nome}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{nAnimais} animais</Badge>
                    <Badge className={`text-xs ${gmdMedio >= 1 ? 'bg-success text-success-foreground' : gmdMedio >= 0.5 ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                      GMD: {gmdMedio.toFixed(2)} kg
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Ganho Médio</p>
                    <p className="font-bold text-foreground">{ganhoMedio.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conv. Alimentar</p>
                    <p className="font-bold text-foreground">{conversaoAlimentar > 0 ? `${conversaoAlimentar.toFixed(1)}:1` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GMD</p>
                    <p className={`font-bold ${gmdMedio >= 1 ? 'text-success' : 'text-warning'}`}>{gmdMedio.toFixed(2)} kg/dia</p>
                  </div>
                </div>

                {animalData.length > 0 && (
                  <div className="bg-muted/20 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-5 text-xs px-3 py-2 font-medium text-muted-foreground border-b border-border/50">
                      <span>Brinco</span><span>P. Inicial</span><span>P. Atual</span><span>Ganho</span><span>GMD</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border/30">
                      {animalData.map(a => (
                        <div key={a.animalId} className="grid grid-cols-5 text-xs px-3 py-2">
                          <span className="font-medium text-foreground">{a.brinco}</span>
                          <span className="text-muted-foreground">{a.pesoInicial.toFixed(0)} kg</span>
                          <span className="text-foreground">{a.pesoAtual.toFixed(0)} kg</span>
                          <span className={a.ganho > 0 ? 'text-success' : 'text-destructive'}>{a.ganho > 0 ? '+' : ''}{a.ganho.toFixed(0)} kg</span>
                          <span className={`font-medium ${a.gmd >= 1 ? 'text-success' : a.gmd >= 0.5 ? 'text-warning' : 'text-destructive'}`}>{a.gmd.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
