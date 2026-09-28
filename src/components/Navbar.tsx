import React from 'react';
import { Search, Download, LogOut, Shield, MapPin, Menu, Cloud, RefreshCw, WifiOff, Edit, Globe, ExternalLink, Code } from 'lucide-react';
import { User, Branch } from '../types';
import { SyncState } from '../services/cloudSync';

interface NavbarProps {
  currentUser: User;
  branches: Branch[];
  selectedBranch: string;
  onSelectBranch: (branchCode: string) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  onSwitchUser?: () => void;
  onToggleSidebar: () => void;
  companyLogo: string;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  syncState?: SyncState;
  onForceSync?: () => void;
  onOpenAdminEditLR?: () => void;
  onOpenWebsiteIntegration?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  branches,
  selectedBranch,
  onSelectBranch,
  onOpenSearch,
  onLogout,
  onSwitchUser,
  onToggleSidebar,
  companyLogo,
  canInstallPwa,
  onInstallPwa,
  syncState,
  onForceSync,
  onOpenAdminEditLR,
  onOpenWebsiteIntegration,
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'OPERATOR':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'VIEWER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md w-full max-w-full overflow-x-hidden">
      <div className="px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4 w-full max-w-full min-w-0">
        {/* Left: Mobile menu toggle + Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            onClick={onToggleSidebar}
            id="btn-toggle-sidebar"
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition lg:hidden flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white p-0.5 border-2 border-amber-400 shadow-sm flex-shrink-0 flex items-center justify-center">
              <img
                src={companyLogo || '/company_logo.jpg'}
                alt="New Shree Swami Samarth Transport Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-base md:text-lg tracking-wide text-white uppercase truncate">
                  NEW SHREE SWAMI SAMARTH TRANSPORT
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] sm:text-xs text-amber-400 font-medium truncate">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="truncate">Chakan, Pune • Heavy Logistics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <button
            onClick={onOpenSearch}
            id="btn-global-search"
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400" />
              <span>Search LR, MR, LHS, Customer, Vehicle...</span>
            </span>
            <kbd className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Branch Selector, PWA Install, User info & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            id="btn-mobile-search"
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Branch Filter */}
          <div className="flex items-center">
            <select
              value={selectedBranch}
              onChange={(e) => onSelectBranch(e.target.value)}
              id="select-navbar-branch"
              className="bg-slate-800 border border-slate-700 text-white text-[11px] sm:text-xs font-semibold rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[85px] sm:max-w-[140px] truncate"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Edit LR Quick Button (Tablet/Desktop only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminEditLR}
              id="btn-navbar-admin-edit-lr"
              title="Admin Authorized: Search & Edit any booked Consignment LR"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-sm transition border border-emerald-400 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit LR (संपादित करा)</span>
            </button>
          )}

          {/* Main Official Website Link */}
          <a
            href="https://shreeswamisamarthtransport.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Official Company Website (shreeswamisamarthtransport.in)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">shreeswamisamarthtransport.in</span>
            <span className="md:hidden">Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Website Login Integration Code Modal Button */}
          {onOpenWebsiteIntegration && (
            <button
              type="button"
              onClick={onOpenWebsiteIntegration}
              id="btn-navbar-website-code"
              title="Get Website 'LOGIN' Button Code for shreeswamisamarthtransport.in"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>वेबसाइट LOGIN कोड</span>
            </button>
          )}

          {/* Cloud Sync Status (All Devices Synced) */}
          <button
            type="button"
            onClick={onForceSync}
            title={
              syncState?.status === 'connected'
                ? 'सर्व डिव्हाइसवर डेटा आपोआप सिंक आहे (Firebase Cloud Live). क्लिक करून रिफ्रेश करा.'
                : syncState?.status === 'syncing'
                ? 'क्लाउड डेटाबेससह सिंक होत आहे...'
                : 'ऑफलाइन मोड (डिव्हाइस कॅश). पुन्हा प्रयत्न करण्यासाठी क्लिक करा.'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              syncState?.status === 'connected'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80 hover:text-emerald-200'
                : syncState?.status === 'syncing'
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {syncState?.status === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline text-[11px] font-medium tracking-tight">Cloud Synced</span>
                <span className="hidden xl:inline text-[10px] text-emerald-400/80 font-normal">(All Devices)</span>
              </>
            ) : syncState?.status === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-[11px] font-medium text-amber-300">Syncing...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-400">Offline</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          {canInstallPwa && (
            <button
              onClick={onInstallPwa}
              id="btn-install-pwa"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition"
              title="Install Mobile App / Desktop PWA"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* User Profile Pill & Actions */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={onSwitchUser}
              id="btn-navbar-user-profile"
              title="Click to view user profile & switch account"
              className="flex items-center gap-2 text-left p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer group"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white line-clamp-1 flex items-center justify-end gap-1.5 group-hover:text-amber-300 transition">
                  <span>{currentUser.name}</span>
                  {currentUser.role === 'ADMIN' && (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1.5">
                  {currentUser.phone && (
                    <span className="font-mono text-amber-300 font-semibold">{currentUser.phone}</span>
                  )}
                  <span>• @{currentUser.username}</span>
                </div>
              </div>
              <span
                title={currentUser.email ? `${currentUser.name} (${currentUser.email}) • Contact: ${currentUser.phone || 'N/A'}` : currentUser.name}
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${getRoleBadgeColor(
                  currentUser.role
                )}`}
              >
                {currentUser.role}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              id="btn-logout"
              title="Sign Out / Log Out from System"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 rounded-lg transition text-xs font-semibold ml-1 cursor-pointer group shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-white transition" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
