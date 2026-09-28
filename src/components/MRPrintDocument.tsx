import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Building2, Truck, Phone, FileText, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { MRRecord, LRRecord, CompanyProfile } from '../types';
import { exportElementToPdf } from '../services/pdfExport';

interface MRPrintDocumentProps {
  mr: MRRecord;
  attachedLRs: LRRecord[];
  companyProfile: CompanyProfile;
  onBack: () => void;
  autoPrint?: boolean;
}

export const MRPrintDocument: React.FC<MRPrintDocumentProps> = ({
  mr,
  attachedLRs,
  companyProfile,
  onBack,
  autoPrint = false,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

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

  const handleSaveAsPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfNotice('Generating high-resolution MR/Manifest PDF document...');

    try {
      const filename = `MR_${mr.mrNumber}_A4.pdf`;
      const success = await exportElementToPdf('printable-mr-container', {
        filename,
        orientation: 'portrait',
        format: 'a4',
        marginMm: 3,
        quality: 0.98,
      });

      if (success) {
        setPdfNotice(
          `✅ Manifest PDF डाऊनलोड झाली! ही फाईल तुमच्या कॉम्प्युटरच्या 'Downloads' फोल्डरमध्ये सेव्ह झाली आहे: ${filename} (Ctrl + J दाबा)`
        );
        setTimeout(() => setPdfNotice(null), 8000);
      } else {
        setPdfNotice(null);
      }
    } catch (err) {
      console.error('MR PDF export error:', err);
      setPdfNotice('Failed to generate PDF. Opening system print dialog as fallback...');
      setTimeout(() => {
        setPdfNotice(null);
        window.print();
      }, 1000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalPackages = attachedLRs.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);
  const totalActualWeight = attachedLRs.reduce((sum, l) => sum + (l.totalActualWeight || 0), 0);
  // ONLY TO PAY is collected on delivery manifest (Rule 1)
  const totalFreight = attachedLRs.reduce((sum, l) => {
    const mode = (l.paymentMode || '').toUpperCase().trim();
    if (mode === 'PAID' || mode === 'TBB') return sum;
    return sum + (l.charges?.grandTotal || l.totalFreight || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* SCREEN CONTROL BAR (HIDDEN ON PRINT) */}
      <div className="no-print bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="btn-mr-print-back"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-sky-500 text-white font-black uppercase px-2 py-0.5 rounded">
                Delivery Manifest / MR Printout
              </span>
              <span className="text-xs text-sky-300 font-semibold">
                Vehicle: {mr.vehicleNumber} • {mr.fromBranch} → {mr.toBranch}
              </span>
            </div>
            <div className="text-base font-black font-mono text-white mt-0.5">
              MR No: {mr.mrNumber} ({attachedLRs.length} LRs Attached)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAsPdf}
            disabled={isExportingPdf}
            id="btn-save-mr-pdf"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs transition shadow-md cursor-pointer border ${
              isExportingPdf
                ? 'bg-rose-950 text-rose-300 border-rose-800 cursor-wait'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 hover:border-rose-400'
            }`}
            title="Download high-resolution A4 PDF document to your device"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>GENERATING PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-white" />
                <span>SAVE AS PDF (डाउनलोड)</span>
              </>
            )}
          </button>

          <button
            onClick={handleTriggerPrint}
            id="btn-trigger-mr-print"
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT / SAVE AS PDF (सिस्टम विंडो)</span>
          </button>
        </div>

        {/* Downloads folder location helper note */}
        <div className="w-full pt-2 text-[11px] text-slate-400 flex items-center justify-between gap-2 border-t border-slate-800/80">
          <span>
            📁 <strong>फाईल सेव्ह स्थान:</strong> डाऊनलोड केलेली PDF फाईल तुमच्या कॉम्प्युटरच्या <strong className="text-amber-300 font-bold underline">Downloads</strong> फोल्डरमध्ये सेव्ह होते.
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            शॉर्टकट: Ctrl + J
          </span>
        </div>
      </div>

      {/* PDF Notification Alert */}
      {pdfNotice && (
        <div className="no-print bg-slate-900 border border-sky-500/40 text-sky-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
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

      {/* DEDICATED A4 PRINTABLE DOCUMENT */}
      <div id="printable-mr-container" className="print-only-container">
        <div
          className="relative bg-white text-black p-5 sm:p-7 max-w-[210mm] mx-auto border border-slate-300 print:border-black shadow-lg print:shadow-none font-sans text-[10px] leading-tight box-border"
          style={{ minHeight: '275mm' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
            <img
              src={companyProfile.logoUrl || '/company_logo.jpg'}
              alt=""
              className="w-96 h-96 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* TOP HEADER */}
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2 relative z-10">
            {/* Company Logo - Larger Prominent Size */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 p-1 flex items-center justify-center border-2 border-slate-300 rounded-lg bg-white shadow-xs">
              <img
                src={companyProfile.logoUrl || '/company_logo.jpg'}
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Company Details with BOLD RED TITLE & LONG / LARGE DISPLAY */}
            <div className="text-center flex-1 px-3">
              <h1
                className="text-3xl sm:text-4xl font-black tracking-wider text-red-600 uppercase leading-none"
                style={{
                  color: '#DC2626',
                  letterSpacing: '0.04em',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                {companyProfile.name}
              </h1>
              <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mt-1">
                {companyProfile.tagline} • {companyProfile.subTagline || 'CHAKAN, PUNE'}
              </p>
              <p className="text-[8.5px] text-slate-700 font-semibold mt-0.5 leading-tight">
                {companyProfile.address}
                {companyProfile.pincode && !companyProfile.address.includes(companyProfile.pincode)
                  ? ` - ${companyProfile.pincode}`
                  : ''}
              </p>
              <div className="text-[8.5px] font-mono font-bold text-slate-900 mt-1 flex items-center justify-center gap-3">
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

            {/* Manifest Badge */}
            <div className="text-right flex-shrink-0 min-w-[36mm]">
              <div className="border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase tracking-wider bg-slate-100 text-center">
                DELIVERY MANIFEST / MR
              </div>
              <div className="font-mono text-sm font-black text-sky-950 mt-1 text-right">
                {mr.mrNumber}
              </div>
              <div className="text-[8px] text-slate-700 mt-0.5">
                Date: <strong>{mr.date}</strong>
              </div>
              <div className="text-[8px] text-slate-700 font-mono">
                Hub: <strong>{mr.branchCode}</strong>
              </div>
            </div>
          </div>

          {/* VEHICLE & ROUTE BAR */}
          <div className="grid grid-cols-4 border border-black mb-2 text-[9px] bg-slate-50 relative z-10">
            <div className="p-1.5 border-r border-black">
              <span className="text-slate-500 block text-[8px]">Vehicle Number:</span>
              <strong className="font-mono text-sm font-black text-slate-950">
                {mr.vehicleNumber}
              </strong>
            </div>
            <div className="p-1.5 border-r border-black">
              <span className="text-slate-500 block text-[8px]">Driver Name & Phone:</span>
              <strong className="text-slate-950 block truncate">
                {mr.driverName || '—'}
              </strong>
              <span className="text-[8px] font-mono text-slate-700">
                {mr.driverPhone || '—'}
              </span>
            </div>
            <div className="p-1.5 border-r border-black">
              <span className="text-slate-500 block text-[8px]">Transit Route:</span>
              <strong className="text-slate-950 uppercase block">
                {mr.fromBranch} → {mr.toBranch}
              </strong>
            </div>
            <div className="p-1.5 text-right">
              <span className="text-slate-500 block text-[8px]">Total LRs Dispatched:</span>
              <strong className="font-mono text-sm font-black text-sky-900">
                {attachedLRs.length} Consignments
              </strong>
            </div>
          </div>

          {/* CONSIGNMENT BREAKDOWN TABLE */}
          <div className="border border-black mb-2 relative z-10">
            <table className="w-full text-left text-[8.5px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black uppercase text-[7.5px]">
                  <th className="py-1 px-1.5 border-r border-black text-center w-6">#</th>
                  <th className="py-1 px-1.5 border-r border-black w-24">LR Number</th>
                  <th className="py-1 px-1.5 border-r border-black w-16">Date</th>
                  <th className="py-1 px-1.5 border-r border-black">Consignor (Sender)</th>
                  <th className="py-1 px-1.5 border-r border-black">Consignee (Receiver)</th>
                  <th className="py-1 px-1.5 border-r border-black text-center w-12">Pkgs</th>
                  <th className="py-1 px-1.5 border-r border-black text-right w-16">Act Wt</th>
                  <th className="py-1 px-1.5 border-r border-black text-center w-16">Pay Mode</th>
                  <th className="py-1 px-1.5 text-right w-20">Freight (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {attachedLRs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 italic">
                      No LRs attached to this delivery manifest yet.
                    </td>
                  </tr>
                ) : (
                  attachedLRs.map((itemLR, idx) => (
                    <tr key={itemLR.id} className="hover:bg-slate-50">
                      <td className="py-1 px-1.5 border-r border-black text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black font-mono font-black text-blue-900">
                        {itemLR.lrNumber}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black text-slate-700 font-mono">
                        {itemLR.bookingDate}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black font-bold uppercase truncate max-w-[40mm]">
                        {itemLR.consignorName}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black uppercase truncate max-w-[40mm]">
                        {itemLR.consigneeName}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black text-center font-mono font-bold">
                        {itemLR.totalQuantity}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black text-right font-mono">
                        {itemLR.totalActualWeight} kg
                      </td>
                      <td className="py-1 px-1.5 border-r border-black text-center font-bold text-[7.5px]">
                        <span
                          className={`px-1 py-0.5 rounded ${
                            itemLR.paymentMode === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : itemLR.paymentMode === 'TO PAY'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {itemLR.paymentMode}
                        </span>
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-black text-slate-950">
                        {(itemLR.paymentMode === 'PAID' || itemLR.paymentMode === 'TBB') ? (
                          <span className="text-slate-400 font-semibold">₹0.00</span>
                        ) : (
                          `₹${(itemLR.charges?.grandTotal || itemLR.totalFreight || 0).toLocaleString('en-IN')}`
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-black bg-slate-100 uppercase text-[8px]">
                  <td colSpan={5} className="py-1.5 px-2 border-r border-black text-right">
                    TOTAL TO-PAY COLLECTION ({attachedLRs.length} LRs):
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-black text-center font-mono text-[9px] font-black">
                    {totalPackages}
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-black text-right font-mono text-[9px]">
                    {totalActualWeight} kg
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-black text-center text-[7px] text-slate-500">TO-PAY ONLY</td>
                  <td className="py-1.5 px-2 text-right font-mono text-[10px] font-black text-slate-950">
                    ₹{totalFreight.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PAYMENT & QR SECTION */}
          <div className="grid grid-cols-12 border border-black mb-3 relative z-10">
            {/* PhonePe QR Code - 100% READABLE & SCANNABLE */}
            <div className="col-span-4 p-2 border-r border-black flex items-center gap-2.5 bg-slate-50/50">
              <div className="w-20 h-20 p-1 bg-white border-2 border-slate-900 rounded flex items-center justify-center flex-shrink-0 shadow-xs relative">
                <img
                  src="/phonepe_qr_code.png"
                  alt="PhonePe QR"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4 h-4 bg-black rounded-full border border-white flex items-center justify-center text-[8px] text-white font-bold">
                    पे
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-[#5f259f] text-white text-[7px] font-bold flex items-center justify-center">पे</span>
                  <span className="text-[9px] font-black uppercase text-[#5f259f] tracking-tight">PhonePe</span>
                </div>
                <div className="text-[7.5px] font-extrabold uppercase text-[#5f259f]">ACCEPTED HERE</div>
                <div className="text-[7.5px] font-mono font-bold text-slate-900 truncate">
                  {companyProfile.upiId || 'shreeswamisamarth@ybl'}
                </div>
                <p className="text-[7px] text-emerald-700 font-semibold leading-tight">
                  Scan to Pay (PhonePe/GPay)
                </p>
              </div>
            </div>

            {/* Collection Summary */}
            <div className="col-span-8 p-2 text-[9px] flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-50 border border-slate-300 rounded">
                  <span className="text-slate-600 text-[8px] block uppercase font-bold">
                    Total Consignments:
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {attachedLRs.length} LRs • {totalPackages} Pkgs
                  </span>
                </div>
                <div className="p-2 bg-sky-50 border border-sky-300 rounded">
                  <span className="text-sky-800 text-[8px] block uppercase font-bold">
                    Total Manifest Value:
                  </span>
                  <span className="font-mono text-sm font-black text-sky-950">
                    ₹{totalFreight.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="pt-6 relative z-10">
            <div className="grid grid-cols-3 text-center text-[8.5px]">
              <div className="flex flex-col justify-end items-center px-2">
                <div className="border-t-2 border-black w-40 pt-1 font-bold">
                  Driver's Signature
                  <span className="block text-[7px] font-normal text-slate-600">
                    ({mr.driverName || 'Driver'})
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-end items-center px-2">
                <div className="border-t-2 border-black w-40 pt-1 font-bold">
                  Receiving Branch In-Charge
                  <span className="block text-[7px] font-normal text-slate-600">
                    ({mr.toBranch} Hub)
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-end items-center px-2">
                <div className="border-t-2 border-black w-44 pt-1 font-black uppercase text-red-600">
                  For New Shree Swami Samarth Transport
                  <span className="block text-[7px] font-normal text-slate-600">
                    Authorized Signatory / Seal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
