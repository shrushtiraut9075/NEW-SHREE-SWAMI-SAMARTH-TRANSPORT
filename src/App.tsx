import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveView } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LREntry } from './components/LREntry';
import { LRRegister } from './components/LRRegister';
import { LRViewModal } from './components/LRViewModal';
import { LRPrintDocument } from './components/LRPrintDocument';
import { TripManifestPrintDocument } from './components/TripManifestPrintDocument';
import { MRPrintDocument } from './components/MRPrintDocument';
import { MREntry } from './components/MREntry';
import { MRRegister } from './components/MRRegister';
import { LHSEntry } from './components/LHSEntry';
import { LHSRegister } from './components/LHSRegister';
import { StockOperations } from './components/StockOperations';
import { PaymentModule } from './components/PaymentModule';
import { MasterDataModule } from './components/MasterDataModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { LRTrackingModule } from './components/LRTrackingModule';
import { LoginPage } from './components/LoginPage';
import { AdminLREditModal } from './components/AdminLREditModal';
import { WebsiteIntegrationModal } from './components/WebsiteIntegrationModal';
import { StorageService } from './services/storage';
import { CloudSync, SyncState } from './services/cloudSync';
import {
  LRRecord,
  MRRecord,
  LHSRecord,
  StockTransferRecord,
  PaymentRecord,
  Branch,
  Customer,
  Vehicle,
  Driver,
  CompanyProfile,
  User,
} from './types';
import {
  Search,
  X,
  BookOpen,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Shield,
  CheckCircle2,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Truck,
  Menu,
} from 'lucide-react';

export default function App() {
  // Master datasets
  const [branches, setBranches] = useState<Branch[]>(StorageService.getBranches());
  const [customers, setCustomers] = useState<Customer[]>(StorageService.getCustomers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(StorageService.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(StorageService.getDrivers());

  // Operational records
  const [lrs, setLrs] = useState<LRRecord[]>(StorageService.getLRs());
  const [mrs, setMrs] = useState<MRRecord[]>(StorageService.getMRs());
  const [lhsList, setLhsList] = useState<LHSRecord[]>(StorageService.getLHS());
  const [stockTransfers, setStockTransfers] = useState<StockTransferRecord[]>(
    StorageService.getStockTransfers()
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(StorageService.getPayments());

  // Company Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(
    StorageService.getCompany()
  );

  // Users & Current Authenticated User (with RBAC role switcher)
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [websiteIntegrationOpen, setWebsiteIntegrationOpen] = useState(false);

  // RBAC Access Control flags: Admin & Operator have full access; other users restricted to LR, MR, LHS entry only
  const isFullAccess =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'OPERATOR' ||
    currentUser?.username === 'admin' ||
    currentUser?.username === 'operator';
  const isOtherUser = !isFullAccess;

  // Navigation and branch state
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const user = StorageService.getCurrentUser();
    const isFull =
      user?.role === 'ADMIN' ||
      user?.role === 'OPERATOR' ||
      user?.username === 'admin' ||
      user?.username === 'operator';
    return isFull ? 'DASHBOARD' : 'LR_ENTRY';
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Enforce access control for non-admin/non-operator users
  useEffect(() => {
    if (currentUser && isOtherUser) {
      const allowedViews: ActiveView[] = [
        'LR_ENTRY',
        'LR_REGISTER',
        'MR_ENTRY',
        'MR_REGISTER',
        'LHS_ENTRY',
        'LHS_REGISTER',
        'LR_TRACKING',
      ];
      if (!allowedViews.includes(activeView)) {
        setActiveView('LR_ENTRY');
      }
    }
  }, [currentUser, activeView, isOtherUser]);

  // Modals & Editing states
  const [viewingLR, setViewingLR] = useState<LRRecord | null>(null);
  const [printingLRs, setPrintingLRs] = useState<LRRecord[] | null>(null);
  const [printingLHS, setPrintingLHS] = useState<LHSRecord | null>(null);
  const [printingMR, setPrintingMR] = useState<MRRecord | null>(null);
  const [autoPrintTrigger, setAutoPrintTrigger] = useState<boolean>(false);
  const setPrintingLR = (lr: LRRecord | null, autoPrint: boolean = false) => {
    setAutoPrintTrigger(autoPrint);
    setPrintingLRs(lr ? [lr] : null);
  };
  const [editingLR, setEditingLR] = useState<LRRecord | null>(null);
  const [editingMR, setEditingMR] = useState<MRRecord | null>(null);
  const [editingLHS, setEditingLHS] = useState<LHSRecord | null>(null);

  // Global search & User switch dialogs
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSwitchModalOpen, setUserSwitchModalOpen] = useState(false);
  const [adminEditModalOpen, setAdminEditModalOpen] = useState(false);

  // Cloud Sync Status (All Devices Synced)
  const [syncState, setSyncState] = useState<SyncState>(() => CloudSync.getSyncState());

  // Real-time synchronization across all devices via Firebase Firestore
  useEffect(() => {
    // 1. Initialize Firestore listeners for LRs, MRs, LHS, Customers, Payments, etc.
    CloudSync.initRealtimeSync();

    // 2. Refresh local state whenever cloud data is updated by another device
    const unsubData = CloudSync.subscribeDataChange(() => {
      refreshAllData();
    });

    // 3. Monitor connection status (connected, syncing, offline)
    const unsubSync = CloudSync.subscribeSyncState((state) => {
      setSyncState(state);
    });

    return () => {
      unsubData();
      unsubSync();
    };
  }, []);

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Refresh all state from StorageService (Single Source of Truth)
  const refreshAllData = () => {
    setBranches(StorageService.getBranches());
    setCustomers(StorageService.getCustomers());
    setVehicles(StorageService.getVehicles());
    setDrivers(StorageService.getDrivers());
    setLrs(StorageService.getLRs());
    setMrs(StorageService.getMRs());
    setLhsList(StorageService.getLHS());
    setStockTransfers(StorageService.getStockTransfers());
    setPayments(StorageService.getPayments());
    setCompanyProfile(StorageService.getCompany());
    setUsers(StorageService.getUsers());
  };

  // Keyboard shortcut for global search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchDialogOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchDialogOpen(false);
        setUserSwitchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Capture PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('PWA installation is supported directly from your browser menu or address bar.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
    }
    setDeferredPrompt(null);
  };

  // Switch User / Role for live RBAC testing
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    setUserSwitchModalOpen(false);
    const isFull =
      user.role === 'ADMIN' ||
      user.role === 'OPERATOR' ||
      user.username === 'admin' ||
      user.username === 'operator';
    if (!isFull) {
      setActiveView('LR_ENTRY');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    const prevUser = currentUser;
    StorageService.logout();
    setCurrentUser(null);
    setShowLogoutModal(false);
    setUserSwitchModalOpen(false);
    setLogoutNotice(
      prevUser
        ? `You have successfully logged out (${prevUser.name}).`
        : 'You have been securely logged out.'
    );
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setLogoutNotice(null);
    refreshAllData();
    const isFull =
      user.role === 'ADMIN' ||
      user.role === 'OPERATOR' ||
      user.username === 'admin' ||
      user.username === 'operator';
    if (!isFull) {
      setActiveView('LR_ENTRY');
    }
  };

  // LR actions
  const handleSaveLRSuccess = (savedLR: LRRecord, andPrint: boolean = true) => {
    refreshAllData();
    setEditingLR(null);
    if (andPrint) {
      setAutoPrintTrigger(true);
      setPrintingLRs([savedLR]);
    } else {
      setAutoPrintTrigger(false);
      setActiveView('LR_REGISTER');
    }
  };

  const handleCancelLR = (lrId: string, reason: string) => {
    StorageService.cancelLR(lrId, reason, currentUser.username);
    refreshAllData();
  };

  const handlePurgeLR = (lrId: string) => {
    StorageService.permanentlyDeleteLR(lrId, currentUser.username);
    refreshAllData();
  };

  // MR actions
  const handleSaveMRSuccess = (savedMR: MRRecord, andPrint?: boolean) => {
    refreshAllData();
    setEditingMR(null);
    if (andPrint) {
      setPrintingMR(savedMR);
    } else {
      setActiveView('MR_REGISTER');
    }
  };

  // LHS actions
  const handleSaveLHSSuccess = (savedLHS: LHSRecord, andPrint?: boolean) => {
    refreshAllData();
    setEditingLHS(null);
    if (andPrint) {
      setPrintingLHS(savedLHS);
    } else {
      setActiveView('LHS_REGISTER');
    }
  };

  // Global search matches
  const globalSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{
      type: 'LR' | 'MR' | 'LHS' | 'CUSTOMER';
      id: string;
      title: string;
      subtitle: string;
      raw: any;
    }> = [];

    // Search LRs
    lrs.forEach((l) => {
      if (
        l.lrNumber.toLowerCase().includes(q) ||
        l.consignorName.toLowerCase().includes(q) ||
        l.consigneeName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'LR',
          id: l.id,
          title: `LR: ${l.lrNumber}`,
          subtitle: `${l.consignorName} → ${l.consigneeName} (₹${l.charges?.grandTotal || 0})`,
          raw: l,
        });
      }
    });

    // Search MRs
    mrs.forEach((m) => {
      if (
        m.mrNumber.toLowerCase().includes(q) ||
        m.vehicleNumber.toLowerCase().includes(q) ||
        m.driverName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'MR',
          id: m.id,
          title: `Manifest: ${m.mrNumber}`,
          subtitle: `Vehicle: ${m.vehicleNumber} | Route: ${m.fromBranch} → ${m.toBranch}`,
          raw: m,
        });
      }
    });

    // Search LHS
    lhsList.forEach((lhs) => {
      if (
        lhs.lhsNumber.toLowerCase().includes(q) ||
        lhs.vehicleNumber.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'LHS',
          id: lhs.id,
          title: `Loading Sheet: ${lhs.lhsNumber}`,
          subtitle: `Vehicle: ${lhs.vehicleNumber} | Freight: ₹${lhs.totalFreight}`,
          raw: lhs,
        });
      }
    });

    // Search Customers
    customers.forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'CUSTOMER',
          id: c.id,
          title: `Party: ${c.name}`,
          subtitle: `GSTIN: ${c.gstin || 'N/A'} | Contact: ${c.contact || 'N/A'}`,
          raw: c,
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, lrs, mrs, lhsList, customers]);

  if (!currentUser) {
    return (
      <LoginPage
        companyProfile={companyProfile}
        onLoginSuccess={handleLoginSuccess}
        logoutMessage={logoutNotice}
      />
    );
  }

  // Pending count for sidebar badge
  const pendingCount = lrs.filter(
    (l) => l.status === 'BOOKED' || l.paymentStatus === 'PENDING'
  ).length;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 flex flex-col text-slate-900 font-sans pb-16 lg:pb-0">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={(code) => setSelectedBranch(code)}
        onOpenSearch={() => setSearchDialogOpen(true)}
        onLogout={handleLogout}
        onSwitchUser={() => setUserSwitchModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        companyLogo={companyProfile.logoUrl}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        syncState={syncState}
        onForceSync={() => CloudSync.forceRefreshCloudData()}
        onOpenAdminEditLR={() => setAdminEditModalOpen(true)}
        onOpenWebsiteIntegration={() => setWebsiteIntegrationOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-row overflow-hidden w-full max-w-full min-w-0">
        {/* 2. Responsive Sidebar Drawer */}
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => {
            setActiveView(view);
            if (view === 'LR_ENTRY') setEditingLR(null);
            if (view === 'MR_ENTRY') setEditingMR(null);
            if (view === 'LHS_ENTRY') setEditingLHS(null);
          }}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          lrCount={lrs.length}
          mrCount={mrs.length}
          lhsCount={lhsList.length}
          stockTransferCount={stockTransfers.length}
          pendingCount={pendingCount}
          companyLogo={companyProfile.logoUrl}
          onLogout={handleLogout}
          onOpenAdminEditLR={() => setAdminEditModalOpen(true)}
        />

        {/* 3. Central Dynamic Workspace Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 lg:p-8 w-full max-w-full min-w-0">
          {/* A4 LR PRINT DOCUMENT PREVIEW */}
          {printingLRs && printingLRs.length > 0 ? (
            <LRPrintDocument
              lr={printingLRs[0]}
              lrs={printingLRs}
              companyProfile={companyProfile}
              autoPrint={autoPrintTrigger}
              currentUser={currentUser}
              onEdit={(lr) => {
                setAutoPrintTrigger(false);
                setPrintingLRs(null);
                setEditingLR(lr);
                setActiveView('LR_ENTRY');
              }}
              onBack={() => {
                setAutoPrintTrigger(false);
                setPrintingLRs(null);
                setActiveView(isOtherUser ? 'LR_ENTRY' : 'LR_REGISTER');
              }}
            />
          ) : printingLHS ? (
            <TripManifestPrintDocument
              lhs={printingLHS}
              attachedLRs={lrs.filter((l) => printingLHS.lrIds?.includes(l.id))}
              companyProfile={companyProfile}
              onBack={() => {
                setPrintingLHS(null);
                setActiveView(isOtherUser ? 'LHS_ENTRY' : 'LHS_REGISTER');
              }}
            />
          ) : printingMR ? (
            <MRPrintDocument
              mr={printingMR}
              attachedLRs={lrs.filter((l) => printingMR.lrIds?.includes(l.id))}
              companyProfile={companyProfile}
              onBack={() => {
                setPrintingMR(null);
                setActiveView(isOtherUser ? 'MR_ENTRY' : 'MR_REGISTER');
              }}
            />
          ) : (
            <>
              {/* RESTRICTED ACCESS WARNING (When non-admin/non-operator attempts non-entry view) */}
              {isOtherUser && !['LR_ENTRY', 'MR_ENTRY', 'LHS_ENTRY', 'LR_TRACKING'].includes(activeView) && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Your account ({currentUser.name} • {currentUser.role}) is designated for Data Entry only. You have authorized access to <strong>LR Entry</strong>, <strong>MR Entry</strong>, <strong>LHS Entry</strong>, and <strong>LR Tracking & POD</strong> modules.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={() => setActiveView('LR_ENTRY')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      LR Entry (एल.आर नोंद)
                    </button>
                    <button
                      onClick={() => setActiveView('MR_ENTRY')}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      MR Entry (मॅनिफेस्ट नोंद)
                    </button>
                    <button
                      onClick={() => setActiveView('LHS_ENTRY')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      LHS Entry (लोडिंग शीट)
                    </button>
                    <button
                      onClick={() => setActiveView('LR_TRACKING')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      LR Tracking & POD (ट्रॅकिंग व पावती)
                    </button>
                  </div>
                </div>
              )}

              {/* DASHBOARD VIEW (Admin & Operator Only) */}
              {isFullAccess && activeView === 'DASHBOARD' && (
                <Dashboard
                  lrs={lrs}
                  mrs={mrs}
                  lhsList={lhsList}
                  stockTransfers={stockTransfers}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onNavigate={(v) => {
                    setActiveView(v);
                    if (v === 'LR_ENTRY') setEditingLR(null);
                  }}
                  onViewLR={(lr) => setViewingLR(lr)}
                  onPrintLR={(lr) => setPrintingLR(lr)}
                  onEditLR={(lr) => {
                    setEditingLR(lr);
                    setActiveView('LR_ENTRY');
                  }}
                  onOpenAdminEditLR={() => setAdminEditModalOpen(true)}
                  onOpenWebsiteIntegration={() => setWebsiteIntegrationOpen(true)}
                  currentUser={currentUser}
                  companyProfile={companyProfile}
                />
              )}

              {/* LR ENTRY / EDIT VIEW (Accessible to all roles) */}
              {activeView === 'LR_ENTRY' && (
                <LREntry
                  branches={branches}
                  customers={customers}
                  vehicles={vehicles}
                  drivers={drivers}
                  selectedBranch={selectedBranch}
                  initialLR={editingLR}
                  onSaveSuccess={handleSaveLRSuccess}
                  onCancel={() => {
                    setEditingLR(null);
                    setActiveView(isOtherUser ? 'LR_ENTRY' : 'LR_REGISTER');
                  }}
                  currentUser={currentUser}
                  companyProfile={companyProfile}
                />
              )}

              {/* LR REGISTER VIEW (Accessible to all authenticated users) */}
              {activeView === 'LR_REGISTER' && (
                <LRRegister
                  lrs={lrs}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onNewLR={() => {
                    setEditingLR(null);
                    setActiveView('LR_ENTRY');
                  }}
                  onViewLR={(lr) => setViewingLR(lr)}
                  onEditLR={(lr) => {
                    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
                    if (!isAdmin) {
                      alert('LR संपादन केवळ सिस्टीम ॲडमिन (Admin) यांनाच अनुमत आहे. कोणतीही LR ही ॲडमिन शिवाय एडिट करता येत नाही.');
                      return;
                    }
                    setEditingLR(lr);
                    setActiveView('LR_ENTRY');
                  }}
                  onPrintLR={(lr) => setPrintingLR(lr)}
                  onPrintMultipleLRs={(selectedLRs) => setPrintingLRs(selectedLRs)}
                  onCancelLR={handleCancelLR}
                  onPurgeLR={handlePurgeLR}
                  onTrackLR={(lr) => setActiveView('LR_TRACKING')}
                  onOpenAdminEditLR={() => setAdminEditModalOpen(true)}
                  currentUser={currentUser}
                  companyProfile={companyProfile}
                />
              )}

              {/* LR LIVE TRACKING & POD MODULE (Accessible to Admin, Operator, and Entry staff) */}
              {activeView === 'LR_TRACKING' && (
                <LRTrackingModule
                  lrs={lrs}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  companyProfile={companyProfile}
                  currentUser={currentUser}
                  onRefresh={refreshAllData}
                  onViewLR={(lr) => setViewingLR(lr)}
                  onPrintLR={(lr) => setPrintingLR(lr)}
                />
              )}

              {/* MR (MANIFEST) ENTRY VIEW (Accessible to all roles) */}
              {activeView === 'MR_ENTRY' && (
                <MREntry
                  branches={branches}
                  vehicles={vehicles}
                  drivers={drivers}
                  availableLRs={lrs.filter((l) => l.status !== 'CANCELLED')}
                  existingMRs={mrs}
                  selectedBranch={selectedBranch}
                  initialMR={editingMR}
                  onSaveSuccess={handleSaveMRSuccess}
                  onCancel={() => {
                    setEditingMR(null);
                    setActiveView('MR_REGISTER');
                  }}
                  currentUser={currentUser}
                />
              )}

              {/* MR (MANIFEST) REGISTER VIEW (Accessible to all authenticated users) */}
              {activeView === 'MR_REGISTER' && (
                <MRRegister
                  mrs={mrs}
                  lrs={lrs}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onNewMR={() => {
                    setEditingMR(null);
                    setActiveView('MR_ENTRY');
                  }}
                  onEditMR={(mr) => {
                    setEditingMR(mr);
                    setActiveView('MR_ENTRY');
                  }}
                  onPrintMR={(mr) => setPrintingMR(mr)}
                  currentUser={currentUser}
                  companyProfile={companyProfile}
                />
              )}

              {/* LHS (LOADING SHEET) ENTRY VIEW - Loads from MR entries (MR Stock) */}
              {activeView === 'LHS_ENTRY' && (
                <LHSEntry
                  branches={branches}
                  vehicles={vehicles}
                  drivers={drivers}
                  availableMRs={mrs}
                  allLRs={lrs}
                  existingLHS={lhsList}
                  selectedBranch={selectedBranch}
                  initialLHS={editingLHS}
                  onSaveSuccess={handleSaveLHSSuccess}
                  onCancel={() => {
                    setEditingLHS(null);
                    setActiveView('LHS_REGISTER');
                  }}
                  onNavigateToMR={() => {
                    setEditingMR(null);
                    setActiveView('MR_ENTRY');
                  }}
                  currentUser={currentUser}
                />
              )}

              {/* LHS (LOADING SHEET) REGISTER VIEW (Accessible to all authenticated users) */}
              {activeView === 'LHS_REGISTER' && (
                <LHSRegister
                  lhsList={lhsList}
                  lrs={lrs}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onNewLHS={() => {
                    setEditingLHS(null);
                    setActiveView('LHS_ENTRY');
                  }}
                  onEditLHS={(lhs) => {
                    setEditingLHS(lhs);
                    setActiveView('LHS_ENTRY');
                  }}
                  onPrintLHS={(lhs) => setPrintingLHS(lhs)}
                  currentUser={currentUser}
                  companyProfile={companyProfile}
                />
              )}

              {/* STOCK OPERATIONS (Admin & Operator Only) */}
              {isFullAccess &&
                (activeView === 'STOCK_REGISTER' ||
                  activeView === 'STOCK_TRANSFER_ENTRY' ||
                  activeView === 'STOCK_TRANSFER_REGISTER') && (
                  <StockOperations
                    viewMode={
                      activeView === 'STOCK_REGISTER'
                        ? 'REGISTER'
                        : activeView === 'STOCK_TRANSFER_ENTRY'
                        ? 'TRANSFER_ENTRY'
                        : 'TRANSFER_REGISTER'
                    }
                    stockTransfers={stockTransfers}
                    lrs={lrs}
                    mrs={mrs}
                    lhsList={lhsList}
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onNavigate={(v) => setActiveView(v)}
                    onTransferCreated={(newT) => {
                      refreshAllData();
                      setActiveView('STOCK_TRANSFER_REGISTER');
                    }}
                    onUpdateTransferStatus={(id, status) => {
                      StorageService.updateStockTransferStatus(id, status, currentUser.username);
                      refreshAllData();
                    }}
                    currentUser={currentUser}
                  />
                )}

              {/* PHONEPE & UPI PAYMENT MODULE (Admin & Operator Only) */}
              {isFullAccess && activeView === 'PAYMENT_MODULE' && (
                <PaymentModule
                  payments={payments}
                  lrs={lrs}
                  companyProfile={companyProfile}
                  currentUser={currentUser}
                  onPaymentRecorded={(p) => {
                    refreshAllData();
                  }}
                />
              )}

              {/* MASTER DATA MODULES (Admin & Operator Only) */}
              {isFullAccess && activeView === 'MASTER_BRANCHES' && (
                <MasterDataModule
                  type="BRANCHES"
                  branches={branches}
                  customers={customers}
                  vehicles={vehicles}
                  drivers={drivers}
                  currentUser={currentUser}
                  onRefresh={refreshAllData}
                />
              )}
              {isFullAccess && activeView === 'MASTER_CUSTOMERS' && (
                <MasterDataModule
                  type="CUSTOMERS"
                  branches={branches}
                  customers={customers}
                  vehicles={vehicles}
                  drivers={drivers}
                  currentUser={currentUser}
                  onRefresh={refreshAllData}
                />
              )}
              {isFullAccess && activeView === 'MASTER_VEHICLES' && (
                <MasterDataModule
                  type="VEHICLES"
                  branches={branches}
                  customers={customers}
                  vehicles={vehicles}
                  drivers={drivers}
                  currentUser={currentUser}
                  onRefresh={refreshAllData}
                />
              )}
              {isFullAccess && activeView === 'MASTER_DRIVERS' && (
                <MasterDataModule
                  type="DRIVERS"
                  branches={branches}
                  customers={customers}
                  vehicles={vehicles}
                  drivers={drivers}
                  currentUser={currentUser}
                  onRefresh={refreshAllData}
                />
              )}

              {/* REPORTS MODULE (Admin & Operator Only) */}
              {isFullAccess &&
                (activeView === 'REPORTS_LR' ||
                  activeView === 'REPORTS_MR' ||
                  activeView === 'REPORTS_LHS' ||
                  activeView === 'REPORTS_STOCK' ||
                  activeView === 'REPORTS_PAYMENTS' ||
                  activeView === 'REPORTS_PARTY' ||
                  activeView === 'REPORTS_OUTSTANDING') && (
                  <ReportsModule
                    lrs={lrs}
                    mrs={mrs}
                    lhsList={lhsList}
                    payments={payments}
                    stockTransfers={stockTransfers}
                    customers={customers}
                    branches={branches}
                    companyProfile={companyProfile}
                    initialReportType={
                      activeView === 'REPORTS_MR'
                        ? 'MR_REPORT'
                        : activeView === 'REPORTS_LHS'
                        ? 'LHS_REPORT'
                        : activeView === 'REPORTS_STOCK'
                        ? 'STOCK_REPORT'
                        : activeView === 'REPORTS_PAYMENTS'
                        ? 'PAYMENT_REPORT'
                        : activeView === 'REPORTS_PARTY'
                        ? 'PARTY_LEDGER_REPORT'
                        : activeView === 'REPORTS_OUTSTANDING'
                        ? 'OUTSTANDING_REPORT'
                        : 'LR_REPORT'
                    }
                    onPrintLR={(lr) => setPrintingLR(lr)}
                    onPrintMR={(mr) => setPrintingMR(mr)}
                    onPrintLHS={(lhs) => setPrintingLHS(lhs)}
                  />
                )}

              {/* DATA SAFE & SETTINGS (Admin & Operator Only) */}
              {isFullAccess &&
                (activeView === 'DATA_SAFE_OVERVIEW' ||
                  activeView === 'DATA_SAFE_BACKUP' ||
                  activeView === 'DATA_SAFE_RESTORE' ||
                  activeView === 'DATA_SAFE_EXPORT' ||
                  activeView === 'SETTINGS_PROFILE' ||
                  activeView === 'SETTINGS_LOGO_QR' ||
                  activeView === 'SETTINGS_USERS' ||
                  activeView === 'SETTINGS_AUDIT') && (
                  <SettingsModule
                    companyProfile={companyProfile}
                    currentUser={currentUser}
                    onProfileUpdated={(updated) => {
                      setCompanyProfile(updated);
                      refreshAllData();
                    }}
                    onDatabaseRestored={refreshAllData}
                  />
                )}
            </>
          )}
        </main>
      </div>

      {/* 4. MODALS & POPUPS */}

      {/* LR VIEW MODAL */}
      <LRViewModal
        lr={viewingLR}
        onClose={() => setViewingLR(null)}
        currentUser={currentUser}
        onEdit={(lr) => {
          setViewingLR(null);
          setEditingLR(lr);
          setActiveView('LR_ENTRY');
        }}
        onPrint={(lr) => {
          setViewingLR(null);
          setPrintingLR(lr);
        }}
        onOpenTracking={(lr) => {
          setViewingLR(null);
          setActiveView('LR_TRACKING');
        }}
        companyProfile={companyProfile}
      />

      {/* GLOBAL SEARCH DIALOG (Ctrl+K) */}
      {searchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-start justify-center pt-20 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by LR number, manifest, vehicle, customer, or route..."
                className="w-full text-sm font-semibold outline-none bg-transparent"
              />
              <button
                onClick={() => setSearchDialogOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 text-xs">
              {globalSearchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  {searchQuery.trim()
                    ? 'No records found matching your query.'
                    : 'Type anything to search across LRs, MRs, vehicles, and customers...'}
                </div>
              ) : (
                globalSearchResults.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSearchDialogOpen(false);
                      if (isOtherUser) {
                        if (r.type === 'LR') {
                          setViewingLR(r.raw);
                        } else if (r.type === 'MR') {
                          setActiveView('MR_ENTRY');
                        } else if (r.type === 'LHS') {
                          setActiveView('LHS_ENTRY');
                        }
                      } else {
                        if (r.type === 'LR') {
                          setViewingLR(r.raw);
                        } else if (r.type === 'MR') {
                          setActiveView('MR_REGISTER');
                        } else if (r.type === 'LHS') {
                          setActiveView('LHS_REGISTER');
                        } else if (r.type === 'CUSTOMER') {
                          setActiveView('MASTER_CUSTOMERS');
                        }
                      }
                    }}
                    className="p-2.5 hover:bg-blue-50/70 rounded-lg cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-500">{r.subtitle}</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
                      {r.type}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
              <span>Quick Navigation: Press Enter to open or Esc to close</span>
              <span>New Shree Swami Samarth Transport ERP</span>
            </div>
          </div>
        </div>
      )}

      {/* USER / ROLE SWITCHER MODAL (Live RBAC Testing) */}
      {userSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Switch User / Role (RBAC Simulator)
                </h3>
              </div>
              <button
                onClick={() => setUserSwitchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              Select an account to test different access tiers:
            </p>

            <div className="space-y-2">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.role === 'ADMIN' && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                            PROPRIETOR / SYSTEM ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                        <span>@{u.username} • Branch: {u.branchCode}</span>
                        {u.phone && <span className="font-mono text-slate-700 font-medium">📱 {u.phone}</span>}
                        {u.email && <span className="text-blue-600 font-medium">✉️ {u.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'OPERATOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 text-[11px] text-slate-500 border-t border-slate-100">
              <strong>Role Access Rules:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>
                  <strong className="text-purple-700">ADMIN:</strong> Full Access (All modules, operations, registers, settings, and Data Safe).
                </li>
                <li>
                  <strong className="text-blue-700">OPERATOR:</strong> Full Access (All modules, operations, registers, settings, and Data Safe).
                </li>
                <li>
                  <strong className="text-emerald-700">OTHER USERS (USER / VIEWER):</strong> Restricted to <strong>LR Entry</strong>, <strong>MR Entry</strong>, and <strong>LHS Entry</strong> modules only.
                </li>
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setUserSwitchModalOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserSwitchModalOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out from System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex-shrink-0">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Sign Out of System</h3>
                <p className="text-xs text-slate-500">End active session</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to log out, <strong className="text-slate-900">{currentUser.name}</strong>? Any unsaved edits will be closed and your terminal session will be cleared.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                id="btn-confirm-logout-modal"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Website Integration Modal */}
      <WebsiteIntegrationModal
        isOpen={websiteIntegrationOpen}
        onClose={() => setWebsiteIntegrationOpen(false)}
        onDataSynced={refreshAllData}
      />

      {/* 7. Mobile App Full Screen Bottom Navigation Bar (Smartphones only) */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Dashboard / Home */}
          <button
            type="button"
            onClick={() => {
              setActiveView('DASHBOARD');
              setEditingLR(null);
            }}
            className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
              activeView === 'DASHBOARD' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">डॅशबोर्ड</span>
          </button>

          {/* 2. LR Register */}
          <button
            type="button"
            onClick={() => {
              setActiveView('LR_REGISTER');
              setEditingLR(null);
            }}
            className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
              activeView === 'LR_REGISTER' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">नोंदवही</span>
          </button>

          {/* 3. Center Elevated +LR Action Button */}
          <button
            type="button"
            onClick={() => {
              setEditingLR(null);
              setActiveView('LR_ENTRY');
            }}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-slate-900 group-active:scale-95 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider mt-0.5">
              +LR नोंद
            </span>
          </button>

          {/* 4. LR Tracking & POD */}
          <button
            type="button"
            onClick={() => {
              setActiveView('LR_TRACKING');
              setEditingLR(null);
            }}
            className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
              activeView === 'LR_TRACKING' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">ट्रॅकिंग</span>
          </button>

          {/* 5. Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">मेनू</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
