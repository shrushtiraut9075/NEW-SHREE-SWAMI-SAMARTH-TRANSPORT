import React, { useState, useMemo } from 'react';
import { Search, X, Edit, FileText, Calendar, Truck, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LRRecord, User } from '../types';

interface AdminLREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lrs: LRRecord[];
  onSelectLREdit: (lr: LRRecord) => void;
  currentUser: User;
}

export const AdminLREditModal: React.FC<AdminLREditModalProps> = ({
  isOpen,
  onClose,
  lrs,
  onSelectLREdit,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLRs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      // Show latest 12 LRs by default
      return [...lrs].sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)).slice(0, 12);
    }
    return lrs
      .filter((lr) => {
        return (
          lr.lrNumber.toLowerCase().includes(q) ||
          lr.consignorName.toLowerCase().includes(q) ||
          lr.consigneeName.toLowerCase().includes(q) ||
          lr.vehicleNumber.toLowerCase().includes(q) ||
          lr.fromLocation.toLowerCase().includes(q) ||
          lr.toLocation.toLowerCase().includes(q) ||
          (lr.bookingDate && lr.bookingDate.includes(q))
        );
      })
      .slice(0, 20);
  }, [lrs, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <Edit className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  ADMIN LR EDIT (एल.आर संपादित करा)
                </h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/40">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                एडिट करण्यासाठी खालील यादीतून LR निवडा किंवा LR नंबर सर्च करा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input box */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="LR नंबर, पार्टीचे नाव, गाडी नंबर किंवा तारीख टाईप करा..."
              className="w-full bg-white border-2 border-emerald-500/60 focus:border-emerald-600 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-xs outline-none"
            />
            <Search className="w-5 h-5 text-emerald-600 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* List of LRs to edit */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredLRs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                '{searchTerm}' या नावाचा कोणताही LR सापडला नाही.
              </p>
              <p className="text-[11px] text-slate-400">
                कृपया LR नंबर किंवा पार्टीचे नाव तपासून पुन्हा प्रयत्न करा.
              </p>
            </div>
          ) : (
            filteredLRs.map((lr) => {
              const isCancelled = lr.status === 'CANCELLED';
              return (
                <div
                  key={lr.id}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {lr.lrNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{lr.bookingDate}</span>
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-800 font-mono font-bold px-1.5 py-0.5 rounded">
                        {lr.branchCode}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          lr.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : lr.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {lr.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-bold">
                      <span>{lr.consignorName}</span>
                      <span className="text-slate-400 font-normal mx-1">→</span>
                      <span>{lr.consigneeName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        रूट: {lr.fromLocation} → {lr.toLocation}
                      </span>
                      {lr.vehicleNumber && (
                        <span className="flex items-center gap-1 font-mono text-slate-700">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{lr.vehicleNumber}</span>
                        </span>
                      )}
                      <span className="font-black text-slate-900">
                        ₹{(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      disabled={isCancelled}
                      onClick={() => {
                        onClose();
                        onSelectLREdit(lr);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer disabled:opacity-40"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{isCancelled ? 'CANCELLED (CANNOT EDIT)' : 'EDIT THIS LR (संपादित करा)'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorized Administrator: {currentUser.name} (Kudke Baliram)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-bold hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
