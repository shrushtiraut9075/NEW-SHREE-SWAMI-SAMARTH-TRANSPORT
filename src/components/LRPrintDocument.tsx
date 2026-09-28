import React, { useState, useEffect } from 'react';
import {
  Printer,
  ArrowLeft,
  Layers,
  FileText,
  CheckCircle2,
  Scissors,
  FileDown,
  Loader2,
  Check,
  Download,
  QrCode,
  X,
  FileCode,
  Edit,
} from 'lucide-react';
import { LRRecord, CompanyProfile, User } from '../types';
import { exportElementToPdf } from '../services/pdfExport';
import { generateDirectLRPdf } from '../services/directLrPdf';
import { downloadLRHtmlFile } from '../utils/htmlExport';
import { generateUpiQrDataUrl } from '../utils/qrHelper';

interface LRPrintDocumentProps {
  lr?: LRRecord;
  lrs?: LRRecord[];
  companyProfile: CompanyProfile;
  currentUser?: User;
  onEdit?: (lr: LRRecord) => void;
  onBack: () => void;
  autoPrint?: boolean;
}

type PrintLayoutMode = '3_ON_1_A4' | 'FULL_PAGE' | 'SINGLE_COPY';
type SingleCopyType = 'CONSIGNOR' | 'CONSIGNEE' | 'DRIVER';

export const LRPrintDocument: React.FC<LRPrintDocumentProps> = ({
  lr,
  lrs,
  companyProfile,
  currentUser,
  onEdit,
  onBack,
  autoPrint = false,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
  // Determine if printing 3 distinct LRs or 3 copies of 1 LR
  const activeLRs: LRRecord[] = lrs && lrs.length > 0 ? lrs : lr ? [lr] : [];
  const isMultiDistinct = activeLRs.length > 1;
  const primaryLR = activeLRs[0];

  // Primary Default: '3_ON_1_A4' as explicitly requested!
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('3_ON_1_A4');
  const [singleCopy, setSingleCopy] = useState<SingleCopyType>('CONSIGNOR');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('/phonepe_qr_code.png');

  // Generate verified scannable UPI QR code (strictly follows NPCI and avoids invalid QR)
  useEffect(() => {
    let isSubscribed = true;
    if (companyProfile.phonePeQrUrl && companyProfile.phonePeQrUrl.startsWith('data:image')) {
      setDynamicQrUrl(companyProfile.phonePeQrUrl);
      return;
    }
    const upiTarget = companyProfile.upiId?.trim() || 'shreeswamisamarth@ybl';
    generateUpiQrDataUrl({
      upiId: upiTarget,
      payeeName: companyProfile.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT',
      amount: primaryLR?.paymentMode === 'TO PAY' ? (primaryLR.charges?.grandTotal || primaryLR.totalFreight) : undefined,
      transactionNote: primaryLR ? `Freight LR ${primaryLR.lrNumber}` : 'Transport Freight',
      width: 600,
      margin: 1,
    }).then((url) => {
      if (isSubscribed && url) {
        setDynamicQrUrl(url);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, [companyProfile.upiId, companyProfile.name, companyProfile.phonePeQrUrl, primaryLR?.lrNumber, primaryLR?.paymentMode, primaryLR?.charges?.grandTotal]);

  // Automatically trigger browser print dialog if autoPrint is requested (e.g. from Save & Print action)
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleDirectDownload = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfNotice('PDF फाईल तयार करत आहे (लोगो व अलाइनमेंट जोडत आहे)...');

    try {
      const ok = await generateDirectLRPdf(
        activeLRs,
        companyProfile,
        layoutMode === '3_ON_1_A4' ? '3_ON_1_A4' : 'FULL_PAGE'
      );

      if (ok) {
        setPdfNotice(
          `✅ PDF यशस्वीरित्या डाऊनलोड झाली! कंपनी लोगो व संपूर्ण अलाइनमेंट व्यवस्थित सेव्ह झाले असून फाईल 'Downloads' फोल्डरमध्ये सेव्ह झाली आहे (Ctrl + J दाबा).`
        );
        setTimeout(() => setPdfNotice(null), 8000);
      } else {
        // Fallback to browser print/save-as-pdf
        setPdfNotice('सिस्टम प्रिंट डायलॉग उघडत आहे (Save as PDF निवडा)...');
        setTimeout(() => {
          setPdfNotice(null);
          window.print();
        }, 800);
      }
    } catch (err) {
      console.error('Direct PDF error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveAsPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfNotice('A4 PDF फाईल तयार करत आहे...');

    try {
      const filename = isMultiDistinct
        ? `LR_Batch_${activeLRs.slice(0, 3).map((l) => l.lrNumber).join('_')}_A4.pdf`
        : `LR_${primaryLR.lrNumber}_${layoutMode === '3_ON_1_A4' ? '3in1' : 'FullPage'}_A4.pdf`;

      const success = await exportElementToPdf('printable-lr-container', {
        filename,
        orientation: 'portrait',
        format: 'a4',
        marginMm: 3,
        quality: 0.98,
      });

      if (success) {
        setPdfNotice(
          `✅ PDF डाऊनलोड झाली! ही फाईल तुमच्या कॉम्प्युटरच्या 'Downloads' फोल्डरमध्ये सेव्ह झाली आहे: ${filename} (Ctrl + J दाबा)`
        );
        setTimeout(() => setPdfNotice(null), 8000);
      } else {
        setPdfNotice(null);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfNotice('सिस्टम प्रिंट डायलॉग उघडत आहे (Save as PDF निवडा)...');
      setTimeout(() => {
        setPdfNotice(null);
        window.print();
      }, 800);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!primaryLR) return;
    downloadLRHtmlFile(primaryLR, companyProfile);
    setPdfNotice(
      `✅ HTML फाईल यशस्वीरित्या डाऊनलोड झाली (LR-${primaryLR.lrNumber}.html)! तुम्ही ही फाईल कोणत्याही ब्राऊझर, मोबाईल किंवा कॉम्प्युटरवर उघडू शकता.`
    );
    setTimeout(() => setPdfNotice(null), 8000);
  };

  if (!primaryLR) {
    return (
      <div className="p-8 text-center text-slate-600 bg-white rounded-xl border border-slate-200">
        <p className="font-bold text-sm">No consignment selected for printing.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
        >
          Return to Register
        </button>
      </div>
    );
  }

  // 1/3-Page Slip Sub-Component
  const renderSlip = (
    itemLR: LRRecord,
    copyTitle: string,
    keySuffix: string | number,
    slipNumber?: number
  ) => {
    const isTBB = itemLR.paymentMode === 'TBB';
    const isPaid = itemLR.paymentMode === 'PAID';
    const isDriverCopy = copyTitle.toUpperCase().includes('DRIVER');
    // Rule 2: On PAID LR, only Driver Copy has amount. Consignor & Consignee copies hide amount.
    // Rule 3: On TBB LR, amount never appears. In place of amount it says TBB.
    const showAmount = !isTBB && (!isPaid || isDriverCopy);
    const placeholderText = isTBB ? 'TBB' : isPaid ? 'PAID' : '—';

    return (
      <div
        key={`${itemLR.id}-${keySuffix}`}
        className="slip-1third h-[89mm] max-h-[89mm] overflow-hidden border-2 border-black p-1.5 flex flex-col justify-between text-black text-[8px] leading-tight bg-white relative box-border"
      >
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
          <img
            src={companyProfile.logoUrl || '/company_logo.jpg'}
            alt=""
            className="w-36 h-36 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* TOP ROW: LOGO + COMPANY DETAILS + BADGE & LR NUMBER */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-1 relative z-10">
          {/* Logo (Crisp, High-Resolution Dedicated Box - Enlarged as requested) */}
          <div className="w-[22mm] h-[22mm] min-w-[22mm] min-h-[22mm] flex-shrink-0 p-0.5 flex items-center justify-center border-2 border-slate-700 rounded bg-white shadow-2xs">
            <img
              src={companyProfile.logoUrl || '/company_logo.jpg'}
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Company Details with FULL BOLD RED TITLE & ENLARGED SIZE */}
          <div className="text-center flex-1 px-1 min-w-0">
            <h1
              className="text-[20px] sm:text-[22px] font-black tracking-wide text-red-600 uppercase leading-none pb-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                color: '#DC2626',
                letterSpacing: '0.03em',
                fontWeight: 900,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {companyProfile.name}
            </h1>
            <p className="text-[8px] font-extrabold text-slate-800 uppercase tracking-wider mt-0.5 truncate">
              {companyProfile.tagline} • {companyProfile.subTagline || 'CHAKAN, PUNE'}
            </p>
            <p className="text-[7.5px] text-slate-700 font-semibold max-w-[140mm] mx-auto leading-tight mt-0.5 truncate">
              {companyProfile.address}{companyProfile.pincode && !companyProfile.address.includes(companyProfile.pincode) ? ` - ${companyProfile.pincode}` : ''}
            </p>
            <div className="text-[7.5px] font-mono font-bold text-slate-900 flex items-center justify-center gap-2 mt-0.5">
              <span>
                <strong>GSTIN:</strong> {companyProfile.gstin}
              </span>
              <span>•</span>
              <span>
                <strong>PAN:</strong> {companyProfile.pan}
              </span>
              <span>•</span>
              <span>
                <strong>Mob:</strong> {companyProfile.mobile || companyProfile.phone || '9881898635'}
              </span>
            </div>
          </div>

          {/* Right Meta Box */}
          <div className="text-right flex-shrink-0 w-[36mm] min-w-[36mm]">
            <div className="border border-black px-1.5 py-0.5 font-black text-[7.5px] uppercase tracking-wider bg-slate-100 text-center shadow-2xs">
              [ {copyTitle} ]
            </div>
            <div className="font-mono text-[11px] font-black text-blue-950 mt-0.5 text-right tracking-tight">
              {itemLR.lrNumber}
            </div>
            <div className="text-[7px] text-slate-700 flex items-center justify-end gap-1 mt-0.5 font-medium whitespace-nowrap">
              <span>Date: <strong>{itemLR.bookingDate}</strong></span>
              <span>| Hub: <strong className="font-mono font-bold">{itemLR.branchCode}</strong></span>
            </div>
          </div>
        </div>

        {/* ROUTE & VEHICLE BAR */}
        <div className="grid grid-cols-4 border-b border-black text-[7.5px] bg-slate-50/80 py-0.5 px-1 relative z-10">
          <div className="border-r border-black pr-1 truncate">
            <span className="text-slate-500">From: </span>
            <strong className="text-slate-950 uppercase">{itemLR.fromLocation}</strong>
          </div>
          <div className="border-r border-black px-1 truncate">
            <span className="text-slate-500">To: </span>
            <strong className="text-slate-950 uppercase">{itemLR.toLocation}</strong>
          </div>
          <div className="border-r border-black px-1 truncate">
            <span className="text-slate-500">Vehicle: </span>
            <strong className="font-mono text-slate-950 font-black">
              {itemLR.vehicleNumber || 'DIRECT'}
            </strong>
          </div>
          <div className="pl-1 truncate text-right">
            <span className="text-slate-500">Payment: </span>
            <strong className="font-black text-[8px] uppercase text-blue-900">
              {itemLR.paymentMode} ({itemLR.deliveryType})
            </strong>
          </div>
        </div>

        {/* CONSIGNOR & CONSIGNEE DETAILS */}
        <div className="grid grid-cols-2 border-b border-black text-[7.5px] py-1 px-1 relative z-10">
          <div className="border-r border-black pr-2 space-y-0.5">
            <div className="font-bold text-[7px] uppercase tracking-wider text-slate-600">
              CONSIGNOR (SENDER)
            </div>
            <div className="font-black text-[8.5px] text-slate-950 uppercase truncate">
              {itemLR.consignorName}
            </div>
            <div className="text-slate-700 truncate leading-none">
              {itemLR.consignorAddress || 'On record at booking office'}
            </div>
            <div className="font-mono text-[7px] text-slate-900">
              <strong>GSTIN:</strong> {itemLR.consignorGstin || 'UR / UNREGISTERED'}{' '}
              {itemLR.consignorMobile && `• Ph: ${itemLR.consignorMobile}`}
            </div>
          </div>

          <div className="pl-2 space-y-0.5">
            <div className="font-bold text-[7px] uppercase tracking-wider text-slate-600">
              CONSIGNEE (RECEIVER)
            </div>
            <div className="font-black text-[8.5px] text-slate-950 uppercase truncate">
              {itemLR.consigneeName}
            </div>
            <div className="text-slate-700 truncate leading-none">
              {itemLR.consigneeAddress || 'On record at destination branch'}
            </div>
            <div className="font-mono text-[7px] text-slate-900">
              <strong>GSTIN:</strong> {itemLR.consigneeGstin || 'UR / UNREGISTERED'}{' '}
              {itemLR.consigneeMobile && `• Ph: ${itemLR.consigneeMobile}`}
            </div>
          </div>
        </div>

        {/* GOODS & PACKAGES MINI TABLE */}
        <div className="border-b border-black relative z-10">
          <table className="w-full table-fixed text-left text-[7.5px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-black uppercase text-[6.5px]">
                <th className="py-0.5 px-1 border-r border-black w-[38%] truncate">
                  Package Description & Goods Details
                </th>
                <th className="py-0.5 px-1 border-r border-black text-center w-[12%] truncate">
                  Packing
                </th>
                <th className="py-0.5 px-1 border-r border-black text-center w-[8%] truncate">
                  Qty
                </th>
                <th className="py-0.5 px-1 border-r border-black text-right w-[10%] truncate">
                  Act Wt
                </th>
                <th className="py-0.5 px-1 border-r border-black text-right w-[10%] truncate">
                  Chg Wt
                </th>
                <th className="py-0.5 px-1 border-r border-black text-right w-[10%] truncate">
                  Rate
                </th>
                <th className="py-0.5 px-1 text-right w-[12%] truncate">
                  Freight (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {itemLR.items.slice(0, 2).map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-0.5 px-1 border-r border-black font-semibold truncate">
                    {item.description}
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-center truncate">
                    {item.packingType}
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-center font-mono font-bold truncate">
                    {item.quantity} {item.units}
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-right font-mono truncate">
                    {item.actualWeight} KG
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-right font-mono truncate">
                    {item.chargeWeight} KG
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-right font-mono truncate">
                    {showAmount ? `₹${item.ratePerKg || 0}` : placeholderText}
                  </td>
                  <td className="py-0.5 px-1 text-right font-mono font-bold truncate">
                    {showAmount ? `₹${item.freight.toLocaleString('en-IN')}` : placeholderText}
                  </td>
                </tr>
              ))}
              {itemLR.items.length > 2 && (
                <tr className="border-b border-slate-200 text-slate-600 italic text-[6.5px]">
                  <td colSpan={7} className="py-0.5 px-1 truncate">
                    + {itemLR.items.length - 2} more item(s) included in booking total
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-slate-50 uppercase text-[7px] border-t border-black">
                <td colSpan={2} className="py-0.5 px-1 border-r border-black truncate">
                  Total:
                </td>
                <td className="py-0.5 px-1 border-r border-black text-center font-mono font-black truncate">
                  {itemLR.totalQuantity}
                </td>
                <td className="py-0.5 px-1 border-r border-black text-right font-mono truncate">
                  {itemLR.totalActualWeight} KG
                </td>
                <td className="py-0.5 px-1 border-r border-black text-right font-mono truncate">
                  {itemLR.totalChargeWeight} KG
                </td>
                <td className="py-0.5 px-1 border-r border-black text-right truncate">—</td>
                <td className="py-0.5 px-1 text-right font-mono font-black text-slate-950 truncate">
                  {showAmount ? `₹${itemLR.totalFreight.toLocaleString('en-IN')}` : placeholderText}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOTTOM SECTION: QR CODE + CHARGES + TERMS + 3 SIGNATURES */}
        <div className="grid grid-cols-12 gap-2 items-center py-1 px-1 relative z-10 border-t border-slate-200">
          {/* PhonePe QR + UPI (ENLARGED SCANNER & 100% READABLE) */}
          <div className="col-span-4 flex items-center gap-1.5 border-r border-slate-300 pr-1">
            <div
              onClick={() => setShowStandeeModal(true)}
              title="Click to view full PhonePe QR Standee"
              className="w-[24mm] h-[24mm] min-w-[24mm] min-h-[24mm] p-0.5 bg-white border-2 border-slate-900 rounded flex items-center justify-center flex-shrink-0 shadow-xs relative cursor-pointer hover:border-purple-600 transition"
            >
              <img
                src={dynamicQrUrl}
                alt="PhonePe QR"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#5f259f] text-white text-[7px] font-bold flex items-center justify-center flex-shrink-0">
                  पे
                </span>
                <span className="text-[8px] font-black uppercase text-[#5f259f] tracking-tight truncate">
                  PhonePe
                </span>
              </div>
              <div className="text-[6.5px] font-extrabold uppercase text-[#5f259f] mt-0.5">
                ACCEPTED HERE
              </div>
              <div className="text-[6.5px] font-black uppercase text-slate-950 truncate mt-0.5">
                {companyProfile.name || 'SHREE SWAMI SAMARTH TRANSPORT'}
              </div>
              <div className="text-[6.5px] font-mono font-bold text-purple-900 truncate">
                UPI: {companyProfile.upiId || 'shreeswamisamarth@ybl'}
              </div>
              <div className="text-[5.5px] text-emerald-700 font-bold truncate mt-0.5">
                Scan with PhonePe, GPay, Paytm
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          {showAmount ? (
            <div className="col-span-4 border-r border-slate-300 pr-1.5 text-[7px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Freight: ₹{(itemLR.charges?.freight || 0).toLocaleString('en-IN')}</span>
                <span className="text-slate-600">Handling: ₹{(itemLR.charges?.handling || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Door/Other: ₹{((itemLR.charges?.doorDelivery || 0) + (itemLR.charges?.otherCharges || 0)).toLocaleString('en-IN')}</span>
                <span className="text-slate-600">GST: ₹{(itemLR.charges?.gstTax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-red-50 border border-red-500 px-1 py-0.5 flex justify-between items-center font-black text-[8px] text-red-600 rounded-xs">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono text-[9px] font-black">
                  ₹{(itemLR.charges?.grandTotal || itemLR.totalFreight || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <div className="col-span-4 border-r border-slate-300 pr-1.5 text-[7px] space-y-0.5 flex flex-col justify-between">
              <div className="flex justify-between font-bold text-[7.5px]">
                <span className="text-slate-700">Billing Mode:</span>
                <span className={`font-black ${isTBB ? 'text-blue-900' : 'text-emerald-900'}`}>
                  {isTBB ? 'TBB (TO BE BILLED)' : 'PAID AT BOOKING'}
                </span>
              </div>
              <div className="text-[6.5px] text-slate-500 italic">
                {isTBB ? 'Freight billed directly to client account.' : 'Freight cleared at source. Paid copy.'}
              </div>
              <div className={`px-1.5 py-0.5 flex justify-between items-center font-black text-[8px] rounded-xs border ${
                isTBB ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-emerald-50 border-emerald-600 text-emerald-700'
              }`}>
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono text-[10px] font-black tracking-wider">
                  {placeholderText}
                </span>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="col-span-4 grid grid-cols-3 gap-1 text-[6.5px] text-center pt-1.5">
            <div className="flex flex-col justify-end items-center">
              <div className="border-t border-black w-full pt-0.5 text-slate-700 font-semibold">
                Consignor
              </div>
            </div>
            <div className="flex flex-col justify-end items-center">
              <div className="border-t border-black w-full pt-0.5 text-slate-700 font-semibold">
                Driver
              </div>
            </div>
            <div className="flex flex-col justify-end items-center">
              <div className="border-t border-black w-full pt-0.5 font-bold text-red-600 uppercase leading-none">
                Auth Sign
                <span className="block text-[5.5px] font-normal text-slate-600">
                  Swami Samarth
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Scissor Divider
  const renderCutLine = (index: number) => (
    <div key={`cut-${index}`} className="flex items-center justify-center my-0.5 text-[8px] text-slate-500 font-mono select-none h-[3.5mm] max-h-[3.5mm] overflow-hidden">
      <span className="flex-1 border-b border-dashed border-slate-500"></span>
      <span className="px-2 flex items-center gap-1 bg-white text-slate-600">
        <Scissors className="w-2.5 h-2.5" />
        <span className="uppercase tracking-widest text-[6.5px] font-bold">Cut Along Dotted Line</span>
        <Scissors className="w-2.5 h-2.5" />
      </span>
      <span className="flex-1 border-b border-dashed border-slate-500"></span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* SCREEN CONTROL BAR (HIDDEN DURING PRINT) */}
      <div className="no-print bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="btn-print-back"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black uppercase px-2 py-0.5 rounded">
                A4 Laser Printout
              </span>
              <span className="text-xs text-amber-300 font-semibold">
                {isMultiDistinct
                  ? `3 Selected Consignments on 1 Sheet`
                  : `3 Copies on 1 Sheet (Consignor, Consignee, Driver)`}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-0.5">
              {isMultiDistinct
                ? `LRs: ${activeLRs.map((l) => l.lrNumber).join(', ')}`
                : `LR: ${primaryLR.lrNumber}`}
            </div>
          </div>
        </div>

        {/* Layout Options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <span className="text-[11px] text-slate-400 px-2">Layout:</span>
            <button
              onClick={() => setLayoutMode('3_ON_1_A4')}
              id="btn-layout-3on1"
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                layoutMode === '3_ON_1_A4'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Print 3 LRs on 1 A4 Page"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3 LRs on 1 A4 Page (Standard)</span>
            </button>
            <button
              onClick={() => setLayoutMode('FULL_PAGE')}
              id="btn-layout-full"
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                layoutMode === 'FULL_PAGE'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Print 1 Copy per full A4 Page"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Page A4</span>
            </button>
          </div>

          {/* Action Buttons: Direct Download, HD PDF & System Print */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Edit LR (Admin Only) */}
            {isAdmin && onEdit && primaryLR && (
              <button
                onClick={() => onEdit(primaryLR)}
                id="btn-print-edit-lr"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-md transition cursor-pointer border border-emerald-400"
                title="Edit Consignment Details (Admin Authorized)"
              >
                <Edit className="w-4 h-4 text-emerald-100" />
                <span>EDIT LR (संपादित करा)</span>
              </button>
            )}

            {/* PhonePe Standee Poster View Button */}
            <button
              onClick={() => setShowStandeeModal(true)}
              id="btn-view-phonepe-standee"
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-lg shadow-md transition cursor-pointer border border-purple-500"
              title="View & Print Official PhonePe Standee Poster"
            >
              <QrCode className="w-4 h-4 text-purple-200" />
              <span>PHONEPE STANDEE</span>
            </button>

            {/* Download Standalone HTML Button */}
            <button
              onClick={handleDownloadHtml}
              id="btn-download-html"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg shadow-md transition cursor-pointer border border-blue-400"
              title="Download standalone HTML file with PhonePe QR and full consignment details"
            >
              <FileCode className="w-4 h-4 text-blue-200" />
              <span>DOWNLOAD HTML (HTML फाईल)</span>
            </button>

            {/* Direct Vector PDF Download Button */}
            <button
              onClick={handleDirectDownload}
              disabled={isExportingPdf}
              id="btn-direct-download-pdf"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-black text-xs transition shadow-md cursor-pointer border ${
                isExportingPdf
                  ? 'bg-rose-950 text-rose-300 border-rose-800 cursor-wait'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 hover:border-rose-400'
              }`}
              title="Download crisp vector .pdf file directly to your Downloads folder"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>DOWNLOADING...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>DOWNLOAD .PDF (थेट डाऊनलोड)</span>
                </>
              )}
            </button>

            {/* HD Graphic PDF Save Button */}
            <button
              onClick={handleSaveAsPdf}
              disabled={isExportingPdf}
              id="btn-hd-save-pdf"
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-md transition cursor-pointer border border-emerald-500"
              title="Save exact visual document as high-definition PDF"
            >
              <FileText className="w-4 h-4" />
              <span>SAVE AS PDF (HD लेआऊट)</span>
            </button>

            {/* Trigger System Print / Save as PDF Button */}
            <button
              onClick={handleTriggerPrint}
              id="btn-trigger-print"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-md transition cursor-pointer"
              title="Open browser print dialog to choose Save as PDF or physical printer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT (सिस्टम विंडो)</span>
            </button>
          </div>
        </div>

        {/* 3-Step Clear Guidance Box for Saving Properly */}
        <div className="pt-2.5 text-[11px] text-slate-300 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="flex items-start gap-2 bg-slate-800/70 p-2 rounded-lg border border-rose-500/30">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              १
            </span>
            <div className="leading-tight">
              <strong className="text-white">थेट PDF (लाल):</strong> कंपनी लोगो, QR कोड व परिपूर्ण अलाइनमेंटसह त्वरित <span className="text-rose-300 font-bold">.pdf फाईल डाऊनलोड</span> होते (Downloads फोल्डर / Ctrl + J).
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-800/70 p-2 rounded-lg border border-emerald-500/30">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              २
            </span>
            <div className="leading-tight">
              <strong className="text-white">HD लेआऊट (हिरवे):</strong> स्क्रीनवरील सर्व रंगीत बॉक्सेस व डिझाइनची हुबेहूब <span className="text-emerald-300 font-bold">हाय-डेफिनिशन PDF</span> सेव्ह होते.
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-800/70 p-2 rounded-lg border border-amber-500/30">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              ३
            </span>
            <div className="leading-tight">
              <strong className="text-white">सिस्टम प्रिंट (पिवळे):</strong> थेट प्रिंटरवर प्रिंट करण्यासाठी किंवा Destination = <span className="text-amber-300 font-bold">'Save as PDF'</span> निवडून फोल्डर निवडण्यासाठी.
            </div>
          </div>
        </div>
      </div>

      {/* PDF Notification Alert */}
      {pdfNotice && (
        <div className="no-print bg-slate-900 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold">{pdfNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfNotice(null)}
            className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* RENDER DEDICATED PRINTABLE CONTAINER */}
      <div id="printable-lr-container" className="print-only-container">
        {/* MODE 1: 3 LRS ON ONE SINGLE A4 PAGE */}
        {layoutMode === '3_ON_1_A4' && (
          <div className="pdf-page sheet-3in1-a4 bg-white text-black p-2 print:p-0 w-full max-w-[202mm] print:w-full print:max-w-full mx-auto border border-slate-300 print:border-none shadow-xl print:shadow-none box-border">
            {isMultiDistinct ? (
              // 3 Distinct LRs printed on 1 sheet
              activeLRs.slice(0, 3).map((itemLR, idx) => (
                <React.Fragment key={itemLR.id}>
                  {renderSlip(itemLR, `CONSIGNMENT #${idx + 1}`, `distinct-${idx}`, idx + 1)}
                  {idx < Math.min(activeLRs.length, 3) - 1 && renderCutLine(idx)}
                </React.Fragment>
              ))
            ) : (
              // 1 LR with its 3 Copies (Consignor, Consignee, Driver) on 1 sheet
              (['CONSIGNOR COPY', 'CONSIGNEE COPY', 'DRIVER COPY'] as const).map(
                (copyTitle, idx) => (
                  <React.Fragment key={copyTitle}>
                    {renderSlip(primaryLR, copyTitle, `copy-${idx}`, idx + 1)}
                    {idx < 2 && renderCutLine(idx)}
                  </React.Fragment>
                )
              )
            )}
          </div>
        )}

        {/* MODE 2: FULL PAGE A4 (1 Copy per sheet for long multi-item consignments) */}
        {layoutMode === 'FULL_PAGE' && (
          <div className="space-y-8 print:space-y-0">
            {(['CONSIGNOR COPY', 'CONSIGNEE COPY', 'DRIVER COPY'] as const).map(
              (copyTitle, idx) => {
                const isTBB = primaryLR.paymentMode === 'TBB';
                const isPaid = primaryLR.paymentMode === 'PAID';
                const isDriverCopy = copyTitle.toUpperCase().includes('DRIVER');
                const showAmount = !isTBB && (!isPaid || isDriverCopy);
                const placeholderText = isTBB ? 'TBB' : isPaid ? 'PAID' : '—';

                return (
                <div
                  key={copyTitle}
                  className={`pdf-page relative bg-white text-black p-6 sm:p-8 max-w-[210mm] mx-auto border border-slate-300 print:border-black shadow-lg print:shadow-none font-sans text-[11px] leading-tight ${
                    idx < 2 ? 'page-break mb-8 print:mb-0' : ''
                  }`}
                  style={{ minHeight: '275mm' }}
                >
                  {/* Security Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
                    <img
                      src={companyProfile.logoUrl || '/company_logo.jpg'}
                      alt=""
                      className="w-96 h-96 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-700">
                      Lorry Receipt / Consignment Note
                    </div>
                    <div className="border-2 border-black px-3 py-0.5 font-black text-xs uppercase tracking-widest bg-slate-100">
                      [ {copyTitle} ]
                    </div>
                    <div className="text-[10px] font-mono text-slate-700">
                      GST REG: GTA FORWARD/RCM
                    </div>
                  </div>

                  {/* Company Header */}
                  <div className="flex items-center justify-between gap-4 pb-2.5 border-b-2 border-black">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 p-1.5 flex items-center justify-center border-2 border-slate-300 rounded-xl bg-white shadow-xs">
                      <img
                        src={companyProfile.logoUrl || '/company_logo.jpg'}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-center flex-1">
                      <h1
                        className="text-3xl sm:text-4xl font-black tracking-wider text-red-600 uppercase"
                        style={{
                          color: '#DC2626',
                          letterSpacing: '0.05em',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        }}
                      >
                        {companyProfile.name}
                      </h1>
                      <p className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mt-1">
                        {companyProfile.tagline} • {companyProfile.subTagline || 'CHAKAN, PUNE'}
                      </p>
                      <p className="text-[10px] text-slate-700 font-semibold mt-1 max-w-xl mx-auto leading-normal">
                        {companyProfile.address}{companyProfile.pincode && !companyProfile.address.includes(companyProfile.pincode) ? ` - ${companyProfile.pincode}` : ''}
                      </p>
                      <div className="text-[10.5px] font-mono font-bold text-slate-900 mt-1 flex items-center justify-center gap-x-3">
                        <span><strong>GSTIN:</strong> {companyProfile.gstin}</span>
                        <span>•</span>
                        <span><strong>PAN:</strong> {companyProfile.pan}</span>
                        <span>•</span>
                        <span><strong>Mob:</strong> {companyProfile.mobile || companyProfile.phone || '9881898635'}</span>
                      </div>
                    </div>
                    <div className="w-24 text-right flex-shrink-0 flex flex-col items-end justify-center">
                      <div className="border-2 border-blue-900 px-2 py-1 text-center w-full bg-blue-50/50">
                        <div className="text-[9px] uppercase font-bold text-slate-600">Hub Branch</div>
                        <div className="text-sm font-black text-blue-900 font-mono">
                          {primaryLR.branchCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route & Vehicle */}
                  <div className="grid grid-cols-4 border-b border-black text-[10px]">
                    <div className="p-1.5 border-r border-black">
                      <span className="text-slate-500 block">LR Number:</span>
                      <span className="font-mono text-sm font-black text-blue-900">{primaryLR.lrNumber}</span>
                    </div>
                    <div className="p-1.5 border-r border-black">
                      <span className="text-slate-500 block">Booking Date:</span>
                      <span className="font-bold text-slate-900">{primaryLR.bookingDate}</span>
                    </div>
                    <div className="p-1.5 border-r border-black">
                      <span className="text-slate-500 block">Payment Mode:</span>
                      <span className="font-black text-xs uppercase text-slate-950">{primaryLR.paymentMode}</span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-slate-500 block">Delivery Type:</span>
                      <span className="font-bold uppercase text-slate-900">{primaryLR.deliveryType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-b border-black text-[10px] bg-slate-50">
                    <div className="p-1.5 border-r border-black">
                      <span className="text-slate-500">From: </span>
                      <strong className="text-slate-900 uppercase">{primaryLR.fromLocation}</strong>
                    </div>
                    <div className="p-1.5 border-r border-black">
                      <span className="text-slate-500">To: </span>
                      <strong className="text-slate-900 uppercase">{primaryLR.toLocation}</strong>
                    </div>
                    <div className="p-1.5">
                      <span className="text-slate-500">Vehicle No: </span>
                      <strong className="font-mono text-slate-900 font-black">
                        {primaryLR.vehicleNumber || 'DIRECT'}
                      </strong>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 border-b border-black">
                    <div className="p-2.5 border-r border-black space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-700">CONSIGNOR (NAME & ADDRESS)</div>
                      <div className="font-black text-xs text-slate-950 uppercase">{primaryLR.consignorName}</div>
                      <div className="text-[10px] text-slate-800 leading-tight">{primaryLR.consignorAddress || 'Address on record'}</div>
                      <div className="text-[10px] font-mono pt-1">
                        <strong>GSTIN:</strong> {primaryLR.consignorGstin || 'UR'} {primaryLR.consignorMobile && `• Ph: ${primaryLR.consignorMobile}`}
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-700">CONSIGNEE (NAME & ADDRESS)</div>
                      <div className="font-black text-xs text-slate-950 uppercase">{primaryLR.consigneeName}</div>
                      <div className="text-[10px] text-slate-800 leading-tight">{primaryLR.consigneeAddress || 'Address on record'}</div>
                      <div className="text-[10px] font-mono pt-1">
                        <strong>GSTIN:</strong> {primaryLR.consigneeGstin || 'UR'} {primaryLR.consigneeMobile && `• Ph: ${primaryLR.consigneeMobile}`}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-b border-black">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-black uppercase text-[9px]">
                          <th className="py-1.5 px-2 border-r border-black w-7/12">Description of Goods</th>
                          <th className="py-1.5 px-2 border-r border-black text-center w-1/12">Packing</th>
                          <th className="py-1.5 px-2 border-r border-black text-center w-1/12">Qty</th>
                          <th className="py-1.5 px-2 border-r border-black text-right w-1/12">Actual Wt</th>
                          <th className="py-1.5 px-2 border-r border-black text-right w-1/12">Charge Wt</th>
                          <th className="py-1.5 px-2 border-r border-black text-right w-1/12">Rate</th>
                          <th className="py-1.5 px-2 text-right w-1/12">Freight (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {primaryLR.items.map((item, iIdx) => (
                          <tr key={iIdx}>
                            <td className="py-1.5 px-2 border-r border-black font-semibold">{item.description}</td>
                            <td className="py-1.5 px-2 border-r border-black text-center">{item.packingType}</td>
                            <td className="py-1.5 px-2 border-r border-black text-center font-mono font-bold">{item.quantity} {item.units}</td>
                            <td className="py-1.5 px-2 border-r border-black text-right font-mono">{item.actualWeight} KG</td>
                            <td className="py-1.5 px-2 border-r border-black text-right font-mono">{item.chargeWeight} KG</td>
                            <td className="py-1.5 px-2 border-r border-black text-right font-mono">{showAmount ? `₹${item.ratePerKg || 0}` : (isTBB ? 'TBB' : '—')}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">{showAmount ? `₹${item.freight.toLocaleString('en-IN')}` : placeholderText}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-black font-black bg-slate-50 uppercase text-[9px]">
                          <td colSpan={2} className="py-1 px-2 border-r border-black">TOTAL:</td>
                          <td className="py-1 px-2 border-r border-black text-center font-mono text-xs">{primaryLR.totalQuantity}</td>
                          <td className="py-1 px-2 border-r border-black text-right font-mono">{primaryLR.totalActualWeight} KG</td>
                          <td className="py-1 px-2 border-r border-black text-right font-mono">{primaryLR.totalChargeWeight} KG</td>
                          <td className="py-1 px-2 border-r border-black text-right">—</td>
                          <td className="py-1 px-2 text-right font-mono text-xs font-black">{showAmount ? `₹${primaryLR.totalFreight.toLocaleString('en-IN')}` : placeholderText}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Lower */}
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-4 p-2.5 border-r border-black flex flex-col items-center justify-center text-center bg-slate-50/50">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#5f259f] text-white text-[8px] font-bold flex items-center justify-center">पे</span>
                        <span className="text-[9px] uppercase font-black text-[#5f259f] tracking-wide">PhonePe ACCEPTED HERE</span>
                      </div>
                      <div
                        onClick={() => setShowStandeeModal(true)}
                        title="Click to view full PhonePe QR Standee"
                        className="w-36 h-36 p-1.5 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-xs relative cursor-pointer hover:border-purple-600 transition"
                      >
                        <img
                          src={dynamicQrUrl}
                          alt="PhonePe QR"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-[9px] font-black uppercase text-slate-950 mt-1">SHREE SWAMI SAMARTH TRANSPORT</div>
                      <div className="text-[8px] font-mono font-bold text-purple-900">UPI: {companyProfile.upiId || 'shreeswamisamarth@ybl'}</div>
                      <div className="text-[7px] text-emerald-700 font-semibold">Scan &amp; Pay Using PhonePe / Any UPI App</div>
                    </div>

                    <div className="col-span-4 p-2 border-r border-black text-[9px] space-y-1">
                      <div className="font-bold text-slate-800 uppercase">Terms & Conditions:</div>
                      <ol className="list-decimal list-inside text-slate-700 space-y-0.5 text-[8px]">
                        <li>Goods carried strictly at Owner's Risk.</li>
                        <li>Not responsible for leakage, breakage or natural loss.</li>
                        <li>Demurrage applicable after 3 days of arrival.</li>
                        <li>Jurisdiction: Pune Courts only.</li>
                      </ol>
                    </div>

                    <div className="col-span-4 p-0">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="py-1 px-2 text-slate-700">Base Freight:</td>
                            <td className="py-1 px-2 text-right font-mono font-bold">{showAmount ? `₹${(primaryLR.charges?.freight || 0).toLocaleString('en-IN')}` : placeholderText}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-1 px-2 text-slate-700">Handling/Other:</td>
                            <td className="py-1 px-2 text-right font-mono">{showAmount ? `₹${((primaryLR.charges?.handling || 0) + (primaryLR.charges?.doorDelivery || 0)).toLocaleString('en-IN')}` : placeholderText}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-1 px-2 text-slate-700">GST:</td>
                            <td className="py-1 px-2 text-right font-mono">{showAmount ? `₹${(primaryLR.charges?.gstTax || 0).toLocaleString('en-IN')}` : placeholderText}</td>
                          </tr>
                          <tr className="bg-slate-100 font-black text-xs border-t-2 border-black">
                            <td className="py-1.5 px-2 uppercase text-slate-900">GRAND TOTAL:</td>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-950">{showAmount ? `₹${(primaryLR.charges?.grandTotal || 0).toLocaleString('en-IN')}` : placeholderText}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 pt-6 text-[9px] text-center">
                    <div className="flex flex-col justify-end items-center px-2">
                      <div className="border-t border-black w-36 pt-1 font-bold">Consignor's Signature</div>
                    </div>
                    <div className="flex flex-col justify-end items-center px-2">
                      <div className="border-t border-black w-36 pt-1 font-bold">Driver's Signature</div>
                    </div>
                    <div className="flex flex-col justify-end items-center px-2">
                      <div className="border-t border-black w-44 pt-1 font-black uppercase text-red-600">
                        For New Shree Swami Samarth Transport
                        <span className="block text-[8px] font-normal text-slate-600">Authorized Signatory</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PhonePe Full Standee Modal (Readable & Scannable) */}
      {showStandeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 print:hidden animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-3.5 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white text-purple-900 font-bold flex items-center justify-center text-xs shadow-xs">
                  पे
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">PhonePe Official Standee</h3>
                  <p className="text-[10px] text-purple-200">SHREE SWAMI SAMARTH TRANSPORT</p>
                </div>
              </div>
              <button
                onClick={() => setShowStandeeModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-purple-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center bg-slate-50">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-md max-w-[280px]">
                <img
                  src="/phonepe_qr.jpg"
                  alt="PhonePe Standee Poster"
                  className="w-full h-auto rounded object-contain shadow-xs"
                />
              </div>

              <div className="mt-3 text-center space-y-1 w-full">
                <div className="text-xs font-black text-slate-900 uppercase">
                  {companyProfile.name || 'SHREE SWAMI SAMARTH TRANSPORT'}
                </div>
                <div className="inline-block px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-mono font-black text-purple-900">
                  UPI: {companyProfile.upiId || 'shreeswamisamarth@ybl'}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✅ 100% Scannable by PhonePe, Google Pay, Paytm, Navi &amp; BHIM
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
              <a
                href="/phonepe_qr.jpg"
                download="PhonePe_Standee_SSST.jpg"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>डाऊनलोड करा (Download)</span>
              </a>
              <button
                onClick={() => setShowStandeeModal(false)}
                className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
