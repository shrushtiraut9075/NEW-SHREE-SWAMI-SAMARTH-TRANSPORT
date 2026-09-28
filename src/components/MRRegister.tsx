import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Printer,
  X,
  Building2,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { MRRecord, LRRecord, Branch, User, CompanyProfile } from '../types';
import { exportToExcel, exportToPDF } from '../services/reportExport';

interface MRRegisterProps {
  mrs: MRRecord[];
  lrs: LRRecord[];
  branches: Branch[];
  selectedBranch: string;
  onNewMR: () => void;
  onEditMR: (mr: MRRecord) => void;
  onPrintMR?: (mr: MRRecord) => void;
  currentUser: User;
  companyProfile: CompanyProfile;
}

const getTodayISO = () => new Date().toISOString().split('T')[0];

const getFirstDayOfCurrentMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const MRRegister: React.FC<MRRegisterProps> = ({
  mrs = [],
  lrs = [],
  branches = [],
  selectedBranch,
  onNewMR,
  onEditMR,
  onPrintMR,
  currentUser,
  companyProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState(selectedBranch || 'ALL');
  const [viewingMR, setViewingMR] = useState<MRRecord | null>(null);

  // Date range filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'ALL' | 'THIS_MONTH' | 'TODAY'>('ALL');

  const setFilterToday = () => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
    setActivePreset('TODAY');
  };

  const setFilterThisMonth = () => {
    setStartDate(getFirstDayOfCurrentMonth());
    setEndDate(getTodayISO());
    setActivePreset('THIS_MONTH');
  };

  const setFilterAll = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset('ALL');
  };

  const filteredMRs = useMemo(() => {
    return (mrs || []).filter((mr) => {
      if (!mr) return false;
      if (filterBranch !== 'ALL' && mr.branchCode !== filterBranch) return false;

      // Date range filtering
      if (startDate && mr.date && mr.date < startDate) return false;
      if (endDate && mr.date && mr.date > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mrNo = (mr.mrNumber || '').toLowerCase();
        const vehNo = (mr.vehicleNumber || '').toLowerCase();
        const drv = (mr.driverName || '').toLowerCase();
        const fromB = (mr.fromBranch || '').toLowerCase();
        const toB = (mr.toBranch || '').toLowerCase();
        const lhsN = (mr.lhsNo || '').toLowerCase();

        return (
          mrNo.includes(q) ||
          vehNo.includes(q) ||
          drv.includes(q) ||
          fromB.includes(q) ||
          toB.includes(q) ||
          lhsN.includes(q)
        );
      }
      return true;
    });
  }, [mrs, filterBranch, startDate, endDate, searchQuery]);

  const getAttachedLRs = (mr: MRRecord) => {
    if (!mr) return [];
    const ids = mr.lrIds || mr.selectedLrIds || [];
    const numbers = mr.selectedLrNumbers || [];
    return (lrs || []).filter(
      (l) =>
        ids.includes(l.id) ||
        ids.includes(l.lrNumber) ||
        numbers.includes(l.lrNumber)
    );
  };

  const handleExportMRExcel = () => {
    const dateRangeLabel =
      startDate || endDate
        ? ` (${startDate || 'Start'} to ${endDate || 'Today'})`
        : '';

    exportToExcel(
      {
        title: `Trip Manifest (MR) Register${dateRangeLabel}`,
        filename: 'MR_Register',
        headers: [
          'MR Number',
          'Date',
          'Branch',
          'Vehicle No',
          'Driver Name',
          'From Hub',
          'To Hub',
          'LHS Number',
          'LRs Count',
          'Packages',
          'Total Weight (kg)',
          'Total Freight (₹)',
        ],
        rows: filteredMRs.map((m) => [
          m.mrNumber || '',
          m.date || '',
          m.branchName || m.branchCode || '',
          m.vehicleNumber || '',
          m.driverName || '',
          m.fromBranch || '',
          m.toBranch || '',
          m.lhsNo || 'Pending LHS',
          m.totalLRs || (m.lrIds || []).length || 0,
          m.totalPackages || 0,
          m.totalWeight || 0,
          m.totalFreight || 0,
        ]),
        summaryStats: [
          { label: 'Total Manifests', value: `${filteredMRs.length} MRs` },
          {
            label: 'Total Freight',
            value: `₹${filteredMRs
              .reduce((s, m) => s + (m.totalFreight || 0), 0)
              .toLocaleString('en-IN')}`,
          },
        ],
        branch: filterBranch,
      },
      companyProfile
    );
  };

  const handleExportMRPDF = () => {
    const dateRangeLabel =
      startDate || endDate
        ? ` (${startDate || 'Start'} to ${endDate || 'Today'})`
        : '';

    exportToPDF(
      {
        title: `Trip Manifest (MR) Register${dateRangeLabel}`,
        filename: 'MR_Register',
        headers: [
          'MR Number',
          'Date',
          'Branch',
          'Vehicle No',
          'Driver Name',
          'Route',
          'LHS No',
          'LRs',
          'Pkgs',
          'Weight',
          'Total Freight (₹)',
        ],
        rows: filteredMRs.map((m) => [
          m.mrNumber || '',
          m.date || '',
          m.branchName || m.branchCode || '',
          m.vehicleNumber || '',
          m.driverName || '',
          `${m.fromBranch || ''} → ${m.toBranch || ''}`,
          m.lhsNo || 'Pending',
          m.totalLRs || (m.lrIds || []).length || 0,
          m.totalPackages || 0,
          `${m.totalWeight || 0} kg`,
          m.totalFreight || 0,
        ]),
        summaryStats: [
          { label: 'Total Manifests', value: `${filteredMRs.length} MRs` },
          {
            label: 'Total Freight',
            value: `₹${filteredMRs
              .reduce((s, m) => s + (m.totalFreight || 0), 0)
              .toLocaleString('en-IN')}`,
          },
        ],
        branch: filterBranch,
      },
      companyProfile
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Trip Manifests (MR)
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {filteredMRs.length} Records
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            TRIP MANIFEST (MR) REGISTER
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Godown dispatch manifests, consolidated consignments & vehicle trip vouchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={handleExportMRExcel}
            id="btn-mr-export-excel"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Download Filtered MR as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>EXCEL</span>
          </button>

          {/* PDF EXPORT BUTTON */}
          <button
            onClick={handleExportMRPDF}
            id="btn-mr-export-pdf"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Download Filtered MR as PDF (.pdf)"
          >
            <FileText className="w-4 h-4 text-rose-100" />
            <span>PDF</span>
          </button>

          <button
            onClick={onNewMR}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ NEW MR ENTRY</span>
          </button>
        </div>
      </div>

      {/* Date Range & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search MR number, vehicle, driver, route, LHS number..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Branch:</span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Presets & Custom Date Range */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>कालावधी (Period):</span>
            </span>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={setFilterToday}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  activePreset === 'TODAY'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                आज (Today)
              </button>
              <button
                type="button"
                onClick={setFilterThisMonth}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  activePreset === 'THIS_MONTH'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                चालू महिना (This Month)
              </button>
              <button
                type="button"
                onClick={setFilterAll}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  activePreset === 'ALL'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सर्व (All Time)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('ALL');
                }}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('ALL');
                }}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={setFilterAll}
                className="text-[11px] text-slate-500 hover:text-rose-600 underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full max-w-full min-w-0">
        <div className="overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">MR Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-2 text-center">Branch</th>
                <th className="py-3 px-3">Vehicle No.</th>
                <th className="py-3 px-3">Driver Name</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-2 text-center">LRs</th>
                <th className="py-3 px-2 text-center">Packages</th>
                <th className="py-3 px-2 text-right">Weight</th>
                <th className="py-3 px-3 text-right">Freight (₹)</th>
                <th className="py-3 px-2 text-center">Stock / LHS Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMRs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    कोणतेही Manifests (MR) सापडले नाहीत.
                  </td>
                </tr>
              ) : (
                filteredMRs.map((mr) => {
                  const isLoadedInLHS = !!mr.lhsNo;
                  return (
                    <tr key={mr.id} className="hover:bg-sky-50/40 transition">
                      <td className="py-2.5 px-3 font-mono font-black text-sky-800 whitespace-nowrap">
                        {mr.mrNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{mr.date}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {mr.branchCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {mr.vehicleNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">{mr.driverName || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {mr.fromBranch} → {mr.toBranch}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-700">
                        {mr.totalLRs || (mr.lrIds || []).length || 0}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">{mr.totalPackages || 0}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {mr.totalWeight || 0} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(mr.totalFreight || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {isLoadedInLHS ? (
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200"
                            title={`Loaded in ${mr.lhsNo}`}
                          >
                            LHS: {mr.lhsNo}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            MR Stock (Pending LHS)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingMR(mr)}
                            title="View Manifest & Attached LRs"
                            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onPrintMR && (
                            <button
                              onClick={() => onPrintMR(mr)}
                              title="Print Manifest / MR (A4)"
                              className="p-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditMR(mr)}
                            title="Edit Manifest"
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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

      {/* VIEW MR MODAL */}
      {viewingMR && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] text-sky-400 font-mono font-bold uppercase">
                  Trip Manifest Details
                </span>
                <h2 className="text-lg font-black font-mono text-white">{viewingMR.mrNumber}</h2>
              </div>
              <button
                onClick={() => setViewingMR(null)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Vehicle:</span>
                  <strong className="font-mono text-slate-900">{viewingMR.vehicleNumber || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Driver:</span>
                  <strong className="text-slate-900">{viewingMR.driverName || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Freight:</span>
                  <strong className="font-mono text-slate-900">
                    ₹{(viewingMR.totalFreight || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Status / LHS:</span>
                  {viewingMR.lhsNo ? (
                    <strong className="font-mono text-indigo-700">Loaded: {viewingMR.lhsNo}</strong>
                  ) : (
                    <strong className="text-amber-700">MR Stock (Pending LHS)</strong>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-xs mb-2 uppercase">
                  Attached Consignments ({viewingMR.totalLRs || (viewingMR.lrIds || []).length || 0} LRs)
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <th className="py-2 px-3">LR Number</th>
                        <th className="py-2 px-3">Consignor</th>
                        <th className="py-2 px-3">Consignee</th>
                        <th className="py-2 px-2 text-center">Pkgs</th>
                        <th className="py-2 px-2 text-right">Actual Wt</th>
                        <th className="py-2 px-3 text-right">To-Pay (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getAttachedLRs(viewingMR).map((lr) => {
                        const isToPay = (lr.paymentMode || '').toUpperCase().trim() === 'TO PAY';
                        return (
                          <tr key={lr.id}>
                            <td className="py-2 px-3 font-mono font-bold text-sky-800">
                              {lr.lrNumber}
                            </td>
                            <td className="py-2 px-3 text-slate-800">{lr.consignorName}</td>
                            <td className="py-2 px-3 text-slate-700">{lr.consigneeName}</td>
                            <td className="py-2 px-2 text-center font-mono">{lr.totalQuantity}</td>
                            <td className="py-2 px-2 text-right font-mono">{lr.totalActualWeight} kg</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {isToPay ? (
                                `₹${(lr.charges?.grandTotal || 0).toLocaleString('en-IN')}`
                              ) : (
                                <span className="text-slate-400">₹0 ({lr.paymentMode})</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                {onPrintMR ? (
                  <button
                    onClick={() => {
                      const toPrint = viewingMR;
                      setViewingMR(null);
                      onPrintMR(toPrint);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT MANIFEST (A4)</span>
                  </button>
                ) : <div />}
                <button
                  onClick={() => setViewingMR(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
