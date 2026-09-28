import React, { useState, useMemo } from 'react';
import {
  Save,
  ArrowLeft,
  FileText,
  Truck,
  CheckSquare,
  Square,
  AlertCircle,
  Calculator,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Building2,
  Package,
} from 'lucide-react';
import { LHSRecord, LRRecord, MRRecord, Branch, Vehicle, Driver, User } from '../types';
import { StorageService } from '../services/storage';

interface LHSEntryProps {
  branches: Branch[];
  vehicles: Vehicle[];
  drivers: Driver[];
  availableMRs?: MRRecord[];
  allLRs?: LRRecord[];
  availableLRs?: LRRecord[];
  existingLHS?: LHSRecord[];
  selectedBranch: string;
  initialLHS?: LHSRecord | null;
  onSaveSuccess: (lhs: LHSRecord, andPrint?: boolean) => void;
  onCancel: () => void;
  onNavigateToMR?: () => void;
  currentUser: User;
}

// Transport Rule 1: In MR & LHS, PAID & TBB amounts are NOT collectible on delivery (only TO PAY)
export const getLRCollectibleFreight = (lr: LRRecord): number => {
  const mode = (lr.paymentMode || '').toUpperCase().trim();
  if (mode === 'PAID' || mode === 'TBB') {
    return 0; // PAID & TBB amounts do NOT come in MR/LHS
  }
  return lr.charges?.grandTotal || 0;
};

export const LHSEntry: React.FC<LHSEntryProps> = ({
  branches,
  vehicles,
  drivers,
  availableMRs,
  allLRs,
  availableLRs,
  existingLHS,
  selectedBranch,
  initialLHS,
  onSaveSuccess,
  onCancel,
  onNavigateToMR,
  currentUser,
}) => {
  const effectiveBranch =
    initialLHS?.branchCode ||
    (selectedBranch !== 'ALL' ? selectedBranch : branches[0]?.code || 'CHK');

  const [branchCode, setBranchCode] = useState(effectiveBranch);
  const [lhsNumber, setLhsNumber] = useState(
    initialLHS?.lhsNumber || StorageService.generateNextLHSNumber(effectiveBranch)
  );
  const [date, setDate] = useState(
    initialLHS?.date || new Date().toISOString().split('T')[0]
  );
  const [fromBranch, setFromBranch] = useState(
    initialLHS?.fromBranch || 'Chakan Central Hub'
  );
  const [toBranch, setToBranch] = useState(
    initialLHS?.toBranch || 'Aurangabad / Mumbai'
  );
  const [vehicleNumber, setVehicleNumber] = useState(
    initialLHS?.vehicleNumber || ''
  );
  const [driverName, setDriverName] = useState(initialLHS?.driverName || '');
  const [driverMobile, setDriverMobile] = useState(
    initialLHS?.driverMobile || ''
  );
  const [hamaliCharges, setHamaliCharges] = useState<number>(
    initialLHS?.hamaliCharges || 0
  );
  const [advancePaid, setAdvancePaid] = useState<number>(
    initialLHS?.advancePaid || 0
  );

  // Selected MR IDs
  const [selectedMrIds, setSelectedMrIds] = useState<string[]>(
    initialLHS?.selectedMrIds || []
  );

  // Selected LR IDs (derived from selected MRs or initial LHS)
  const [selectedLrIds, setSelectedLrIds] = useState<string[]>(
    initialLHS?.lrIds || []
  );

  // Accordion state to expand/collapse LR details for each MR
  const [expandedMrIds, setExpandedMrIds] = useState<Record<string, boolean>>({});

  const [remarks, setRemarks] = useState(initialLHS?.remarks || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // All LRs from props or StorageService
  const fullLRList = useMemo(() => {
    return allLRs || availableLRs || StorageService.getLRs();
  }, [allLRs, availableLRs]);

  // All MRs from props or StorageService
  const fullMRList = useMemo(() => {
    return availableMRs || StorageService.getMRs();
  }, [availableMRs]);

  // Find which MRs have already been assigned to existing LHS (excluding current initialLHS)
  const usedLhsMrIds = useMemo(() => {
    const set = new Set<string>();
    const allLHS = existingLHS || StorageService.getLHS();
    allLHS.forEach((item) => {
      if (!initialLHS || (item.id !== initialLHS.id && item.lhsNumber !== initialLHS.lhsNumber)) {
        item.selectedMrIds?.forEach((id) => set.add(id));
      }
    });
    return set;
  }, [existingLHS, initialLHS]);

  // Filter available MRs: Only MRs that are NOT yet loaded on an existing LHS
  const eligibleMRs = useMemo(() => {
    return fullMRList.filter((mr) => {
      if (mr.status === 'CANCELLED') return false;
      // If already attached to another LHS, it is loaded!
      if (usedLhsMrIds.has(mr.id) || usedLhsMrIds.has(mr.mrNumber)) {
        return false;
      }
      if (mr.lhsNo && (!initialLHS || mr.lhsNo !== initialLHS.lhsNumber)) {
        return false;
      }
      return true;
    });
  }, [fullMRList, usedLhsMrIds, initialLHS]);

  // Helper to get LRs for an MR
  const getLRsForMR = (mr: MRRecord): LRRecord[] => {
    const ids = mr.lrIds || mr.selectedLrIds || [];
    const numbers = mr.selectedLrNumbers || [];
    return fullLRList.filter(
      (l) =>
        ids.includes(l.id) ||
        ids.includes(l.lrNumber) ||
        numbers.includes(l.lrNumber)
    );
  };

  const handleBranchChange = (newCode: string) => {
    setBranchCode(newCode);
    if (!initialLHS) {
      setLhsNumber(StorageService.generateNextLHSNumber(newCode));
    }
  };

  const toggleExpandMR = (mrId: string) => {
    setExpandedMrIds((prev) => ({ ...prev, [mrId]: !prev[mrId] }));
  };

  // Toggle selection of an MR (attaches all LRs of that MR)
  const toggleSelectMR = (mr: MRRecord) => {
    const isCurrentlySelected = selectedMrIds.includes(mr.id) || selectedMrIds.includes(mr.mrNumber);
    const mrLRs = getLRsForMR(mr);
    const mrLrIds = mrLRs.map((l) => l.id);

    if (isCurrentlySelected) {
      setSelectedMrIds(selectedMrIds.filter((id) => id !== mr.id && id !== mr.mrNumber));
      setSelectedLrIds(selectedLrIds.filter((id) => !mrLrIds.includes(id)));
    } else {
      setSelectedMrIds([...selectedMrIds, mr.id]);
      // Union of LR ids
      const newLrIds = Array.from(new Set([...selectedLrIds, ...mrLrIds]));
      setSelectedLrIds(newLrIds);

      // Auto-populate vehicle and driver if currently blank
      if (!vehicleNumber.trim() && mr.vehicleNumber) {
        setVehicleNumber(mr.vehicleNumber);
      }
      if (!driverName.trim() && mr.driverName) {
        setDriverName(mr.driverName);
      }
      if (!driverMobile.trim() && mr.driverMobile) {
        setDriverMobile(mr.driverMobile);
      }
      if (mr.fromBranch && fromBranch === 'Chakan Central Hub') {
        setFromBranch(mr.fromBranch);
      }
      if (mr.toBranch && toBranch === 'Aurangabad / Mumbai') {
        setToBranch(mr.toBranch);
      }
    }
  };

  const selectAllMRs = () => {
    if (selectedMrIds.length === eligibleMRs.length) {
      setSelectedMrIds([]);
      setSelectedLrIds([]);
    } else {
      const allIds = eligibleMRs.map((m) => m.id);
      setSelectedMrIds(allIds);
      const allLrIds: string[] = [];
      eligibleMRs.forEach((m) => {
        getLRsForMR(m).forEach((l) => allLrIds.push(l.id));
      });
      setSelectedLrIds(Array.from(new Set(allLrIds)));
    }
  };

  // Attached LRs for calculations
  const attachedLRs = useMemo(() => {
    return fullLRList.filter((l) => selectedLrIds.includes(l.id));
  }, [fullLRList, selectedLrIds]);

  const totalPackages = attachedLRs.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);
  const totalWeight = attachedLRs.reduce((sum, l) => sum + (l.totalActualWeight || 0), 0);

  // ONLY TO PAY freight is added for LHS (PAID & TBB are ₹0 as required)
  const totalFreight = attachedLRs.reduce(
    (sum, l) => sum + getLRCollectibleFreight(l),
    0
  );
  const balanceAmount = totalFreight - (Number(advancePaid) || 0) + (Number(hamaliCharges) || 0);

  const handleSubmit = (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    setValidationError(null);

    if (!lhsNumber.trim()) {
      setValidationError('LHS Number is required.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setValidationError('Vehicle Number is required.');
      return;
    }
    if (selectedMrIds.length === 0 && selectedLrIds.length === 0) {
      setValidationError('कृपया किमान १ MR (Manifest) निवडा. LHS बनवण्यासाठी MR मधील नोंदी आवश्यक आहेत.');
      return;
    }

    const branchObj = branches.find((b) => b.code === branchCode);

    const record: LHSRecord = {
      id: initialLHS?.id || `lhs-${Date.now()}`,
      lhsNumber: lhsNumber.trim().toUpperCase(),
      date,
      branchCode,
      branchName: branchObj?.name || branchCode,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverMobile: driverMobile.trim(),
      fromBranch: fromBranch.trim(),
      toBranch: toBranch.trim(),
      selectedMrIds: selectedMrIds,
      lrIds: selectedLrIds,
      selectedLrIds: selectedLrIds,
      selectedLrNumbers: attachedLRs.map((l) => l.lrNumber),
      totalLRs: attachedLRs.length,
      totalPackages,
      totalWeight,
      totalFreight,
      advancePaid: Number(advancePaid) || 0,
      hamaliCharges: Number(hamaliCharges) || 0,
      balanceAmount,
      remarks: remarks.trim(),
      status: initialLHS?.status || 'LOADED',
      createdAt: initialLHS?.createdAt || new Date().toISOString(),
      createdBy: initialLHS?.createdBy || currentUser.username,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = StorageService.saveLHS(record);
      onSaveSuccess(saved, andPrint);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Storage failure';
      setValidationError(`Error saving LHS: ${errorMsg}`);
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
            <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Lorry Hire Sheet / Loading Sheet
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {initialLHS ? `EDIT LOADING SHEET: ${initialLHS.lhsNumber}` : 'NEW LOADING SHEET (LHS ENTRY)'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">LHS Number</span>
            <span className="text-base font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              {lhsNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndPrint}
            id="btn-lhs-header-save-print"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>SAVE & PRINT LHS</span>
          </button>
        </div>
      </div>

      {/* Transport Workflow Rules Banner */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-indigo-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Truck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block text-sm">
              ट्रान्सपोर्ट नियम: LHS मध्ये नेहमी MR (Manifest) मधील नोंदी घेतल्या जातात!
            </strong>
            <span className="text-slate-300 text-[11px] leading-relaxed">
              LR बुकिंग झाल्यावर ती <strong>MR Register</strong> मध्ये येते (Booking Stock कमी होतो). आणि जेव्हा MR वरून <strong>LHS</strong> बनवला जातो, तेव्हा MR Stock कमी होऊन तो <strong>LHS Register</strong> (वाहन डिस्पॅच) मध्ये जातो.
            </span>
          </div>
        </div>
        {onNavigateToMR && (
          <button
            type="button"
            onClick={onNavigateToMR}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-lg text-xs self-start sm:self-auto flex-shrink-0 shadow transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ नवीन MR बनवा</span>
          </button>
        )}
      </div>

      {validationError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-lg flex items-center gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LHS Header Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>1. Loading Sheet & Vehicle Dispatch Route</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hub Branch</label>
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
              <label className="block font-bold text-slate-700 mb-1">Loading Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">From Location</label>
              <input
                type="text"
                value={fromBranch}
                onChange={(e) => setFromBranch(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">To Destination</label>
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
              <label className="block font-bold text-slate-700 mb-1">Driver Mobile</label>
              <input
                type="text"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="+91 98220 12345"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hamali Charges (₹)</label>
              <input
                type="number"
                min="0"
                value={hamaliCharges || ''}
                onChange={(e) => setHamaliCharges(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. MR (MANIFEST) SELECTION - As requested: LHS takes entries from MR, NOT from Booking Register! */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  2. Select Manifest / MR Entries to Load on Vehicle (MR मधून नोंदी निवडा)
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                या वाहनात डिस्पॅच करावयाचे <strong>MR (Manifests)</strong> निवडा. MR निवडताच त्यातील सर्व LR आपोआप जोडल्या जातील.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200 font-mono">
                Available MRs: {eligibleMRs.length}
              </span>
              {eligibleMRs.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllMRs}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 cursor-pointer"
                >
                  {selectedMrIds.length === eligibleMRs.length ? 'Deselect All' : 'Select All MRs'}
                </button>
              )}
            </div>
          </div>

          {/* PAID & TBB Rule Notice */}
          <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <strong>रक्कम नियम:</strong> PAID आणि TBB ची रक्कम ₹0 धरली आहे. Loading Sheet (LHS) मध्ये केवळ <strong>TO PAY (रोख वसूली)</strong> ची रक्कम ट्रिप भाड्यात जोडली जाते.
            </span>
          </div>

          {/* MR List Cards/Table */}
          {eligibleMRs.length === 0 ? (
            <div className="py-8 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-slate-700 font-bold text-sm">
                कोणतेही प्रलंबित MR (Manifest) उपलब्ध नाही
              </div>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                सर्व MR आधीच LHS मध्ये लोड केलेले आहेत अथवा अद्याप नवीन MR तयार केलेले नाही. प्रथम MR तयार करा (त्यात Booking LRs येतील) आणि नंतर येथे LHS बनवा.
              </p>
              {onNavigateToMR && (
                <button
                  type="button"
                  onClick={onNavigateToMR}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ नवीन MR (Manifest) बनवा</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleMRs.map((mr) => {
                const isSelected = selectedMrIds.includes(mr.id) || selectedMrIds.includes(mr.mrNumber);
                const mrLRs = getLRsForMR(mr);
                const mrPackages = mrLRs.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);
                const mrWeight = mrLRs.reduce((sum, l) => sum + (l.totalActualWeight || 0), 0);
                const mrCollectibleFreight = mrLRs.reduce(
                  (sum, l) => sum + getLRCollectibleFreight(l),
                  0
                );
                const isExpanded = !!expandedMrIds[mr.id];

                return (
                  <div
                    key={mr.id}
                    className={`rounded-xl border transition overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* MR Header Row */}
                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          onClick={() => toggleSelectMR(mr)}
                          className="pt-0.5 sm:pt-0 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 flex-shrink-0 hover:text-slate-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-indigo-900 text-sm">
                              {mr.mrNumber}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                              {mr.date}
                            </span>
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold font-mono">
                              {mr.branchCode}
                            </span>
                            {mr.vehicleNumber && (
                              <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-mono font-bold">
                                {mr.vehicleNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                            <span>
                              <strong>Route:</strong> {mr.fromBranch || 'Chakan'} → {mr.toBranch || 'Destination'}
                            </span>
                            {mr.driverName && (
                              <span>
                                <strong>Driver:</strong> {mr.driverName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right stats & expand button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-xs">
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Consignments
                          </span>
                          <span className="font-mono font-black text-blue-700">
                            {mrLRs.length} LRs ({mrPackages} Pkgs)
                          </span>
                        </div>

                        <div className="text-center sm:text-right">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Total Weight
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {mrWeight} kg
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            To-Pay Freight
                          </span>
                          <span className="font-mono font-black text-emerald-700 text-sm">
                            ₹{mrCollectibleFreight.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpandMR(mr.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="View attached LRs"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable LR details under this MR */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/80 p-3 sm:p-4">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Attached Consignments in {mr.mrNumber} ({mrLRs.length} LRs)</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            PAID & TBB freight amount excluded (₹0)
                          </span>
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                                <th className="py-2 px-3">LR Number</th>
                                <th className="py-2 px-3">Consignor</th>
                                <th className="py-2 px-3">Consignee</th>
                                <th className="py-2 px-2 text-center">Pkgs</th>
                                <th className="py-2 px-2 text-right">Actual Wt</th>
                                <th className="py-2 px-2.5 text-center">Payment Mode</th>
                                <th className="py-2 px-3 text-right">To-Pay (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                              {mrLRs.map((lr) => {
                                const mode = (lr.paymentMode || '').toUpperCase().trim();
                                const isToPay = mode === 'TO PAY';
                                const collectible = getLRCollectibleFreight(lr);

                                return (
                                  <tr key={lr.id}>
                                    <td className="py-2 px-3 font-mono font-bold text-blue-800">
                                      {lr.lrNumber}
                                    </td>
                                    <td className="py-2 px-3 text-slate-800">{lr.consignorName}</td>
                                    <td className="py-2 px-3 text-slate-700">{lr.consigneeName}</td>
                                    <td className="py-2 px-2 text-center font-mono">{lr.totalQuantity}</td>
                                    <td className="py-2 px-2 text-right font-mono">{lr.totalActualWeight} kg</td>
                                    <td className="py-2 px-2.5 text-center">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                          mode === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : mode === 'TBB'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-amber-100 text-amber-900'
                                        }`}
                                      >
                                        {mode}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold">
                                      {isToPay ? (
                                        <span className="text-slate-900">
                                          ₹{collectible.toLocaleString('en-IN')}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">₹0</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Trip Accounting, Advances, and Summary Totals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>3. Trip Freight Accounting & Driver Advance</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Total Loading Freight (To-Pay)
              </span>
              <span className="text-lg font-black font-mono text-slate-900">
                ₹{totalFreight.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {attachedLRs.length} LRs ({selectedMrIds.length} MRs)
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Advance Paid to Driver (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid || ''}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-emerald-800"
              />
              <span className="text-[10px] text-slate-400">Driver trip advance</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hamali / Loading (₹)
              </label>
              <input
                type="number"
                min="0"
                value={hamaliCharges || ''}
                onChange={(e) => setHamaliCharges(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
              <span className="text-[10px] text-slate-400">Loading labor charges</span>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
              <span className="text-[10px] text-indigo-700 uppercase font-bold block">
                Balance Payable / Recoverable (₹)
              </span>
              <span className="text-lg font-black font-mono text-indigo-900">
                ₹{balanceAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">
                Freight - Advance + Hamali
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">
              Trip Remarks / Special Instructions
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Dispatched via Expressway, Night delivery permitted, Tarpaulin tied."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              id="btn-lhs-save"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>SAVE LOADING SHEET (LHS)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrint}
              id="btn-lhs-save-and-print"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>SAVE & PRINT (A4)</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
