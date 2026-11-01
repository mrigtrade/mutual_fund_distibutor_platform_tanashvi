/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849, BSE Member Code: 714114)
 * High-Fidelity Client-Side Export Utilities for PDF and Excel/CSV
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// 1. CSV & Formatted Excel (.xls) Exporters
// ============================================================================

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(sanitize).join(','),
    ...rows.map(row => row.map(sanitize).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportToExcelXls(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
  metadata?: { title?: string; subtitle?: string; clientName?: string; pan?: string }
) {
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName || 'Sheet1'}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .header-title { font-size: 16pt; font-weight: bold; color: #0a192f; }
        .header-sub { font-size: 10pt; color: #64748b; }
        .meta-label { font-weight: bold; color: #334155; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background-color: #0a192f; color: #f8fafc; font-weight: bold; border: 1px solid #334155; padding: 8px 12px; }
        td { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .num { text-align: right; }
        .gold { color: #c5a059; font-weight: bold; }
        .disclaimer { font-size: 8pt; color: #94a3b8; font-style: italic; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header-title">Tanashvi Fintech Private Limited</div>
      <div class="header-sub">AMFI Registered Mutual Fund Distributor (ARN-347849) · BSE Member 714114</div>
      <br/>
      ${metadata?.title ? `<h3>${metadata.title}</h3>` : ''}
      ${metadata?.subtitle ? `<p class="header-sub">${metadata.subtitle}</p>` : ''}
      ${metadata?.clientName ? `<p><span class="meta-label">Client Name:</span> ${metadata.clientName} &nbsp;|&nbsp; <span class="meta-label">PAN:</span> ${metadata.pan || 'N/A'} &nbsp;|&nbsp; <span class="meta-label">Generated:</span> ${new Date().toLocaleDateString('en-IN')}</p>` : ''}
      
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => {
                const isNum = typeof cell === 'number' || (!isNaN(Number(cell)) && cell !== '');
                return `<td class="${isNum ? 'num' : ''}">${cell}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="disclaimer">
        Disclaimer: Mutual Fund investments are subject to market risks, read all scheme related documents carefully. 
        Prepared via Tanashvi B2B Mutual Fund Platform. Confidential & Proprietary.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 2. High-Quality PDF Report Exporter (jsPDF + AutoTable)
// ============================================================================

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  clientName?: string;
  pan?: string;
  ucc?: string;
  summaryCards?: Array<{ label: string; value: string }>;
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
  footerNotes?: string[];
}

export function exportReportToPdf(options: PdfReportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // --- Header Banner ---
  doc.setFillColor(10, 25, 47); // #0a192f Tanashvi Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(248, 250, 252);
  doc.text('Tanashvi', 15, 12);

  // Motto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(197, 160, 89); // #c5a059 Gold
  doc.text(' |   भवतः हिताय', 42, 12);

  // Subtitle / Regulatory
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Tanashvi Fintech Private Limited · AMFI Reg. ARN-347849 · BSE StAR Member 714114', 15, 20);

  // Right-aligned Date
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 15, 12, { align: 'right' });
  doc.text(`www.tanashvi.in`, pageWidth - 15, 20, { align: 'right' });

  currentY = 38;

  // --- Document Title ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(options.title, 15, currentY);
  currentY += 6;

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(options.subtitle, 15, currentY);
    currentY += 8;
  }

  // --- Investor / Metadata Pill Box ---
  if (options.clientName || options.pan || options.ucc) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(15, currentY, pageWidth - 30, 12, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    let metaText = `Client: ${options.clientName || 'N/A'}`;
    if (options.pan) metaText += `   |   PAN: ${options.pan}`;
    if (options.ucc) metaText += `   |   UCC: ${options.ucc}`;

    doc.text(metaText, 20, currentY + 7.5);
    currentY += 18;
  }

  // --- Summary KPI Cards ---
  if (options.summaryCards && options.summaryCards.length > 0) {
    const cardWidth = (pageWidth - 30 - (options.summaryCards.length - 1) * 4) / options.summaryCards.length;
    const cardHeight = 16;

    options.summaryCards.forEach((card, idx) => {
      const cardX = 15 + idx * (cardWidth + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, cardX + 3, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cardX + 3, currentY + 12);
    });

    currentY += cardHeight + 8;
  }

  // --- Table ---
  autoTable(doc, {
    startY: currentY,
    head: [options.headers],
    body: options.rows,
    theme: 'grid',
    headStyles: {
      fillColor: [10, 25, 47],
      textColor: [248, 250, 252],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      cellPadding: 2.8,
      overflow: 'linebreak'
    },
    margin: { left: 15, right: 15 }
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- Footer Notes & Compliance Disclaimer ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);

  let noteY = Math.min(finalY, doc.internal.pageSize.getHeight() - 25);

  if (options.footerNotes) {
    options.footerNotes.forEach(note => {
      doc.text(`• ${note}`, 15, noteY);
      noteY += 4;
    });
  }

  doc.setTextColor(100, 116, 139);
  doc.text(
    'Disclaimer: Mutual fund investments are subject to market risks. Read all scheme related documents carefully. ' +
    'Calculations and returns shown are for informational purposes.',
    15,
    noteY + 3
  );

  const filename = options.filename || `${options.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
