import React from 'react';
import { X, Printer, FileDown, Building2, Truck, User as UserIcon, Package, Calendar, Phone, CheckCircle2, FileCheck, Upload, Clock, Eye, FileCode, Edit, Lock } from 'lucide-react';
import { LRRecord, CompanyProfile, User } from '../types';
import { downloadLRHtmlFile } from '../utils/htmlExport';

interface LRViewModalProps {
  lr: LRRecord | null;
  onClose: () => void;
  onPrint: (lr: LRRecord) => void;
  onEdit?: (lr: LRRecord) => void;
  currentUser?: User;
  onOpenTracking?: (lr: LRRecord) => void;
  companyProfile: CompanyProfile;
}

export const LRViewModal: React.FC<LRViewModalProps> = ({
  lr,
  onClose,
  onPrint,
  onEdit,
  currentUser,
  onOpenTracking,
  companyProfile,
}) => {
  if (!lr) return null;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
  const isCancelled = lr.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-amber-400 flex-shrink-0 shadow-xs flex items-center justify-center">
              <img
                src={companyProfile.logoUrl || '/company_logo.jpg'}
                alt="Chakan Transport Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-amber-400">
                  {lr.lrNumber}
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase border border-blue-400/30">
                  {lr.branchCode} Hub
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Booking Date: {lr.bookingDate} • Mode: {lr.paymentMode} • Delivery: {lr.deliveryType}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-md mt-0.5">
                HQ: {companyProfile.address}{companyProfile.pincode && !companyProfile.address.includes(companyProfile.pincode) ? ` - ${companyProfile.pincode}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !isCancelled && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(lr);
                }}
                id="btn-modal-edit-lr"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer border border-emerald-400"
                title="Edit Consignment LR (Admin Only)"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>EDIT LR (संपादित करा)</span>
              </button>
            )}
            <button
              onClick={() => downloadLRHtmlFile(lr, companyProfile)}
              id="btn-modal-download-html"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
              title="Download standalone HTML document file"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-200" />
              <span>Download HTML</span>
            </button>
            <button
              onClick={() => onPrint(lr)}
              id="btn-modal-save-pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-bold shadow transition cursor-pointer"
              title="Open document view to Save as PDF or Laser Print"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Save as PDF</span>
            </button>
            <button
              onClick={() => onPrint(lr)}
              id="btn-modal-print-a4"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
              title="Print A4 Consignment Note (3-in-1)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              id="btn-modal-close"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Status:</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded text-[11px] ${
                  lr.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : lr.status === 'IN TRANSIT'
                    ? 'bg-amber-100 text-amber-900'
                    : lr.status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {lr.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-700">
              <div>
                <span className="text-slate-500">From:</span>{' '}
                <strong className="text-slate-900">{lr.fromLocation}</strong>
              </div>
              <div>→</div>
              <div>
                <span className="text-slate-500">To:</span>{' '}
                <strong className="text-slate-900">{lr.toLocation}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500">Vehicle:</span>
              <span className="bg-slate-200 text-slate-900 px-2 py-0.5 rounded font-bold">
                {lr.vehicleNumber || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Consignor & Consignee Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                Consignor (Sender)
              </span>
              <div className="text-sm font-black text-slate-900">{lr.consignorName}</div>
              <div className="text-slate-600 font-mono text-[11px]">
                GSTIN: <strong>{lr.consignorGstin || 'Unregistered / UR'}</strong>
              </div>
              {lr.consignorAddress && (
                <div className="text-slate-600 text-[11px]">{lr.consignorAddress}</div>
              )}
              {lr.consignorMobile && (
                <div className="text-slate-600 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{lr.consignorMobile}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                Consignee (Receiver)
              </span>
              <div className="text-sm font-black text-slate-900">{lr.consigneeName}</div>
              <div className="text-slate-600 font-mono text-[11px]">
                GSTIN: <strong>{lr.consigneeGstin || 'Unregistered / UR'}</strong>
              </div>
              {lr.consigneeAddress && (
                <div className="text-slate-600 text-[11px]">{lr.consigneeAddress}</div>
              )}
              {lr.consigneeMobile && (
                <div className="text-slate-600 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{lr.consigneeMobile}</span>
                </div>
              )}
            </div>
          </div>

          {/* Goods Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200">
              Consignment Cargo & Packages
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2">Packing</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Actual Wt</th>
                  <th className="py-2 px-2 text-right">Charge Wt</th>
                  <th className="py-2 px-2 text-right">Rate/Kg</th>
                  <th className="py-2 px-3 text-right">Freight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lr.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-2 px-2 text-slate-700">{item.packingType}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                      {item.quantity} {item.units}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      {item.actualWeight} KG
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      {item.chargeWeight} KG
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      ₹{item.ratePerKg || 0}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{item.freight.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <td colSpan={2} className="py-2 px-3 uppercase text-[10px] text-slate-600">
                    Totals:
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-blue-700">
                    {lr.totalQuantity}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-900">
                    {lr.totalActualWeight} KG
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-blue-700">
                    {lr.totalChargeWeight} KG
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400">—</td>
                  <td className="py-2 px-3 text-right font-mono text-blue-700 font-black">
                    ₹{lr.totalFreight.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Charges Breakdown & Payment details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transit & Fleet Meta */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                Logistics & Driver Details
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500">Driver:</span>{' '}
                  <strong className="text-slate-900">{lr.driverName || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>{' '}
                  <strong className="font-mono text-slate-900">{lr.driverMobile || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">E-Way Bill:</span>{' '}
                  <strong className="font-mono text-slate-900">{lr.eWayBillNo || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Up To Branch:</span>{' '}
                  <strong className="text-slate-900">{lr.freightUpToBranch || 'Direct'}</strong>
                </div>
              </div>
              {lr.specialRemarks && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                  <strong>Remarks:</strong> {lr.specialRemarks}
                </div>
              )}
            </div>

            {/* Charges Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Financial Summary
              </span>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Freight:</span>
                  <span>₹{(lr.charges?.freight || 0).toLocaleString('en-IN')}</span>
                </div>
                {Boolean(lr.charges?.vasuli) && (
                  <div className="flex justify-between text-slate-400">
                    <span>Vasuli / Collection:</span>
                    <span>₹{lr.charges.vasuli.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Boolean(lr.charges?.handling) && (
                  <div className="flex justify-between text-slate-400">
                    <span>Handling / B.C.:</span>
                    <span>₹{lr.charges.handling.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Boolean(lr.charges?.doorDelivery) && (
                  <div className="flex justify-between text-slate-400">
                    <span>Door Delivery:</span>
                    <span>₹{lr.charges.doorDelivery.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Boolean(lr.charges?.otherCharges) && (
                  <div className="flex justify-between text-slate-400">
                    <span>Other Charges:</span>
                    <span>₹{lr.charges.otherCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>GST / Service Tax:</span>
                  <span>+₹{(lr.charges?.gstTax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-amber-400">
                  <span className="uppercase">Grand Total:</span>
                  <span className="text-base">
                    ₹{(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consignment Tracking & Proof of Delivery (POD) Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  Consignment Tracking & Proof of Delivery (POD)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    lr.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : lr.status === 'IN TRANSIT'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {lr.status}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    lr.podStatus === 'UPLOADED' || lr.podStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  POD: {lr.podStatus || 'PENDING'}
                </span>
              </div>
            </div>

            {lr.podDetails ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={lr.podDetails.documentUrl || '/company_logo.jpg'}
                      alt="POD"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Delivered To: {lr.podDetails.receivedBy} ({lr.podDetails.receiverPhone || 'Verified'})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Delivered on: {lr.podDetails.deliveryDate} at {lr.podDetails.deliveryTime} • {lr.podDetails.remarks}
                    </div>
                  </div>
                </div>
                {onOpenTracking && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTracking(lr);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View POD & Tracking</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Proof of Delivery (POD) has not been uploaded yet for this consignment.</span>
                </div>
                {onOpenTracking && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTracking(lr);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload POD (पावती जोडा)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[10px] text-slate-500">
            Booked By: <strong>{lr.createdBy}</strong> on {new Date(lr.createdAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onPrint(lr)}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 (3 Copies)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
