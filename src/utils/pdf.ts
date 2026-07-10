import type { Invoice, Quote, StoreSettings, LineItem } from '@/types';
import { formatFCFA } from '@/utils/data';
import { toast } from 'sonner';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';

// Register Roboto fonts (built into pdfmake)
pdfMake.addVirtualFileSystem(pdfFonts);

function storeHeader(settings: StoreSettings) {
  return [
    { text: settings.storeName, style: 'storeName', alignment: 'center' as const },
    {
      text: [
        { text: settings.address, fontSize: 9 },
        '\n',
        { text: `Tél: ${settings.phone}`, fontSize: 9 },
        { text: settings.email ? `  |  ${settings.email}` : '', fontSize: 9 },
      ],
      alignment: 'center' as const,
      margin: [0, 2, 0, 2],
    },
    {
      text: `NINEA: ${settings.ninea}   |   RC: ${settings.rc}`,
      alignment: 'center' as const,
      fontSize: 9,
      margin: [0, 0, 0, 8],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#1a5276' }], margin: [0, 0, 0, 10] },
  ];
}

function itemsTable(items: LineItem[]) {
  const headerRow = [
    { text: '#', style: 'tableHeader', alignment: 'center' as const },
    { text: 'Désignation', style: 'tableHeader' },
    { text: 'Qté', style: 'tableHeader', alignment: 'center' as const },
    { text: 'Unité', style: 'tableHeader', alignment: 'center' as const },
    { text: 'Prix Unitaire', style: 'tableHeader', alignment: 'right' as const },
    { text: 'Total', style: 'tableHeader', alignment: 'right' as const },
  ];

  const dataRows = items.map((item, i) => [
    { text: String(i + 1), alignment: 'center' as const },
    { text: item.itemName },
    { text: String(item.quantity), alignment: 'center' as const },
    { text: item.unit, alignment: 'center' as const },
    { text: formatFCFA(item.price), alignment: 'right' as const },
    { text: formatFCFA(item.total), alignment: 'right' as const },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: [25, '*', 35, 45, 85, 90],
      body: [headerRow, ...dataRows],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 5, 0, 10] as [number, number, number, number],
  };
}

function totalsBlock(subtotal: number, discount: number, tax: number, total: number) {
  const result: Record<string, unknown>[] = [];
  result.push({ text: 'Sous-total:', bold: true, width: '*' });
  result.push({ text: formatFCFA(subtotal), alignment: 'right' as const, width: 90 });

  if (discount > 0) {
    result.push({ text: 'Remise:', bold: true, width: '*', margin: [0, 2, 0, 0] as [number, number, number, number] });
    result.push({ text: `- ${formatFCFA(discount)}`, alignment: 'right' as const, width: 90, margin: [0, 2, 0, 0] as [number, number, number, number], color: '#c0392b' });
  }

  result.push({ text: `TVA (${18}%):`, bold: true, width: '*', margin: [0, 2, 0, 0] as [number, number, number, number] });
  result.push({ text: formatFCFA(tax), alignment: 'right' as const, width: 90, margin: [0, 2, 0, 0] as [number, number, number, number] });

  result.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }], colSpan: 2, margin: [0, 4, 0, 4] as [number, number, number, number] });
  result.push({ text: 'TOTAL:', bold: true, fontSize: 13, width: '*' });
  result.push({ text: formatFCFA(total), bold: true, fontSize: 13, alignment: 'right' as const, width: 90 });

  return result;
}

function buildDocDefinition(
  title: string,
  refNumber: string,
  date: string,
  settings: StoreSettings,
  customerName: string,
  items: LineItem[],
  subtotal: number,
  discount: number,
  tax: number,
  total: number,
  extras: Record<string, string>[] = [],
  notes?: string,
): TDocumentDefinitions {
  return {
    content: [
      ...storeHeader(settings) as Content[],
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: title, style: 'title' },
              { text: `Réf: ${refNumber}`, margin: [0, 2, 0, 0] as [number, number, number, number] },
              { text: `Date: ${date}`, margin: [0, 2, 0, 0] as [number, number, number, number] },
            ],
          },
          {
            width: 200,
            stack: [
              { text: 'Client:', style: 'label' },
              { text: customerName, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
              ...extras.map((e) => ({ text: `${e.label}: ${e.value}`, fontSize: 9, margin: [0, 1, 0, 1] as [number, number, number, number] })),
            ],
          },
        ],
        margin: [0, 0, 0, 12] as [number, number, number, number],
      },
      itemsTable(items),
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 90],
              body: totalsBlock(subtotal, discount, tax, total).reduce(
                (acc: unknown[][], item, i) => {
                  if (i % 2 === 0) acc.push([]);
                  acc[acc.length - 1].push(item);
                  return acc;
                },
                [] as unknown[][],
              ),
            },
            layout: 'noBorders',
          },
        ],
      },
      ...(notes
        ? [
            {
              text: 'Notes:',
              style: 'label',
              margin: [0, 15, 0, 3] as [number, number, number, number],
            },
            {
              text: notes,
              fontSize: 9,
              italics: true,
              margin: [0, 0, 0, 0] as [number, number, number, number],
            },
          ]
        : []),
    ] as Content[],
    styles: {
      storeName: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] as [number, number, number, number] },
      title: { fontSize: 16, bold: true, color: '#1a5276', margin: [0, 0, 0, 4] as [number, number, number, number] },
      label: { fontSize: 9, color: '#7f8c8d', bold: true },
      tableHeader: { bold: true, fontSize: 9, fillColor: '#1a5276', color: 'white', margin: [0, 3, 0, 3] as [number, number, number, number] },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    info: {
      title: refNumber,
      author: settings.storeName,
    },
  };
}

function triggerDownload(docDef: TDocumentDefinitions, filename: string) {
  pdfMake.createPdf(docDef).download(filename);
}

export function generateInvoicePDF(invoice: Invoice, settings: StoreSettings): void {
  const extras: { label: string; value: string }[] = [
    { label: 'Mode de paiement', value: invoice.paymentMethod },
    { label: 'Statut', value: invoice.status },
  ];

  const docDef = buildDocDefinition(
    'FACTURE',
    invoice.number,
    invoice.date,
    settings,
    invoice.customerName,
    invoice.items,
    invoice.subtotal,
    invoice.discount,
    invoice.tax,
    invoice.total,
    extras,
    invoice.notes,
  );

  triggerDownload(docDef, `${invoice.number}.pdf`);
}

export function generateQuotePDF(quote: Quote, settings: StoreSettings): void {
  const extras: { label: string; value: string }[] = [
    { label: 'Validité', value: `jusqu'au ${quote.expiryDate}` },
    { label: 'Statut', value: quote.status },
  ];

  const docDef = buildDocDefinition(
    'DEVIS',
    quote.number,
    quote.date,
    settings,
    quote.customerName,
    quote.items,
    quote.subtotal,
    quote.discount,
    quote.tax,
    quote.total,
    extras,
    quote.notes,
  );

  triggerDownload(docDef, `${quote.number}.pdf`);
}

/**
 * Exports a filtered list of invoices as a single PDF summary report.
 * Shows a landscape table with number, client, date, mode, total, status.
 */
export function exportToPDFInvoices(
  invoices: Invoice[],
  filename: string,
  storeName: string,
): void {
  if (!invoices || invoices.length === 0) {
    toast.error('Aucune facture à exporter');
    return;
  }

  const body = [
    [
      { text: 'N° Facture', style: 'tableHeader' },
      { text: 'Client', style: 'tableHeader' },
      { text: 'Date', style: 'tableHeader', alignment: 'center' as const },
      { text: 'Mode', style: 'tableHeader', alignment: 'center' as const },
      { text: 'Total', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Statut', style: 'tableHeader', alignment: 'center' as const },
    ],
    ...invoices.map((inv) => [
      { text: inv.number, alignment: 'center' as const },
      inv.customerName,
      inv.date,
      { text: inv.paymentMethod, alignment: 'center' as const },
      { text: formatFCFA(inv.total), alignment: 'right' as const },
      { text: inv.status, alignment: 'center' as const },
    ]),
  ];

  const docDef: TDocumentDefinitions = {
    content: [
      { text: storeName, style: 'storeHeader', alignment: 'center' as const },
      {
        text: 'Liste des Factures',
        style: 'docTitle',
        alignment: 'center' as const,
        margin: [0, 10, 0, 15] as [number, number, number, number],
      },
      {
        table: {
          headerRows: 1,
          widths: [85, '*', 65, 55, 65, 50] as string[],
          body,
        },
        layout: 'lightHorizontalLines',
      },
      {
        text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        alignment: 'center' as const,
        margin: [0, 20, 0, 0] as [number, number, number, number],
        fontSize: 9,
        color: '#7f8c8d',
      },
    ],
    styles: {
      storeHeader: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] as [number, number, number, number] },
      docTitle: { fontSize: 16, bold: true, color: '#1a5276' },
      tableHeader: { bold: true, fontSize: 9, fillColor: '#1a5276', color: 'white', margin: [0, 3, 0, 3] as [number, number, number, number] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageOrientation: 'landscape',
    info: { title: filename },
  };

  const fname = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdfMake.createPdf(docDef).download(fname);
}

/**
 * Exports a filtered list of quotes as a single PDF summary report.
 * Shows a landscape table with number, client, date, total, status.
 */
export function exportToPDFQuotes(
  quotes: Quote[],
  filename: string,
  storeName: string,
): void {
  if (!quotes || quotes.length === 0) {
    toast.error('Aucun devis à exporter');
    return;
  }

  const body = [
    [
      { text: 'N° Dévis', style: 'tableHeader' },
      { text: 'Client', style: 'tableHeader' },
      { text: 'Date', style: 'tableHeader', alignment: 'center' as const },
      { text: 'Expire le', style: 'tableHeader', alignment: 'center' as const },
      { text: 'Total', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Statut', style: 'tableHeader', alignment: 'center' as const },
    ],
    ...quotes.map((q) => [
      { text: q.number, alignment: 'center' as const },
      q.customerName,
      q.date,
      q.expiryDate,
      { text: formatFCFA(q.total), alignment: 'right' as const },
      { text: q.status, alignment: 'center' as const },
    ]),
  ];

  const docDef: TDocumentDefinitions = {
    content: [
      { text: storeName, style: 'storeHeader', alignment: 'center' as const },
      {
        text: 'Liste des Devis',
        style: 'docTitle',
        alignment: 'center' as const,
        margin: [0, 10, 0, 15] as [number, number, number, number],
      },
      {
        table: {
          headerRows: 1,
          widths: [85, '*', 65, 65, 65, 50] as string[],
          body,
        },
        layout: 'lightHorizontalLines',
      },
      {
        text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        alignment: 'center' as const,
        margin: [0, 20, 0, 0] as [number, number, number, number],
        fontSize: 9,
        color: '#7f8c8d',
      },
    ],
    styles: {
      storeHeader: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] as [number, number, number, number] },
      docTitle: { fontSize: 16, bold: true, color: '#1a5276' },
      tableHeader: { bold: true, fontSize: 9, fillColor: '#1a5276', color: 'white', margin: [0, 3, 0, 3] as [number, number, number, number] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageOrientation: 'landscape',
    info: { title: filename },
  };

  const fname = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdfMake.createPdf(docDef).download(fname);
}
