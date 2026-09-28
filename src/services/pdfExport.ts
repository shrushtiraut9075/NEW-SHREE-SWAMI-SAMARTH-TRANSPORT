import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4';
  marginMm?: number;
  quality?: number;
}

/**
 * Convert any image URL (like /company_logo.jpg) into a base64 Data URL
 * to avoid canvas tainting and guarantee 100% clean PDF generation.
 */
async function toDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) {
    return url;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return url;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Capture an HTML element by ID or Element reference and generate a clean, high-resolution A4 PDF.
 * Converts to actual .pdf file download on the user's computer.
 */
export async function exportElementToPdf(
  target: HTMLElement | string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    filename = 'document.pdf',
    orientation = 'portrait',
    format = 'a4',
    marginMm = 3,
    quality = 0.98,
  } = options;

  const rootElement = typeof target === 'string' ? document.getElementById(target) : target;
  if (!rootElement) {
    console.error(`exportElementToPdf: Element not found:`, target);
    return false;
  }

  try {
    // 1. Pre-convert all images in the document to Data URLs to prevent canvas tainting
    const imgElements = Array.from(rootElement.querySelectorAll<HTMLImageElement>('img'));
    const urlCache = new Map<string, string>();

    for (const img of imgElements) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        if (!urlCache.has(src)) {
          const dataUrl = await toDataUrl(src);
          urlCache.set(src, dataUrl);
        }
      }
    }

    // Check if container has multiple explicit sub-pages (e.g. in FULL_PAGE mode)
    const subPages = rootElement.querySelectorAll<HTMLElement>('.pdf-page, .page-break');
    const pagesToRender: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [rootElement];

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true,
    });

    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;

    // Usable print area
    const availableWidth = pageWidth - marginMm * 2;
    const availableHeight = pageHeight - marginMm * 2;

    for (let i = 0; i < pagesToRender.length; i++) {
      if (i > 0) {
        pdf.addPage(format, orientation);
      }

      const pageEl = pagesToRender[i];
      // Run html2canvas with a strict 4.5s timeout to guarantee it never hangs
      const canvas = await Promise.race([
        html2canvas(pageEl, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 2500,
          windowWidth: 794,
          onclone: (clonedDoc) => {
            // Lock cloned page element to exact A4 standard width (794px @ 96DPI = 210mm)
            const clonedContainers = clonedDoc.querySelectorAll<HTMLElement>(
              '.sheet-3in1-a4, .pdf-page, #printable-lr-container'
            );
            clonedContainers.forEach((el) => {
              el.style.width = '794px';
              el.style.minWidth = '794px';
              el.style.maxWidth = '794px';
              el.style.margin = '0 auto';
              el.style.boxSizing = 'border-box';
            });

            const clonedImgs = clonedDoc.querySelectorAll<HTMLImageElement>('img');
            clonedImgs.forEach((img) => {
              const src = img.getAttribute('src');
              if (src && urlCache.has(src)) {
                img.src = urlCache.get(src)!;
              }
            });
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('HTML2Canvas rendering timeout (4.5s)')), 4500)
        ),
      ]);

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let imgData: string;
      try {
        imgData = canvas.toDataURL('image/jpeg', quality);
      } catch {
        imgData = canvas.toDataURL('image/png');
      }

      // If it fits within a single page
      if (imgHeight <= availableHeight + 2) {
        // Center vertically if there is remaining margin
        const yOffset = marginMm + Math.max(0, (availableHeight - imgHeight) / 2);
        pdf.addImage(imgData, 'JPEG', marginMm, yOffset, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Scale proportionally to fit precisely on a single sheet
        const scaleFactor = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;
        const xOffset = marginMm + (availableWidth - scaledWidth) / 2;
        const yOffset = marginMm + (availableHeight - scaledHeight) / 2;

        pdf.addImage(
          imgData,
          'JPEG',
          xOffset,
          yOffset,
          scaledWidth,
          scaledHeight,
          undefined,
          'FAST'
        );
      }
    }

    // Ensure proper filename extension
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // 1. Primary Download via jsPDF built-in save (cross-browser compliant)
    try {
      pdf.save(cleanFilename);
    } catch {
      // 2. Fallback via manual Blob anchor
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = cleanFilename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        if (downloadAnchor.parentNode) {
          document.body.removeChild(downloadAnchor);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF with html2canvas/jsPDF:', error);
    // As safety fallback, trigger browser native print/save-as-pdf dialog
    window.print();
    return false;
  }
}
