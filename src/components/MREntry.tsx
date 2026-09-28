import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  FileSpreadsheet,
  Truck,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { MRRecord, LRRecord, Branch, Vehicle, Driver, User } from '../types';
import { StorageService } from '../services/storage';

interface MREntryProps {
  branches: Branch[];
  vehicles: Vehicle[];
  drivers: Driver[];
  availableLRs: LRRecord[];
  existingMRs?: MRRecord[];
  selectedBranch: string;
  initialMR?: MRRecord | null;
  onSaveSuccess: (mr: MRRecord, andPrint?: boolean) => void;
  onCancel: () => void;
  currentUser: User;
}

// Transport Rule: In MR & LHS, PAID & TBB amounts must NOT be collected on delivery
export const getLRCollectibleFreight = (lr: LRRecord): number => {
  const mode = (lr.paymentMode || '').toUpperCase().trim();
  if (mode === 'PAID' || mode === 'TBB') {
    return 0; // PAID & TBB amounts do NOT come in MR/LHS
  }
  return lr.charges?.grandTotal || 0;
};

export const MREntry: React.FC<MREntryProps> = ({
  branches,
  vehicles,
  drivers,
  availableLRs,
  existingMRs,
  selectedBranch,
  initialMR,
  onSaveSuccess,
  onCancel,
  currentUser,
}) => {
  const effectiveBranch =
    initialMR?.branchCode ||
    (selectedBranch !== 'ALL' ? selectedBranch : branches[0]?.code || 'CHK');

  const [branchCode, setBranchCode] = useState(effectiveBranch);
  const [mrNumber, setMrNumber] = useState(
    initialMR?.mrNumber || StorageService.generateNextMRNumber(effectiveBranch)
  );
  const [date, setDate] = useState(
    initialMR?.date || new Date().toISOString().split('T')[0]
  );
  const [fromBranch, setFromBranch] = useState(
    initialMR?.fromBranch || 'Chakan, Pune'
  );
  const [toBranch, setToBranch] = useState(
    initialMR?.toBranch || 'Aurangabad / Mumbai'
  );
  const [vehicleNumber, setVehicleNumber] = useState(
    initialMR?.vehicleNumber || ''
  );
  const [driverName, setDriverName] = useState(initialMR?.driverName || '');
  const [driverMobile, setDriverMobile] = useState(
    initialMR?.driverMobile || ''
  );
  const [loaderName, setLoaderName] = useState(
    initialMR?.loaderName || 'Sunil Shinde'
  );
  const [supervisorName, setSupervisorName] = useState(
    initialMR?.supervisorName || 'S. K. Patil'
  );
  const [remarks, setRemarks] = useState(initialMR?.remarks || '');

  // Selected LR IDs
  const [selectedLrIds, setSelectedLrIds] = useState<string[]>(
    initialMR?.lrIds || []
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter out any LRs that already belong to existing MRs or LHS (Rule 2: एकदा MR/LHS झाल्यावर LR परत दिसणार नाहीत)
  const usedMrLrIds = React.useMemo(() => {
    const set = new Set<string>();
    const allMRs = existingMRs || StorageService.getMRs();
    allMRs.forEach((m) => {
      if (!initialMR || (m.id !== initialMR.id && m.mrNumber !== initialMR.mrNumber)) {
        m.lrIds?.forEach((id) => set.add(id));
        m.selectedLrIds?.forEach((id) => set.add(id));
        m.selectedLrNumbers?.forEach((no) => set.add(no));
      }
    });

    // Also include any LRs from LHS (once created in MR or LHS, LR cannot be duplicated)
    const allLHS = StorageService.getLHS();
    allLHS.forEach((lhs) => {
      lhs.lrIds?.forEach((id) => set.add(id));
      lhs.selectedLrIds?.forEach((id) => set.add(id));
      lhs.selectedLrNumbers?.forEach((no) => set.add(no));
    });

    return set;
  }, [existingMRs, initialMR]);

  // Available LRs for this MR: exclude already-manifested/loaded LRs and cancelled LRs
  const eligibleLRs = React.useMemo(() => {
    return availableLRs.filter((lr) => {
      if (lr.status === 'CANCELLED' || lr.status === 'DELIVERED') return false;
      // If already in an existing MR or LHS (and not part of the MR being edited), hide it completely!
      if (usedMrLrIds.has(lr.id) || usedMrLrIds.has(lr.lrNumber)) {
        return false;
      }
      return true;
    });
  }, [availableLRs, usedMrLrIds]);

  const handleBranchChange = (newCode: string) => {
    setBranchCode(newCode);
    if (!initialMR) {
      setMrNumber(StorageService.generateNextMRNumber(newCode));
    }
  };

  const toggleSelectLR = (id: string) => {
    if (selectedLrIds.includes(id)) {
      setSelectedLrIds(selectedLrIds.filter((item) => item !== id));
    } else {
      setSelectedLrIds([...selectedLrIds, id]);
    }
  };

  const selectAllLRs = () => {
    if (selectedLrIds.length === eligibleLRs.length) {
      setSelectedLrIds([]);
    } else {
      setSelectedLrIds(eligibleLRs.map((l) => l.id));
    }
  };

  // Selected LRs calculations (PAID & TBB freight amount excluded as per Rule 1)
  const attachedLRs = eligibleLRs.filter((l) => selectedLrIds.includes(l.id));
  const totalPackages = attachedLRs.reduce((sum, l) => sum + l.totalQuantity, 0);
  const totalWeight = attachedLRs.reduce((sum, l) => sum + l.totalActualWeight, 0);
  // ONLY TO PAY freight is collected on MR (Rule 1)
  const totalFreight = attachedLRs.reduce(
    (sum, l) => sum + getLRCollectibleFreight(l),
    0
  );

  const handleSubmit = (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    setValidationError(null);

    if (!mrNumber.trim()) {
      setValidationError('MR Number is required.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setValidationError('Vehicle Number is required.');
      return;
    }
    if (selectedLrIds.length === 0) {
      setValidationError('Please attach at least one LR consignment to this manifest.');
      return;
    }

    const branchObj = branches.find((b) => b.code === branchCode);

    const record: MRRecord = {
      id: initialMR?.id || `mr-${Date.now()}`,
      mrNumber: mrNumber.trim().toUpperCase(),
      date,
      branchCode,
      branchName: branchObj?.name || branchCode,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverMobile: driverMobile.trim(),
      fromBranch: fromBranch.trim(),
      toBranch: toBranch.trim(),
      loaderName: loaderName.trim(),
      supervisorName: supervisorName.trim(),
      lrIds: selectedLrIds,
      selectedLrIds: selectedLrIds,
      selectedLrNumbers: attachedLRs.map((l) => l.lrNumber),
      totalLR: selectedLrIds.length,
      totalLRs: selectedLrIds.length,
      totalPackages,
      totalWeight,
      totalFreight,
      remarks: remarks.trim(),
      status: initialMR?.status || 'CREATED',
      createdAt: initialMR?.createdAt || new Date().toISOString(),
      createdBy: initialMR?.createdBy || currentUser.username,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = StorageService.saveMR(record);
      onSaveSuccess(saved, andPrint);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Storage failure';
      setValidationError(`Error saving MR: ${errorMsg}`);
    }
  };

  const handleSaveAndPrint = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e as any, true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Trip Manifest
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {initialMR ? `EDIT MANIFEST: ${initialMR.mrNumber}` : 'NEW MANIFEST / MR ENTRY'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">MR Number</span>
            <span className="text-base font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
              {mrNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndPrint}
            id="btn-mr-header-save-print"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>SAVE & PRINT MANIFEST</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-lg flex items-center gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manifest Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span>1. Trip Header & Vehicle Assignment</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch Hub</label>
              <select
                value={branchCode}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">From Hub</label>
              <input
                type="text"
                value={fromBranch}
                onChange={(e) => setFromBranch(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">To Destination Hub</label>
              <input
                type="text"
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle No. *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="MH-14-CW-7890"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Driver Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Driver Phone</label>
              <input
                type="text"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="+91 98220 12345"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Loader / Supervisor</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={loaderName}
                  onChange={(e) => setLoaderName(e.target.value)}
                  placeholder="Loader"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-[11px]"
                />
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Supervisor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Consignments Multi-Select Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-600" />
                <span>2. Select Consignments to Attach to Manifest (LRs निवडा)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Tick the LRs being loaded into this vehicle. <strong className="text-sky-700">एकदा MR झालेल्या LR या यादीत परत दिसणार नाहीत.</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                Available LRs: {eligibleLRs.length}
              </span>
              <button
                type="button"
                onClick={selectAllLRs}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 cursor-pointer"
              >
                {selectedLrIds.length === eligibleLRs.length ? 'Deselect All' : 'Select All Available'}
              </button>
            </div>
          </div>

          {/* PAID & TBB Rule Notice */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <strong>महत्त्वाची सूचना:</strong> PAID आणि TBB ची रक्कम ₹0 धरली आहे. Manifest/MR मध्ये केवळ <strong>TO PAY (रोख वसूली)</strong> ची रक्कम जोडली जाते.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 w-10 text-center">Select</th>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-2 text-center">Packages</th>
                  <th className="py-2.5 px-2 text-right">Actual Wt</th>
                  <th className="py-2.5 px-2.5 text-center">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">To-Pay Collect (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleLRs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      कोणत्याही पेंडिंग LR उपलब्ध नाहीत. (सर्व LRs आधीच MR/LHS मध्ये जोडल्या गेल्या आहेत किंवा रद्द केलेल्या आहेत).
                    </td>
                  </tr>
                ) : (
                  eligibleLRs.map((lr) => {
                    const isSelected = selectedLrIds.includes(lr.id);
                    const mode = (lr.paymentMode || '').toUpperCase().trim();
                    const isToPay = mode === 'TO PAY';
                    const collectibleAmt = getLRCollectibleFreight(lr);

                    return (
                      <tr
                        key={lr.id}
                        onClick={() => toggleSelectLR(lr.id)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 inline" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 inline" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800">
                          {lr.lrNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">{lr.consignorName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{lr.consigneeName}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {lr.fromLocation} → {lr.toLocation}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{lr.totalQuantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {lr.totalActualWeight} kg
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              mode === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : mode === 'TBB'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isToPay ? (
                            <span className="font-bold text-slate-900">
                              ₹{collectibleAmt.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold" title={`${mode} माल - वसूली शून्य`}>
                              ₹0 <span className="text-[10px] text-slate-400">({mode})</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-sky-100/60 font-black border-t-2 border-sky-300 text-sky-950 text-[11px]">
                  <td colSpan={5} className="py-2.5 px-3 uppercase">
                    Manifest Totals ({selectedLrIds.length} Consignments Selected):
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-xs">{totalPackages} Pkgs</td>
                  <td className="py-2.5 px-2 text-right font-mono text-xs">{totalWeight} KG</td>
                  <td className="py-2.5 px-2.5 text-center text-[10px] text-slate-600 font-bold">
                    To-Pay Only
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-sky-950 font-black">
                    ₹{totalFreight.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Remarks & Submit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700">Trip Remarks & Seals</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Container Seal No. 90214. Checked and verified by Chakan Dispatch team."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
          />

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndPrint}
              id="btn-mr-footer-save-print"
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow cursor-pointer transition"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>SAVE & PRINT MANIFEST (A4)</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black shadow"
            >
              <Save className="w-4 h-4" />
              <span>SAVE MANIFEST</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
