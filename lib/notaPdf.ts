import logoCfa from '@/assets/logo-cfa.png';

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

export interface NotaLavouraData {
  talhaoNome: string;
  cultura?: string | null;
  quantidade: number;
  unidade: string;
  valor: number;
  comprador?: string | null;
  data: string; // ISO yyyy-mm-dd
  observacao?: string | null;
}

export async function gerarNotaVendaLavoura(d: NotaLavouraData) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const dataObj = new Date(d.data + 'T00:00:00');
  const dataBR = dataObj.toLocaleDateString('pt-BR');
  const today = new Date();
  const todayBR = today.toLocaleDateString('pt-BR');
  const notaNumero = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;

  const brandGreen: [number, number, number] = [34, 100, 53];
  const lightGreen: [number, number, number] = [232, 244, 234];
  const darkText: [number, number, number] = [40, 40, 40];
  const mutedText: [number, number, number] = [110, 110, 110];

  // === HEADER BAND ===
  doc.setFillColor(...brandGreen);
  doc.rect(0, 0, pageW, 32, 'F');
  const logoData = await loadLogoDataUrl();
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 14, 6, 20, 20); } catch { /* noop */ }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CFA', 38, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Carvalho Furtado Agropecuária', 38, 20);
  doc.setFontSize(7.5);
  doc.text('Gestão e Comércio Agrícola', 38, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('NOTA DE VENDA — LAVOURA', pageW - 14, 14, { align: 'right' });
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
  doc.text('TALHÃO', 18, y + 6);
  doc.text('CULTURA', 80, y + 6);
  doc.text('QUANTIDADE', 130, y + 6);
  doc.text('DATA DA VENDA', 168, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(d.talhaoNome, 18, y + 14);
  doc.text(d.cultura || '—', 80, y + 14);
  doc.text(`${d.quantidade.toLocaleString('pt-BR')} ${d.unidade}`, 130, y + 14);
  doc.text(dataBR, 168, y + 14);

  // === COMPRADOR ===
  y += 32;
  doc.setTextColor(...brandGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO COMPRADOR', 14, y);
  doc.setDrawColor(...brandGreen);
  doc.setLineWidth(0.4);
  doc.line(14, y + 1.5, pageW - 14, y + 1.5);
  y += 7;
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(d.comprador || 'Não informado', 14, y);

  // === DETALHE DA OPERAÇÃO ===
  y += 10;
  doc.setTextColor(...brandGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETALHAMENTO DA VENDA', 14, y);
  doc.line(14, y + 1.5, pageW - 14, y + 1.5);

  const precoUnit = d.quantidade > 0 ? d.valor / d.quantidade : 0;
  autoTable(doc, {
    startY: y + 4,
    head: [['Descrição', 'Quantidade', 'Preço Unit.', 'Valor Total']],
    body: [[
      `${d.cultura || 'Produção'} — ${d.talhaoNome}${d.observacao ? `\nObs: ${d.observacao}` : ''}`,
      `${d.quantidade.toLocaleString('pt-BR')} ${d.unidade}`,
      `R$ ${precoUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: brandGreen, textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' },
    styles: { fontSize: 9.5, cellPadding: 3, textColor: darkText, lineColor: [220, 220, 220] },
    columnStyles: {
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' },
    },
  });

  // === TOTAL BOX ===
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(...brandGreen);
  doc.roundedRect(pageW - 90, finalY, 76, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('VALOR TOTAL DA VENDA', pageW - 86, finalY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageW - 16, finalY + 14, { align: 'right' });

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

  const filename = `nota-venda-lavoura-${d.talhaoNome.replace(/\s+/g, '-')}-${d.data}.pdf`;
  doc.save(filename);
}
