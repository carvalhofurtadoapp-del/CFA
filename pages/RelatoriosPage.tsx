import { useState } from 'react';
import { useAnimais } from '@/hooks/useAnimais';
import { usePesagens } from '@/hooks/usePesagens';
import { useGastos } from '@/hooks/useGastos';
import { useEquipamentos, calcularValorAtual } from '@/hooks/useEquipamentos';
import { useVacinas } from '@/hooks/useVacinas';
import { useInsumos } from '@/hooks/useInsumos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'rebanho' | 'financeiro' | 'pesagens' | 'equipamentos' | 'vacinas' | 'estoque' | 'nascimentos';

function exportExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths based on content
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportPDF(filename: string, title: string, headers: string[], rows: (string | number)[][], periodo?: string) {
  const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait' });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Emitido em: ${dataEmissao}`, 14, 28);
  if (periodo) {
    doc.text(`Período: ${periodo}`, 14, 34);
  }

  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(14, periodo ? 37 : 31, doc.internal.pageSize.getWidth() - 14, periodo ? 37 : 31);

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Total de registros: ${rows.length}`, 14, periodo ? 43 : 37);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows.map(r => r.map(c => String(c))),
    startY: periodo ? 48 : 42,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 100, 54],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text('CFA - Controle de Fazenda Agropecuária', 14, doc.internal.pageSize.getHeight() - 10);
    },
  });

  doc.save(`${filename}.pdf`);
}

export default function RelatoriosPage() {
  const { data: animais = [], isLoading: la } = useAnimais();
  const { data: pesagens = [], isLoading: lp } = usePesagens();
  const { data: gastos = [] } = useGastos();
  const { data: equipamentos = [] } = useEquipamentos();
  const { data: vacinas = [] } = useVacinas();
  const { data: insumos = [] } = useInsumos();
  const [tipo, setTipo] = useState<ReportType>('rebanho');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const isLoading = la || lp;

  const filterByDate = <T extends Record<string, any>>(arr: T[], field: string = 'data') => {
    return arr.filter(item => {
      const d = String(item[field] || '');
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      return true;
    });
  };

  const getAnimalBrinco = (id: string) => {
    const a = animais.find(a => a.id === id);
    return a ? `${a.brinco}${a.nome ? ` (${a.nome})` : ''}` : id;
  };

  const getPeriodoLabel = () => {
    if (dataInicio && dataFim) return `${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;
    if (dataInicio) return `A partir de ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}`;
    if (dataFim) return `Até ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;
    return '';
  };

  const getReportData = (): { title: string; sheet: string; headers: string[]; rows: (string | number)[][] } => {
    const today = new Date().toISOString().split('T')[0];
    switch (tipo) {
      case 'rebanho': {
        const data = dataInicio || dataFim ? filterByDate(animais, 'data_nascimento') : animais;
        return {
          title: 'Relatório de Rebanho',
          sheet: 'Rebanho',
          headers: ['Brinco', 'Nome', 'Raça', 'Sexo', 'Status', 'Nascimento', 'Desmama', 'Confinamento'],
          rows: data.map(a => [a.brinco, a.nome || '', a.raca, a.sexo, a.status, a.data_nascimento, a.data_desmama || '', a.data_confinamento || '']),
        };
      }
      case 'financeiro': {
        const data = filterByDate(gastos);
        return {
          title: 'Relatório Financeiro',
          sheet: 'Financeiro',
          headers: ['Data', 'Descrição', 'Fornecedor', 'Categoria', 'Tipo', 'Valor (R$)'],
          rows: data.map(g => [g.data, g.descricao, g.fornecedor || '', g.categoria, g.tipo === 'entrada' ? 'Entrada' : 'Saída', Number(g.valor)]),
        };
      }
      case 'pesagens': {
        const data = filterByDate(pesagens);
        return {
          title: 'Relatório de Pesagens',
          sheet: 'Pesagens',
          headers: ['Data', 'Animal (Brinco)', 'Peso (kg)', 'GMD (kg/dia)'],
          rows: data.map(p => [p.data, getAnimalBrinco(p.animal_id), Number(p.peso), p.gmd ? Number(p.gmd) : '']),
        };
      }
      case 'equipamentos':
        return {
          title: 'Relatório de Equipamentos',
          sheet: 'Equipamentos',
          headers: ['Nome', 'Tipo', 'Status', 'Valor Compra (R$)', 'Valor Atual (R$)', 'Horas Trabalhadas', 'Data Compra', 'Próx. Manutenção'],
          rows: equipamentos.map(e => [e.nome, e.tipo, e.status, Number(e.valor_compra), Math.round(calcularValorAtual(Number(e.valor_compra), Number(e.valor_residual), e.vida_util_anos, e.data_compra)), `${Math.floor(Number((e as any).horas_trabalhadas || 0))}h`, e.data_compra, e.proxima_manutencao || '']),
        };
      case 'vacinas':
        return {
          title: 'Relatório de Vacinas',
          sheet: 'Vacinas',
          headers: ['Vacina', 'Animal (Brinco)', 'Status', 'Data Aplicação', 'Próxima'],
          rows: vacinas.map(v => [v.nome, getAnimalBrinco(v.animal_id), v.status, v.data_aplicacao || '', v.data_proxima || '']),
        };
      case 'estoque':
        return {
          title: 'Relatório de Estoque',
          sheet: 'Estoque',
          headers: ['Material', 'Quantidade', 'Unidade', 'Mínimo', 'EAN'],
          rows: insumos.map(i => [i.nome, Number(i.quantidade), i.unidade, Number(i.minimo), i.codigo_ean || '']),
        };
      case 'nascimentos': {
        const currentYear = new Date().getFullYear();
        const startDate = dataInicio || `${currentYear}-01-01`;
        const endDate = dataFim || `${currentYear}-12-31`;
        const nascidos = animais.filter(a => a.data_nascimento >= startDate && a.data_nascimento <= endDate);
        const machos = nascidos.filter(a => a.sexo === 'macho');
        const femeas = nascidos.filter(a => a.sexo === 'femea');

        // Group by month
        const meses: Record<string, { machos: number; femeas: number }> = {};
        nascidos.forEach(a => {
          const mes = a.data_nascimento.substring(0, 7); // YYYY-MM
          if (!meses[mes]) meses[mes] = { machos: 0, femeas: 0 };
          if (a.sexo === 'macho') meses[mes].machos++;
          else meses[mes].femeas++;
        });

        const rows: (string | number)[][] = Object.entries(meses)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, counts]) => {
            const [y, m] = mes.split('-');
            const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            return [monthName, counts.machos, counts.femeas, counts.machos + counts.femeas];
          });

        // Add total row
        rows.push(['TOTAL', machos.length, femeas.length, nascidos.length]);

        return {
          title: 'Relatório de Nascimentos por Sexo',
          sheet: 'Nascimentos',
          headers: ['Período', 'Machos', 'Fêmeas', 'Total'],
          rows,
        };
      }
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const today = new Date().toISOString().split('T')[0];
    const { title, sheet, headers, rows } = getReportData();
    const filename = `${tipo}_${today}`;
    const periodo = getPeriodoLabel();

    if (format === 'excel') {
      exportExcel(filename, sheet, headers, rows);
    } else {
      exportPDF(filename, title, headers, rows, periodo || undefined);
    }
    toast.success(`Relatório exportado em ${format === 'excel' ? 'Excel' : 'PDF'}!`);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const reportInfo: Record<ReportType, { title: string; count: number; desc: string }> = {
    rebanho: { title: 'Rebanho', count: animais.length, desc: `${animais.length} animais cadastrados` },
    financeiro: { title: 'Financeiro', count: gastos.length, desc: `${gastos.length} movimentações` },
    pesagens: { title: 'Pesagens', count: pesagens.length, desc: `${pesagens.length} registros de peso` },
    equipamentos: { title: 'Equipamentos', count: equipamentos.length, desc: `${equipamentos.length} ativos` },
    vacinas: { title: 'Vacinas', count: vacinas.length, desc: `${vacinas.length} registros` },
    estoque: { title: 'Estoque', count: insumos.length, desc: `${insumos.length} materiais` },
    nascimentos: { title: 'Nascimentos', count: animais.filter(a => a.data_nascimento.startsWith(String(new Date().getFullYear()))).length, desc: `Machos e fêmeas nascidos no ano` },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Exporte dados em Excel ou PDF</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerar Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={tipo} onValueChange={(v) => setTipo(v as ReportType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rebanho">Rebanho</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="pesagens">Pesagens</SelectItem>
              <SelectItem value="equipamentos">Equipamentos</SelectItem>
              <SelectItem value="vacinas">Vacinas</SelectItem>
              <SelectItem value="estoque">Estoque</SelectItem>
              <SelectItem value="nascimentos">Nascimentos (Machos/Fêmeas)</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-foreground" />
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm font-medium text-foreground">{reportInfo[tipo].title}</p>
            <p className="text-xs text-muted-foreground mt-1">{reportInfo[tipo].desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleExport('excel')} className="bg-success text-success-foreground hover:bg-success/90 gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button onClick={() => handleExport('pdf')} variant="destructive" className="gap-2">
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(reportInfo).map(([key, info]) => (
          <div key={key} className={`bg-card rounded-2xl p-4 border cursor-pointer hover:shadow-md transition-shadow ${tipo === key ? 'border-accent ring-1 ring-accent/30' : 'border-border/50'}`} onClick={() => setTipo(key as ReportType)}>
            <p className="text-xs text-muted-foreground">{info.title}</p>
            <p className="text-xl font-bold text-foreground">{info.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
