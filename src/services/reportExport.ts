import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CompanyProfile } from '../types';

export interface ReportExportData {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summaryStats?: { label: string; value: string | number }[];
  dateRange?: { start: string; end: string };
  branch?: string;
}

/**
 * Export report to formatted Excel (.xlsx) file
 */
export const exportToExcel = (
  report: ReportExportData,
  companyProfile: CompanyProfile
) => {
  const wb = XLSX.utils.book_new();

  // Create sheet data with company header
  const sheetData: (string | number)[][] = [
    [companyProfile.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT'],
    [companyProfile.tagline || 'Leading Logistics & Cargo Carrier'],
    [
      `Branch: ${report.branch || 'ALL'} | Date Range: ${
        report.dateRange ? `${report.dateRange.start} to ${report.dateRange.end}` : 'All Dates'
      }`,
    ],
    [`Report: ${report.title.toUpperCase()}`],
    [`Generated On: ${new Date().toLocaleString('en-IN')}`],
    [], // empty row
  ];

  // If summary statistics are provided, append them
  if (report.summaryStats && report.summaryStats.length > 0) {
    sheetData.push(['--- SUMMARY OVERVIEW ---']);
    report.summaryStats.forEach((stat) => {
      sheetData.push([stat.label, stat.value]);
    });
    sheetData.push([]); // empty row
  }

  // Add table headers
  sheetData.push(report.headers);

  // Add data rows
  report.rows.forEach((r) => sheetData.push(r));

  // Convert array of arrays to worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  const colWidths = report.headers.map((h, i) => {
    let maxLen = h.length;
    report.rows.forEach((row) => {
      const val = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
      if (val.length > maxLen) maxLen = Math.min(val.length, 40);
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
  ws['!cols'] = colWidths;

  // Append sheet and download file
  XLSX.utils.book_append_sheet(wb, ws, report.title.slice(0, 30));
  const safeFilename = `${report.filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
};

/**
 * Export report to professional PDF (.pdf) file
 */
export const exportToPDF = (
  report: ReportExportData,
  companyProfile: CompanyProfile
) => {
  // Use landscape if more than 6 columns, else portrait
  const isLandscape = report.headers.length > 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Company Name in Bold Red with accent
  doc.setTextColor(239, 68, 68); // red-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(companyProfile.name.toUpperCase(), 20, 24);

  // Subtitle / Hub info
  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `${companyProfile.tagline || 'Reliable Road Freight & Logistics Services'}  |  GSTIN: ${companyProfile.gstin || '27AABCU9603R1ZM'}`,
    20,
    38
  );

  // Report Title Badge on top-right
  doc.setTextColor(253, 224, 71); // amber-300
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(report.title.toUpperCase(), pageWidth - 20, 24, { align: 'right' });

  // Date and branch subtitle on top-right
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const filterInfo = `Branch: ${report.branch || 'ALL'}  |  Period: ${
    report.dateRange ? `${report.dateRange.start} to ${report.dateRange.end}` : 'All'
  }`;
  doc.text(filterInfo, pageWidth - 20, 38, { align: 'right' });

  let startY = 70;

  // Render Summary Stats Cards if available
  if (report.summaryStats && report.summaryStats.length > 0) {
    const cardWidth = Math.min(140, (pageWidth - 40) / report.summaryStats.length - 8);
    const cardHeight = 28;

    report.summaryStats.forEach((stat, idx) => {
      const x = 20 + idx * (cardWidth + 8);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(stat.label.toUpperCase(), x + 6, startY + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(String(stat.value), x + 6, startY + 22);
    });

    startY += cardHeight + 14;
  }

  // Build the autotable
  autoTable(doc, {
    startY: startY,
    head: [report.headers],
    body: report.rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    columnStyles: {
      // Numbers/totals generally align right
      ...getAlignedColumnStyles(report.headers),
    },
    didDrawPage: (data) => {
      // Footer with page number & timestamp
      const pageCount = doc.internal.pages.length - 1;
      const str = `Page ${data.pageNumber} of ${pageCount}  |  Generated on ${new Date().toLocaleString('en-IN')}  |  New Shree Swami Samarth Transport ERP`;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 12, {
        align: 'center',
      });
    },
    margin: { left: 20, right: 20, top: 70, bottom: 25 },
  });

  const safeFilename = `${report.filename}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(safeFilename);
};

/**
 * Determine text alignment for numeric/monetary columns
 */
function getAlignedColumnStyles(headers: string[]) {
  const styles: Record<number, { halign: 'left' | 'right' | 'center' }> = {};
  headers.forEach((h, idx) => {
    const lower = h.toLowerCase();
    if (
      lower.includes('amount') ||
      lower.includes('freight') ||
      lower.includes('total') ||
      lower.includes('wt') ||
      lower.includes('weight') ||
      lower.includes('pkgs') ||
      lower.includes('packages') ||
      lower.includes('rate') ||
      lower.includes('advance') ||
      lower.includes('balance') ||
      lower.includes('due')
    ) {
      styles[idx] = { halign: 'right' };
    } else if (
      lower.includes('date') ||
      lower.includes('hub') ||
      lower.includes('branch') ||
      lower.includes('status') ||
      lower.includes('mode')
    ) {
      styles[idx] = { halign: 'center' };
    } else {
      styles[idx] = { halign: 'left' };
    }
  });
  return styles;
}
