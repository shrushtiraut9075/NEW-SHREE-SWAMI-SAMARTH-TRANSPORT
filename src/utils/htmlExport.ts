import { LRRecord, CompanyProfile } from '../types';

/**
 * Generates a complete, self-contained standalone HTML document for any LR
 * with print-ready styles, company branding, PhonePe UPI QR code, terms, and POD status.
 */
export function generateLRHtml(lr: LRRecord, company: CompanyProfile, copyType: 'CONSIGNOR' | 'CONSIGNEE' | 'DRIVER' = 'CONSIGNOR'): string {
  const isTBB = lr.paymentMode === 'TBB';
  const isPaid = lr.paymentMode === 'PAID';
  const isDriverCopy = copyType === 'DRIVER';
  // Rule 2: On PAID LR, only driver copy shows amount.
  // Rule 3: On TBB LR, amount never appears; instead show 'TBB'.
  const showAmount = !isTBB && (!isPaid || isDriverCopy);
  const placeholderText = isTBB ? 'TBB' : 'PAID';

  const qrImgTag = `
    <div style="width: 140px; height: 140px; margin: 4px auto; background: #fff; padding: 3px; border: 2px solid #5f259f; border-radius: 10px;">
      <img src="${company.phonePeQrUrl || '/phonepe_qr_code.png'}" alt="PhonePe QR Code" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='/phonepe_qr_code.png'" />
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LR Consignment Note - ${lr.lrNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .no-print {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      border-radius: 12px;
    }
    .btn {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn:hover { background: #fbbf24; }
    .btn-secondary {
      background: #334155;
      color: #fff;
    }
    .btn-secondary:hover { background: #475569; }

    .a4-container {
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #0f172a;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      padding: 16px;
    }

    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 8px;
    }
    .logo-cell {
      width: 75px;
      text-align: center;
      vertical-align: middle;
      padding: 4px;
    }
    .logo-box {
      width: 85px;
      height: 85px;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin: auto;
    }
    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .title-cell {
      text-align: center;
      padding: 4px 8px;
      vertical-align: middle;
    }
    .title-main {
      font-size: 24px;
      font-weight: 900;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-sub {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      margin-top: 2px;
    }
    .title-addr {
      font-size: 10px;
      color: #334155;
      margin-top: 2px;
    }
    .title-contact {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .lr-badge-cell {
      width: 160px;
      text-align: right;
      vertical-align: middle;
      padding: 4px;
    }
    .lr-badge-box {
      border: 2px solid #0f172a;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      text-align: center;
    }
    .lr-badge-num {
      font-size: 13px;
      font-weight: 900;
      color: #1d4ed8;
      font-family: monospace;
    }
    .lr-badge-copy {
      font-size: 9px;
      font-weight: 800;
      background: #1e293b;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 4px;
      text-transform: uppercase;
    }

    /* Info Bar */
    .info-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      font-size: 11px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    /* Parties Section */
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border: 1px solid #94a3b8;
    }
    .parties-table th {
      background: #1e293b;
      color: #fff;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      text-align: left;
    }
    .parties-table td {
      padding: 6px 8px;
      vertical-align: top;
      width: 50%;
      border: 1px solid #cbd5e1;
      font-size: 11px;
    }
    .party-name {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }

    /* Cargo Table */
    .goods-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border: 1px solid #94a3b8;
    }
    .goods-table th {
      background: #0f172a;
      color: #fff;
      padding: 5px 6px;
      font-size: 10px;
      text-transform: uppercase;
      border: 1px solid #334155;
    }
    .goods-table td {
      padding: 6px;
      border: 1px solid #cbd5e1;
      font-size: 11px;
    }

    /* Bottom Grid: Charges, PhonePe, Signatures */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .card {
      border: 1px solid #cbd5e1;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }

    .charges-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .charges-table td {
      padding: 2px 0;
    }
    .charges-table .total-row td {
      border-top: 2px solid #0f172a;
      font-size: 13px;
      font-weight: 900;
      color: #047857;
      padding-top: 4px;
    }

    .phonepe-box {
      border: 1.5px solid #5f259f;
      border-radius: 8px;
      text-align: center;
      padding: 6px;
      background: #faf5ff;
    }
    .phonepe-header {
      background: #5f259f;
      color: #fff;
      font-size: 9px;
      font-weight: 900;
      padding: 2px 4px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    /* Tracking & POD Status Badge Box */
    .tracking-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .terms-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 6px 8px;
      font-size: 9px;
      color: #475569;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .signatures-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      text-align: center;
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
    }
    .sign-line {
      margin-top: 24px;
      border-top: 1px solid #64748b;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      .a4-container { box-shadow: none; border: 1.5px solid #000; padding: 12px; }
      @page { size: A4 portrait; margin: 8mm; }
    }
  </style>
</head>
<body>

  <!-- Top toolbar (not printed) -->
  <div class="no-print">
    <div>
      <div style="font-weight: 900; font-size: 14px; color: #f59e0b;">
        NEW SHREE SWAMI SAMARTH TRANSPORT • LR DOCUMENT (HTML)
      </div>
      <div style="font-size: 11px; color: #94a3b8;">
        Consignment No: <strong>${lr.lrNumber}</strong> • Booking Date: <strong>${lr.bookingDate}</strong>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.history.back()">
        ← Go Back
      </button>
    </div>
  </div>

  <!-- A4 Single Sheet Consignment Note -->
  <div class="a4-container">
    
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          <div class="logo-box">
            <img src="${company.logoUrl || '/company_logo.jpg'}" alt="Logo" onerror="this.src='/company_logo.jpg'">
          </div>
        </td>
        <td class="title-cell">
          <div class="title-main">${company.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT'}</div>
          <div class="title-sub">${company.tagline || 'RELIABLE | SAFE | TIMELY LOGISTICS'} • ${company.subTagline || 'CHAKAN • PUNE'}</div>
          <div class="title-addr">${company.address}${company.pincode ? ' - ' + company.pincode : ''}</div>
          <div class="title-contact">
            📞 Phone: ${company.mobile || company.phone || '9881898635'} | 🏢 GSTIN: <strong>${company.gstin}</strong> | PAN: <strong>${company.pan}</strong>
          </div>
        </td>
        <td class="lr-badge-cell">
          <div class="lr-badge-box">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">CONSIGNMENT NOTE</div>
            <div class="lr-badge-num">${lr.lrNumber}</div>
            <div class="lr-badge-copy">CONSIGNOR COPY</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Quick Info Bar -->
    <div class="info-bar">
      <div>Booking Date: <strong>${lr.bookingDate}</strong></div>
      <div>Origin Hub: <strong>${lr.branchCode} (${lr.branchName || 'CHAKAN'})</strong></div>
      <div>Payment Mode: <strong style="color: #047857;">${lr.paymentMode}</strong></div>
      <div>Delivery Type: <strong>${lr.deliveryType}</strong></div>
    </div>

    <!-- Route and Vehicle Details -->
    <div class="info-bar" style="background: #faf5ff; border-color: #d8b4fe; margin-top: -4px;">
      <div>From: <strong>${lr.fromLocation}</strong></div>
      <div>To: <strong style="color: #6b21a8;">${lr.toLocation}</strong></div>
      <div>Vehicle No: <strong style="font-family: monospace;">${lr.vehicleNumber || 'MH-14 (Scheduled)'}</strong></div>
      <div>Driver: <strong>${lr.driverName || 'Assigned'}</strong> ${lr.driverMobile ? `(${lr.driverMobile})` : ''}</div>
    </div>

    <!-- Parties Involved -->
    <table class="parties-table">
      <thead>
        <tr>
          <th>CONSIGNOR (माल पाठविणारा - प्रेक्षक)</th>
          <th>CONSIGNEE (माल स्वीकारणारा - प्राप्तकर्ता)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="party-name">${lr.consignorName}</div>
            <div style="color: #475569; margin-top: 2px;">${lr.consignorAddress}</div>
            <div style="margin-top: 4px;">GSTIN: <strong style="font-family: monospace;">${lr.consignorGstin || 'URP'}</strong></div>
            ${lr.consignorMobile ? `<div>Mobile: <strong>${lr.consignorMobile}</strong></div>` : ''}
          </td>
          <td>
            <div class="party-name">${lr.consigneeName}</div>
            <div style="color: #475569; margin-top: 2px;">${lr.consigneeAddress}</div>
            <div style="margin-top: 4px;">GSTIN: <strong style="font-family: monospace;">${lr.consigneeGstin || 'URP'}</strong></div>
            ${lr.consigneeMobile ? `<div>Mobile: <strong>${lr.consigneeMobile}</strong></div>` : ''}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Goods Cargo Table -->
    <table class="goods-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">Sr</th>
          <th>Description of Goods (मालाचा तपशील)</th>
          <th style="width: 80px; text-align: center;">Packing</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          <th style="width: 80px; text-align: right;">Actual Wt</th>
          <th style="width: 80px; text-align: right;">Charge Wt</th>
          <th style="width: 60px; text-align: right;">Rate (₹)</th>
          <th style="width: 80px; text-align: right;">Freight (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${lr.items.map((item, idx) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a;">${item.description}</td>
            <td style="text-align: center;">${item.packingType}</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">${item.quantity}</td>
            <td style="text-align: right; font-family: monospace;">${item.actualWeight} Kg</td>
            <td style="text-align: right; font-family: monospace;">${item.chargeWeight} Kg</td>
            <td style="text-align: right; font-family: monospace;">${showAmount ? `₹${item.ratePerKg}` : (isTBB ? 'TBB' : '—')}</td>
            <td style="text-align: right; font-weight: 900; font-family: monospace;">${showAmount ? `₹${item.freight.toLocaleString('en-IN')}` : placeholderText}</td>
          </tr>
        `).join('')}
        <tr style="background: #f8fafc; font-weight: 900;">
          <td colspan="3" style="text-align: right; text-transform: uppercase;">Total:</td>
          <td style="text-align: center; font-family: monospace;">${lr.totalQuantity}</td>
          <td style="text-align: right; font-family: monospace;">${lr.totalActualWeight} Kg</td>
          <td style="text-align: right; font-family: monospace;">${lr.totalChargeWeight} Kg</td>
          <td></td>
          <td style="text-align: right; font-family: monospace; color: #1e3a8a;">${showAmount ? `₹${lr.totalFreight.toLocaleString('en-IN')}` : placeholderText}</td>
        </tr>
      </tbody>
    </table>

    <!-- Live Tracking & POD Status Bar -->
    <div class="tracking-box">
      <div>
        <span style="font-weight: 900; color: #166534; text-transform: uppercase;">🚚 MOVEMENT STATUS:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${lr.status}</strong>
        ${lr.currentLocation ? `<span style="color: #64748b; margin-left: 6px;">(Location: ${lr.currentLocation})</span>` : ''}
      </div>
      <div>
        <span style="font-weight: 900; color: #166534; text-transform: uppercase;">📄 POD STATUS:</span>
        <strong style="margin-left: 4px; padding: 2px 6px; border-radius: 4px; ${lr.podStatus === 'UPLOADED' || lr.podStatus === 'VERIFIED' ? 'background:#bbf7d0;color:#14532d;' : 'background:#fef08a;color:#713f12;'}">
          ${lr.podStatus === 'UPLOADED' ? 'POD UPLOADED (पावती प्राप्त)' : lr.podStatus === 'VERIFIED' ? 'POD VERIFIED (पडताळणी पूर्ण)' : 'POD PENDING (पावती बाकी)'}
        </strong>
        ${lr.podDetails ? `<span style="color: #334155; margin-left: 6px;">(Delivered to: <strong>${lr.podDetails.receivedBy}</strong>)</span>` : ''}
      </div>
    </div>

    <!-- Bottom Grid -->
    <div class="bottom-grid">
      <!-- 1. Freight & Charges -->
      <div class="card">
        <div class="card-title">FREIGHT & CHARGES BREAKDOWN</div>
        <table class="charges-table">
          <tr>
            <td>Base Freight:</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${showAmount ? `₹${(lr.charges?.freight || 0).toLocaleString('en-IN')}` : placeholderText}</td>
          </tr>
          ${lr.charges?.vasuli ? `<tr><td>Vasuli / Collection:</td><td style="text-align:right; font-family:monospace;">${showAmount ? `₹${lr.charges.vasuli}` : placeholderText}</td></tr>` : ''}
          ${lr.charges?.handling ? `<tr><td>Handling / Hamali:</td><td style="text-align:right; font-family:monospace;">${showAmount ? `₹${lr.charges.handling}` : placeholderText}</td></tr>` : ''}
          ${lr.charges?.doorDelivery ? `<tr><td>Door Delivery Charges:</td><td style="text-align:right; font-family:monospace;">${showAmount ? `₹${lr.charges.doorDelivery}` : placeholderText}</td></tr>` : ''}
          ${lr.charges?.otherCharges ? `<tr><td>Statistical / Other:</td><td style="text-align:right; font-family:monospace;">${showAmount ? `₹${lr.charges.otherCharges}` : placeholderText}</td></tr>` : ''}
          <tr>
            <td>GST / Service Tax (5%):</td>
            <td style="text-align: right; font-family: monospace;">${showAmount ? `+₹${(lr.charges?.gstTax || 0).toLocaleString('en-IN')}` : placeholderText}</td>
          </tr>
          <tr class="total-row" style="${isTBB ? 'background:#dbeafe;color:#1e40af;' : !showAmount ? 'background:#d1fae5;color:#065f46;' : ''}">
            <td>TOTAL AMOUNT:</td>
            <td style="text-align: right; font-family: monospace; font-size: ${showAmount ? '13px' : '15px'}; font-weight: 900;">${showAmount ? `₹${(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}` : placeholderText}</td>
          </tr>
        </table>
      </div>

      <!-- 2. PhonePe Scan & Pay -->
      <div class="phonepe-box">
        <div class="phonepe-header">ACCEPTED HERE • PHONEPE UPI</div>
        ${qrImgTag}
        <div style="font-size: 10px; font-weight: 900; color: #5f259f; margin-top: 4px;">
          SCAN TO PAY FREIGHT
        </div>
        <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #1e1b4b;">
          ${company.upiId || 'shreeswamisamarth@ybl'}
        </div>
      </div>

      <!-- 3. Bank & Remarks -->
      <div class="card">
        <div class="card-title">BANK RTGS / NEFT DETAILS</div>
        <div style="font-size: 10px; line-height: 1.5; color: #334155;">
          <div>Bank: <strong>${company.bankDetails?.bankName || 'State Bank of India'}</strong></div>
          <div>A/C No: <strong style="font-family: monospace;">${company.bankDetails?.accountNo || '38901245678'}</strong></div>
          <div>IFSC: <strong style="font-family: monospace;">${company.bankDetails?.ifsc || 'SBIN0012054'}</strong></div>
          <div>Branch: <strong>${company.bankDetails?.branch || 'Chakan MIDC'}</strong></div>
          ${lr.eWayBillNo ? `<div style="margin-top: 4px; padding-top: 2px; border-top: 1px solid #e2e8f0;">E-Way Bill: <strong style="font-family: monospace;">${lr.eWayBillNo}</strong></div>` : ''}
        </div>
      </div>
    </div>

    <!-- Terms & Conditions -->
    <div class="terms-box">
      <strong>नियम व अटी (Terms & Conditions):</strong> 1. The consignment is carried entirely at Owner's risk unless specifically insured. 2. The transporter is not responsible for leakage, breakage, or damage in transit. 3. Demurrage @ ₹300 per day charged if goods not taken within 3 days of arrival. 4. Subject to Pune jurisdiction only.
    </div>

    <!-- Signatures -->
    <div class="signatures-row">
      <div>
        <div class="sign-line">Consignor Signature / Stamp</div>
      </div>
      <div>
        <div class="sign-line">Receiver Signature & Date (POD)</div>
      </div>
      <div>
        <div class="sign-line">For ${company.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT'}</div>
      </div>
    </div>

  </div>

</body>
</html>`;
}

/**
 * Triggers a browser download of the standalone HTML file
 */
export function downloadLRHtmlFile(lr: LRRecord, company: CompanyProfile): void {
  const htmlContent = generateLRHtml(lr, company);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LR-${lr.lrNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
