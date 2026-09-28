import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Code,
  Layout,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
  FileCode,
  HelpCircle,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  Truck,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface WebsiteIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  onDataSynced?: () => void;
}

export const WebsiteIntegrationModal: React.FC<WebsiteIntegrationModalProps> = ({
  isOpen,
  onClose,
  appUrl: customAppUrl,
  onDataSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'WEBSITE_DATA' | 'WP_MENU' | 'HTML_BUTTON' | 'IFRAME' | 'FLOATING'>('WEBSITE_DATA');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine current live URL
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-pre-eqspdsulb7zc7ognxewn2g-847968942512.asia-east1.run.app';

  const liveAppUrl = customAppUrl || currentOrigin;
  const officialWebsite = 'https://shreeswamisamarthtransport.in';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleSyncWebsiteData = () => {
    const res = StorageService.syncWebsiteData();
    setSyncSuccessMsg(res.message);
    if (onDataSynced) {
      onDataSynced();
    }
    setTimeout(() => {
      setSyncSuccessMsg(null);
    }, 4000);
  };

  // Ready-to-use snippets
  const htmlButtonSnippet = `<!-- ======================================================== -->
<!-- NEW SHREE SWAMI SAMARTH TRANSPORT - ERP LOGIN BUTTON -->
<!-- Paste this in your website header, menu, or hero section -->
<!-- ======================================================== -->
<a href="${liveAppUrl}" 
   target="_blank" 
   rel="noopener noreferrer" 
   style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg, #f59e0b, #d97706); color:#0f172a; font-weight:800; font-size:14px; font-family:'Plus Jakarta Sans', system-ui, sans-serif; padding:10px 22px; border-radius:10px; text-decoration:none; box-shadow:0 4px 14px rgba(245, 158, 11, 0.35); text-transform:uppercase; letter-spacing:0.5px; transition:transform 0.2s ease, box-shadow 0.2s ease;"
   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(245, 158, 11, 0.5)';"
   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(245, 158, 11, 0.35)';">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
  <span>LOGIN / ERP प्रवेश</span>
</a>`;

  const iframeSnippet = `<!-- ======================================================== -->
<!-- NEW SHREE SWAMI SAMARTH TRANSPORT - FULLSCREEN ERP PAGE -->
<!-- Paste this in https://shreeswamisamarthtransport.in/login page -->
<!-- ======================================================== -->
<div style="width:100%; min-height:100vh; overflow:hidden; background:#020617;">
  <iframe 
    src="${liveAppUrl}" 
    style="width:100%; height:100vh; border:none; display:block;"
    allow="camera; clipboard-write; fullscreen"
    loading="lazy"
    title="New Shree Swami Samarth Transport ERP Portal">
  </iframe>
</div>`;

  const floatingSnippet = `<!-- ======================================================== -->
<!-- FLOATING LOGIN WIDGET FOR shreeswamisamarthtransport.in -->
<!-- Paste this just before </body> tag in footer.php or Theme Footer -->
<!-- ======================================================== -->
<div id="nsst-portal-badge" style="position:fixed; bottom:24px; right:24px; z-index:999999;">
  <a href="${liveAppUrl}" 
     target="_blank" 
     rel="noopener noreferrer" 
     style="display:flex; align-items:center; gap:10px; background:#0f172a; color:#ffffff; padding:12px 20px; border-radius:50px; text-decoration:none; font-family:sans-serif; font-size:14px; font-weight:700; border:2px solid #f59e0b; box-shadow:0 8px 24px rgba(0,0,0,0.35); transition:all 0.3s ease;">
    <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;"></span>
    <span>🚛 ERP LOGIN</span>
  </a>
</div>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  वेबसाइट LOGIN लिंक व कोड इंटिग्रेशन
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  Ready to Connect
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <code className="text-amber-300">{officialWebsite}</code> वर हा पूर्ण ERP प्रोजेक्ट 'LOGIN' क्लिकमध्ये ॲड करा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live URL Banner */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              या ERP सिस्टीमची थेट लाइव्ह लिंक (Portal URL):
            </span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <input
                type="text"
                readOnly
                value={liveAppUrl}
                className="bg-transparent text-xs text-amber-300 font-mono w-full focus:outline-none select-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleCopy(liveAppUrl, 'url')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-md"
            >
              {copiedKey === 'url' ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'url' ? 'कॉपी झाले!' : 'लिंक कॉपी करा'}</span>
            </button>
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              <span>वेबसाइट उघडा</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('WEBSITE_DATA')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'WEBSITE_DATA'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>🌐 अधिकृत वेबसाइट डेटा (Website Live Data)</span>
          </button>

          <button
            onClick={() => setActiveTab('WP_MENU')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'WP_MENU'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>१. वर्डप्रेस मेनू (WordPress Menu)</span>
          </button>

          <button
            onClick={() => setActiveTab('HTML_BUTTON')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'HTML_BUTTON'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>२. HTML लॉगिन बटण कोड</span>
          </button>

          <button
            onClick={() => setActiveTab('IFRAME')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'IFRAME'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>३. वेबसाइटच्या आतच उघडा (Iframe)</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOATING')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'FLOATING'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>४. फ्लोटिंग बटण (Widget)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-300 space-y-4">
          {/* TAB 0: WEBSITE OFFICIAL DATA & SYNC */}
          {activeTab === 'WEBSITE_DATA' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>shreeswamisamarthtransport.in थेट अधिकृत डेटा</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                        १००% सुरक्षित जोडला आहे
                      </span>
                    </h4>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">
                    अधिकृत वेबसाइटवरील शाखांचे पत्ते, मोबाईल नंबर, कामकाजाची वेळ (8 AM - 11 PM) आणि सेवा या ERP मध्ये जोडल्या गेल्या आहेत.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncWebsiteData}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md flex-shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>डेटा पुन्हा सिंक करा (Re-Sync)</span>
                </button>
              </div>

              {syncSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">{syncSuccessMsg}</span>
                </div>
              )}

              {/* Security Shield Banner */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2.5 text-slate-300 text-[11px]">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>शून्य डेटा नुकसान हमी:</strong> वेबसाइटचा डेटा जोडताना तुमच्या चालू असलेल्या कोणत्याही LR, MR, LHS, पेमेंट, कस्टमर किंवा गाडीच्या डेटाला कसलाही धक्का लागलेला नाही.
                </span>
              </div>

              {/* 4 Official Website Branches */}
              <div>
                <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>वेबसाइटवरील अधिकृत कार्यालये व संपर्क (Official Branches)</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Pune */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-amber-300 text-xs">PUNE HEAD OFFICE (पुणे मुख्य शाखा)</span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        PUN
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      486, Shukrawar Peth, Shivaji Road, Lane No. 1, Siddheshwar Flower Mill, Pune - 411002
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>7722022042 / 9011677972 / 9607751898</span>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>8:00 AM - 11:00 PM</span>
                      </span>
                    </div>
                  </div>

                  {/* Mumbai */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-amber-300 text-xs">MUMBAI OFFICE (काळबादेवी शाखा)</span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        MUM
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Dhanji Munji Dhela Building No. 95A, Shop No. 6, Ground Floor, Old Hanuman Lane, Kalbadevi Road, Mumbai - 400 002
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>8424883921</span>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>8:00 AM - 11:00 PM</span>
                      </span>
                    </div>
                  </div>

                  {/* Dadar */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-amber-300 text-xs">DADAR OFFICE (दादर पश्चिम शाखा)</span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        DDR
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Shop No. 2, Sai Ganesh Sadan, Senapati Bapat Road, Near Jagopal Industry, Dadar (W), Mumbai - 400 028
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>9607751898 / 9011677972</span>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>8:00 AM - 11:00 PM</span>
                      </span>
                    </div>
                  </div>

                  {/* Chakan */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-amber-300 text-xs">CHAKAN CENTRAL HUB (चाकण मुख्य हब)</span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        CHK
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan - 410501
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>9881898635 (KUDKE BALIRAM)</span>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>24/7 Operations / 8 AM - 11 PM</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Services */}
              <div>
                <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>वेबसाइट अधिकृत सेवा (Offered Services)</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    '📦 दैनिक पार्सल वाहतूक (मुंबई - पुणे - दादर)',
                    '📝 माल बुकिंग सेवा (Goods Booking)',
                    '⚡ शहर-ते-शहर एक्सप्रेस वाहतूक कॉरिडॉर',
                    '🏭 व्यावसायिक व औद्योगिक माल हाताळणी',
                    '🚛 संपूर्ण गाडी लोड (Full Truck Load across India)',
                    '🛡️ सुरक्षित आणि वेळेवर हमी पोहोच',
                  ].map((srv, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-200">
                      {srv}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* TAB 1: WORDPRESS MENU */}
          {activeTab === 'WP_MENU' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>वर्डप्रेस (WordPress) वेबसाइटच्या मेनूमध्ये LOGIN बटण कसे जोडायचे?</span>
                </h4>
                <p className="mt-1 text-slate-300 text-xs">
                  आपल्या <strong>shreeswamisamarthtransport.in</strong> वेबसाइटवर 'LOGIN' क्लिक केल्यावर हा ERP प्रोजेक्ट उघडण्यासाठी खालील सोप्या पायऱ्या पूर्ण करा:
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    १
                  </div>
                  <div>
                    <p className="font-semibold text-white">वर्डप्रेस ॲडमिन पॅनेल उघडा:</p>
                    <p className="text-slate-400 mt-0.5">
                      तुमच्या ब्राउझरमध्ये <code className="text-amber-300">https://shreeswamisamarthtransport.in/wp-admin</code> उघडून लॉगिन करा.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    २
                  </div>
                  <div>
                    <p className="font-semibold text-white">मेनू सेटिंग्जमध्ये जा:</p>
                    <p className="text-slate-400 mt-0.5">
                      डाव्या बाजूच्या मेनूमधील <strong>Appearance (देखावा)</strong> वर क्लिक करून <strong>Menus (मेनू)</strong> निवडा.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    ३
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Custom Link (कस्टम लिंक) निवडा:</p>
                    <p className="text-slate-400 mt-0.5">
                      डाव्या बाजूच्या 'Add menu items' मध्ये <strong>Custom Links</strong> उघडा आणि खालील माहिती भरा:
                    </p>
                    <div className="mt-2 space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
                      <div>
                        <span className="text-slate-400 text-[11px] block">URL मध्ये ही लिंक पेस्ट करा:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            readOnly
                            value={liveAppUrl}
                            className="w-full bg-slate-950 px-2.5 py-1.5 rounded text-amber-300 font-mono text-xs border border-slate-700"
                          />
                          <button
                            onClick={() => handleCopy(liveAppUrl, 'wp_url')}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                          >
                            {copiedKey === 'wp_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'wp_url' ? 'कॉपी झाले!' : 'कॉपी'}</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Link Text मध्ये हे नाव लिहा:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            readOnly
                            value="LOGIN"
                            className="w-full bg-slate-950 px-2.5 py-1.5 rounded text-white font-bold text-xs border border-slate-700"
                          />
                          <button
                            onClick={() => handleCopy('LOGIN', 'wp_text')}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                          >
                            {copiedKey === 'wp_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'wp_text' ? 'कॉपी झाले!' : 'कॉपी'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    ४
                  </div>
                  <div>
                    <p className="font-semibold text-white">Add to Menu आणि Save करा:</p>
                    <p className="text-slate-400 mt-0.5">
                      <strong>Add to Menu</strong> बटणावर क्लिक करा आणि शेवटी उजवीकडे निळ्या रंगाच्या <strong>Save Menu (मेनू जतन करा)</strong> वर क्लिक करा.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-xl text-emerald-200 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>फायदा:</strong> हे केल्याने तुमच्या वेबसाइटचा कोणताही कोड किंवा डिझाइन खराब होणार नाही, आणि वेबसाइटच्या मेनूमध्ये थेट 'LOGIN' चे सुंदर बटण दिसेल!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HTML BUTTON */}
          {activeTab === 'HTML_BUTTON' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">वेबसाइटच्या हेडर किंवा होमपेजसाठी रेडीमेड HTML कोड</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    हा कोड तुम्ही तुमच्या वेबसाइटच्या कोणत्याही पानावर, हेडरमध्ये किंवा बॅनरवर पेस्ट करू शकता:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(htmlButtonSnippet, 'html')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  {copiedKey === 'html' ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'html' ? 'कोड कॉपी झाला!' : 'सर्व कोड कॉपी करा'}</span>
                </button>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-xs">बटण प्रिव्ह्यू (Preview):</span>
                <a
                  href={liveAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase shadow-md pointer-events-none"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>LOGIN / ERP प्रवेश</span>
                </a>
              </div>

              {/* Code snippet block */}
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {htmlButtonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: IFRAME EMBED */}
          {activeTab === 'IFRAME' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    वेबसाइटच्या स्वतःच्या पेजवरच ERP उघडा (Embedded Iframe Mode)
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    जर तुम्हाला <code className="text-amber-300">shreeswamisamarthtransport.in/login</code> हे स्वतंत्र पेज तयार करून त्यात हा संपूर्ण प्रोजेक्ट लोड करायचा असेल:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(iframeSnippet, 'iframe')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  {copiedKey === 'iframe' ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'iframe' ? 'कोड कॉपी झाला!' : 'Iframe कोड कॉपी करा'}</span>
                </button>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-blue-200 text-xs">
                <strong>टीप:</strong> वर्डप्रेसमध्ये 'Add New Page' (नवीन पान) करा, त्याचे नाव 'Login' ठेवा, आणि 'Custom HTML' ब्लॉक निवडून हा खालील कोड पेस्ट करा.
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {iframeSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: FLOATING WIDGET */}
          {activeTab === 'FLOATING' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">वेबसाइटच्या कोपऱ्यात दिसणारे फ्लोटिंग बटण (Sticky Widget)</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    हे बटण तुमच्या वेबसाइटवर कायम खाली उजव्या कोपऱ्यात तरंगत राहील, ज्यामुळे ग्राहकांना व स्टाफला सहज लॉगिन करता येईल:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(floatingSnippet, 'floating')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  {copiedKey === 'floating' ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'floating' ? 'कोड कॉपी झाला!' : 'Widget कोड कॉपी करा'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {floatingSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>सुरक्षित इंटिग्रेशन • चालू ERP मधील कोणत्याही डेटाला धक्का लागणार नाही.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
