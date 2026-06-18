import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrincoTag } from '@/components/BrincoTag';
import { ArrowRightLeft, DollarSign, Trash2, Loader2, AlertTriangle, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import logoCfa from '@/assets/logo-cfa.png';

interface AnimalLite {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  lote_rebanho_id: string | null;
  observacao: string | null;
}

interface LoteLite {
  id: string;
  nome: string;
}

interface DeleteLoteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lote: LoteLite | null;
  animais: AnimalLite[];
  lotes: LoteLite[];
  latestWeightMap: Record<string, number>;
  onDeleted: () => void;
  /** When 'single-sale', dialog opens directly on the sell step for a single animal and does NOT delete the pasto. */
  mode?: 'delete' | 'single-sale';
  singleAnimalId?: string | null;
}

type Step = 'choose' | 'realocar' | 'vender';

interface VendaItem {
  animal_id: string;
  selected: boolean;
  peso: string;
  valor: string;
  comprador: string;
  telefone: string;
}

export function DeleteLoteDialog({ open, onOpenChange, lote, animais, lotes, latestWeightMap, onDeleted, mode = 'delete', singleAnimalId = null }: DeleteLoteDialogProps) {
  const qc = useQueryClient();
  const isSingleSale = mode === 'single-sale';
  const [step, setStep] = useState<Step>(isSingleSale ? 'vender' : 'choose');
  const [targetLote, setTargetLote] = useState<string>('todos');
  const [vendaItems, setVendaItems] = useState<VendaItem[]>([]);
  const [compradorGlobal, setCompradorGlobal] = useState({ nome: '', telefone: '' });
  const [processing, setProcessing] = useState(false);

  const animaisDoLote = useMemo(() => {
    if (isSingleSale && singleAnimalId) {
      return animais.filter(a => a.id === singleAnimalId);
    }
    return lote ? animais.filter(a => a.lote_rebanho_id === lote.id) : [];
  }, [lote, animais, isSingleSale, singleAnimalId]);

  // Auto-init venda items when opening in single-sale mode
  useEffect(() => {
    if (open && isSingleSale && animaisDoLote.length > 0 && vendaItems.length === 0) {
      setVendaItems(
        animaisDoLote.map(a => ({
          animal_id: a.id,
          selected: true,
          peso: latestWeightMap[a.id]?.toString() || '',
          valor: '',
          comprador: '',
          telefone: '',
        }))
      );
      setStep('vender');
    }
  }, [open, isSingleSale, animaisDoLote, latestWeightMap, vendaItems.length]);

  const reset = () => {
    setStep(isSingleSale ? 'vender' : 'choose');
    setTargetLote('todos');
    setVendaItems([]);
    setCompradorGlobal({ nome: '', telefone: '' });
    setProcessing(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const initVendaItems = () => {
    setVendaItems(
      animaisDoLote.map(a => ({
        animal_id: a.id,
        selected: true,
        peso: latestWeightMap[a.id]?.toString() || '',
        valor: '',
        comprador: '',
        telefone: '',
      }))
    );
    setStep('vender');
  };

  const updateItem = (id: string, patch: Partial<VendaItem>) => {
    setVendaItems(prev => prev.map(it => (it.animal_id === id ? { ...it, ...patch } : it)));
  };

  const applyCompradorAll = () => {
    setVendaItems(prev => prev.map(it => ({ ...it, comprador: compradorGlobal.nome, telefone: compradorGlobal.telefone })));
    toast.success('Comprador aplicado a todos');
  };

  const deleteLoteRow = async () => {
    if (!lote) return;
    const { error } = await supabase.from('lotes_rebanho').delete().eq('id', lote.id);
    if (error) throw error;
  };

  const handleDeleteEmpty = async () => {
    setProcessing(true);
    try {
      await deleteLoteRow();
      qc.invalidateQueries({ queryKey: ['lotes_rebanho'] });
      qc.invalidateQueries({ queryKey: ['animais'] });
      toast.success('Lote removido!');
      onDeleted();
      handleClose(false);
    } catch {
      toast.error('Erro ao remover lote');
    } finally {
      setProcessing(false);
    }
  };

  const handleRealocar = async () => {
    if (!lote) return;
    setProcessing(true);
    try {
      const newLoteId = targetLote === 'todos' ? null : targetLote;
      const ids = animaisDoLote.map(a => a.id);
      if (ids.length > 0) {
        const { error } = await supabase
          .from('animais')
          .update({ lote_rebanho_id: newLoteId } as any)
          .in('id', ids);
        if (error) throw error;
      }
      await deleteLoteRow();
      qc.invalidateQueries({ queryKey: ['lotes_rebanho'] });
      qc.invalidateQueries({ queryKey: ['animais'] });
      const destinoNome = targetLote === 'todos' ? 'Todos (sem pasto)' : lotes.find(l => l.id === targetLote)?.nome || 'destino';
      toast.success(`${ids.length} animal(is) realocado(s) para ${destinoNome}. Lote removido.`);
      onDeleted();
      handleClose(false);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao realocar animais');
    } finally {
      setProcessing(false);
    }
  };

  const loadLogoDataUrl = async (): Promise<string | null> => {
    try {
      const response = await fetch(logoCfa);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generatePdfNota = async (selected: VendaItem[]) => {
    if (selected.length === 0) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const today = new Date();
    const todayBR = today.toLocaleDateString('pt-BR');
    const todayISO = today.toISOString().split('T')[0];
    const total = selected.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
    const totalPeso = selected.reduce((s, v) => s + (parseFloat(v.peso) || 0), 0);
    const notaNumero = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;

    // Brand colors (CFA green)
    const brandGreen: [number, number, number] = [34, 100, 53];
    const lightGreen: [number, number, number] = [232, 244, 234];
    const darkText: [number, number, number] = [40, 40, 40];
    const mutedText: [number, number, number] = [110, 110, 110];

    // === HEADER BAND ===
    doc.setFillColor(...brandGreen);
    doc.rect(0, 0, pageW, 32, 'F');

    // Logo
    const logoData = await loadLogoDataUrl();
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 14, 6, 20, 20);
      } catch {
        // ignore logo failure
      }
    }

    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CFA', 38, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Carvalho Furtado Agropecuária', 38, 20);
    doc.setFontSize(7.5);
    doc.text('Gestão e Comércio de Bovinos', 38, 25);

    // Document title (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('NOTA DE VENDA', pageW - 14, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Nº ${notaNumero}`, pageW - 14, 20, { align: 'right' });
    doc.text(`Emissão: ${todayBR}`, pageW - 14, 25, { align: 'right' });

    // === DOCUMENT INFO BOX ===
    let y = 42;
    doc.setDrawColor(...brandGreen);
    doc.setLineWidth(0.3);
    doc.setFillColor(...lightGreen);
    doc.roundedRect(14, y, pageW - 28, 26, 2, 2, 'FD');

    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ORIGEM', 18, y + 6);
    doc.text('QTD. ANIMAIS', 90, y + 6);
    doc.text('PESO TOTAL', 130, y + 6);
    doc.text('DATA OPERAÇÃO', 168, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const origemTxt = isSingleSale ? 'Venda individual' : `Pasto ${lote?.nome || '-'}`;
    doc.text(origemTxt, 18, y + 14);
    doc.text(`${selected.length}`, 90, y + 14);
    doc.text(totalPeso > 0 ? `${totalPeso.toLocaleString('pt-BR')} kg` : '—', 130, y + 14);
    doc.text(todayBR, 168, y + 14);

    // === COMPRADOR(ES) ===
    y += 32;
    const compradoresMap = new Map<string, { telefone: string; count: number }>();
    selected.forEach(v => {
      const key = v.comprador || 'Não informado';
      const cur = compradoresMap.get(key) || { telefone: v.telefone, count: 0 };
      cur.count += 1;
      if (!cur.telefone && v.telefone) cur.telefone = v.telefone;
      compradoresMap.set(key, cur);
    });
    doc.setTextColor(...brandGreen);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DADOS DO(S) COMPRADOR(ES)', 14, y);
    doc.setDrawColor(...brandGreen);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, pageW - 14, y + 1.5);
    y += 7;
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    compradoresMap.forEach((info, nome) => {
      const line = `${nome}${info.telefone ? `   |   Tel: ${info.telefone}` : ''}   |   ${info.count} animal(is)`;
      doc.text(line, 14, y);
      y += 5.5;
    });

    // === TABELA DE ANIMAIS ===
    y += 4;
    doc.setTextColor(...brandGreen);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ANIMAIS COMERCIALIZADOS', 14, y);
    doc.line(14, y + 1.5, pageW - 14, y + 1.5);

    const rows = selected.map((v, idx) => {
      const animal = animaisDoLote.find(a => a.id === v.animal_id);
      const peso = parseFloat(v.peso) || 0;
      const valor = parseFloat(v.valor) || 0;
      return [
        String(idx + 1).padStart(2, '0'),
        animal?.brinco || '-',
        animal?.nome || '-',
        animal?.raca || '-',
        peso > 0 ? `${peso.toLocaleString('pt-BR')} kg` : '-',
        v.comprador || '-',
        `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ];
    });

    autoTable(doc, {
      startY: y + 4,
      head: [['#', 'Brinco', 'Nome', 'Raça', 'Peso', 'Comprador', 'Valor']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: brandGreen, textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' },
      styles: { fontSize: 9, cellPadding: 2.5, textColor: darkText, lineColor: [220, 220, 220] },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22, fontStyle: 'bold' },
        4: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
    });

    // === TOTAIS BOX ===
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(...brandGreen);
    doc.roundedRect(pageW - 90, finalY, 76, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('VALOR TOTAL DA VENDA', pageW - 86, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageW - 16, finalY + 14, { align: 'right' });

    // Peso total side
    if (totalPeso > 0) {
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Peso total comercializado:', 14, finalY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${totalPeso.toLocaleString('pt-BR')} kg`, 14, finalY + 13);
    }

    // === ASSINATURAS ===
    const sigY = finalY + 42;
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.line(20, sigY, 90, sigY);
    doc.line(pageW - 90, sigY, pageW - 20, sigY);
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VENDEDOR', 55, sigY + 5, { align: 'center' });
    doc.text('COMPRADOR', pageW - 55, sigY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text('CFA — Carvalho Furtado Agropecuária', 55, sigY + 10, { align: 'center' });
    doc.text('Assinatura e CPF/CNPJ', pageW - 55, sigY + 10, { align: 'center' });

    // === FOOTER ===
    doc.setDrawColor(...brandGreen);
    doc.setLineWidth(0.4);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setTextColor(...mutedText);
    doc.setFontSize(7.5);
    doc.text(`Documento gerado em ${todayBR} via Sistema CFA`, 14, pageH - 9);
    doc.text(`Nº ${notaNumero}`, pageW - 14, pageH - 9, { align: 'right' });

    const filenameSrc = isSingleSale
      ? `animal-${animaisDoLote[0]?.brinco || 'individual'}`
      : `pasto-${lote?.nome.replace(/\s+/g, '-') || 'lote'}`;
    const filename = `nota-venda-${filenameSrc}-${todayISO}.pdf`;
    doc.save(filename);
    toast.success('Nota de venda gerada!');
  };

  const handleBaixarNota = () => {
    const selected = vendaItems.filter(v => v.selected);
    if (selected.length === 0) {
      toast.error('Selecione ao menos um animal');
      return;
    }
    const invalid = selected.find(v => !v.valor || parseFloat(v.valor) <= 0 || !v.comprador);
    if (invalid) {
      toast.error('Preencha valor e comprador para gerar a nota');
      return;
    }
    generatePdfNota(selected);
  };

  const handleVender = async () => {
    if (!isSingleSale && !lote) return;
    const selected = vendaItems.filter(v => v.selected);
    if (selected.length === 0) {
      toast.error('Selecione ao menos um animal para venda');
      return;
    }
    const invalid = selected.find(v => !v.valor || parseFloat(v.valor) <= 0 || !v.comprador);
    if (invalid) {
      toast.error('Preencha valor e comprador para todos os animais selecionados');
      return;
    }
    setProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      for (const item of selected) {
        const animal = animaisDoLote.find(a => a.id === item.animal_id);
        if (!animal) continue;
        const valorNum = parseFloat(item.valor);
        const pesoNum = item.peso ? parseFloat(item.peso) : null;

        const obsExtra = `[Venda ${today}] Comprador: ${item.comprador}${item.telefone ? ` | Tel: ${item.telefone}` : ''}${pesoNum ? ` | Peso: ${pesoNum}kg` : ''}`;
        const novaObs = animal.observacao ? `${animal.observacao}\n${obsExtra}` : obsExtra;
        await supabase
          .from('animais')
          .update({
            status: 'vendido',
            preco_venda: valorNum,
            observacao: novaObs,
            lote_rebanho_id: null,
          } as any)
          .eq('id', item.animal_id);

        if (pesoNum && pesoNum > 0) {
          await supabase.from('pesagens').insert({
            animal_id: item.animal_id,
            peso: pesoNum,
            data: today,
            gmd: null,
          } as any);
        }

        await supabase.from('gastos').insert({
          tipo: 'entrada',
          categoria: 'Venda Animal',
          descricao: `Venda ${animal.brinco}${animal.nome ? ` (${animal.nome})` : ''}${lote ? ` - Pasto ${lote.nome}` : ''}`,
          valor: valorNum,
          data: today,
          fornecedor: item.comprador,
        } as any);
      }

      // Apenas no modo "delete" (excluir pasto): realocar não vendidos e deletar pasto
      if (!isSingleSale && lote) {
        const naoVendidosIds = vendaItems.filter(v => !v.selected).map(v => v.animal_id);
        if (naoVendidosIds.length > 0) {
          await supabase.from('animais').update({ lote_rebanho_id: null } as any).in('id', naoVendidosIds);
        }
        await deleteLoteRow();
        qc.invalidateQueries({ queryKey: ['lotes_rebanho'] });
      }

      qc.invalidateQueries({ queryKey: ['animais'] });
      qc.invalidateQueries({ queryKey: ['gastos'] });
      qc.invalidateQueries({ queryKey: ['pesagens'] });

      // Auto-gerar PDF da nota
      await generatePdfNota(selected);

      toast.success(
        isSingleSale
          ? `Venda registrada para ${selected.length} animal!`
          : `${selected.length} animal(is) vendido(s) e pasto removido!`
      );
      onDeleted();
      handleClose(false);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar venda');
    } finally {
      setProcessing(false);
    }
  };

  // No lote required when in single-sale mode
  if (!lote && !isSingleSale) return null;

  // single-sale: skip empty/choose/realocar branches and render only the venda step
  if (isSingleSale && animaisDoLote.length === 0) return null;

  // Caso 1: lote vazio → confirmação simples (apenas modo delete)
  if (!isSingleSale && lote && animaisDoLote.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" /> Excluir Pasto
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o pasto <strong>{lote.nome}</strong>? Ele não possui animais.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeleteEmpty} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: choose (apenas modo delete)
  if (!isSingleSale && step === 'choose') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> Pasto possui animais
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O pasto <strong>{lote.nome}</strong> possui <strong>{animaisDoLote.length}</strong> animal(is). O que deseja fazer?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setStep('realocar')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-accent" />
                </div>
                <p className="font-medium text-foreground">Realocar Animais</p>
                <p className="text-xs text-muted-foreground text-center">Mover para outro pasto antes de excluir</p>
              </button>
              <button
                onClick={initVendaItems}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border hover:border-success hover:bg-success/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <p className="font-medium text-foreground">Vender Animais</p>
                <p className="text-xs text-muted-foreground text-center">Registrar venda detalhada e excluir pasto</p>
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleClose(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: realocar (apenas modo delete)
  if (!isSingleSale && step === 'realocar' && lote) {
    const outrosLotes = lotes.filter(l => l.id !== lote.id);
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Realocar Animais</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para qual pasto deseja mover os <strong>{animaisDoLote.length}</strong> animais? Se não selecionar nenhum, irão para <strong>Todos</strong> (sem pasto).
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pasto de destino</Label>
              <Select value={targetLote} onValueChange={setTargetLote}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (sem pasto)</SelectItem>
                  {outrosLotes.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('choose')}>Voltar</Button>
              <Button className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleRealocar} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Realocar e Excluir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: vender
  const selectedCount = vendaItems.filter(v => v.selected).length;
  const totalValor = vendaItems.filter(v => v.selected).reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" />
            {isSingleSale
              ? `Vender Animal — ${animaisDoLote[0]?.nome || animaisDoLote[0]?.brinco || ''}`
              : `Vender Animais — ${lote?.nome || ''}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Comprador global - oculto quando há apenas 1 animal */}
          {vendaItems.length > 1 && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comprador (aplicar a todos)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="Nome do comprador" value={compradorGlobal.nome} onChange={e => setCompradorGlobal({ ...compradorGlobal, nome: e.target.value })} />
                <Input placeholder="Telefone" value={compradorGlobal.telefone} onChange={e => setCompradorGlobal({ ...compradorGlobal, telefone: e.target.value })} />
                <Button variant="outline" onClick={applyCompradorAll} disabled={!compradorGlobal.nome}>Aplicar a todos</Button>
              </div>
            </div>
          )}

          {/* Lista de animais */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {vendaItems.map(item => {
              const animal = animaisDoLote.find(a => a.id === item.animal_id)!;
              return (
                <div key={item.animal_id} className={`rounded-xl border p-3 transition-colors ${item.selected ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/20 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={e => updateItem(item.animal_id, { selected: e.target.checked })}
                      className="mt-2 w-4 h-4 accent-accent"
                    />
                    <BrincoTag brinco={animal.brinco} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{animal.nome || animal.brinco}</p>
                      <p className="text-xs text-muted-foreground">{animal.raca}</p>
                    </div>
                  </div>
                  {item.selected && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Peso (kg)</Label>
                        <Input type="number" placeholder="kg" value={item.peso} onChange={e => updateItem(item.animal_id, { peso: e.target.value })} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Valor venda *</Label>
                        <Input type="number" placeholder="R$" value={item.valor} onChange={e => updateItem(item.animal_id, { valor: e.target.value })} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Comprador *</Label>
                        <Input placeholder="Nome" value={item.comprador} onChange={e => updateItem(item.animal_id, { comprador: e.target.value })} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Telefone</Label>
                        <Input placeholder="(00) 00000-0000" value={item.telefone} onChange={e => updateItem(item.animal_id, { telefone: e.target.value })} className="h-9" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumo */}
          <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Selecionados para venda</p>
              <p className="text-sm font-medium">{selectedCount} de {vendaItems.length} animal(is)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-success">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isSingleSale
              ? <>ℹ️ A venda será registrada no Fluxo de Caixa como entrada da categoria <strong>Venda Animal</strong> e o animal será marcado como <strong>vendido</strong>.</>
              : <>ℹ️ Animais não selecionados serão movidos para <strong>Todos</strong> (sem pasto). O pasto <strong>{lote?.nome}</strong> será excluído ao final. Cada venda será registrada no Fluxo de Caixa como entrada da categoria <strong>Venda Animal</strong>.</>
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {!isSingleSale && (
              <Button variant="outline" className="rounded-xl sm:flex-1" onClick={() => setStep('choose')} disabled={processing}>Voltar</Button>
            )}
            {isSingleSale && (
              <Button variant="outline" className="rounded-xl sm:flex-1" onClick={() => handleClose(false)} disabled={processing}>Cancelar</Button>
            )}
            <Button variant="outline" className="rounded-xl sm:flex-1 gap-2" onClick={handleBaixarNota} disabled={processing || selectedCount === 0}>
              <FileDown className="w-4 h-4" /> Baixar Nota PDF
            </Button>
            <Button className="rounded-xl sm:flex-1 bg-success text-success-foreground hover:bg-success/90" onClick={handleVender} disabled={processing || selectedCount === 0}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirmar Venda (${selectedCount})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
