import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  PackageCheck,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  BookOpen,
} from 'lucide-react';
import { StockTransferRecord, LRRecord, MRRecord, LHSRecord, Branch, User } from '../types';
import { StorageService } from '../services/storage';

interface StockOperationsProps {
  viewMode: 'REGISTER' | 'TRANSFER_ENTRY' | 'TRANSFER_REGISTER';
  stockTransfers: StockTransferRecord[];
  lrs: LRRecord[];
  mrs?: MRRecord[];
  lhsList?: LHSRecord[];
  branches: Branch[];
  selectedBranch: string;
  onNavigate: (mode: any) => void;
  onTransferCreated: (newTransfer: StockTransferRecord) => void;
  onUpdateTransferStatus: (id: string, newStatus: any) => void;
  currentUser: User;
}

export const StockOperations: React.FC<StockOperationsProps> = ({
  viewMode,
  stockTransfers,
  lrs,
  mrs,
  lhsList,
  branches,
  selectedBranch,
  onNavigate,
  onTransferCreated,
  onUpdateTransferStatus,
  currentUser,
}) => {
  const [stockStageFilter, setStockStageFilter] = useState<'ALL' | 'BOOKING' | 'MR' | 'LHS'>('ALL');

  const allMRs = mrs || StorageService.getMRs();
  const allLHS = lhsList || StorageService.getLHS();

  // 1. Booking Stock: LRs booked, NOT yet manifested in any MR
  const bookingStockLRs = useMemo(() => {
    return lrs.filter((l) => {
      if (l.status === 'CANCELLED' || l.status === 'DELIVERED') return false;
      const isInMR = allMRs.some((m) =>
        m.status !== 'CANCELLED' &&
        (m.lrIds?.includes(l.id) || m.lrIds?.includes(l.lrNumber) || m.selectedLrIds?.includes(l.id))
      );
      const isInLHS = allLHS.some((lhs) =>
        lhs.lrIds?.includes(l.id) || lhs.lrIds?.includes(l.lrNumber) || lhs.selectedLrIds?.includes(l.id)
      );
      return !isInMR && !isInLHS;
    });
  }, [lrs, allMRs, allLHS]);

  // 2. MR Stock: LRs in MR manifests that are NOT yet loaded into an LHS
  const mrStockLRs = useMemo(() => {
    return lrs.filter((l) => {
      if (l.status === 'CANCELLED' || l.status === 'DELIVERED') return false;
      const matchingMR = allMRs.find((m) =>
        m.status !== 'CANCELLED' &&
        (m.lrIds?.includes(l.id) || m.lrIds?.includes(l.lrNumber) || m.selectedLrIds?.includes(l.id))
      );
      if (!matchingMR) return false;
      // Not yet in an LHS
      const isInLHS = allLHS.some((lhs) =>
        (matchingMR.lhsNo && matchingMR.lhsNo.trim() !== '') ||
        lhs.selectedMrIds?.includes(matchingMR.id) ||
        lhs.selectedMrIds?.includes(matchingMR.mrNumber) ||
        lhs.lrIds?.includes(l.id) ||
        lhs.selectedLrIds?.includes(l.id)
      );
      return !isInLHS;
    });
  }, [lrs, allMRs, allLHS]);

  // 3. LHS Stock: LRs loaded onto vehicles & dispatched in LHS
  const lhsStockLRs = useMemo(() => {
    return lrs.filter((l) => {
      if (l.status === 'CANCELLED' || l.status === 'DELIVERED') return false;
      return allLHS.some((lhs) =>
        lhs.lrIds?.includes(l.id) || lhs.lrIds?.includes(l.lrNumber) || lhs.selectedLrIds?.includes(l.id)
      );
    });
  }, [lrs, allLHS]);

  const activeLRsForDisplay = useMemo(() => {
    if (stockStageFilter === 'BOOKING') return bookingStockLRs;
    if (stockStageFilter === 'MR') return mrStockLRs;
    if (stockStageFilter === 'LHS') return lhsStockLRs;
    return lrs.filter((l) => l.status !== 'DELIVERED' && l.status !== 'CANCELLED');
  }, [stockStageFilter, bookingStockLRs, mrStockLRs, lhsStockLRs, lrs]);
  // Transfer Form State
  const [transferNo, setTransferNo] = useState(
    `ST-${Date.now().toString().slice(-5)}`
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromBranch, setFromBranch] = useState(
    selectedBranch !== 'ALL' ? selectedBranch : 'CHK - Chakan Central Hub'
  );
  const [toBranch, setToBranch] = useState('MUM - Mumbai Hub');
  const [selectedLrId, setSelectedLrId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Search in transfer register
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Form Submit
  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLrId) {
      setError('Please select a consignment to transfer.');
      return;
    }

    const matchedLR = lrs.find((l) => l.id === selectedLrId);
    if (!matchedLR) {
      setError('Selected consignment not found in database.');
      return;
    }

    const newTransfer: StockTransferRecord = {
      id: `st-${Date.now()}`,
      transferNumber: transferNo,
      date,
      fromBranch,
      toBranch,
      lrId: matchedLR.id,
      lrNumber: matchedLR.lrNumber,
      packagesCount: matchedLR.totalQuantity,
      weightKg: matchedLR.totalActualWeight,
      vehicleNumber: vehicleNumber.toUpperCase(),
      driverName,
      status: 'In Transit',
      transferredBy: currentUser.username,
      createdBy: currentUser.username,
      remarks,
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = StorageService.saveStockTransfer(newTransfer);
      onTransferCreated(saved);
      onNavigate('STOCK_TRANSFER_REGISTER');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Storage error';
      setError(`Failed to save transfer: ${errorMsg}`);
    }
  };

  // Filter transfers
  const filteredTransfers = stockTransfers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.transferNumber.toLowerCase().includes(q) ||
      t.lrNumber.toLowerCase().includes(q) ||
      t.fromBranch.toLowerCase().includes(q) ||
      t.toBranch.toLowerCase().includes(q) ||
      (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Tab Switcher Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Stock Operations
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Inter-Hub Transfers & Inventory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {viewMode === 'REGISTER'
              ? 'HUB STOCK REGISTER'
              : viewMode === 'TRANSFER_ENTRY'
              ? 'NEW STOCK TRANSFER'
              : 'STOCK TRANSFER REGISTER'}
          </h1>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => onNavigate('STOCK_REGISTER')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Register
          </button>
          {currentUser.role !== 'VIEWER' && (
            <button
              onClick={() => onNavigate('STOCK_TRANSFER_ENTRY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'TRANSFER_ENTRY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Transfer
            </button>
          )}
          <button
            onClick={() => onNavigate('STOCK_TRANSFER_REGISTER')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'TRANSFER_REGISTER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transfer Register ({stockTransfers.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: HUB STOCK REGISTER (Current Inventory breakdown by branch) */}
      {viewMode === 'REGISTER' && (
        <div className="space-y-6">
          {/* Branch summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const branchLRs = lrs.filter(
                (l) => l.branchCode === b.code && l.status !== 'DELIVERED' && l.status !== 'CANCELLED'
              );
              const branchPkgs = branchLRs.reduce((sum, l) => sum + l.totalQuantity, 0);
              const branchWt = branchLRs.reduce((sum, l) => sum + l.totalActualWeight, 0);

              return (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span className="font-mono font-black text-sm text-slate-900">{b.code}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{b.name}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase">Stock LRs</span>
                      <span className="text-base font-black font-mono text-slate-900">
                        {branchLRs.length}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase">Packages</span>
                      <span className="text-base font-black font-mono text-teal-700">
                        {branchPkgs}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase">Weight</span>
                      <span className="text-sm font-black font-mono text-slate-800">
                        {branchWt} kg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3-Stage Transport Stock Pipeline Cards (Booking -> MR -> LHS) */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-xl text-white shadow-xs space-y-3 border border-indigo-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Transport Inventory Progression Pipeline
                </span>
                <h3 className="text-base font-black text-white">
                  स्टॉक क्रमवारी: १) Booking Stock ➔ २) MR Stock ➔ ३) LHS Stock
                </h3>
              </div>
              <span className="text-[11px] text-slate-300">
                MR बनवल्यास Booking Stock कमी होतो आणि LHS बनवल्यास MR Stock कमी होतो.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Stage 1: Booking Stock */}
              <div
                onClick={() => setStockStageFilter(stockStageFilter === 'BOOKING' ? 'ALL' : 'BOOKING')}
                className={`p-3.5 rounded-lg border transition cursor-pointer ${
                  stockStageFilter === 'BOOKING'
                    ? 'bg-blue-900/60 border-blue-400 ring-2 ring-blue-400/50'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>1. Booking Stock</span>
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-800">
                    बुकिंग स्टॉक
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {bookingStockLRs.length}{' '}
                  <span className="text-xs font-normal text-slate-300">LRs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  गोदाम आवक LRs (MR ची प्रतीक्षा)
                </div>
              </div>

              {/* Stage 2: MR Stock */}
              <div
                onClick={() => setStockStageFilter(stockStageFilter === 'MR' ? 'ALL' : 'MR')}
                className={`p-3.5 rounded-lg border transition cursor-pointer ${
                  stockStageFilter === 'MR'
                    ? 'bg-sky-900/60 border-sky-400 ring-2 ring-sky-400/50'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>2. MR Stock (Manifest)</span>
                  </span>
                  <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded font-bold border border-sky-800">
                    MR स्टॉक
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {mrStockLRs.length}{' '}
                  <span className="text-xs font-normal text-slate-300">LRs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  MR मधील LRs (LHS वाहन लोडिंग बाकी)
                </div>
              </div>

              {/* Stage 3: LHS Stock */}
              <div
                onClick={() => setStockStageFilter(stockStageFilter === 'LHS' ? 'ALL' : 'LHS')}
                className={`p-3.5 rounded-lg border transition cursor-pointer ${
                  stockStageFilter === 'LHS'
                    ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-400/50'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>3. LHS Stock (Dispatched)</span>
                  </span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-800">
                    LHS वाहन स्टॉक
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {lhsStockLRs.length}{' '}
                  <span className="text-xs font-normal text-slate-300">LRs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  वाहनात भरलेला व डिस्पॅच झालेला माल
                </div>
              </div>
            </div>
          </div>

          {/* Active Inventory List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Consignments Inventory ({activeLRsForDisplay.length} Records)
              </span>

              {/* Stage Filter Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setStockStageFilter('ALL')}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    stockStageFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  सर्व (All)
                </button>
                <button
                  type="button"
                  onClick={() => setStockStageFilter('BOOKING')}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    stockStageFilter === 'BOOKING'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  १) Booking Stock ({bookingStockLRs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockStageFilter('MR')}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    stockStageFilter === 'MR'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  २) MR Stock ({mrStockLRs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockStageFilter('LHS')}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    stockStageFilter === 'LHS'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ३) LHS Stock ({lhsStockLRs.length})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">LR Number</th>
                    <th className="py-2.5 px-3">Branch Hub</th>
                    <th className="py-2.5 px-3">Booking Date</th>
                    <th className="py-2.5 px-3">Consignor</th>
                    <th className="py-2.5 px-3">Consignee</th>
                    <th className="py-2.5 px-2 text-center">Packages</th>
                    <th className="py-2.5 px-2 text-right">Actual Wt</th>
                    <th className="py-2.5 px-2 text-center">Stock Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLRsForDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        या स्टेजमध्ये कोणताही माल उपलब्ध नाही.
                      </td>
                    </tr>
                  ) : (
                    activeLRsForDisplay.map((lr) => {
                      const isLhs = lhsStockLRs.some((l) => l.id === lr.id);
                      const isMr = mrStockLRs.some((l) => l.id === lr.id);

                      return (
                        <tr key={lr.id} className="hover:bg-teal-50/30">
                          <td className="py-2 px-3 font-mono font-bold text-teal-800">
                            {lr.lrNumber}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">{lr.branchName}</td>
                          <td className="py-2 px-3 text-slate-600">{lr.bookingDate}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{lr.consignorName}</td>
                          <td className="py-2 px-3 text-slate-700">{lr.consigneeName}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold">
                            {lr.totalQuantity}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{lr.totalActualWeight} kg</td>
                          <td className="py-2 px-2 text-center">
                            {isLhs ? (
                              <span className="text-[10px] bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded border border-indigo-200">
                                3) LHS Stock
                              </span>
                            ) : isMr ? (
                              <span className="text-[10px] bg-sky-100 text-sky-900 font-black px-2 py-0.5 rounded border border-sky-200">
                                2) MR Stock
                              </span>
                            ) : (
                              <span className="text-[10px] bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded border border-blue-200">
                                1) Booking Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: NEW STOCK TRANSFER ENTRY */}
      {viewMode === 'TRANSFER_ENTRY' && (
        <div className="max-w-4xl mx-auto bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-teal-600" />
            <span>Transfer Consignment Between Branches</span>
          </h2>

          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 text-xs rounded-r">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveTransfer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Note No.</label>
                <input
                  type="text"
                  value={transferNo}
                  onChange={(e) => setTransferNo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Consignment to Transfer *
                </label>
                <select
                  value={selectedLrId}
                  onChange={(e) => setSelectedLrId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-teal-800"
                >
                  <option value="">-- Choose Consignment --</option>
                  {lrs
                    .filter((l) => l.status !== 'CANCELLED')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lrNumber} ({l.totalQuantity} Pkgs - {l.totalActualWeight} kg)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Origin Hub (From)</label>
                <input
                  type="text"
                  value={fromBranch}
                  onChange={(e) => setFromBranch(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Hub (To)</label>
                <input
                  type="text"
                  value={toBranch}
                  onChange={(e) => setToBranch(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="MH-14-CW-7890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks & Reason</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Hub re-routing for fast delivery / Warehouse capacity transfer"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('STOCK_TRANSFER_REGISTER')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black shadow"
              >
                Initiate Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: STOCK TRANSFER REGISTER */}
      {viewMode === 'TRANSFER_REGISTER' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transfer no, LR, hub..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {currentUser.role !== 'VIEWER' && (
              <button
                onClick={() => onNavigate('STOCK_TRANSFER_ENTRY')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Transfer</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Transfer No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">LR Consignment</th>
                  <th className="py-3 px-3">From Hub</th>
                  <th className="py-3 px-3">To Hub</th>
                  <th className="py-3 px-2 text-center">Packages</th>
                  <th className="py-3 px-2 text-right">Weight</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No stock transfer records found.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((st) => (
                    <tr key={st.id} className="hover:bg-teal-50/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                        {st.transferNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{st.date}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-blue-800">
                        {st.lrNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">{st.fromBranch}</td>
                      <td className="py-2.5 px-3 text-slate-800">{st.toBranch}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">
                        {st.packagesCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">{st.weightKg} kg</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {st.vehicleNumber || '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            st.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {st.status !== 'RECEIVED' && currentUser.role !== 'VIEWER' ? (
                          <button
                            onClick={() => onUpdateTransferStatus(st.id, 'RECEIVED')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow"
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Done</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
