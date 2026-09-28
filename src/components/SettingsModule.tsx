import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Building2,
  QrCode,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
  History,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  Sliders,
  Eye,
  EyeOff,
  ShieldAlert,
  X,
  Check,
  Cloud,
  Globe,
  Code,
} from 'lucide-react';
import { CompanyProfile, User, SecurityAuditLog, UserPermissions, UserRole, DEFAULT_UNIT_RATES } from '../types';
import { StorageService, DEFAULT_COMPANY, getDefaultPermissions } from '../services/storage';
import { CloudSync, SyncState } from '../services/cloudSync';
import { WebsiteIntegrationModal } from './WebsiteIntegrationModal';

interface SettingsModuleProps {
  companyProfile: CompanyProfile;
  currentUser: User;
  onProfileUpdated: (updated: CompanyProfile) => void;
  onDatabaseRestored: () => void;
  initialTab?: 'PROFILE' | 'DATA_SAFE' | 'USERS' | 'AUDIT';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  companyProfile,
  currentUser,
  onProfileUpdated,
  onDatabaseRestored,
  initialTab,
}) => {
  // Authorization checks (Admin & Operator have full access)
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  const isOperator = currentUser.role === 'OPERATOR' || currentUser.username === 'operator';
  const isFullAccess = isAdmin || isOperator;
  const canViewProfile = isFullAccess || (currentUser.permissions?.canViewCompanyProfile ?? false);
  const canEditProfile = isFullAccess || (currentUser.permissions?.canEditCompanyProfile ?? false);
  const canManageUsers = isFullAccess || (currentUser.permissions?.canManageUsers ?? false);
  const canManageDataSafe = isFullAccess || (currentUser.permissions?.canAccessDataSafe ?? false);

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'DATA_SAFE' | 'USERS' | 'AUDIT'>(() => {
    if (initialTab) {
      if (initialTab === 'PROFILE' && !canViewProfile) {
        return canManageUsers ? 'USERS' : 'DATA_SAFE';
      }
      return initialTab;
    }
    if (canViewProfile) return 'PROFILE';
    if (canManageUsers) return 'USERS';
    return 'DATA_SAFE';
  });

  // Ensure unauthorized user cannot view Company Profile
  useEffect(() => {
    if (!canViewProfile && activeTab === 'PROFILE') {
      setActiveTab(canManageUsers ? 'USERS' : 'DATA_SAFE');
    }
  }, [canViewProfile, activeTab, canManageUsers]);

  // Company Profile State
  const [profileForm, setProfileForm] = useState<CompanyProfile>(() => ({
    ...companyProfile,
    name: companyProfile.name || companyProfile.companyName || DEFAULT_COMPANY.name,
    companyName: companyProfile.companyName || companyProfile.name || DEFAULT_COMPANY.name,
    adminName: companyProfile.adminName || companyProfile.proprietor || 'KUDKE BALIRAM',
    proprietor: companyProfile.proprietor || companyProfile.adminName || 'KUDKE BALIRAM',
    mobile: companyProfile.mobile || companyProfile.phone || '9881898635',
    phone: companyProfile.phone || companyProfile.mobile || '9881898635',
    email: companyProfile.email || 'shreeswamisamarthtransport9881@gmail.com',
    unitRates: companyProfile.unitRates || DEFAULT_COMPANY.unitRates || DEFAULT_UNIT_RATES,
  }));

  useEffect(() => {
    setProfileForm({
      ...companyProfile,
      name: companyProfile.name || companyProfile.companyName || DEFAULT_COMPANY.name,
      companyName: companyProfile.companyName || companyProfile.name || DEFAULT_COMPANY.name,
      adminName: companyProfile.adminName || companyProfile.proprietor || 'KUDKE BALIRAM',
      proprietor: companyProfile.proprietor || companyProfile.adminName || 'KUDKE BALIRAM',
      mobile: companyProfile.mobile || companyProfile.phone || '9881898635',
      phone: companyProfile.phone || companyProfile.mobile || '9881898635',
      email: companyProfile.email || 'shreeswamisamarthtransport9881@gmail.com',
      unitRates: companyProfile.unitRates || DEFAULT_COMPANY.unitRates || DEFAULT_UNIT_RATES,
    });
  }, [companyProfile]);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);

  // Restore State
  const [restoreJson, setRestoreJson] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Cloud Database & Multi-Device Sync state
  const [cloudSyncState, setCloudSyncState] = useState<SyncState>(() => CloudSync.getSyncState());
  const [cloudSyncMsg, setCloudSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPushingCloud, setIsPushingCloud] = useState(false);

  useEffect(() => {
    return CloudSync.subscribeSyncState((s) => {
      setCloudSyncState(s);
    });
  }, []);

  const handleManualCloudPull = async () => {
    try {
      setCloudSyncMsg(null);
      await CloudSync.forceRefreshCloudData();
      onDatabaseRestored();
      setCloudSyncMsg({ type: 'success', text: 'Cloud data successfully refreshed and synced to this device.' });
    } catch (e: any) {
      setCloudSyncMsg({ type: 'error', text: e?.message || 'Failed to sync with cloud.' });
    }
  };

  const handlePushAllLocalToCloud = async () => {
    try {
      setIsPushingCloud(true);
      setCloudSyncMsg(null);
      const lrs = StorageService.getLRs();
      const mrs = StorageService.getMRs();
      const lhs = StorageService.getLHS();
      const custs = StorageService.getCustomers();
      const branches = StorageService.getBranches();
      const vehicles = StorageService.getVehicles();
      const drivers = StorageService.getDrivers();
      const payments = StorageService.getPayments();
      const comp = StorageService.getCompany();

      await Promise.all([
        ...lrs.map((lr) => CloudSync.syncLR(lr)),
        ...mrs.map((mr) => CloudSync.syncMR(mr)),
        ...lhs.map((l) => CloudSync.syncLHS(l)),
        ...custs.map((c) => CloudSync.syncCustomer(c)),
        ...branches.map((b) => CloudSync.syncBranch(b)),
        ...vehicles.map((v) => CloudSync.syncVehicle(v)),
        ...drivers.map((d) => CloudSync.syncDriver(d)),
        ...payments.map((p) => CloudSync.syncPayment(p)),
        CloudSync.syncCompany(comp),
      ]);

      setCloudSyncMsg({
        type: 'success',
        text: `सर्व रेकॉर्ड्स क्लाउडवर यशस्वीरित्या पाठवले गेले (${lrs.length} LRs, ${mrs.length} MRs, ${lhs.length} LHS). आता हे इतर सर्व डिव्हाइसेसवर तात्काळ दिसतील!`,
      });
    } catch (e: any) {
      setCloudSyncMsg({ type: 'error', text: e?.message || 'Error uploading to cloud.' });
    } finally {
      setIsPushingCloud(false);
    }
  };

  // Users & Audit
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(
    StorageService.getAuditLogs()
  );

  // User Management Modal state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canModifyLR: false,
    canCancelLR: false,
    canDeleteLR: false,
    canCreateLR: true,
    canViewCompanyProfile: false,
    canEditCompanyProfile: false,
    canManageMaster: false,
    canAccessDataSafe: false,
    canManageUsers: false,
  });

  // New user state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [newCanModifyLR, setNewCanModifyLR] = useState(false); // default: false (LR modification restricted)
  const [newCanViewCompanyProfile, setNewCanViewCompanyProfile] = useState(false); // default: false (Company profile hidden)
  const [newCanCancelLR, setNewCanCancelLR] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProfile) {
      alert('Access Denied: Only System Administrator can modify company profile details.');
      return;
    }
    const updatedProfile: CompanyProfile = {
      ...profileForm,
      name: profileForm.companyName || profileForm.name,
      companyName: profileForm.companyName || profileForm.name,
      mobile: profileForm.phone || profileForm.mobile,
      phone: profileForm.phone || profileForm.mobile,
      adminName: profileForm.adminName || 'KUDKE BALIRAM',
      proprietor: profileForm.proprietor || 'KUDKE BALIRAM',
    };
    StorageService.saveCompanyProfile(updatedProfile, currentUser);
    onProfileUpdated(updatedProfile);
    setSaveMessage('Company Profile & LR Settings successfully saved.');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleDownloadBackup = () => {
    const backupJson = StorageService.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NEW_SHREE_SWAMI_SAMARTH_TRANSPORT_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtmlFile = () => {
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const htmlContent = `<!doctype html>
<html lang="mr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>NEW SHREE SWAMI SAMARTH TRANSPORT - चाकण, पुणे</title>
    <meta name="description" content="Professional Transport Management System for New Shree Swami Samarth Transport, Chakan, Pune." />
    <meta name="theme-color" content="#1e3a8a" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; }
      .card { background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 20px; padding: 32px; max-width: 640px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
      .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(37,99,235,0.15); border: 1px solid #3b82f6; color: #93c5fd; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; }
      h1 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 8px; line-height: 1.25; }
      .sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
      .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
      .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #1e293b; }
      .info-row:last-child { border-bottom: none; }
      .info-label { color: #64748b; font-weight: 600; }
      .info-val { color: #f1f5f9; font-weight: 700; text-align: right; }
      .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 20px; background: #2563eb; color: #ffffff; font-weight: 800; font-size: 14px; border-radius: 12px; text-decoration: none; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
      .btn:hover { background: #1d4ed8; transform: translateY(-1px); }
      .btn-secondary { background: #334155; margin-top: 12px; box-shadow: none; }
      .btn-secondary:hover { background: #475569; }
      .footer-note { font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">🚛 अधिकृत ट्रान्सपोर्ट मॅनेजमेंट सिस्टीम</div>
      <h1>NEW SHREE SWAMI SAMARTH TRANSPORT</h1>
      <p class="sub">चाकण, पुणे - ऑल इंडिया ट्रान्सपोर्ट सर्व्हिस | डेली पार्सल & फुल लोड</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">कंपनीचे नाव:</span>
          <span class="info-val">न्यू श्री स्वामी समर्थ ट्रान्सपोर्ट</span>
        </div>
        <div class="info-row">
          <span class="info-label">प्रोप्रायटर:</span>
          <span class="info-val">कुडके बळीराम</span>
        </div>
        <div class="info-row">
          <span class="info-label">मोबाईल नंबर:</span>
          <span class="info-val">9881898635 / 7588166444</span>
        </div>
        <div class="info-row">
          <span class="info-label">पत्ता:</span>
          <span class="info-val">गट क्र. १५८, बर्गे वस्ती, चाकण, पुणे ४१०५०१</span>
        </div>
        <div class="info-row">
          <span class="info-label">सुविधा:</span>
          <span class="info-val">LR पावती, MR मेमो, LHS लोडिंग शीट, QR पेमेंट, POD ट्रॅकिंग</span>
        </div>
      </div>

      <a href="\${appOrigin || './index.html'}" class="btn">🚀 अ‍ॅप उघडा / Open Transport System</a>
      <button onclick="window.print()" class="btn btn-secondary">🖨️ प्रिंट करा / Print Details</button>

      <p class="footer-note">NEW SHREE SWAMI SAMARTH TRANSPORT &copy; \${new Date().getFullYear()} All Rights Reserved.</p>
    </div>
  </body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NEW_SHREE_SWAMI_SAMARTH_TRANSPORT_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRestoreJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    setRestoreError(null);
    setRestoreSuccess(null);

    if (!restoreJson.trim()) {
      setRestoreError('Please select a valid backup JSON file or paste the JSON content.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to restore the database from this backup? Current records will be replaced.'
      )
    ) {
      return;
    }

    const success = StorageService.importFullBackup(restoreJson);
    if (success) {
      setRestoreSuccess('Database successfully restored from backup.');
      onDatabaseRestored();
    } else {
      setRestoreError('Failed to restore backup. Invalid JSON schema.');
    }
  };

  const handleResetToSample = () => {
    if (
      window.confirm(
        'Reset database to initial demonstration sample data? All newly entered records will be overwritten.'
      )
    ) {
      StorageService.resetToSampleData();
      onDatabaseRestored();
      alert('System successfully reset to default sample dataset.');
    }
  };

  // Open User Permission & Credential Management Modal
  const handleOpenUserEditor = (u: User) => {
    setSelectedUserForEdit(u);
    setEditUsername(u.username || '');
    setEditFullName(u.fullName || u.name || '');
    setEditPassword(u.password || '');
    setEditPin(u.pin || '');
    setEditPhone(u.phone || u.contact || '');
    setEditEmail(u.email || '');
    setEditRole(u.role);
    setShowEditPassword(false);
    setEditError(null);
    const defaults = getDefaultPermissions(u.role);
    setEditPermissions({
      ...defaults,
      ...(u.permissions || {}),
    });
  };

  // Apply Quick Permission Preset
  const handleApplyPreset = (preset: 'RESTRICTED_OPERATOR' | 'AUTHORIZED_OPERATOR' | 'VIEWER' | 'ADMIN') => {
    if (preset === 'RESTRICTED_OPERATOR') {
      setEditRole('OPERATOR');
      setEditPermissions({
        canModifyLR: false, // LR modification Restricted
        canCancelLR: false,
        canDeleteLR: false,
        canCreateLR: true,
        canViewCompanyProfile: false, // Company Profile Hide from User
        canEditCompanyProfile: false,
        canManageMaster: false,
        canAccessDataSafe: false,
        canManageUsers: false,
      });
    } else if (preset === 'AUTHORIZED_OPERATOR') {
      setEditRole('OPERATOR');
      setEditPermissions({
        canModifyLR: true, // LR modification Allowed
        canCancelLR: true,
        canDeleteLR: false,
        canCreateLR: true,
        canViewCompanyProfile: false, // Company Profile remains hidden from users
        canEditCompanyProfile: false,
        canManageMaster: true,
        canAccessDataSafe: false,
        canManageUsers: false,
      });
    } else if (preset === 'VIEWER') {
      setEditRole('VIEWER');
      setEditPermissions(getDefaultPermissions('VIEWER'));
    } else if (preset === 'ADMIN') {
      setEditRole('ADMIN');
      setEditPermissions(getDefaultPermissions('ADMIN'));
    }
  };

  // Save User Credentials, UserID, Password & Permissions
  const handleSaveUserPermissions = () => {
    if (!selectedUserForEdit) return;
    setEditError(null);

    const cleanUsername = editUsername.trim();
    if (!cleanUsername) {
      setEditError('User ID / Username cannot be empty.');
      return;
    }

    const isMasterAdmin =
      selectedUserForEdit.id === 'usr-admin' || selectedUserForEdit.username === 'admin';

    // Update credentials & permissions in StorageService
    const res = StorageService.updateUserCredentials(selectedUserForEdit.id, {
      username: cleanUsername,
      password: editPassword.trim() || undefined,
      pin: editPin.trim() || undefined,
      fullName: editFullName.trim() || undefined,
      phone: editPhone.trim() || undefined,
      email: editEmail.trim() || undefined,
      role: isMasterAdmin ? 'ADMIN' : editRole,
      permissions: isMasterAdmin ? getDefaultPermissions('ADMIN') : editPermissions,
    });

    if (!res.success) {
      setEditError(res.error || 'Failed to update credentials.');
      return;
    }

    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setSaveMessage(`User ID (@${cleanUsername}) & credentials successfully updated!`);
    setTimeout(() => setSaveMessage(null), 3500);
    setSelectedUserForEdit(null);
  };

  // Toggle User Status
  const handleToggleUserStatus = (u: User) => {
    if (u.id === 'usr-admin' || u.username === 'admin') {
      alert('Master Administrator account cannot be deactivated.');
      return;
    }
    const newStatus = StorageService.toggleUserStatus(u.id);
    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setSaveMessage(`User @${u.username} is now ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Delete User
  const handleDeleteUser = (u: User) => {
    if (u.id === 'usr-admin' || u.username === 'admin') {
      alert('Master Administrator account cannot be deleted.');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to permanently delete user @${u.username} (${u.fullName || u.name})?`
      )
    ) {
      StorageService.deleteUser(u.id);
      setUsers(StorageService.getUsers());
      setAuditLogs(StorageService.getAuditLogs());
      setSaveMessage(`User @${u.username} has been removed.`);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Add User with custom Password & PIN
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    const assignedPassword = newPassword.trim() || newUsername.trim().toLowerCase();
    const assignedPin = newPin.trim() || '1234';

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      name: newFullName.trim(),
      fullName: newFullName.trim(),
      role: newRole,
      branchCode: 'ALL',
      phone: newPhone.trim() || '+91 98220 00000',
      contact: newPhone.trim() || '+91 98220 00000',
      email: newEmail.trim() || undefined,
      password: assignedPassword,
      pin: assignedPin,
      active: true,
      permissions: {
        ...getDefaultPermissions(newRole),
        canModifyLR: newRole === 'ADMIN' ? true : newCanModifyLR,
        canViewCompanyProfile: newRole === 'ADMIN' ? true : newCanViewCompanyProfile,
        canCancelLR: newRole === 'ADMIN' ? true : newCanCancelLR,
      },
    };

    StorageService.saveUser(newUser);
    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setSaveMessage(`New user @${newUser.username} created with password "${assignedPassword}".`);
    setTimeout(() => setSaveMessage(null), 4000);

    setNewUsername('');
    setNewFullName('');
    setNewPassword('');
    setNewPin('');
    setNewPhone('');
    setNewEmail('');
    setNewCanModifyLR(false);
    setNewCanViewCompanyProfile(false);
    setNewCanCancelLR(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              System Administration
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Company Branding, Data Safe & RBAC
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            SETTINGS & DATA SAFE
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company profile, PhonePe QR code, backup & restore, and system security logs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl font-bold text-xs">
          {canViewProfile && (
            <button
              id="tab-settings-profile"
              onClick={() => setActiveTab('PROFILE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'PROFILE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company Profile
            </button>
          )}
          {canManageDataSafe && (
            <button
              id="tab-settings-data-safe"
              onClick={() => setActiveTab('DATA_SAFE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'DATA_SAFE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Safe (Backup)
            </button>
          )}
          {canManageUsers && (
            <button
              id="tab-settings-users"
              onClick={() => setActiveTab('USERS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'USERS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Users & Roles
            </button>
          )}
          {isAdmin && (
            <button
              id="tab-settings-audit"
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'AUDIT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Log
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs rounded-r font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* ACCESS RESTRICTED WARNING IF OPERATOR ATTEMPTS TO VIEW PROFILE DIRECTLY */}
      {activeTab === 'PROFILE' && !canViewProfile && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-base font-black text-rose-950 uppercase tracking-tight">
            Company Profile Access Restricted
          </h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
            Company profile, financial settings, and banking details are confidential and strictly restricted to Master Administrator (KUDKE BALIRAM).
          </p>
        </div>
      )}

      {/* 1. COMPANY PROFILE & BRANDING */}
      {activeTab === 'PROFILE' && canViewProfile && (
        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Corporate Identity & Registered Office</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={profileForm.companyName || profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, companyName: e.target.value, name: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrator / Proprietor Name
                </label>
                <input
                  type="text"
                  value={profileForm.adminName || profileForm.proprietor || 'KUDKE BALIRAM'}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      adminName: e.target.value,
                      proprietor: e.target.value,
                    })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Title / Tagline</label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, tagline: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={profileForm.gstin}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Primary Contact / Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone || profileForm.mobile}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value, mobile: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={profileForm.pan}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, pan: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={profileForm.website || 'https://shreeswamisamarthtransport.in'}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, website: e.target.value })
                    }
                    placeholder="https://shreeswamisamarthtransport.in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-amber-700 font-bold"
                  />
                  <a
                    href={profileForm.website || 'https://shreeswamisamarthtransport.in'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 transition"
                    title="Open website in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Website Integration Info Card */}
              <div className="sm:col-span-2 lg:col-span-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      वेबसाइटवर 'LOGIN' लिंक व कोड (shreeswamisamarthtransport.in)
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      तुमच्या मुख्य वेबसाइटवर 'LOGIN' क्लिक केल्यावर हा ERP प्रोजेक्ट उघडण्यासाठी वर्डप्रेस मेनू व HTML कोड येथे मिळवा.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebsiteModal(true)}
                  id="btn-settings-open-website-code"
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>वेबसाइट लॉगिन कोड पहा</span>
                </button>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Registered Office Address (Premises & Gat / Survey No.)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        address: 'Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan',
                        city: 'Chakan, Pune',
                        state: 'Maharashtra',
                        pincode: '410501',
                      })
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Load Verified Chakan HQ Address
                  </button>
                </div>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  required
                  placeholder="Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Hub</label>
                <input
                  type="text"
                  value={profileForm.city || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, city: e.target.value })
                  }
                  placeholder="Chakan, Pune"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={profileForm.state || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, state: e.target.value })
                  }
                  placeholder="Maharashtra"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={profileForm.pincode || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, pincode: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="410501"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-blue-900">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    <strong>Official Physical Location:</strong> Gat No. 158, Pune-Nashik Highway, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan - 410501
                  </span>
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Gat+No+158+Pune+Nashik+Road+Chimbali+Chakan+410501"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold underline"
                >
                  <span>Google Maps Verify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Logo & QR Code Previews */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>2. Official Company Logo & PhonePe QR Code</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Logo Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-bold text-slate-700">Official Company Logo</span>
                <div className="w-28 h-28 bg-white rounded-xl border-2 border-amber-400 p-2 flex items-center justify-center shadow-xs">
                  <img
                    src={profileForm.logoUrl || '/company_logo.jpg'}
                    alt="Official Company Logo"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-full text-left space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload Logo / Image URL
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setProfileForm({ ...profileForm, logoUrl: ev.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={profileForm.logoUrl}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, logoUrl: e.target.value })
                    }
                    placeholder="/company_logo.jpg"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              {/* QR Code Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">PhonePe Payment QR Code</span>
                  <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-1.5 py-0.5 rounded">UPI Live</span>
                </div>
                <div className="w-28 h-28 bg-white rounded-lg border-2 border-purple-300 p-1.5 flex items-center justify-center shadow-xs">
                  <img
                    src={profileForm.phonePeQrUrl || '/phonepe_qr_code.png'}
                    alt="PhonePe QR Code"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-full text-left space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-0.5">
                      PhonePe UPI ID / VPA (NPCI Validated) *
                    </label>
                    <input
                      type="text"
                      value={profileForm.upiId || ''}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, upiId: e.target.value.trim() })
                      }
                      placeholder="e.g. 9881898635@ybl or shreeswamisamarth@ybl"
                      className="w-full bg-white border border-purple-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-purple-900"
                    />
                    {/* Quick suggestion buttons */}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[9px] text-slate-500 font-medium">Quick Set:</span>
                      {[
                        'shreeswamisamarth@ybl',
                        '9881898635@ybl',
                        '9881898635@axl',
                        '9881898635@ibl',
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, upiId: sug })}
                          className="text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded border border-purple-200 cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Upload Authentic PhonePe QR Code Image (किंवा फोटो)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setProfileForm({ ...profileForm, phonePeQrUrl: ev.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-purple-100 file:text-purple-900 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[10px] font-bold text-slate-600">Image URL / Path</label>
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, phonePeQrUrl: '/phonepe_qr_code.png' })}
                        className="text-[9px] text-purple-700 hover:underline font-bold"
                      >
                        Reset to Pure Vector QR
                      </button>
                    </div>
                    <input
                      type="text"
                      value={profileForm.phonePeQrUrl}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phonePeQrUrl: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LR Terms and Conditions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>3. Legal Terms & Conditions (Printed on LR Copies)</span>
            </h2>

            <textarea
              rows={3}
              value={profileForm.termsConditions}
              onChange={(e) =>
                setProfileForm({ ...profileForm, termsConditions: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs"
            />

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow transition"
              >
                SAVE COMPANY PROFILE
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. DATA SAFE / BACKUP & RESTORE */}
      {activeTab === 'DATA_SAFE' && (
        <div className="space-y-6">
          {/* Cloud Database & Multi-Device Synchronization Section */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-700/50 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/30 rounded-xl text-indigo-300 border border-indigo-500/40">
                  <Cloud className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase text-white tracking-wide">
                      Multi-Device Cloud Database Sync (सर्व उपकरणांवर डेटा सिंक)
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{cloudSyncState.status === 'connected' ? 'Live Cloud Synced' : cloudSyncState.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    सर्व डिव्हाइसेसवर (मोबाइल, टॅबलेट, लॅपटॉप) एकाच वेळी डेटा आपोआप अपडेट राहतो.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualCloudPull}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800/80 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold border border-indigo-600 transition cursor-pointer"
                  title="क्लाउड डेटाबेसवरून ताज्या नोंदी त्वरित डाऊनलोड करा"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Sync Cloud Data</span>
                </button>
                <button
                  type="button"
                  disabled={isPushingCloud}
                  onClick={handlePushAllLocalToCloud}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer disabled:opacity-50"
                  title="या उपकरणावरील सर्व डेटा क्लाउडवर सुरक्षित पाठवा"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isPushingCloud ? 'Uploading...' : 'Push All Data to Cloud'}</span>
                </button>
              </div>
            </div>

            {cloudSyncMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
                  cloudSyncMsg.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600 text-rose-200'
                }`}
              >
                <span>{cloudSyncMsg.text}</span>
                <button
                  type="button"
                  onClick={() => setCloudSyncMsg(null)}
                  className="text-white hover:text-slate-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Cloud Connection
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firebase Firestore (Active)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Database: ai-studio-newshreeswamisam...
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Cross-Device Sync
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  100% Real-Time Auto Sync
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {cloudSyncState.lastSyncedAt
                    ? `Last checked: ${new Date(cloudSyncState.lastSyncedAt).toLocaleTimeString()}`
                    : 'Active background listener'}
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  All Devices Status
                </div>
                <div className="text-xs font-bold text-amber-300 mt-1">
                  Same Data Across Phones & PCs
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  कुठल्याही डिव्हाइसवरून LR तयार करा, सर्वांना लगेच दिसेल.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900">
                  One-Click Complete Database Backup
                </h2>
                <p className="text-xs text-slate-500">
                  Export all LRs, Manifests, Loading Sheets, Stock Transfers, Payments and Master Data into an audit-compliant JSON archive.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD FULL DATABASE BACKUP (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtmlFile}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>DOWNLOAD HTML FILE (अ‍ॅप HTML फाईल सेव्ह करा)</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Restore Database from Backup File</span>
            </h2>

            {restoreError && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 text-xs rounded-r">
                {restoreError}
              </div>
            )}
            {restoreSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs rounded-r">
                {restoreSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Backup JSON File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFromFile}
                  className="text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Or Paste Backup JSON Payload
                </label>
                <textarea
                  rows={4}
                  value={restoreJson}
                  onChange={(e) => setRestoreJson(e.target.value)}
                  placeholder='{"lrRecords": [...], "branches": [...]}'
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetToSample}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Sample Data</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow"
                >
                  RESTORE DATABASE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. USERS & ROLES */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* Primary Administrator Identity Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl border border-slate-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
                KB
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black tracking-wide text-white uppercase">
                    KUDKE BALIRAM
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black tracking-wider uppercase">
                    ★ System Administrator & Proprietor
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <strong className="font-mono text-white">9881898635</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <strong className="text-blue-200">shreeswamisamarthtransport9881@gmail.com</strong>
                  </span>
                  <span className="text-slate-400">
                    Scope: <strong className="text-slate-200">All Branches (Full Master Access)</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-edit-admin-creds"
                onClick={() => {
                  const adminU = users.find((u) => u.role === 'ADMIN') || users[0];
                  if (adminU) handleOpenUserEditor(adminU);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Admin ID / Password (आयडी व पासवर्ड बदला)</span>
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Master Admin</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>User Accounts & RBAC Access Controls (वापरकर्ता खाती व पासवर्ड)</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Admin can change any User ID, set custom Passwords, configure LR Modification restrictions, and manage employee access.
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                {users.length} Registered Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">User & ID</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Password / PIN</th>
                    <th className="py-2.5 px-3">LR Modification</th>
                    <th className="py-2.5 px-3">Company Profile</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Status</th>
                    {canManageUsers && <th className="py-2.5 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isMaster = u.id === 'usr-admin' || u.username === 'admin' || u.role === 'ADMIN';
                    const canMod = isMaster || (u.permissions?.canModifyLR ?? false);
                    const canProf = isMaster || (u.permissions?.canViewCompanyProfile ?? false);
                    const isActive = u.active !== false;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isMaster ? 'bg-amber-50/40' : !isActive ? 'opacity-60 bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{u.fullName || u.name}</span>
                              {isMaster && (
                                <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded border border-amber-400">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                ID: @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : u.role === 'OPERATOR'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* PASSWORD STATUS */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                            <KeyRound className="w-3 h-3 text-amber-500" />
                            <span>{u.password ? '••••••••' : 'Default'}</span>
                            {u.pin && <span className="text-[10px] text-slate-400">({u.pin})</span>}
                          </div>
                        </td>

                        {/* LR MODIFICATION STATUS */}
                        <td className="py-2.5 px-3">
                          {canMod ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" />
                              <span>Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <Lock className="w-3 h-3" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </td>

                        {/* COMPANY PROFILE STATUS */}
                        <td className="py-2.5 px-3">
                          {canProf ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Eye className="w-3 h-3" />
                              <span>Visible</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-mono font-semibold text-slate-800">{u.contact || u.phone || '—'}</span>
                            {u.email && <span className="text-slate-500 text-[10px]">{u.email}</span>}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        {canManageUsers && (
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                id={`edit-creds-user-${u.username}`}
                                onClick={() => handleOpenUserEditor(u)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Change User ID, Password, and Permissions"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Change ID/Password</span>
                              </button>

                              {!isMaster && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`p-1 rounded border transition-colors cursor-pointer ${
                                      isActive
                                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                    }`}
                                    title={isActive ? 'Deactivate User Account' : 'Activate User Account'}
                                  >
                                    {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Create New System User Form */}
            {canManageUsers && (
              <form onSubmit={handleAddUser} className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50/60 p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>नवीन वापरकर्ता तयार करा (Create New User with UserID & Password)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Admin can define UserID & Password directly</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      वापरकर्ता आयडी (User ID / Username) *
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. branch_clerk"
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      कर्मचाऱ्याचे नाव (Full Name) *
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Rahul Patil"
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      पासवर्ड (Password) *
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. rahul@123"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Security PIN (४ अंकी पिन)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      मोबाईल नंबर (Phone)
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. 9881898635"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ईमेल पत्ता (Email)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="clerk@shreeswamitransport.com"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      रोल (Role)
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 font-bold text-slate-800"
                    >
                      <option value="OPERATOR">OPERATOR (Default)</option>
                      <option value="USER">USER (Data Entry)</option>
                      <option value="VIEWER">VIEWER (Read Only)</option>
                      <option value="ADMIN">ADMIN (Full Access)</option>
                    </select>
                  </div>
                </div>

                {/* Granular Permission Toggles for New User */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanModifyLR}
                        onChange={(e) => setNewCanModifyLR(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow LR Modification <span className="text-[10px] text-slate-500">(Restricted by default)</span></span>
                    </label>

                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanViewCompanyProfile}
                        onChange={(e) => setNewCanViewCompanyProfile(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow Company Profile View <span className="text-[10px] text-slate-500">(Hidden by default)</span></span>
                    </label>

                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanCancelLR}
                        onChange={(e) => setNewCanCancelLR(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow LR Cancellation</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="btn-create-new-user"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded font-bold px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create User with Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* USER ROLE, USERID & PASSWORD EDITOR MODAL */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wide">
                        Change User ID, Password & Permissions
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        युझर आयडी व पासवर्ड बदला: <strong className="text-white">@{selectedUserForEdit.username}</strong> ({selectedUserForEdit.fullName || selectedUserForEdit.name})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {editError && (
                    <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 text-xs rounded-r">
                      {editError}
                    </div>
                  )}

                  {/* 1. Core Credentials Box (UserID & Password) */}
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wide">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Login Credentials (लॉगिन माहिती बदला)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          वापरकर्ता आयडी (User ID / Username) *
                        </label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="e.g. admin or username"
                          required
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          लॉगिन करताना हा User ID वापरावा लागेल.
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          कर्मचाऱ्याचे नाव (Full Name)
                        </label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="e.g. Kudke Baliram"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          नवीन पासवर्ड (Password) *
                        </label>
                        <div className="relative">
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 font-mono text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Security PIN (पिन)
                        </label>
                        <input
                          type="text"
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value)}
                          placeholder="e.g. 9881 or 1234"
                          maxLength={6}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          मोबाईल नंबर (Phone)
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. 9881898635"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          ईमेल (Email)
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Master Admin Notice */}
                  {(selectedUserForEdit.id === 'usr-admin' || selectedUserForEdit.username === 'admin') ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                      <p className="font-bold">★ Primary Administrator Account</p>
                      <p className="mt-0.5 text-slate-600">
                        You can update your Admin User ID, Name, Password, and Phone above. Admin retains permanent full access to all system modules.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Role Selector & Presets */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Assigned System Role (सिस्टीम रोल)
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) => {
                            const newR = e.target.value as UserRole;
                            setEditRole(newR);
                            setEditPermissions(getDefaultPermissions(newR));
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                        >
                          <option value="OPERATOR">OPERATOR (Operational Staff)</option>
                          <option value="USER">USER (Data Entry Staff)</option>
                          <option value="VIEWER">VIEWER (Auditor / Read-Only)</option>
                          <option value="ADMIN">ADMIN (Full Administrative Access)</option>
                        </select>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Apply Quick Security Preset
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('RESTRICTED_OPERATOR')}
                            className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-slate-900 block flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-rose-600" />
                              Restricted Operator
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              LR Mod Locked, Company Profile Hidden
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyPreset('AUTHORIZED_OPERATOR')}
                            className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-slate-900 block flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Authorized Operator
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              LR Mod Allowed, Profile Hidden
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Granular Permission Checklist */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                          Granular Permission Toggles
                        </label>

                        <div className="space-y-2">
                          {/* 1. LR Modification Restricted */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="perm-canModifyLR"
                              checked={editPermissions.canModifyLR ?? false}
                              onChange={(e) =>
                                setEditPermissions({ ...editPermissions, canModifyLR: e.target.checked })
                              }
                              className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="perm-canModifyLR" className="text-xs cursor-pointer flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <Lock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Allow LR Modification (LR Modification Restricted if OFF)</span>
                              </div>
                            </label>
                          </div>

                          {/* 2. Company Profile Hidden */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="perm-canViewCompanyProfile"
                              checked={editPermissions.canViewCompanyProfile ?? false}
                              onChange={(e) =>
                                setEditPermissions({
                                  ...editPermissions,
                                  canViewCompanyProfile: e.target.checked,
                                  canEditCompanyProfile: e.target.checked ? editPermissions.canEditCompanyProfile : false,
                                })
                              }
                              className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="perm-canViewCompanyProfile" className="text-xs cursor-pointer flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Allow Company Profile View (Company Profile Hidden if OFF)</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-save-user-permissions"
                    onClick={handleSaveUserPermissions}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save User ID & Password (बदल सेव्ह करा)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Security & Operational Audit Log</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">IP / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-2 px-3">
                      <span className="font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700">{log.details}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Website Integration Modal */}
      <WebsiteIntegrationModal
        isOpen={showWebsiteModal}
        onClose={() => setShowWebsiteModal(false)}
      />
    </div>
  );
};
