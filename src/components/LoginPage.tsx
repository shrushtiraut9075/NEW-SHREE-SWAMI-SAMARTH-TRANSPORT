import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  AlertCircle,
  Phone,
  ArrowRight,
  Truck,
  CheckCircle2,
  Building2,
  KeyRound,
  Globe,
  ExternalLink,
  Code,
} from 'lucide-react';
import { User, CompanyProfile } from '../types';
import { StorageService } from '../services/storage';
import { WebsiteIntegrationModal } from './WebsiteIntegrationModal';

interface LoginPageProps {
  companyProfile: CompanyProfile;
  onLoginSuccess: (user: User) => void;
  logoutMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  companyProfile,
  onLoginSuccess,
  logoutMessage,
}) => {
  const [loginRoleType, setLoginRoleType] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const availableUsers = StorageService.getUsers();

  const handleRoleTabChange = (type: 'ADMIN' | 'USER') => {
    setLoginRoleType(type);
    setErrorMessage(null);
    if (type === 'ADMIN') {
      const adminUser = availableUsers.find((u) => u.role === 'ADMIN');
      setIdentifier(adminUser ? adminUser.username : 'admin');
      setPassword(adminUser?.password || 'admin');
    } else {
      const opUser = availableUsers.find((u) => u.role === 'OPERATOR') || availableUsers.find((u) => u.role === 'USER');
      setIdentifier(opUser ? opUser.username : 'operator');
      setPassword(opUser?.password || 'operator');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Username, Registered Mobile Number, or Email.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = StorageService.login(identifier, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    }, 250);
  };

  const handleQuickLogin = (targetUser: User) => {
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const pass = targetUser.password || targetUser.pin || targetUser.username;
      const result = StorageService.login(targetUser.username, pass);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Quick login failed.');
      }
    }, 200);
  };

  const handlePreFill = (targetUser: User) => {
    setIdentifier(targetUser.username);
    setPassword(targetUser.password || 'admin');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-amber-400/80 shadow-md flex-shrink-0 flex items-center justify-center">
            <img
              src={companyProfile.logoUrl || '/company_logo.jpg'}
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase">
              {companyProfile.companyName || 'NEW SHREE SWAMI SAMARTH TRANSPORT'}
            </h1>
            <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
              <span>चाकण, पुणे • Transport Management ERP</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Gat No. 158, Chimbali</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
          {/* Direct link to main public website */}
          <a
            href="https://shreeswamisamarthtransport.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Official Website: shreeswamisamarthtransport.in"
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition group shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">shreeswamisamarthtransport.in</span>
            <span className="sm:hidden">Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Website Login Code button */}
          <button
            type="button"
            onClick={() => setShowIntegrationModal(true)}
            id="btn-website-integration-login"
            title="Get ready-to-copy code to add this ERP login into shreeswamisamarthtransport.in"
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">वेबसाइट LOGIN कोड</span>
            <span className="md:hidden">Login Code</span>
          </button>

          <span className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg font-mono">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>9881898635</span>
          </span>
        </div>
      </header>

      {/* Official Website Connected Banner */}
      <div className="relative z-10 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs flex flex-wrap items-center justify-center gap-2 sm:gap-4 backdrop-blur-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>अधिकृत वेबसाइटशी जोडलेले पोर्टल:</span>
          <strong className="text-amber-300 font-mono">shreeswamisamarthtransport.in</strong>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <a
          href="https://shreeswamisamarthtransport.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 transition"
        >
          <span>← मुख्य वेबसाइटवर जा (Back to Website)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <span className="hidden sm:inline text-slate-600">|</span>
        <button
          type="button"
          onClick={() => setShowIntegrationModal(true)}
          className="text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
        >
          <Code className="w-3.5 h-3.5 text-amber-400" />
          <span>वेबसाइट LOGIN क्लिक सेटअप कोड</span>
        </button>
      </div>

      {/* Central Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Left / Main Form Column (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4" />
                <span>Driver & Fleet ERP Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sign In to System (प्रवेश करा)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                लॉगिन करण्यासाठी खाली Admin किंवा User निवडा आणि UserID व Password टाका.
              </p>

              {/* Login Role Selector Tabs: USER vs ADMIN */}
              <div className="mt-4 p-1 bg-slate-950/90 rounded-xl border border-slate-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  id="tab-login-admin"
                  onClick={() => handleRoleTabChange('ADMIN')}
                  className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    loginRoleType === 'ADMIN'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>ADMIN LOGIN (प्रशासक)</span>
                </button>

                <button
                  type="button"
                  id="tab-login-user"
                  onClick={() => handleRoleTabChange('USER')}
                  className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    loginRoleType === 'USER'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>USER LOGIN (ऑपरेटर / युझर)</span>
                </button>
              </div>

              {/* Role Context Helper Banner */}
              <div className="mt-3 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex items-center justify-between">
                {loginRoleType === 'ADMIN' ? (
                  <span className="text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <strong>Admin Mode:</strong> Full Access to All Modules, LR Modification & Change User Passwords.
                  </span>
                ) : (
                  <span className="text-blue-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <strong>User Mode:</strong> Standard LR Booking, MR Dispatch & Daily Reports.
                  </span>
                )}
                <span className="text-slate-500 text-[10px] font-mono">
                  {loginRoleType === 'ADMIN' ? 'ID: admin' : 'ID: operator / user'}
                </span>
              </div>

              {/* Logout notification if user just logged out */}
              {logoutMessage && (
                <div className="mt-4 p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{logoutMessage}</span>
                </div>
              )}

              {/* Error notification */}
              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      वापरकर्ता आयडी (User ID / Username)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Mobile No किंवा Username
                    </span>
                  </div>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="input-login-username"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder={loginRoleType === 'ADMIN' ? 'admin' : 'operator / user'}
                      autoFocus
                      required
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      पासवर्ड (Password / PIN)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {loginRoleType === 'ADMIN' ? (
                        <>Default: <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded">admin</code></>
                      ) : (
                        <>Default: <code className="text-blue-400 bg-slate-800 px-1 py-0.5 rounded">operator</code> or <code className="text-blue-400 bg-slate-800 px-1 py-0.5 rounded">user</code></>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      id="btn-toggle-password-visibility"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Notice that Admin has the option to change UserID & Passwords */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-tight">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>User ID व Password बदलण्याचा अधिकार Admin कडे आहे:</span>
                  </div>
                  <p className="mt-0.5 text-slate-300">
                    Admin ने लॉगिन करून <strong>Settings &gt; Users & Roles</strong> मध्ये जाऊन कोणत्याही युझरचा UserID व Password त्वरित बदलू शकता.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500/50"
                    />
                    <span>Remember terminal on this browser</span>
                  </label>
                  <span className="text-slate-500 text-[11px]">v2.4 Role-Secured</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-submit-login"
                  className={`w-full flex items-center justify-center gap-2 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg active:scale-[0.99] transition disabled:opacity-50 cursor-pointer text-sm uppercase tracking-wider mt-1 ${
                    loginRoleType === 'ADMIN'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-500/20'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{loginRoleType === 'ADMIN' ? 'Sign In as Admin (प्रशासक लॉगिन)' : 'Sign In as User (युझर लॉगिन)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Help & Contact Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Proprietor: <strong className="text-slate-200">KUDKE BALIRAM</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-amber-300">
                <Phone className="w-3.5 h-3.5" />
                <span>+91 98818 98635</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Demo / One-Click Access Cards (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950/60 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Authorized User Tiers</span>
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Quick Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Click any profile below to immediately log in or fill credentials for that role:
              </p>

              {/* User cards */}
              <div className="space-y-3">
                {availableUsers.map((u) => {
                  const isAdmin = u.role === 'ADMIN' || u.username === 'admin';
                  const isOperator = u.role === 'OPERATOR';

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition group relative ${
                        isAdmin
                          ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500/80 hover:bg-amber-950/40'
                          : isOperator
                          ? 'bg-blue-950/20 border-blue-900/60 hover:border-blue-500/80 hover:bg-blue-950/40'
                          : 'bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-500/80 hover:bg-emerald-950/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                              {u.name}
                            </span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                                isAdmin
                                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                  : isOperator
                                  ? 'bg-blue-400/20 text-blue-300 border-blue-400/40'
                                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            @{u.username} • {u.branchCode === 'ALL' ? 'All Branches' : `Hub: ${u.branchCode}`}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1.5">
                            {isAdmin && (
                              <span className="text-amber-300/90 font-medium">
                                Full Access • All Modules • Master Data • Settings & Safe
                              </span>
                            )}
                            {isOperator && (
                              <span className="text-blue-300/90 font-medium">
                                Full Access • All Modules • Operations & Master Data
                              </span>
                            )}
                            {!isAdmin && !isOperator && (
                              <span className="text-emerald-300/90 font-medium">
                                Entry Modules Only • LR Entry, MR Entry & LHS Entry
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handlePreFill(u)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          Fill details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(u)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                            isAdmin
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                              : isOperator
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          <span>Sign In as {u.role}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Info Footnote */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Strict Security Enforcement</span>
              </div>
              <div>
                Non-admin accounts have LR modification and Company Profile permanently restricted by default.
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Official Website Offices & Timing strip */}
      <div className="relative z-10 bg-slate-950/80 border-t border-slate-800/80 px-4 py-2 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="text-amber-300 font-bold flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>वेबसाइट शाखा संपर्क:</span>
        </span>
        <span>
          पुणे: <strong className="text-white font-mono">7722022042</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          मुंबई काळबादेवी: <strong className="text-white font-mono">8424883921</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          दादर (प.): <strong className="text-white font-mono">9607751898</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          चाकण हेड ऑफिस: <strong className="text-white font-mono">9881898635</strong>
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-medium">वेळ: सकाळी 8:00 ते रात्री 11:00 (दररोज)</span>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>© 2026 <strong>NEW SHREE SWAMI SAMARTH TRANSPORT</strong></span>
          <span>•</span>
          <a
            href="https://shreeswamisamarthtransport.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition"
          >
            <span>shreeswamisamarthtransport.in</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button
            type="button"
            onClick={() => setShowIntegrationModal(true)}
            className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
          >
            वेबसाइट इंटिग्रेशन कोड (Website Integration)
          </button>
          <span>•</span>
          <span>GSTIN: 27AASFS9322Q1ZQ</span>
          <span>•</span>
          <span>Proprietor: Kudke Baliram</span>
        </div>
      </footer>

      {/* Website Integration Modal */}
      <WebsiteIntegrationModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
      />
    </div>
  );
};
