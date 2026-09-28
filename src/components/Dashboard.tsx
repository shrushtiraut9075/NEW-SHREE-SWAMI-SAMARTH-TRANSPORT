import React from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  Printer,
  Eye,
  Building2,
  Boxes,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  FileCheck,
  Edit,
  Globe,
  ExternalLink,
  Code,
} from 'lucide-react';
import { LRRecord, MRRecord, LHSRecord, StockTransferRecord, Branch, User, CompanyProfile } from '../types';
import { ActiveView } from './Sidebar';
import { DashboardRoadAnimation } from './DashboardRoadAnimation';

interface DashboardProps {
  lrs: LRRecord[];
  mrs: MRRecord[];
  lhsList: LHSRecord[];
  stockTransfers: StockTransferRecord[];
  branches: Branch[];
  selectedBranch: string;
  onNavigate: (view: ActiveView) => void;
  onViewLR: (lr: LRRecord) => void;
  onPrintLR: (lr: LRRecord) => void;
  onEditLR?: (lr: LRRecord) => void;
  onOpenAdminEditLR?: () => void;
  onOpenWebsiteIntegration?: () => void;
  currentUser: User;
  companyProfile?: CompanyProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lrs,
  mrs,
  lhsList,
  stockTransfers,
  branches,
  selectedBranch,
  onNavigate,
  onViewLR,
  onPrintLR,
  onEditLR,
  onOpenAdminEditLR,
  onOpenWebsiteIntegration,
  currentUser,
  companyProfile,
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  // Filter records based on selectedBranch
  const filteredLRs = selectedBranch === 'ALL'
    ? lrs
    : lrs.filter((lr) => lr.branchCode === selectedBranch);

  const filteredMRs = selectedBranch === 'ALL'
    ? mrs
    : mrs.filter((mr) => mr.branchCode === selectedBranch);

  const filteredLHS = selectedBranch === 'ALL'
    ? lhsList
    : lhsList.filter((lhs) => lhs.branchCode === selectedBranch);

  const filteredTransfers = selectedBranch === 'ALL'
    ? stockTransfers
    : stockTransfers.filter(
        (st) =>
          st.fromBranch.toUpperCase().includes(selectedBranch) ||
          st.toBranch.toUpperCase().includes(selectedBranch)
      );

  // Dynamic calculations from database
  const totalLR = filteredLRs.length;
  const totalMR = filteredMRs.length;
  const totalLHS = filteredLHS.length;
  const totalTransfers = filteredTransfers.length;

  const totalFreight = filteredLRs
    .filter((lr) => lr.status !== 'CANCELLED')
    .reduce((sum, lr) => sum + (lr.charges?.freight || 0), 0);

  const totalAmount = filteredLRs
    .filter((lr) => lr.status !== 'CANCELLED')
    .reduce((sum, lr) => sum + (lr.charges?.grandTotal || 0), 0);

  const pendingEntries = filteredLRs.filter(
    (lr) => lr.status === 'BOOKED' || lr.paymentStatus === 'PENDING'
  ).length;

  // Format currency in Indian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status counts
  const statusCounts = {
    BOOKED: filteredLRs.filter((l) => l.status === 'BOOKED').length,
    DISPATCHED: filteredLRs.filter((l) => l.status === 'DISPATCHED').length,
    IN_TRANSIT: filteredLRs.filter((l) => l.status === 'IN TRANSIT').length,
    DELIVERED: filteredLRs.filter((l) => l.status === 'DELIVERED').length,
    CANCELLED: filteredLRs.filter((l) => l.status === 'CANCELLED').length,
  };

  const recentLRs = [...filteredLRs].slice(0, 6);

  const selectedBranchName =
    selectedBranch === 'ALL'
      ? 'All Operating Hubs'
      : branches.find((b) => b.code === selectedBranch)?.name || selectedBranch;

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-800 w-full max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-xl p-1 sm:p-1.5 shadow-md flex items-center justify-center flex-shrink-0 border-2 border-amber-400">
              <img
                src={companyProfile?.logoUrl || '/company_logo.jpg'}
                alt="New Shree Swami Samarth Transport Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] uppercase font-black px-1.5 sm:px-2 py-0.5 rounded tracking-wider">
                  Active Operations
                </span>
                <span className="text-slate-300 text-[11px] sm:text-xs font-mono truncate">
                  Scope: {selectedBranchName} ({selectedBranch})
                </span>
              </div>
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-white uppercase truncate">
                {companyProfile?.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT'}
              </h1>
              <p className="text-amber-300 text-xs sm:text-sm font-semibold mt-0.5 truncate">
                {companyProfile?.tagline || 'RELIABLE | SAFE | TIMELY LOGISTICS'} • {companyProfile?.subTagline || 'CHAKAN, PUNE'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-300 mt-1 font-medium">
                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="font-semibold text-white">
                  {companyProfile?.address}{companyProfile?.pincode && !companyProfile?.address.includes(companyProfile.pincode) ? ` - ${companyProfile.pincode}` : ''}
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-mono font-bold tracking-wider">
                  ✓ VERIFIED HEAD OFFICE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-300 mt-1.5 pt-1.5 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin / Proprietor:</span>
                </span>
                <span className="text-white font-bold tracking-wide uppercase">
                  {companyProfile?.adminName || 'KUDKE BALIRAM'}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span className="font-mono font-bold text-amber-300">
                    {companyProfile?.mobile || companyProfile?.phone || '9881898635'}
                  </span>
                </span>
                <span className="hidden sm:flex items-center gap-1 text-slate-300">
                  <Mail className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-200">
                    {companyProfile?.email || 'shreeswamisamarthtransport9881@gmail.com'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons: 2-column touch-friendly grid on mobile, flex row on desktop */}
          {currentUser.role !== 'VIEWER' && (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
              <button
                id="btn-dash-new-lr"
                onClick={() => onNavigate('LR_ENTRY')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl sm:rounded-lg text-xs font-black shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New LR Booking</span>
              </button>

              {isAdmin && (
                <button
                  id="btn-dash-edit-lr"
                  onClick={onOpenAdminEditLR}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-lg text-xs font-black shadow transition border border-emerald-400 cursor-pointer"
                  title="Admin Authorized: Search & Edit any booked Consignment LR"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit LR (संपादित करा)</span>
                </button>
              )}

              <button
                id="btn-dash-tracking-pod"
                onClick={() => onNavigate('LR_TRACKING')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl sm:rounded-lg text-xs font-bold shadow transition cursor-pointer"
              >
                <Truck className="w-4 h-4 text-white" />
                <span>LR Tracking & POD</span>
              </button>

              <button
                id="btn-dash-new-mr"
                onClick={() => onNavigate('MR_ENTRY')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl sm:rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Manifest (MR)</span>
              </button>

              <button
                id="btn-dash-new-transfer"
                onClick={() => onNavigate('STOCK_TRANSFER_ENTRY')}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl sm:rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
                <span>+ Stock Transfer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD-ONLY ANIMATED HIGHWAY ROAD & RUNNING TRUCK */}
      <DashboardRoadAnimation
        companyName={companyProfile?.companyName || companyProfile?.name || 'NEW SHREE SWAMI SAMARTH TRANSPORT'}
        tagline={companyProfile?.tagline || 'RELIABLE | SAFE | TIMELY LOGISTICS • CHAKAN, PUNE'}
      />

      {/* OFFICIAL WEBSITE CONNECTED DATA & NETWORK HUB */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base text-white tracking-tight">
                  shreeswamisamarthtransport.in अधिकृत वेबसाइट डेटा व नेटवर्क
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>डेटा १००% जोडला आहे</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>पुणे, मुंबई, दादर व चाकण शाखा, संपर्क व कामकाजाची वेळ (8:00 AM - 11:00 PM) जोडलेली आहे.</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">चालू प्रोजेक्टमधील कोणत्याही डेटाला धक्का नाही.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://shreeswamisamarthtransport.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="Open Official Website"
            >
              <span>वेबसाइट उघडा</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {onOpenWebsiteIntegration && (
              <button
                type="button"
                onClick={onOpenWebsiteIntegration}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition shadow cursor-pointer"
                title="Open Website Login Code & Integration Modal"
              >
                <Code className="w-3.5 h-3.5" />
                <span>वेबसाइट LOGIN कोड</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Branch Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {/* Pune */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-amber-300">पुणे मुख्य कार्यालय (PUN)</span>
              <span className="text-[10px] text-slate-400">8 AM - 11 PM</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1" title="486, Shukrawar Peth, Siddheshwar Flower Mill, Pune">
              486, शुक्रवार पेठ, शिवाजी रोड, पुणे
            </p>
            <p className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
              📞 7722022042 / 9011677972
            </p>
          </div>

          {/* Mumbai */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-amber-300">मुंबई काळबादेवी (MUM)</span>
              <span className="text-[10px] text-slate-400">8 AM - 11 PM</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1" title="Dhanji Munji Dhela Bldg 95A, Old Hanuman Lane, Kalbadevi">
              धनजी मुंजी ढेला बिल्डींग, काळबादेवी
            </p>
            <p className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
              📞 8424883921
            </p>
          </div>

          {/* Dadar */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-amber-300">दादर पश्चिम (DDR)</span>
              <span className="text-[10px] text-slate-400">8 AM - 11 PM</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1" title="Sai Ganesh Sadan, Senapati Bapat Road, Dadar (W)">
              साई गणेश सदन, सेनापती बापट मार्ग, दादर
            </p>
            <p className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
              📞 9607751898 / 9011677972
            </p>
          </div>

          {/* Chakan */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-amber-300">चाकण सेंट्रल हब (CHK)</span>
              <span className="text-[10px] text-emerald-400 font-bold">24/7 Operations</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1" title="Gat No. 158, Pune-Nashik Road, Chimbali, Chakan">
              गट नं. १५८, चिंबळी, चाकण (हेड ऑफिस)
            </p>
            <p className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
              📞 9881898635 (कुडके बळीराम)
            </p>
          </div>
        </div>
      </div>

      {/* 7 CLICKABLE SUMMARY CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Primary Operational Metrics</span>
            <span className="text-[10px] text-slate-500 font-normal normal-case">
              (Click any card to inspect full register)
            </span>
          </h2>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Real-Time DB Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {/* 1. TOTAL LR */}
          <div
            id="card-total-lr"
            onClick={() => onNavigate('LR_REGISTER')}
            className="group relative bg-white hover:bg-blue-50/50 p-4 rounded-xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-blue-700">
                TOTAL LR
              </span>
              <BookOpen className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-blue-700 tracking-tight font-mono">
                {totalLR}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Consignments</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          </div>

          {/* 2. TOTAL MR */}
          <div
            id="card-total-mr"
            onClick={() => onNavigate('MR_REGISTER')}
            className="group relative bg-white hover:bg-sky-50/50 p-4 rounded-xl border border-slate-200 hover:border-sky-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-sky-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-sky-700">
                TOTAL MR
              </span>
              <FileSpreadsheet className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-sky-700 tracking-tight font-mono">
                {totalMR}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Trip Manifests</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
              </div>
            </div>
          </div>

          {/* 3. TOTAL LHS */}
          <div
            id="card-total-lhs"
            onClick={() => onNavigate('LHS_REGISTER')}
            className="group relative bg-white hover:bg-indigo-50/50 p-4 rounded-xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-indigo-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-indigo-700">
                TOTAL LHS
              </span>
              <FileText className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-700 tracking-tight font-mono">
                {totalLHS}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Loading Sheets</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </div>
          </div>

          {/* 4. STOCK TRANSFERS */}
          <div
            id="card-stock-transfers"
            onClick={() => onNavigate('STOCK_TRANSFER_REGISTER')}
            className="group relative bg-white hover:bg-teal-50/50 p-4 rounded-xl border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-teal-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-teal-700">
                STOCK TRANSFERS
              </span>
              <ArrowLeftRight className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-teal-700 tracking-tight font-mono">
                {totalTransfers}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Branch Transfers</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
              </div>
            </div>
          </div>

          {/* 5. TOTAL FREIGHT */}
          <div
            id="card-total-freight"
            onClick={() => onNavigate('LR_REGISTER')}
            className="group relative bg-white hover:bg-emerald-50/50 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-emerald-700">
                TOTAL FREIGHT
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-emerald-700 tracking-tight font-mono truncate">
                {formatCurrency(totalFreight)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Base Freight</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
              </div>
            </div>
          </div>

          {/* 6. TOTAL AMOUNT */}
          <div
            id="card-total-amount"
            onClick={() => onNavigate('PAYMENT_MODULE')}
            className="group relative bg-white hover:bg-purple-50/50 p-4 rounded-xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-purple-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-purple-700">
                TOTAL AMOUNT
              </span>
              <CreditCard className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-purple-700 tracking-tight font-mono truncate">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>With Taxes & Fees</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
              </div>
            </div>
          </div>

          {/* 7. PENDING ENTRIES */}
          <div
            id="card-pending-entries"
            onClick={() => onNavigate('LR_REGISTER')}
            className="group relative bg-white hover:bg-amber-50/50 p-4 rounded-xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 group-hover:text-amber-700">
                PENDING ENTRIES
              </span>
              <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
                {pendingEntries}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Booked / Unpaid</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS OVERVIEW BAR & BRANCH SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
            <span>Consignment Status Distribution</span>
            <span className="text-blue-600 font-mono text-[11px]">{totalLR} Active</span>
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-700 font-medium">Booked at Hub</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">{statusCounts.BOOKED}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700 font-medium">In Transit</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">{statusCounts.IN_TRANSIT}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-700 font-medium">Dispatched</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">{statusCounts.DISPATCHED}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-medium">Delivered to Consignee</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">{statusCounts.DELIVERED}</span>
            </div>

            {/* POD Status summary */}
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-700 font-semibold">POD Uploaded</span>
              </span>
              <span className="font-bold text-emerald-700 font-mono">
                {filteredLRs.filter((l) => l.podStatus === 'UPLOADED' || l.podStatus === 'VERIFIED').length}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-slate-700 font-semibold">POD Pending Upload</span>
              </span>
              <span className="font-bold text-rose-600 font-mono">
                {filteredLRs.filter((l) => l.status !== 'CANCELLED' && (l.podStatus === 'PENDING' || !l.podStatus)).length}
              </span>
            </div>

            <button
              onClick={() => onNavigate('LR_TRACKING')}
              className="w-full mt-2 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1 transition"
            >
              <Truck className="w-3 h-3 text-blue-600" />
              <span>Open LR Tracking & POD (सर्व LR ट्रॅकिंग)</span>
            </button>

            {statusCounts.CANCELLED > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-medium">Cancelled Entries</span>
                </span>
                <span className="font-bold font-mono">{statusCounts.CANCELLED}</span>
              </div>
            )}
          </div>
        </div>

        {/* Branch Network Activity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Branch Hubs Volume & Activity</span>
            </h3>
            <button
              onClick={() => onNavigate('MASTER_BRANCHES')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
            >
              Manage Branches →
            </button>
          </div>

          <div className="overflow-x-auto w-full max-w-full min-w-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Branch Hub</th>
                  <th className="py-2 px-3 text-center">LRs</th>
                  <th className="py-2 px-3 text-right">Freight (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((b) => {
                  const branchLRs = lrs.filter((l) => l.branchCode === b.code);
                  const bFreight = branchLRs.reduce((sum, l) => sum + (l.charges?.freight || 0), 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{b.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{b.name}</td>
                      <td className="py-2 px-3 text-center font-mono">{branchLRs.length}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(bFreight)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECENT LR BOOKINGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Recent Consignments (LR Register Live)</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                {filteredLRs.length} total
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant access to review, verify, print A4 copies, or download PDF
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('LR_REGISTER')}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition"
            >
              Open Full LR Register →
            </button>
          </div>
        </div>

        {/* Mobile View: Clean, touch-friendly cards (Phones only) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {recentLRs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No consignments found for current branch filter.
            </div>
          ) : (
            recentLRs.map((lr) => (
              <div key={lr.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                {/* Header: LR Number + Status Badge + Date */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-blue-700 text-xs">
                      {lr.lrNumber}
                    </span>
                    <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded text-[9px] font-bold">
                      {lr.branchCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{lr.bookingDate}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
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
                  </div>
                </div>

                {/* Route & Vehicle */}
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {lr.fromLocation} → {lr.toLocation}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {lr.vehicleNumber || '—'}
                  </span>
                </div>

                {/* Parties */}
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg space-y-0.5">
                  <div className="truncate">
                    <span className="text-slate-400">Consignor: </span>
                    <strong className="text-slate-800">{lr.consignorName}</strong>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400">Consignee: </span>
                    <strong className="text-slate-800">{lr.consigneeName}</strong>
                  </div>
                </div>

                {/* Footer: Grand Total + Action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Total Freight</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(lr.charges?.grandTotal || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && lr.status !== 'CANCELLED' && onEditLR && (
                      <button
                        onClick={() => onEditLR(lr)}
                        className="px-2 py-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-400 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => onViewLR(lr)}
                      className="p-1.5 bg-slate-100 text-slate-700 hover:text-blue-700 rounded"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPrintLR(lr)}
                      className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded"
                      title="Print LR"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / Tablet View: Full 10-column table with scroll safety */}
        <div className="hidden sm:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-3">LR Number</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Consignor</th>
                <th className="py-2.5 px-3">Consignee</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLRs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No consignments found for current branch filter.
                  </td>
                </tr>
              ) : (
                recentLRs.map((lr) => (
                  <tr key={lr.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {lr.lrNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{lr.bookingDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {lr.branchCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[150px] truncate" title={lr.consignorName}>
                      {lr.consignorName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[150px] truncate" title={lr.consigneeName}>
                      {lr.consigneeName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {lr.fromLocation} → {lr.toLocation}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {lr.vehicleNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(lr.charges?.grandTotal || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && lr.status !== 'CANCELLED' && onEditLR && (
                          <button
                            onClick={() => onEditLR(lr)}
                            id={`btn-dash-edit-${lr.id}`}
                            title="Edit this LR (Admin Authorized)"
                            className="flex items-center gap-1 px-2 py-1 text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-500 rounded text-[10px] font-black transition cursor-pointer shadow-2xs"
                          >
                            <Edit className="w-3 h-3 text-emerald-800" />
                            <span>Edit LR</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewLR(lr)}
                          id={`btn-dash-view-${lr.id}`}
                          title="View Full Details"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPrintLR(lr)}
                          id={`btn-dash-print-${lr.id}`}
                          title="Print A4 LR (Consignor, Consignee, Driver copies)"
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
