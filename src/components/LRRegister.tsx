import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit,
  Printer,
  FileDown,
  Filter,
  Ban,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  FileText,
  Lock,
  ShieldAlert,
  Truck,
  Clock,
  FileCheck,
} from 'lucide-react';
import { LRRecord, Branch, User, CompanyProfile } from '../types';
import { exportToExcel, exportToPDF } from '../services/reportExport';
import { StorageService } from '../services/storage';

interface LRRegisterProps {
  lrs: LRRecord[];
  branches: Branch[];
  selectedBranch: string;
  onNewLR: () => void;
  onViewLR: (lr: LRRecord) => void;
  onEditLR: (lr: LRRecord) => void;
  onPrintLR: (lr: LRRecord) => void;
  onPrintMultipleLRs?: (lrs: LRRecord[]) => void;
  onCancelLR: (lrId: string, reason: string) => void;
  onPurgeLR: (lrId: string) => void;
  onTrackLR?: (lr: LRRecord) => void;
  onOpenAdminEditLR?: () => void;
  currentUser: User;
  companyProfile?: CompanyProfile;
}

export const LRRegister: React.FC<LRRegisterProps> = ({
  lrs,
  branches,
  selectedBranch,
  onNewLR,
  onViewLR,
  onEditLR,
  onPrintLR,
  onPrintMultipleLRs,
  onCancelLR,
  onPurgeLR,
  onTrackLR,
  onOpenAdminEditLR,
  currentUser,
  companyProfile,
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  const canModifyLR = isAdmin; // ONLY Admin can edit/modify LRs as strictly requested!
  const canCancelLR = isAdmin || (currentUser.permissions?.canCancelLR ?? false);
  const canDeleteLR = isAdmin || (currentUser.permissions?.canDeleteLR ?? false);
  const canCreateLR = isAdmin || (currentUser.permissions?.canCreateLR ?? true);

  // Selected LRs for 3-on-1 A4 Batch Printing
  const [selectedLRIds, setSelectedLRIds] = useState<string[]>([]);

  // Date Calculation helpers
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getFirstDayOfCurrentMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  type DatePreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM';

  // Filters with Date Period Presets (कालावधी निवड)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset>('THIS_MONTH');
  const [dateFrom, setDateFrom] = useState(getFirstDayOfCurrentMonth());
  const [dateTo, setDateTo] = useState(getTodayISO());
  const [filterBranch, setFilterBranch] = useState(selectedBranch);
  const [filterConsignor, setFilterConsignor] = useState('');
  const [filterConsignee, setFilterConsignee] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPodStatus, setFilterPodStatus] = useState('');

  // Apply Quick Date Period Preset
  const handleApplyDatePreset = (preset: DatePreset) => {
    setActiveDatePreset(preset);
    const today = getTodayISO();
    const d = new Date();

    if (preset === 'TODAY') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'YESTERDAY') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setDateFrom(yStr);
      setDateTo(yStr);
    } else if (preset === 'THIS_WEEK') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date().setDate(diff)).toISOString().split('T')[0];
      setDateFrom(monday);
      setDateTo(today);
    } else if (preset === 'THIS_MONTH') {
      setDateFrom(getFirstDayOfCurrentMonth());
      setDateTo(today);
    } else if (preset === 'LAST_MONTH') {
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
      setDateFrom(first);
      setDateTo(last);
    } else if (preset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Cancellation Modal state
  const [cancellingLR, setCancellingLR] = useState<LRRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Quick LR Print modal state
  const [quickPrintModalOpen, setQuickPrintModalOpen] = useState(false);
  const [quickPrintSearch, setQuickPrintSearch] = useState('');

  // Reset all filters
  const handleReset = () => {
    setSearchQuery('');
    handleApplyDatePreset('ALL');
    setFilterBranch('ALL');
    setFilterConsignor('');
    setFilterConsignee('');
    setFilterVehicle('');
    setFilterStatus('');
    setFilterPodStatus('');
  };

  // Distinct lists for dropdown filters
  const consignorsList = useMemo(() => {
    const set = new Set<string>();
    lrs.forEach((l) => l.consignorName && set.add(l.consignorName));
    return Array.from(set).sort();
  }, [lrs]);

  const consigneesList = useMemo(() => {
    const set = new Set<string>();
    lrs.forEach((l) => l.consigneeName && set.add(l.consigneeName));
    return Array.from(set).sort();
  }, [lrs]);

  const vehiclesList = useMemo(() => {
    const set = new Set<string>();
    lrs.forEach((l) => l.vehicleNumber && set.add(l.vehicleNumber));
    return Array.from(set).sort();
  }, [lrs]);

  // Filtered LRs
  const filteredLRs = useMemo(() => {
    return lrs.filter((lr) => {
      // Branch filter
      if (filterBranch !== 'ALL' && lr.branchCode !== filterBranch) {
        return false;
      }
      // Date range filter
      if (dateFrom && lr.bookingDate < dateFrom) return false;
      if (dateTo && lr.bookingDate > dateTo) return false;

      // Consignor filter
      if (filterConsignor && lr.consignorName !== filterConsignor) return false;

      // Consignee filter
      if (filterConsignee && lr.consigneeName !== filterConsignee) return false;

      // Vehicle filter
      if (filterVehicle && lr.vehicleNumber !== filterVehicle) return false;

      // Status filter
      if (filterStatus && lr.status !== filterStatus) return false;

      // POD Status filter
      if (filterPodStatus === 'PENDING' && (lr.podStatus === 'UPLOADED' || lr.podStatus === 'VERIFIED')) return false;
      if (filterPodStatus === 'UPLOADED' && lr.podStatus !== 'UPLOADED' && lr.podStatus !== 'VERIFIED') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          lr.lrNumber.toLowerCase().includes(q) ||
          lr.consignorName.toLowerCase().includes(q) ||
          lr.consigneeName.toLowerCase().includes(q) ||
          lr.fromLocation.toLowerCase().includes(q) ||
          lr.toLocation.toLowerCase().includes(q) ||
          lr.vehicleNumber.toLowerCase().includes(q) ||
          (lr.eWayBillNo && lr.eWayBillNo.toLowerCase().includes(q)) ||
          lr.items.some((i) => i.description.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    lrs,
    filterBranch,
    dateFrom,
    dateTo,
    filterConsignor,
    filterConsignee,
    filterVehicle,
    filterStatus,
    searchQuery,
  ]);

  const handleExportLRsExcel = () => {
    const periodLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : dateTo ? `upto_${dateTo}` : 'ALL';
    const periodSubtitle = dateFrom && dateTo ? `कालावधी (Period): ${dateFrom} ते ${dateTo}` : 'कालावधी: सर्व रेकॉर्ड्स (All Time)';

    exportToExcel(
      {
        title: `LR Booking Register (${periodSubtitle})`,
        filename: `LR_Register_${periodLabel}`,
        headers: [
          'LR Number',
          'Date',
          'Branch',
          'Consignor',
          'Consignee',
          'From',
          'To',
          'Vehicle No',
          'Packages',
          'Actual Wt (kg)',
          'Charged Wt (kg)',
          'Grand Total (₹)',
          'Payment Mode',
          'Status',
        ],
        rows: filteredLRs.map((l) => [
          l.lrNumber,
          l.bookingDate,
          l.branchCode,
          l.consignorName,
          l.consigneeName,
          l.fromLocation,
          l.toLocation,
          l.vehicleNumber || '—',
          l.totalQuantity,
          l.totalActualWeight,
          l.totalChargeWeight,
          l.charges?.grandTotal || 0,
          l.paymentMode,
          l.status,
        ]),
        summaryStats: [
          { label: 'निवडलेला कालावधी (Date Period)', value: dateFrom && dateTo ? `${dateFrom} ते ${dateTo}` : 'सर्व कालावधी' },
          { label: 'Total Consignments (एकूण LR)', value: `${filteredLRs.length} LRs` },
          {
            label: 'Total Freight (एकूण भाडे)',
            value: `₹${filteredLRs
              .reduce((s, l) => s + (l.charges?.grandTotal || 0), 0)
              .toLocaleString('en-IN')}`,
          },
        ],
        dateRange: { start: dateFrom, end: dateTo },
        branch: filterBranch,
      },
      companyProfile || StorageService.getCompanyProfile()
    );
  };

  const handleExportLRsPDF = () => {
    const periodLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : dateTo ? `upto_${dateTo}` : 'ALL';
    const periodSubtitle = dateFrom && dateTo ? `कालावधी (Period): ${dateFrom} ते ${dateTo}` : 'कालावधी: सर्व रेकॉर्ड्स (All Time)';

    exportToPDF(
      {
        title: `Consignment Register (${periodSubtitle})`,
        filename: `LR_Register_${periodLabel}`,
        headers: [
          'LR Number',
          'Date',
          'Branch',
          'Consignor',
          'Consignee',
          'Route',
          'Pkgs',
          'Actual Wt',
          'Grand Total (₹)',
          'Payment',
          'Status',
        ],
        rows: filteredLRs.map((l) => [
          l.lrNumber,
          l.bookingDate,
          l.branchCode,
          l.consignorName,
          l.consigneeName,
          `${l.fromLocation} → ${l.toLocation}`,
          l.totalQuantity,
          l.totalActualWeight,
          l.charges?.grandTotal || 0,
          l.paymentMode,
          l.status,
        ]),
        summaryStats: [
          { label: 'निवडलेला कालावधी (Period)', value: dateFrom && dateTo ? `${dateFrom} ते ${dateTo}` : 'सर्व कालावधी' },
          { label: 'Total Consignments (एकूण LR)', value: `${filteredLRs.length} LRs` },
          {
            label: 'Total Freight (एकूण भाडे)',
            value: `₹${filteredLRs
              .reduce((s, l) => s + (l.charges?.grandTotal || 0), 0)
              .toLocaleString('en-IN')}`,
          },
        ],
        dateRange: { start: dateFrom, end: dateTo },
        branch: filterBranch,
      },
      companyProfile || StorageService.getCompanyProfile()
    );
  };

  const handleConfirmCancel = () => {
    if (!cancellingLR) return;
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancelling this consignment.');
      return;
    }
    onCancelLR(cancellingLR.id, cancellationReason);
    setCancellingLR(null);
    setCancellationReason('');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white rounded-xl p-1 border-2 border-amber-400 shadow-xs flex items-center justify-center flex-shrink-0">
            <img
              src="/company_logo.jpg"
              alt="Chakan Transport Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                Central Master Register
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredLRs.length} of {lrs.length} Consignments
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              LR BOOKING REGISTER
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete database of all booked, dispatched, and delivered freight consignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={handleExportLRsExcel}
            id="btn-register-export-excel"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Download Filtered LRs as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>EXCEL</span>
          </button>

          {/* PDF EXPORT BUTTON */}
          <button
            onClick={handleExportLRsPDF}
            id="btn-register-export-pdf"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Download Filtered LRs as PDF (.pdf)"
          >
            <FileText className="w-4 h-4 text-rose-100" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => {
              if (selectedLRIds.length > 0) {
                const selected = lrs.filter((l) => selectedLRIds.includes(l.id));
                onPrintMultipleLRs(selected);
              } else {
                setQuickPrintModalOpen(true);
              }
            }}
            id="btn-register-print-lr"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Print LR / Bilty on A4 Paper (3 on 1)"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>PRINT LR (A4 3-IN-1)</span>
          </button>

          {canModifyLR && (
            <button
              onClick={() => {
                if (onOpenAdminEditLR) {
                  onOpenAdminEditLR();
                } else {
                  // Fallback: search query or first match
                  const lrNo = prompt('एडिट करण्यासाठी LR नंबर प्रविष्ट करा (उदा. LR-CHK-2026-00001):');
                  if (lrNo && lrNo.trim()) {
                    const query = lrNo.trim().toLowerCase();
                    const found = lrs.find(
                      (l) => l.lrNumber.toLowerCase() === query || l.lrNumber.toLowerCase().includes(query)
                    );
                    if (found) {
                      onEditLR(found);
                    } else {
                      alert(`LR '${lrNo}' सापडली नाही. कृपया LR नंबर बरोबर आहे का ते तपासा.`);
                    }
                  }
                }
              }}
              id="btn-admin-edit-lr-search"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer border border-emerald-400"
              title="Quick Search & Edit Consignment LR (Admin Authorized)"
            >
              <Edit className="w-4 h-4 text-white" />
              <span>EDIT LR (LR संपादित करा)</span>
            </button>
          )}

          {canCreateLR && (
            <button
              onClick={onNewLR}
              id="btn-register-new-lr"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ NEW LR ENTRY</span>
            </button>
          )}
        </div>
      </div>

      {/* LR MODIFICATION RESTRICTION BANNER FOR NON-ADMIN USERS */}
      {!canModifyLR && (
        <div className="bg-amber-50/90 border border-amber-300 text-amber-950 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide flex items-center gap-2">
                <span>LR Modification Restricted</span>
                <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                  Admin Only Access
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Modifying, correcting rates, or cancelling existing booked LRs is strictly restricted. Only System Administrator (KUDKE BALIRAM) has modification authority.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-mono font-bold bg-white text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
            Role: {currentUser.role}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3) कालवधीनुसार LR दाखवा आणि EXCEL / PDF डाऊनलोड करा (PERIOD FILTER & DOWNLOAD BAR) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                कालावधीनुसार LR रिपोर्ट व डाऊनलोड (DATE PERIOD &amp; EXPORT)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              खाली दिलेल्या पर्यायांतून कालावधी निवडा — निवडलेल्या तारखांमधील सर्व LR स्क्रीनवर दिसतील व लगेच Excel किंवा PDF फाईल डाऊनलोड करता येईल.
            </p>
          </div>

          {/* Direct Download Buttons for Selected Period */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportLRsExcel}
              id="btn-period-download-excel"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-900/40 active:scale-95 transition cursor-pointer border border-emerald-400"
              title="निवडलेल्या कालावधीची Excel फाईल डाउनलोड करा"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>EXCEL डाऊनलोड (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportLRsPDF}
              id="btn-period-download-pdf"
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-900/40 active:scale-95 transition cursor-pointer border border-rose-400"
              title="निवडलेल्या कालावधीची PDF फाईल डाउनलोड करा"
            >
              <FileText className="w-4 h-4 text-rose-200" />
              <span>PDF डाऊनलोड (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Quick Period Buttons & Date Pickers */}
        <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>कालावधी:</span>
            </span>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'TODAY'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              आज (Today)
            </button>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'YESTERDAY'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              काल (Yesterday)
            </button>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('THIS_WEEK')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'THIS_WEEK'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              चालू आठवडा (This Week)
            </button>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'THIS_MONTH'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              चालू महिना (This Month)
            </button>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'LAST_MONTH'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              मागील महिना (Last Month)
            </button>

            <button
              type="button"
              onClick={() => handleApplyDatePreset('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeDatePreset === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              सर्व कालावधी (All Time)
            </button>
          </div>

          {/* Custom Date Pickers & Summary */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
                className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              />
              <span className="text-slate-500">→</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
                className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Selected Period Status Pill */}
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">📍 निवडलेला कालावधी:</span>
            <span>
              {dateFrom && dateTo
                ? `${dateFrom} ते ${dateTo}`
                : dateFrom
                ? `${dateFrom} पासून पुढे`
                : dateTo
                ? `${dateTo} पर्यंत`
                : 'सर्व कालावधी (All Time)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              एकूण LR: <strong className="text-white text-sm">{filteredLRs.length}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              एकूण भाडे: <strong className="text-emerald-400 text-sm">₹{filteredLRs.reduce((s, l) => s + (l.charges?.grandTotal || 0), 0).toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filters & Search Query</span>
          </div>
          <button
            onClick={handleReset}
            id="btn-register-reset"
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET ALL</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Search Anything</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="LR No, Party, City, Vehicle..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="IN TRANSIT">IN TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* POD Status Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">POD Status</label>
            <select
              value={filterPodStatus}
              onChange={(e) => setFilterPodStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold"
            >
              <option value="">All POD Statuses</option>
              <option value="PENDING">POD Pending (पावती बाकी)</option>
              <option value="UPLOADED">POD Uploaded (पावती प्राप्त)</option>
            </select>
          </div>

          {/* Consignor Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Consignor (Sender)</label>
            <select
              value={filterConsignor}
              onChange={(e) => setFilterConsignor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="">All Consignors</option>
              {consignorsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Consignee Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Consignee (Receiver)</label>
            <select
              value={filterConsignee}
              onChange={(e) => setFilterConsignee(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="">All Consignees</option>
              {consigneesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Vehicle</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="">All Vehicles</option>
              {vehiclesList.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BATCH PRINT BAR (When LRs selected) */}
      {selectedLRIds.length > 0 && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl border border-amber-600 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm font-mono">
              {selectedLRIds.length}
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide">
                {selectedLRIds.length === 3
                  ? '3 LRs Selected — Ready for 1 Single A4 Sheet Print!'
                  : `${selectedLRIds.length} / 3 LRs Selected for Single A4 Page`}
              </div>
              <div className="text-[11px] text-slate-900 font-medium">
                {selectedLRIds.length < 3
                  ? `Select ${3 - selectedLRIds.length} more LR(s) to fill all 3 slots on the A4 page`
                  : 'All 3 slots ready to print together on 1 sheet with scissor tear lines'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = lrs.filter((l) => selectedLRIds.includes(l.id));
                if (onPrintMultipleLRs) {
                  onPrintMultipleLRs(selected);
                } else {
                  onPrintLR(selected[0]);
                }
              }}
              id="btn-print-selected-3-lrs"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs rounded-lg shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT {selectedLRIds.length} LR(S) ON 1 A4 SHEET</span>
            </button>
            <button
              onClick={() => setSelectedLRIds([])}
              className="text-xs font-bold text-slate-950 hover:underline px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full max-w-full min-w-0">
        <div className="overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-2 text-center w-10">
                  <span className="sr-only">Select</span>
                  <span className="text-[9px] text-slate-400">#</span>
                </th>
                <th className="py-3 px-3">LR No.</th>
                <th className="py-3 px-3">Booking Date</th>
                <th className="py-3 px-2 text-center">Branch</th>
                <th className="py-3 px-3">Consignor</th>
                <th className="py-3 px-3">Consignee</th>
                <th className="py-3 px-3">Route (From → To)</th>
                <th className="py-3 px-3">Vehicle No.</th>
                <th className="py-3 px-2 text-center">Payment</th>
                <th className="py-3 px-2 text-center">Delivery</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Actual Wt</th>
                <th className="py-3 px-2 text-right">Charge Wt</th>
                <th className="py-3 px-3 text-right">Freight (₹)</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">POD</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLRs.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <span className="font-semibold text-sm">No consignment records found matching criteria.</span>
                      <button
                        onClick={handleReset}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLRs.map((lr) => {
                  const isCancelled = lr.status === 'CANCELLED';
                  const isSelected = selectedLRIds.includes(lr.id);
                  return (
                    <tr
                      key={lr.id}
                      className={`hover:bg-blue-50/40 transition ${
                        isSelected ? 'bg-amber-50/80 font-medium' : ''
                      } ${isCancelled ? 'bg-rose-50/40 opacity-70' : ''}`}
                    >
                      {/* Checkbox for 3-on-1 A4 sheet selection */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedLRIds.length >= 3) {
                                alert('You can select up to 3 LRs to fit onto 1 single A4 sheet.');
                                return;
                              }
                              setSelectedLRIds([...selectedLRIds, lr.id]);
                            } else {
                              setSelectedLRIds(selectedLRIds.filter((id) => id !== lr.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                          title="Select for 3 LRs on 1 A4 Sheet print"
                        />
                      </td>

                      {/* LR No. */}
                      <td className="py-2.5 px-3 font-mono font-black text-blue-700 whitespace-nowrap">
                        {lr.lrNumber}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{lr.bookingDate}</td>

                      {/* Branch */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {lr.branchCode}
                        </span>
                      </td>

                      {/* Consignor */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[140px] truncate" title={lr.consignorName}>
                        {lr.consignorName}
                      </td>

                      {/* Consignee */}
                      <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate" title={lr.consigneeName}>
                        {lr.consigneeName}
                      </td>

                      {/* Route */}
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {lr.fromLocation} → {lr.toLocation}
                      </td>

                      {/* Vehicle */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap">
                        {lr.vehicleNumber || '—'}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            lr.paymentMode === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lr.paymentMode === 'TO PAY'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lr.paymentMode}
                        </span>
                      </td>

                      {/* Delivery Type */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap text-[10px] text-slate-600 font-medium">
                        {lr.deliveryType === 'DOOR DELIVERY' ? 'Door' : 'Godown'}
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                        {lr.totalQuantity}
                      </td>

                      {/* Actual Wt */}
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {lr.totalActualWeight} kg
                      </td>

                      {/* Charge Wt */}
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {lr.totalChargeWeight} kg
                      </td>

                      {/* Freight */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        ₹{(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            lr.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lr.status === 'IN TRANSIT'
                              ? 'bg-amber-100 text-amber-900'
                              : lr.status === 'DISPATCHED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : lr.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lr.status}
                        </span>
                      </td>

                      {/* POD Status */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {lr.podStatus === 'UPLOADED' || lr.podStatus === 'VERIFIED' ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                            title="Proof of Delivery Uploaded & Acknowledged"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-700" />
                            <span>UPLOADED</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                            title="POD Pending (Waiting for signed receipt)"
                          >
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* TRACK & POD */}
                          {onTrackLR && (
                            <button
                              onClick={() => onTrackLR(lr)}
                              id={`btn-lr-track-${lr.id}`}
                              title="Track Consignment Journey & Upload POD"
                              className="flex items-center gap-1 px-2 py-0.5 text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded text-[10px] font-black transition cursor-pointer shadow-2xs"
                            >
                              <Truck className="w-3 h-3 text-blue-800" />
                              <span>TRACK & POD</span>
                            </button>
                          )}

                          {/* VIEW */}
                          <button
                            onClick={() => onViewLR(lr)}
                            id={`btn-lr-view-${lr.id}`}
                            title="VIEW LR Details"
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* EDIT (ADMIN ONLY OR PERMITTED) */}
                          {canModifyLR && !isCancelled ? (
                            <button
                              onClick={() => onEditLR(lr)}
                              id={`btn-lr-edit-${lr.id}`}
                              title="Edit LR (Admin Authorized)"
                              className="flex items-center gap-1 px-2 py-0.5 text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-500 rounded text-[10px] font-black transition cursor-pointer shadow-2xs"
                            >
                              <Edit className="w-3 h-3 text-emerald-800" />
                              <span>EDIT LR</span>
                            </button>
                          ) : !isCancelled ? (
                            <button
                              onClick={() => {
                                alert(
                                  `LR संपादन केवळ सिस्टीम ॲडमिन (Admin) यांनाच अनुमत आहे. कोणतीही LR ही ॲडमिन शिवाय एडिट करता येत नाही. कृपया ॲडमिनशी संपर्क साधा.`
                                );
                              }}
                              id={`btn-lr-edit-locked-${lr.id}`}
                              title="LR Modification Restricted (Only Admin Can Modify)"
                              className="flex items-center gap-1 px-1.5 py-0.5 text-slate-400 bg-slate-100 border border-slate-300 rounded text-[9px] font-bold cursor-pointer"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>LOCKED</span>
                            </button>
                          ) : null}

                          {/* PRINT / PDF */}
                          <button
                            onClick={() => onPrintLR(lr)}
                            id={`btn-lr-print-${lr.id}`}
                            title="Save as PDF or Print A4 3-in-1 Consignment Document"
                            className="flex items-center gap-1 px-2 py-0.5 text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-400 rounded text-[10px] font-black transition cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3 h-3 text-amber-900" />
                            <span>PDF / PRINT</span>
                          </button>

                          {/* CANCEL / SOFT DELETE (ADMIN ONLY) */}
                          {canCancelLR && !isCancelled && (
                            <button
                              onClick={() => setCancellingLR(lr)}
                              id={`btn-lr-cancel-action-${lr.id}`}
                              title="Cancel Consignment (Admin Authorized)"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* PURGE (MASTER ADMIN ONLY) */}
                          {canDeleteLR && isAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Admin Purge: Are you sure you want to permanently delete LR ${lr.lrNumber}? This will be permanently recorded in security audit.`
                                  )
                                ) {
                                  onPurgeLR(lr.id);
                                }
                              }}
                              id={`btn-lr-purge-${lr.id}`}
                              title="Permanent Purge (Master Admin Only)"
                              className="p-1 text-slate-300 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCEL MODAL */}
      {cancellingLR && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Consignment: {cancellingLR.lrNumber}</span>
            </div>

            <p className="text-xs text-slate-600">
              Transaction records are retained in compliance with transport audit rules. This entry will be marked as CANCELLED with your name, timestamp, and explanation.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Cancellation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Order cancelled by consignor / Wrong vehicle allocated"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingLR(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded shadow"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK LR PRINT MODAL */}
      {quickPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[85vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-sm text-white">SELECT LR TO PRINT (A4 3-IN-1)</h3>
                  <p className="text-[11px] text-slate-400">Click any LR to open print view with company red header & QR code</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickPrintModalOpen(false);
                  setQuickPrintSearch('');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <input
                  type="text"
                  value={quickPrintSearch}
                  onChange={(e) => setQuickPrintSearch(e.target.value)}
                  placeholder="Quick search by LR Number, Consignor, Consignee, Vehicle..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh] divide-y divide-slate-100">
              {lrs
                .filter((lr) => {
                  if (!quickPrintSearch.trim()) return true;
                  const q = quickPrintSearch.toLowerCase();
                  return (
                    lr.lrNumber.toLowerCase().includes(q) ||
                    lr.consignorName.toLowerCase().includes(q) ||
                    lr.consigneeName.toLowerCase().includes(q) ||
                    lr.vehicleNumber.toLowerCase().includes(q)
                  );
                })
                .slice(0, 15)
                .map((lr) => (
                  <div
                    key={lr.id}
                    onClick={() => {
                      setQuickPrintModalOpen(false);
                      setQuickPrintSearch('');
                      onPrintLR(lr);
                    }}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-amber-50/70 rounded-lg cursor-pointer transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-900 group-hover:text-amber-800">
                          {lr.lrNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lr.bookingDate}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700">
                          {lr.paymentMode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-semibold mt-0.5">
                        {lr.consignorName} → {lr.consigneeName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lr.fromLocation} → {lr.toLocation} • {lr.totalQuantity} Pkgs • {lr.totalActualWeight} kg
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="font-mono text-xs font-black text-slate-900">
                        ₹{(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg shadow-xs">
                        <Printer className="w-3 h-3" />
                        PRINT
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setQuickPrintModalOpen(false);
                  setQuickPrintSearch('');
                }}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
