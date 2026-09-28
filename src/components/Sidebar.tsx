import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Truck,
  FileSpreadsheet,
  ArrowLeftRight,
  Boxes,
  CreditCard,
  Building2,
  Users2,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  HardDrive,
  QrCode,
  Image as ImageIcon,
  History,
  X,
  PlusCircle,
  FileCheck,
  LogOut,
  Edit,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';

export type ActiveView =
  | 'DASHBOARD'
  | 'LR_ENTRY'
  | 'LR_REGISTER'
  | 'LR_TRACKING'
  | 'MR_ENTRY'
  | 'MR_REGISTER'
  | 'LHS_ENTRY'
  | 'LHS_REGISTER'
  | 'PAYMENT_MODULE'
  | 'STOCK_REGISTER'
  | 'STOCK_TRANSFER_ENTRY'
  | 'STOCK_TRANSFER_REGISTER'
  | 'MASTER_BRANCHES'
  | 'MASTER_CUSTOMERS'
  | 'MASTER_VEHICLES'
  | 'MASTER_DRIVERS'
  | 'REPORTS_LR'
  | 'REPORTS_MR'
  | 'REPORTS_LHS'
  | 'REPORTS_STOCK'
  | 'REPORTS_PAYMENTS'
  | 'REPORTS_PARTY'
  | 'REPORTS_OUTSTANDING'
  | 'DATA_SAFE_OVERVIEW'
  | 'DATA_SAFE_BACKUP'
  | 'DATA_SAFE_RESTORE'
  | 'DATA_SAFE_EXPORT'
  | 'SETTINGS_PROFILE'
  | 'SETTINGS_LOGO_QR'
  | 'SETTINGS_USERS'
  | 'SETTINGS_AUDIT';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  currentUser: User;
  lrCount: number;
  mrCount: number;
  lhsCount: number;
  stockTransferCount: number;
  pendingCount: number;
  companyLogo: string;
  onLogout?: () => void;
  onOpenAdminEditLR?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isOpen,
  onCloseMobile,
  currentUser,
  lrCount,
  mrCount,
  lhsCount,
  stockTransferCount,
  pendingCount,
  companyLogo,
  onLogout,
  onOpenAdminEditLR,
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  const isOperator = currentUser.role === 'OPERATOR' || currentUser.username === 'operator';
  const isFullAccess = isAdmin || isOperator;
  const isOtherUser = !isFullAccess;
  const canViewProfile = isFullAccess;

  const handleItemClick = (view: ActiveView) => {
    onNavigate(view);
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  const navItemClass = (view: ActiveView) => {
    const isActive = activeView === view;
    return `w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
      isActive
        ? 'bg-blue-600 text-white font-semibold shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="app-sidebar"
        className={`no-print fixed lg:static top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] lg:w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 border-2 border-amber-400 flex-shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={companyLogo || '/company_logo.jpg'}
                alt="Chakan Transport Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white tracking-wide uppercase">
                SHREE SWAMI SAMARTH
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">CHAKAN TRANSPORT ERP</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 text-slate-300">
          {/* RESTRICTED VIEW FOR OTHER USERS (LR ENTRY, MR ENTRY, LHS ENTRY ONLY) */}
          {isOtherUser ? (
            <div className="space-y-4">
              {/* Access Restriction Notice */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entry Modules Access</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Your account is authorized for <strong className="text-white">LR Entry</strong>, <strong className="text-white">MR Entry</strong>, and <strong className="text-white">LHS Entry</strong> only.
                </p>
              </div>

              {/* Data Entry Modules */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                  <span>Entry Modules (नोंदणी)</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    3 MODULES
                  </span>
                </div>
                <div className="space-y-1.5">
                  <button
                    id="nav-lr-entry"
                    onClick={() => handleItemClick('LR_ENTRY')}
                    className={navItemClass('LR_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">LR Entry (LR नोंदणी)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-800">
                      Primary
                    </span>
                  </button>

                  <button
                    id="nav-mr-entry"
                    onClick={() => handleItemClick('MR_ENTRY')}
                    className={navItemClass('MR_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                      <span>MR Entry (Manifest)</span>
                    </div>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded font-bold border border-sky-800">
                      MR
                    </span>
                  </button>

                  <button
                    id="nav-lhs-entry"
                    onClick={() => handleItemClick('LHS_ENTRY')}
                    className={navItemClass('LHS_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>LHS Entry (Loading)</span>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-800">
                      LHS
                    </span>
                  </button>

                  <button
                    id="nav-lr-tracking-user"
                    onClick={() => handleItemClick('LR_TRACKING')}
                    className={navItemClass('LR_TRACKING')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span>LR Tracking & POD</span>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-800">
                      TRACK
                    </span>
                  </button>
                </div>
              </div>

              {/* Registers & Records for All Users */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                  <span>Registers (रजिस्टर)</span>
                  <span className="text-[9px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/60">
                    RECORDS
                  </span>
                </div>
                <div className="space-y-1.5">
                  <button
                    id="nav-user-lr-register"
                    onClick={() => handleItemClick('LR_REGISTER')}
                    className={navItemClass('LR_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>1. LR Booking Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {lrCount}
                    </span>
                  </button>

                  <button
                    id="nav-user-mr-register"
                    onClick={() => handleItemClick('MR_REGISTER')}
                    className={navItemClass('MR_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-sky-400" />
                      <span>2. MR Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {mrCount}
                    </span>
                  </button>

                  <button
                    id="nav-user-lhs-register"
                    onClick={() => handleItemClick('LHS_REGISTER')}
                    className={navItemClass('LHS_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      <span>3. LHS Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {lhsCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* FULL ACCESS FOR ADMIN & OPERATOR */
            <>
              {/* Main Dashboard */}
              <div>
                <button
                  id="nav-dashboard"
                  onClick={() => handleItemClick('DASHBOARD')}
                  className={navItemClass('DASHBOARD')}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>Dashboard</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>

              {/* MASTER DATA */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Master Data
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-master-branches"
                    onClick={() => handleItemClick('MASTER_BRANCHES')}
                    className={navItemClass('MASTER_BRANCHES')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Branch Master</span>
                    </div>
                  </button>

                  <button
                    id="nav-master-customers"
                    onClick={() => handleItemClick('MASTER_CUSTOMERS')}
                    className={navItemClass('MASTER_CUSTOMERS')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Customer / Party Master</span>
                    </div>
                  </button>

                  <button
                    id="nav-master-vehicles"
                    onClick={() => handleItemClick('MASTER_VEHICLES')}
                    className={navItemClass('MASTER_VEHICLES')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Vehicle Master</span>
                    </div>
                  </button>

                  <button
                    id="nav-master-drivers"
                    onClick={() => handleItemClick('MASTER_DRIVERS')}
                    className={navItemClass('MASTER_DRIVERS')}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Driver Master</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* TRANSPORT ENTRY */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Transport Entry
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-lr-entry"
                    onClick={() => handleItemClick('LR_ENTRY')}
                    className={navItemClass('LR_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>LR Entry</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded font-semibold border border-emerald-800">
                      New
                    </span>
                  </button>

                  <button
                    id="nav-lr-register"
                    onClick={() => handleItemClick('LR_REGISTER')}
                    className={navItemClass('LR_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>LR Booking Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {lrCount}
                    </span>
                  </button>

                  {isAdmin && (
                    <button
                      id="nav-admin-edit-lr"
                      onClick={() => {
                        if (onOpenAdminEditLR) {
                          onOpenAdminEditLR();
                          if (window.innerWidth < 1024) onCloseMobile();
                        } else {
                          handleItemClick('LR_REGISTER');
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-black text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/80 border-2 border-emerald-600/70 transition group cursor-pointer shadow-sm"
                      title="Search & Edit LR Consignment (Admin Authorized)"
                    >
                      <div className="flex items-center gap-2.5">
                        <Edit className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="tracking-wide">Edit LR (LR संपादित करा)</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black border border-emerald-400">
                        ADMIN
                      </span>
                    </button>
                  )}

                  <button
                    id="nav-lr-tracking"
                    onClick={() => handleItemClick('LR_TRACKING')}
                    className={navItemClass('LR_TRACKING')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                      <span>LR Tracking & POD</span>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-800">
                      LIVE
                    </span>
                  </button>

                  <button
                    id="nav-mr-entry"
                    onClick={() => handleItemClick('MR_ENTRY')}
                    className={navItemClass('MR_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                      <span>MR Entry (Manifest)</span>
                    </div>
                  </button>

                  <button
                    id="nav-mr-register"
                    onClick={() => handleItemClick('MR_REGISTER')}
                    className={navItemClass('MR_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-sky-400" />
                      <span>MR Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {mrCount}
                    </span>
                  </button>

                  <button
                    id="nav-lhs-entry"
                    onClick={() => handleItemClick('LHS_ENTRY')}
                    className={navItemClass('LHS_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>LHS Entry (Loading)</span>
                    </div>
                  </button>

                  <button
                    id="nav-lhs-register"
                    onClick={() => handleItemClick('LHS_REGISTER')}
                    className={navItemClass('LHS_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      <span>LHS Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {lhsCount}
                    </span>
                  </button>

                  <button
                    id="nav-payment-module"
                    onClick={() => handleItemClick('PAYMENT_MODULE')}
                    className={navItemClass('PAYMENT_MODULE')}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>PhonePe & UPI Payment</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* STOCK OPERATIONS */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Stock Operations
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-stock-register"
                    onClick={() => handleItemClick('STOCK_REGISTER')}
                    className={navItemClass('STOCK_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Boxes className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Stock Register</span>
                    </div>
                  </button>

                  <button
                    id="nav-stock-transfer"
                    onClick={() => handleItemClick('STOCK_TRANSFER_ENTRY')}
                    className={navItemClass('STOCK_TRANSFER_ENTRY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                      <span>Stock Transfer</span>
                    </div>
                  </button>

                  <button
                    id="nav-stock-transfer-register"
                    onClick={() => handleItemClick('STOCK_TRANSFER_REGISTER')}
                    className={navItemClass('STOCK_TRANSFER_REGISTER')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-teal-400" />
                      <span>Stock Transfer Register</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {stockTransferCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* REPORTS */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Reports
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-reports-lr"
                    onClick={() => handleItemClick('REPORTS_LR')}
                    className={navItemClass('REPORTS_LR')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>LR Reports</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-mr"
                    onClick={() => handleItemClick('REPORTS_MR')}
                    className={navItemClass('REPORTS_MR')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>MR Reports</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-lhs"
                    onClick={() => handleItemClick('REPORTS_LHS')}
                    className={navItemClass('REPORTS_LHS')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>LHS Reports</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-stock"
                    onClick={() => handleItemClick('REPORTS_STOCK')}
                    className={navItemClass('REPORTS_STOCK')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Stock Reports</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-payments"
                    onClick={() => handleItemClick('REPORTS_PAYMENTS')}
                    className={navItemClass('REPORTS_PAYMENTS')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Payment Reports</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-party"
                    onClick={() => handleItemClick('REPORTS_PARTY')}
                    className={navItemClass('REPORTS_PARTY')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Party-Wise Ledger</span>
                    </div>
                  </button>

                  <button
                    id="nav-reports-outstanding"
                    onClick={() => handleItemClick('REPORTS_OUTSTANDING')}
                    className={navItemClass('REPORTS_OUTSTANDING')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                      <span>Outstanding Dues</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* DATA SAFE */}
              <div>
                <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>DATA SAFE</span>
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1 py-0.2 rounded font-mono">
                    SECURE
                  </span>
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-data-safe-overview"
                    onClick={() => handleItemClick('DATA_SAFE_OVERVIEW')}
                    className={navItemClass('DATA_SAFE_OVERVIEW')}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      <span>Data Safe Overview</span>
                    </div>
                  </button>

                  <button
                    id="nav-data-safe-backup"
                    onClick={() => handleItemClick('DATA_SAFE_BACKUP')}
                    className={navItemClass('DATA_SAFE_BACKUP')}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Backup Data</span>
                    </div>
                  </button>

                  <button
                    id="nav-data-safe-restore"
                    onClick={() => handleItemClick('DATA_SAFE_RESTORE')}
                    className={navItemClass('DATA_SAFE_RESTORE')}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-rose-400" />
                      <span>Restore Data</span>
                    </div>
                  </button>

                  <button
                    id="nav-data-safe-export"
                    onClick={() => handleItemClick('DATA_SAFE_EXPORT')}
                    className={navItemClass('DATA_SAFE_EXPORT')}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <span>Export Data</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SETTINGS & ADMIN */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Settings & Admin
                </div>
                <div className="space-y-0.5">
                  <button
                    id="nav-settings-profile"
                    onClick={() => handleItemClick('SETTINGS_PROFILE')}
                    className={navItemClass('SETTINGS_PROFILE')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Company Profile</span>
                    </div>
                  </button>

                  <button
                    id="nav-settings-logo-qr"
                    onClick={() => handleItemClick('SETTINGS_LOGO_QR')}
                    className={navItemClass('SETTINGS_LOGO_QR')}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Company Logo & QR</span>
                    </div>
                  </button>

                  <button
                    id="nav-settings-users"
                    onClick={() => handleItemClick('SETTINGS_USERS')}
                    className={navItemClass('SETTINGS_USERS')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Users & Roles</span>
                    </div>
                  </button>

                  <button
                    id="nav-settings-audit"
                    onClick={() => handleItemClick('SETTINGS_AUDIT')}
                    className={navItemClass('SETTINGS_AUDIT')}
                  >
                    <div className="flex items-center gap-2.5">
                      <History className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                      <span>Security Audit Log</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex flex-col gap-2">
          {/* Active User Card */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <div className="font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</div>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border flex-shrink-0 ${
                isAdmin
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : isOperator
                  ? 'bg-blue-400/20 text-blue-300 border-blue-400/40'
                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
              }`}
            >
              {isAdmin ? 'Admin' : isOperator ? 'Operator' : 'Entry User'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              id="btn-sidebar-logout"
              title="Sign out of system"
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-600/90 border border-rose-900/50 hover:border-rose-500 rounded-lg transition cursor-pointer group shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-white transition" />
                <span>Log Out</span>
              </span>
              <span className="text-[10px] text-rose-300 font-mono">Sign Out</span>
            </button>
          )}

          {/* Official Website Link */}
          <a
            href="https://shreeswamisamarthtransport.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Open official company website: shreeswamisamarthtransport.in"
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium text-amber-400/90 hover:text-amber-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 rounded-lg transition group"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Globe className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">shreeswamisamarthtransport.in</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-200 flex-shrink-0" />
          </a>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <div className="truncate">
              <span className="font-semibold text-slate-300">New Shree Swami Samarth</span>
              <div className="text-[10px] text-slate-400">
                {isFullAccess ? 'Full ERP Access' : 'LR • MR • LHS Entry Only'}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="System Online" />
          </div>
        </div>
      </aside>
    </>
  );
};
