import jsPDF from 'jspdf';
import { LRRecord, CompanyProfile } from '../types';
import { generateUpiQrDataUrl } from '../utils/qrHelper';

/**
 * Load an image URL as a base64 Data URL with strict timeout guard.
 */
async function loadImgDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Direct, instant vector-based PDF generator for LR Consignments.
 * Includes Company Logo, PhonePe QR, and pixel-perfect A4 alignment.
 * Solves currency symbol encoding (uses 'Rs.') and eliminates awkward gaps.
 */
export async function generateDirectLRPdf(
  lrs: LRRecord[],
  company: CompanyProfile,
  mode: '3_ON_1_A4' | 'FULL_PAGE' = '3_ON_1_A4'
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const primaryLR = lrs[0];
    if (!primaryLR) return false;

    // Pre-load company logo & Generate 100% crisp, readable 1:1 square UPI QR code
    const [logoDataUrl, generatedQrUrl] = await Promise.all([
      loadImgDataUrl(company.logoUrl || '/company_logo.jpg'),
      generateUpiQrDataUrl({
        upiId: company.upiId || 'shreeswamisamarth@ybl',
        payeeName: company.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT',
        amount: primaryLR.paymentMode === 'TO PAY' ? (primaryLR.charges?.grandTotal || primaryLR.totalFreight) : undefined,
        transactionNote: `Freight LR ${primaryLR.lrNumber}`,
        width: 800,
        margin: 2,
      }),
    ]);
    const qrDataUrl =
      (company.phonePeQrUrl && company.phonePeQrUrl.startsWith('data:image') ? company.phonePeQrUrl : null) ||
      generatedQrUrl ||
      (await loadImgDataUrl('/phonepe_qr_code.png'));

    if (mode === '3_ON_1_A4') {
      const copies: Array<{ title: string; lr: LRRecord }> =
        lrs.length > 1
          ? [
              { title: 'CONSIGNMENT #1', lr: lrs[0] },
              { title: 'CONSIGNMENT #2', lr: lrs[1] || lrs[0] },
              { title: 'CONSIGNMENT #3', lr: lrs[2] || lrs[0] },
            ]
          : [
              { title: 'CONSIGNOR COPY', lr: primaryLR },
              { title: 'CONSIGNEE COPY', lr: primaryLR },
              { title: 'DRIVER COPY', lr: primaryLR },
            ];

      // Exact mathematical dimensions for 3 slips on 1 A4 sheet (297mm height)
      // Slip Height: 85mm. Margin Top: 5mm. Gap: 5mm.
      // Slip 0: 5mm to 90mm
      // Cut 0: at 92.5mm
      // Slip 1: 95mm to 180mm
      // Cut 1: at 182.5mm
      // Slip 2: 185mm to 270mm
      // Total height used: 270mm (27mm bottom margin safely within printable bounds)
      const slipHeight = 85; // mm
      const marginX = 8;
      const slipWidth = 194; // mm (210 - 16)

      copies.forEach((copy, idx) => {
        const startY = 5 + idx * 90;
        drawSingleSlip(
          doc,
          copy.lr,
          copy.title,
          company,
          marginX,
          startY,
          slipWidth,
          slipHeight,
          logoDataUrl,
          qrDataUrl,
          false
        );

        // Draw dotted scissors cut line between slips
        if (idx < 2) {
          const cutY = startY + slipHeight + 2.5;
          doc.setDrawColor(160, 160, 160);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(marginX, cutY, marginX + slipWidth, cutY);
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(
            '-- -- -- -- CUT ALONG DOTTED LINE -- -- -- --',
            105,
            cutY - 0.4,
            { align: 'center' }
          );
          doc.setLineDashPattern([], 0); // reset
        }
      });
    } else {
      // Full Page mode (1 LR copy per A4 page)
      const copies = ['CONSIGNOR COPY', 'CONSIGNEE COPY', 'DRIVER COPY'];
      for (let idx = 0; idx < copies.length; idx++) {
        if (idx > 0) doc.addPage('a4', 'portrait');
        drawSingleSlip(
          doc,
          primaryLR,
          copies[idx],
          company,
          10,
          10,
          190,
          275,
          logoDataUrl,
          qrDataUrl,
          true
        );
      }
    }

    const filename = `LR_${primaryLR.lrNumber}_3in1_A4.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating direct LR PDF:', error);
    return false;
  }
}

function drawSingleSlip(
  doc: jsPDF,
  lr: LRRecord,
  copyTitle: string,
  company: CompanyProfile,
  x: number,
  y: number,
  w: number,
  h: number,
  logoDataUrl: string | null,
  qrDataUrl: string | null,
  isFullPage = false
) {
  // Outer Border Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, h);

  // Business Rules 2 & 3:
  // 1) Paid LR: Only Driver Copy shows amount. Consignor & Consignee copies hide amount.
  // 2) TBB LR: Amount numbers never appear; instead 'TBB' is displayed.
  const isTBB = lr.paymentMode === 'TBB';
  const isPaid = lr.paymentMode === 'PAID';
  const isDriverCopy = copyTitle.toUpperCase().includes('DRIVER');
  const showAmount = !isTBB && (!isPaid || isDriverCopy);
  const placeholderText = isTBB ? 'TBB' : 'PAID';

  // -------------------------------------------------------------
  // 1. TOP ROW: LOGO + COMPANY DETAILS + BADGE & LR NUMBER
  // -------------------------------------------------------------
  const headerHeight = isFullPage ? 32 : 18;
  const logoSize = isFullPage ? 28 : 17;
  const logoX = x + (isFullPage ? 3 : 2);
  const logoY = y + (isFullPage ? 3 : 1.2);

  // Draw Logo Box & Image
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(logoX, logoY, logoSize, logoSize);
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', logoX + 0.4, logoY + 0.4, logoSize - 0.8, logoSize - 0.8);
    } catch {
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('LOGO', logoX + logoSize / 2, logoY + logoSize / 2, { align: 'center' });
    }
  }

  // Right Meta Box
  const metaW = isFullPage ? 45 : 38;
  const metaX = x + w - metaW - 2;
  const metaY = y + 1.5;

  // Copy Badge Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(metaX, metaY, metaW, isFullPage ? 6 : 4.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 8.5 : 6.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`[ ${copyTitle} ]`, metaX + metaW / 2, metaY + (isFullPage ? 4.2 : 3.1), {
    align: 'center',
  });

  // LR Number in Meta Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 11 : 9.5);
  doc.setTextColor(15, 23, 42); // Deep Navy
  doc.text(lr.lrNumber, metaX + metaW, metaY + (isFullPage ? 12 : 8.5), { align: 'right' });

  // Date & Hub
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 8 : 6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Date: ${lr.bookingDate || '—'} | Hub: ${lr.branchCode || 'CHK'}`,
    metaX + metaW,
    metaY + (isFullPage ? 17 : 12.5),
    { align: 'right' }
  );

  // Center Company Details
  const centerStartX = logoX + logoSize + 2;
  const centerEndX = metaX - 2;
  const centerX = (centerStartX + centerEndX) / 2;

  let compY = y + (isFullPage ? 7 : 4.5);

  // Bold Red Company Name (FULL BOLD & LARGE SIZE)
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 18 : 13.5);
  doc.text(
    company.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT',
    centerX,
    compY,
    { align: 'center' }
  );

  // Tagline
  compY += isFullPage ? 5 : 3.2;
  doc.setFontSize(isFullPage ? 8.5 : 6.2);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${company.tagline || 'RELIABLE | SAFE | TIMELY LOGISTICS'} • ${company.subTagline || 'CHAKAN • PUNE'}`,
    centerX,
    compY,
    { align: 'center' }
  );

  // Address
  compY += isFullPage ? 4.5 : 3;
  doc.setFontSize(isFullPage ? 7.5 : 5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  let addr = company.address || 'Gat No. 158, Chimbali, Chakan, Pune';
  if (company.pincode && !addr.includes(company.pincode)) {
    addr += ` - ${company.pincode}`;
  }
  doc.text(addr.substring(0, 90), centerX, compY, { align: 'center' });

  // GSTIN • PAN • Mobile
  compY += isFullPage ? 4.5 : 2.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 7.5 : 6);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `GSTIN: ${company.gstin || '27AASFS9322Q1ZQ'}   •   PAN: ${company.pan || 'AASFS9322Q'}   •   Mob: ${
      company.mobile || '9881898635'
    }`,
    centerX,
    compY,
    { align: 'center' }
  );

  // -------------------------------------------------------------
  // 2. ROUTE & VEHICLE BAR (COMPACT & CLEAN)
  // -------------------------------------------------------------
  let curY = y + headerHeight;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(x, curY, x + w, curY);

  const routeH = isFullPage ? 7 : 5;
  doc.setFillColor(248, 250, 252);
  doc.rect(x, curY, w, routeH, 'F');

  const col4W = w / 4;
  const routeTextY = curY + (isFullPage ? 4.8 : 3.5);
  doc.setFontSize(isFullPage ? 8.5 : 6.5);
  doc.setTextColor(0, 0, 0);

  // Col 1: From
  doc.setFont('helvetica', 'normal');
  doc.text('From: ', x + 2, routeTextY);
  doc.setFont('helvetica', 'bold');
  doc.text((lr.fromLocation || 'Chakan, Pune').substring(0, 22), x + 11, routeTextY);
  doc.line(x + col4W, curY, x + col4W, curY + routeH);

  // Col 2: To
  doc.setFont('helvetica', 'normal');
  doc.text('To: ', x + col4W + 2, routeTextY);
  doc.setFont('helvetica', 'bold');
  doc.text((lr.toLocation || 'Destination').substring(0, 22), x + col4W + 8, routeTextY);
  doc.line(x + col4W * 2, curY, x + col4W * 2, curY + routeH);

  // Col 3: Vehicle
  doc.setFont('helvetica', 'normal');
  doc.text('Vehicle: ', x + col4W * 2 + 2, routeTextY);
  doc.setFont('helvetica', 'bold');
  doc.text((lr.vehicleNumber || 'DIRECT').substring(0, 18), x + col4W * 2 + 13, routeTextY);
  doc.line(x + col4W * 3, curY, x + col4W * 3, curY + routeH);

  // Col 4: Payment
  doc.setFont('helvetica', 'normal');
  doc.text('Payment: ', x + col4W * 3 + 2, routeTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Navy Blue
  doc.text(
    `${lr.paymentMode || 'PAID'} (${lr.deliveryType || 'DOOR'})`,
    x + w - 2,
    routeTextY,
    { align: 'right' }
  );

  curY += routeH;
  doc.setDrawColor(0, 0, 0);
  doc.line(x, curY, x + w, curY);

  // -------------------------------------------------------------
  // 3. CONSIGNOR & CONSIGNEE DETAILS (50-50 SPLIT)
  // -------------------------------------------------------------
  const partyH = isFullPage ? 24 : 14;
  const partyColW = w / 2;
  const partyMidX = x + partyColW;

  // Vertical divider between Consignor & Consignee
  doc.line(partyMidX, curY, partyMidX, curY + partyH);

  let pY = curY + (isFullPage ? 4 : 2.8);
  doc.setFontSize(isFullPage ? 7.5 : 5.6);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNOR (SENDER):', x + 2, pY);
  doc.text('CONSIGNEE (RECEIVER):', partyMidX + 2, pY);

  pY += isFullPage ? 4.5 : 3.2;
  doc.setFontSize(isFullPage ? 9.5 : 7.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text((lr.consignorName || 'CASH CUSTOMER').substring(0, 44), x + 2, pY);
  doc.text((lr.consigneeName || 'CASH CUSTOMER').substring(0, 44), partyMidX + 2, pY);

  pY += isFullPage ? 4 : 2.8;
  doc.setFontSize(isFullPage ? 7.5 : 5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    (lr.consignorAddress || 'On record at booking office').substring(0, 55),
    x + 2,
    pY
  );
  doc.text(
    (lr.consigneeAddress || 'On record at destination branch').substring(0, 55),
    partyMidX + 2,
    pY
  );

  pY += isFullPage ? 4 : 2.8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `GST: ${lr.consignorGstin || 'UR'} | Mob: ${lr.consignorMobile || 'NA'}`,
    x + 2,
    pY
  );
  doc.text(
    `GST: ${lr.consigneeGstin || 'UR'} | Mob: ${lr.consigneeMobile || 'NA'}`,
    partyMidX + 2,
    pY
  );

  curY += partyH;
  doc.setDrawColor(0, 0, 0);
  doc.line(x, curY, x + w, curY);

  // -------------------------------------------------------------
  // 4. GOODS TABLE (WITH CRISP VERTICAL GRID LINES)
  // -------------------------------------------------------------
  const tableHeaderH = isFullPage ? 6 : 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(x, curY, w, tableHeaderH, 'F');

  // Exact column width distribution
  const colDescW = w * 0.42;    // ~81.5mm
  const colPackW = w * 0.13;    // ~25.2mm
  const colQtyW = w * 0.08;     // ~15.5mm
  const colActWtW = w * 0.11;   // ~21.3mm
  const colChgWtW = w * 0.11;   // ~21.3mm
  const colFreightW = w * 0.15; // ~29.1mm

  const xPack = x + colDescW;
  const xQty = xPack + colPackW;
  const xActWt = xQty + colQtyW;
  const xChgWt = xActWt + colActWtW;
  const xFreight = xChgWt + colChgWtW;

  const tHeaderY = curY + (isFullPage ? 4.2 : 2.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 8 : 6);
  doc.setTextColor(0, 0, 0);

  doc.text('DESCRIPTION OF GOODS', x + 2, tHeaderY);
  doc.text('PACKING', xPack + 2, tHeaderY);
  doc.text('QTY', xQty + colQtyW / 2, tHeaderY, { align: 'center' });
  doc.text('ACT WT', xActWt + colActWtW - 2, tHeaderY, { align: 'right' });
  doc.text('CHG WT', xChgWt + colChgWtW - 2, tHeaderY, { align: 'right' });
  doc.text('FREIGHT (Rs.)', x + w - 2, tHeaderY, { align: 'right' });

  const tableStartY = curY;
  curY += tableHeaderH;
  doc.line(x, curY, x + w, curY);

  // Items
  const items = lr.items && lr.items.length > 0 ? lr.items.slice(0, isFullPage ? 6 : 2) : [];
  if (items.length === 0) {
    items.push({
      id: 'default-1',
      description: 'Industrial Goods / General Cargo',
      packingType: 'Boxes',
      quantity: lr.totalQuantity || 1,
      units: 'Units',
      actualWeight: lr.totalActualWeight || 100,
      chargeWeight: lr.totalChargeWeight || 100,
      ratePerKg: 0,
      freight: lr.totalFreight || 0,
    });
  }

  const rowH = isFullPage ? 6 : 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 8 : 6.2);

  items.forEach((item) => {
    const rowY = curY + (isFullPage ? 4.2 : 3.1);
    doc.text((item.description || 'Goods').substring(0, 42), x + 2, rowY);
    doc.text((item.packingType || 'Box').substring(0, 14), xPack + 2, rowY);
    doc.text(`${item.quantity || 0}`, xQty + colQtyW / 2, rowY, { align: 'center' });
    doc.text(`${item.actualWeight || 0} KG`, xActWt + colActWtW - 2, rowY, { align: 'right' });
    doc.text(`${item.chargeWeight || 0} KG`, xChgWt + colChgWtW - 2, rowY, { align: 'right' });
    doc.text(
      showAmount ? `Rs. ${(item.freight || 0).toLocaleString('en-IN')}` : placeholderText,
      x + w - 2,
      rowY,
      { align: 'right' }
    );

    curY += rowH;
    doc.setDrawColor(226, 232, 240);
    doc.line(x, curY, x + w, curY);
    doc.setDrawColor(0, 0, 0);
  });

  // Table Footer Total Row
  const footH = isFullPage ? 6 : 4.5;
  doc.setFillColor(248, 250, 252);
  doc.rect(x, curY, w, footH, 'F');
  const footY = curY + (isFullPage ? 4.2 : 3.1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 8.5 : 6.5);
  doc.text('TOTAL:', x + 2, footY);
  doc.text(`${lr.totalQuantity || items.length}`, xQty + colQtyW / 2, footY, { align: 'center' });
  doc.text(`${lr.totalActualWeight || 0} KG`, xActWt + colActWtW - 2, footY, { align: 'right' });
  doc.text(`${lr.totalChargeWeight || 0} KG`, xChgWt + colChgWtW - 2, footY, { align: 'right' });
  doc.text(
    showAmount ? `Rs. ${(lr.totalFreight || 0).toLocaleString('en-IN')}` : placeholderText,
    x + w - 2,
    footY,
    { align: 'right' }
  );

  curY += footH;
  doc.setDrawColor(0, 0, 0);
  doc.line(x, curY, x + w, curY);

  // Draw Vertical Column Grid Lines for Goods Table
  doc.setDrawColor(200, 200, 200);
  doc.line(xPack, tableStartY, xPack, curY);
  doc.line(xQty, tableStartY, xQty, curY);
  doc.line(xActWt, tableStartY, xActWt, curY);
  doc.line(xChgWt, tableStartY, xChgWt, curY);
  doc.line(xFreight, tableStartY, xFreight, curY);
  doc.setDrawColor(0, 0, 0);

  // -------------------------------------------------------------
  // 5. BOTTOM SECTION: QR + DETAILED CHARGES + 3 SIGNATURES
  // Exactly fills the remaining height up to y + h with ZERO empty void
  // -------------------------------------------------------------
  const bottomEndY = y + h;

  // 3 Primary Columns:
  // Column 1: QR & Payment Info (Width: 54mm)
  // Column 2: Charges Breakdown & Grand Total (Width: 72mm)
  // Column 3: 3 Signatures & Authorized Seal (Width: 68mm)
  const col1W = isFullPage ? 60 : 54;
  const col2W = isFullPage ? 75 : 72;

  const divX1 = x + col1W;
  const divX2 = divX1 + col2W;

  // Vertical Column Dividers
  doc.line(divX1, curY, divX1, bottomEndY);
  doc.line(divX2, curY, divX2, bottomEndY);

  // --- COLUMN 1: PHONEPE QR & PAYMENT INFO (100% READABLE & ENLARGED) ---
  const bannerY = curY + (isFullPage ? 1.5 : 1);
  const bannerH = isFullPage ? 4.5 : 3.2;

  // PhonePe Purple Header Pill
  doc.setFillColor(243, 232, 255); // #f3e8ff
  doc.setDrawColor(216, 180, 254); // #d8b4fe
  doc.setLineWidth(0.15);
  doc.roundedRect(x + 1.5, bannerY, col1W - 3, bannerH, 0.8, 0.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 7 : 5.2);
  doc.setTextColor(95, 37, 159); // PhonePe Purple
  doc.text('PhonePe  ACCEPTED HERE', x + col1W / 2, bannerY + (isFullPage ? 3.1 : 2.2), { align: 'center' });

  // Pure 1:1 Square QR Code (Undistorted, High Contrast, Scannable - Enlarged)
  const qrSize = isFullPage ? 28 : 20.5;
  const qrX = x + 1.5;
  const qrY = bannerY + bannerH + 1.2;

  doc.setDrawColor(15, 23, 42); // Crisp border
  doc.setLineWidth(0.2);
  doc.rect(qrX, qrY, qrSize, qrSize);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX + 0.3, qrY + 0.3, qrSize - 0.6, qrSize - 0.6);
    } catch {
      doc.setFontSize(5);
      doc.setTextColor(120, 120, 120);
      doc.text('QR CODE', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }
  }

  // QR Details Beside Code
  const qrTextX = qrX + qrSize + 2;
  let qTxtY = qrY + (isFullPage ? 4.5 : 2.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 7.5 : 5.8);
  doc.setTextColor(95, 37, 159); // PhonePe Purple
  doc.text('Scan & Pay Freight', qrTextX, qTxtY);

  qTxtY += isFullPage ? 4 : 2.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 7 : 5.2);
  doc.setTextColor(15, 23, 42);
  doc.text('SHREE SWAMI SAMARTH', qrTextX, qTxtY);

  qTxtY += isFullPage ? 3.5 : 2.6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 6.5 : 5);
  doc.setTextColor(88, 28, 135);
  doc.text(company.upiId || 'shreeswamisamarth@ybl', qrTextX, qTxtY);

  qTxtY += isFullPage ? 3.5 : 2.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 6 : 4.6);
  doc.setTextColor(22, 163, 74); // Green
  doc.text('PhonePe • GPay • Paytm', qrTextX, qTxtY);

  // Carriage conditions in Column 1 bottom
  const condStartY = qrY + qrSize + 1.2;
  doc.setDrawColor(226, 232, 240);
  doc.line(x, condStartY, divX1, condStartY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isFullPage ? 5.8 : 4.4);
  doc.setTextColor(71, 85, 105);
  doc.text('Conditions: Goods carried at Owner\'s risk. Subject to Pune jurisdiction.', x + 1.5, condStartY + 2.2);

  // --- COLUMN 2: CHARGES TABLE & GRAND TOTAL ---
  let cY = curY + (isFullPage ? 4 : 3);
  doc.setFontSize(isFullPage ? 7.5 : 5.8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');

  // Row 1
  doc.text('Freight Charges:', divX1 + 2, cY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    showAmount ? `Rs. ${(lr.charges?.freight || lr.totalFreight || 0).toLocaleString('en-IN')}` : placeholderText,
    divX1 + 34,
    cY,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Handling:', divX1 + 38, cY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    showAmount ? `Rs. ${(lr.charges?.handling || 0).toLocaleString('en-IN')}` : placeholderText,
    divX2 - 2,
    cY,
    { align: 'right' }
  );

  // Row 2
  cY += isFullPage ? 4 : 3;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Door / Other:', divX1 + 2, cY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const otherSum = (lr.charges?.doorDelivery || 0) + (lr.charges?.otherCharges || 0);
  doc.text(
    showAmount ? `Rs. ${otherSum.toLocaleString('en-IN')}` : placeholderText,
    divX1 + 34,
    cY,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('GST:', divX1 + 38, cY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    showAmount ? `Rs. ${(lr.charges?.gstTax || 0).toLocaleString('en-IN')}` : placeholderText,
    divX2 - 2,
    cY,
    { align: 'right' }
  );

  // Divider before Total Box
  cY += isFullPage ? 3 : 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(divX1, cY, divX2, cY);

  // Highlighted Grand Total Box
  cY += 1;
  const totBoxH = isFullPage ? 8 : 6.5;
  const totBoxW = col2W - 4;

  if (showAmount) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.3);
    doc.rect(divX1 + 2, cY, totBoxW, totBoxH, 'FD');

    const grandTotal = lr.charges?.grandTotal || lr.totalFreight || 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFullPage ? 9.5 : 7.5);
    doc.setTextColor(220, 38, 38);
    doc.text('TOTAL AMOUNT:', divX1 + 4, cY + (isFullPage ? 5.2 : 4.4));
    doc.setFontSize(isFullPage ? 11 : 9);
    doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, divX2 - 4, cY + (isFullPage ? 5.2 : 4.4), {
      align: 'right',
    });
  } else if (isTBB) {
    // TBB Box (Blue themed, boldly stating TBB without amount numbers)
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.3);
    doc.rect(divX1 + 2, cY, totBoxW, totBoxH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFullPage ? 9.5 : 7.5);
    doc.setTextColor(29, 78, 216);
    doc.text('TOTAL AMOUNT:', divX1 + 4, cY + (isFullPage ? 5.2 : 4.4));
    doc.setFontSize(isFullPage ? 12 : 9.5);
    doc.text('TBB', divX2 - 4, cY + (isFullPage ? 5.2 : 4.4), {
      align: 'right',
    });
  } else {
    // PAID Non-Driver Copy (Emerald themed, stating PAID without numbers)
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.3);
    doc.rect(divX1 + 2, cY, totBoxW, totBoxH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFullPage ? 9.5 : 7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('TOTAL AMOUNT:', divX1 + 4, cY + (isFullPage ? 5.2 : 4.4));
    doc.setFontSize(isFullPage ? 12 : 9.5);
    doc.text('PAID', divX2 - 4, cY + (isFullPage ? 5.2 : 4.4), {
      align: 'right',
    });
  }

  // Meta lines under Total Box
  cY += totBoxH + (isFullPage ? 3.5 : 2.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 6.5 : 5.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Payment Status: ${lr.paymentMode || 'PAID'} (${lr.deliveryType || 'DOOR'})`,
    divX1 + 2,
    cY
  );

  cY += isFullPage ? 3 : 2.4;
  doc.text(
    `E-Way Bill: ${lr.eWayBillNo || 'NOT APPLICABLE'}`,
    divX1 + 2,
    cY
  );

  cY += isFullPage ? 3 : 2.4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(isFullPage ? 5.5 : 4.6);
  doc.setTextColor(100, 116, 139);
  doc.text('Tax payable under RCM / Forward Charge (Transport Service)', divX1 + 2, cY);

  // --- COLUMN 3: 3 SIGNATURES & AUTHORIZED STAMP ---
  const sigColW = (w - (divX2 - x)) / 3;

  // Header Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(isFullPage ? 6.5 : 4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Received in good order & condition', (divX2 + x + w) / 2, curY + 3, {
    align: 'center',
  });

  // Signature Dotted Lines
  const sigLineY = bottomEndY - (isFullPage ? 8 : 6);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  // Consignor Sig Line
  doc.line(divX2 + 2, sigLineY, divX2 + sigColW - 2, sigLineY);
  // Driver Sig Line
  const sig2X = divX2 + sigColW;
  doc.line(sig2X + 2, sigLineY, sig2X + sigColW - 2, sigLineY);
  // Swami Samarth Sig Line
  const sig3X = sig2X + sigColW;
  doc.line(sig3X + 2, sigLineY, x + w - 2, sigLineY);

  // Signature Labels
  const sigTextY = sigLineY + (isFullPage ? 3.5 : 2.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 7 : 5.4);
  doc.setTextColor(71, 85, 105);

  doc.text('Consignor Sign', divX2 + sigColW / 2, sigTextY, { align: 'center' });
  doc.text('Driver Sign', sig2X + sigColW / 2, sigTextY, { align: 'center' });

  // Swami Samarth Auth Sign
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('Swami Samarth', (sig3X + x + w) / 2, sigTextY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isFullPage ? 5.8 : 4.6);
  doc.setTextColor(100, 116, 139);
  doc.text('(Auth. Signatory)', (sig3X + x + w) / 2, sigTextY + (isFullPage ? 2.8 : 2.2), {
    align: 'center',
  });
}
