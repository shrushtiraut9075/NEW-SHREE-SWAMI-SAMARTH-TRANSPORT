import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Phone,
  FileCheck,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { PaymentRecord, LRRecord, CompanyProfile, User } from '../types';
import { StorageService } from '../services/storage';

interface PaymentModuleProps {
  payments: PaymentRecord[];
  lrs: LRRecord[];
  companyProfile: CompanyProfile;
  currentUser: User;
  onPaymentRecorded: (newPayment: PaymentRecord) => void;
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({
  payments,
  lrs,
  companyProfile,
  currentUser,
  onPaymentRecorded,
}) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Form
  const [selectedLrId, setSelectedLrId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<
    'PHONEPE_QR' | 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE'
  >('PHONEPE_QR');
  const [referenceNo, setReferenceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // When an LR is selected, pre-fill amount and customer
  const handleSelectLR = (lrId: string) => {
    setSelectedLrId(lrId);
    const found = lrs.find((l) => l.id === lrId);
    if (found) {
      const due = (found.charges?.grandTotal || 0) - (found.paidAmount || 0);
      setAmount(due > 0 ? due : found.charges?.grandTotal || 0);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedLrId) {
      setFormError('Please choose an LR / Consignment.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    const matchedLR = lrs.find((l) => l.id === selectedLrId);
    if (!matchedLR) {
      setFormError('Consignment record not found.');
      return;
    }

    const newPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNo: `RCT-${Date.now().toString().slice(-6)}`,
      receiptNumber: `RCT-${Date.now().toString().slice(-6)}`,
      paymentDate: date,
      date,
      lrId: matchedLR.id,
      lrNumber: matchedLR.lrNumber,
      customerName:
        matchedLR.paymentMode === 'PAID'
          ? matchedLR.consignorName
          : matchedLR.consigneeName,
      amount: Number(amount),
      paymentMode,
      transactionRef: referenceNo.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`,
      referenceNo: referenceNo.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`,
      receivedBy: currentUser.username,
      createdBy: currentUser.username,
      status: 'Paid',
      remarks,
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = StorageService.savePayment(newPay);
      onPaymentRecorded(saved);
      setShowPayModal(false);
      setSelectedLrId('');
      setAmount('');
      setReferenceNo('');
      setRemarks('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Storage error';
      setFormError(`Failed to save payment: ${errorMsg}`);
    }
  };

  // Calculations
  const totalCollections = payments.reduce((sum, p) => sum + p.amount, 0);
  const upiPhonePeTotal = payments
    .filter((p) => p.paymentMode === 'PHONEPE_QR' || p.paymentMode === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingLRs = lrs.filter(
    (l) => l.paymentStatus !== 'PAID' && l.status !== 'CANCELLED'
  );

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      p.lrNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Accounts & Settlements
            </span>
            <span className="text-xs font-semibold text-slate-500">
              PhonePe QR & UPI Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            PHONEPE & UPI PAYMENT MODULE
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant digital collections, PhonePe QR scanner, and freight receipt ledger
          </p>
        </div>

        {currentUser.role !== 'VIEWER' && (
          <button
            onClick={() => setShowPayModal(true)}
            id="btn-open-record-payment"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ RECORD PAYMENT</span>
          </button>
        )}
      </div>

      {/* QR Banner & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* QR Code Card (100% READABLE & SCANNABLE) */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white p-5 rounded-xl border border-purple-800/40 shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/60 border border-purple-500/50 rounded-full text-purple-200 font-bold text-xs uppercase tracking-wider">
            <span className="w-3.5 h-3.5 rounded-full bg-white text-purple-950 font-black text-[9px] flex items-center justify-center">पे</span>
            <span>PhonePe ACCEPTED HERE</span>
          </div>

          <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-lg border-2 border-purple-400 flex items-center justify-center relative">
            <img
              src="/phonepe_qr_code.png"
              alt="Scan & Pay using PhonePe - Shree Swami Samarth Transport"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            {/* Center 'पे' Logo Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 bg-black rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                पे
              </div>
            </div>
          </div>

          <div className="space-y-1 w-full">
            <div className="text-xs font-black tracking-tight text-white uppercase">
              {companyProfile.name || 'SHREE SWAMI SAMARTH TRANSPORT'}
            </div>
            <div className="inline-block px-3 py-0.5 bg-purple-900/50 border border-purple-700/50 rounded text-xs font-mono text-amber-300 font-bold">
              UPI: {companyProfile.upiId || 'shreeswamisamarth@ybl'}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium pt-1">
              ✅ 100% Scannable: PhonePe, GPay, Paytm, BHIM
            </div>
            <a
              href="/phonepe_qr.jpg"
              download="PhonePe_Standee_SSST.jpg"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-white underline font-semibold transition"
            >
              <FileDown className="w-3 h-3" />
              <span>Download Official Standee Poster</span>
            </a>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Total Payments Received
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-2">
                ₹{totalCollections.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
              <span>Receipts Issued:</span>
              <strong className="font-mono text-slate-900">{payments.length}</strong>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                PhonePe & UPI Collections
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-purple-700 mt-2">
                ₹{upiPhonePeTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
              <span>UPI Share:</span>
              <strong className="font-mono text-slate-900">
                {totalCollections > 0
                  ? `${Math.round((upiPhonePeTotal / totalCollections) * 100)}%`
                  : '0%'}
              </strong>
            </div>
          </div>

          <div className="sm:col-span-2 bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-900">
                Pending Unpaid Consignments:
              </span>
              <div className="text-xs text-amber-700">
                {pendingLRs.length} consignments awaiting payment settlement
              </div>
            </div>
            {currentUser.role !== 'VIEWER' && (
              <button
                onClick={() => setShowPayModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow"
              >
                Clear Pending Dues →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt no, LR, party, UTR..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Receipt No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">LR Consignment</th>
                <th className="py-3 px-3">Party / Customer</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Reference / UTR</th>
                <th className="py-3 px-3 text-right">Amount Paid</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payment receipts recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-800">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{p.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {p.lrNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.customerName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                      {p.referenceNo || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.receivedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-800 font-black text-sm uppercase">
                <CreditCard className="w-4 h-4" />
                <span>Record Freight Payment / Settlement</span>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-r">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Consignment (LR) *
                </label>
                <select
                  value={selectedLrId}
                  onChange={(e) => handleSelectLR(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                >
                  <option value="">-- Choose Consignment --</option>
                  {lrs.map((lr) => (
                    <option key={lr.id} value={lr.id}>
                      {lr.lrNumber} - {lr.consignorName} → {lr.consigneeName} (₹
                      {lr.charges?.grandTotal || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    placeholder="₹"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value="PHONEPE_QR">PhonePe QR Code</option>
                    <option value="UPI">Direct UPI / GPay</option>
                    <option value="CASH">Cash Collection</option>
                    <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    UPI Ref / UTR / Cheque No.
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. 423985729182"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Full settlement received by Chakan counter"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-black shadow"
                >
                  Save Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
