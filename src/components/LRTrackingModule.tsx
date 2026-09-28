import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  FileCheck,
  AlertCircle,
  Eye,
  Camera,
  Calendar,
  Phone,
  Share2,
  Printer,
  ChevronRight,
  Filter,
  RotateCcw,
  X,
  Download,
  ShieldCheck,
  Building2,
  UserCheck,
  ArrowRight,
  PlusCircle,
  Trash2,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import {
  LRRecord,
  Branch,
  User,
  CompanyProfile,
  LRStatus,
  PODRecord,
  PODStatus,
} from '../types';
import { StorageService } from '../services/storage';
import { downloadLRHtmlFile } from '../utils/htmlExport';

interface LRTrackingModuleProps {
  lrs: LRRecord[];
  branches: Branch[];
  selectedBranch: string;
  companyProfile: CompanyProfile;
  currentUser: User;
  onRefresh: () => void;
  onViewLR: (lr: LRRecord) => void;
  onPrintLR: (lr: LRRecord) => void;
}

export const LRTrackingModule: React.FC<LRTrackingModuleProps> = ({
  lrs,
  branches,
  selectedBranch,
  companyProfile,
  currentUser,
  onRefresh,
  onViewLR,
  onPrintLR,
}) => {
  // Selected LR to track in the interactive tracker showcase
  const [selectedLrId, setSelectedLrId] = useState<string>(() => {
    return lrs.length > 0 ? lrs[0].id : '';
  });

  // Table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPodStatus, setFilterPodStatus] = useState<string>('ALL');
  const [filterMovementStatus, setFilterMovementStatus] = useState<string>('ALL');
  const [filterBranch, setFilterBranch] = useState(selectedBranch);

  // Modals state
  const [podUploadModalOpen, setPodUploadModalOpen] = useState(false);
  const [podTargetLr, setPodTargetLr] = useState<LRRecord | null>(null);

  const [trackingUpdateModalOpen, setTrackingUpdateModalOpen] = useState(false);
  const [trackingTargetLr, setTrackingTargetLr] = useState<LRRecord | null>(null);

  const [viewPodModalOpen, setViewPodModalOpen] = useState(false);
  const [viewPodLr, setViewPodLr] = useState<LRRecord | null>(null);

  // POD Form fields
  const [podReceiverName, setPodReceiverName] = useState('');
  const [podReceiverPhone, setPodReceiverPhone] = useState('');
  const [podDeliveryDate, setPodDeliveryDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [podDeliveryTime, setPodDeliveryTime] = useState(() =>
    new Date().toTimeString().slice(0, 5)
  );
  const [podRemarks, setPodRemarks] = useState(
    'Consignment received in intact and sound condition with authorized company rubber stamp and signature.'
  );
  const [podDocumentUrl, setPodDocumentUrl] = useState<string>('');
  const [podFileName, setPodFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tracking Status Update fields
  const [newStatus, setNewStatus] = useState<LRStatus>('IN TRANSIT');
  const [newLocation, setNewLocation] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  // Find currently actively tracked LR
  const activeLR = useMemo(() => {
    return lrs.find((l) => l.id === selectedLrId) || (lrs.length > 0 ? lrs[0] : null);
  }, [lrs, selectedLrId]);

  // Filtered LRs for "Each & Every LR Tracking Table"
  const filteredLRs = useMemo(() => {
    return lrs.filter((lr) => {
      // Branch filter
      if (filterBranch !== 'ALL' && lr.branchCode !== filterBranch) {
        return false;
      }
      // POD Status filter
      if (filterPodStatus === 'PENDING' && lr.podStatus === 'UPLOADED') {
        return false;
      }
      if (filterPodStatus === 'UPLOADED' && lr.podStatus !== 'UPLOADED' && lr.podStatus !== 'VERIFIED') {
        return false;
      }
      if (filterPodStatus === 'VERIFIED' && lr.podStatus !== 'VERIFIED') {
        return false;
      }
      // Movement Status filter
      if (filterMovementStatus !== 'ALL' && lr.status !== filterMovementStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = lr.lrNumber.toLowerCase().includes(q);
        const matchConsignor = lr.consignorName.toLowerCase().includes(q);
        const matchConsignee = lr.consigneeName.toLowerCase().includes(q);
        const matchVehicle = (lr.vehicleNumber || '').toLowerCase().includes(q);
        const matchDriver = (lr.driverName || '').toLowerCase().includes(q);
        const matchFrom = lr.fromLocation.toLowerCase().includes(q);
        const matchTo = lr.toLocation.toLowerCase().includes(q);
        const matchEway = (lr.eWayBillNo || '').toLowerCase().includes(q);
        if (
          !matchNumber &&
          !matchConsignor &&
          !matchConsignee &&
          !matchVehicle &&
          !matchDriver &&
          !matchFrom &&
          !matchTo &&
          !matchEway
        ) {
          return false;
        }
      }
      return true;
    });
  }, [lrs, filterBranch, filterPodStatus, filterMovementStatus, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = lrs.length;
    const inTransit = lrs.filter((l) => l.status === 'IN TRANSIT').length;
    const delivered = lrs.filter((l) => l.status === 'DELIVERED').length;
    const podUploaded = lrs.filter(
      (l) => l.podStatus === 'UPLOADED' || l.podStatus === 'VERIFIED'
    ).length;
    const podPending = lrs.filter(
      (l) => l.status !== 'CANCELLED' && (l.podStatus === 'PENDING' || !l.podStatus)
    ).length;
    return { total, inTransit, delivered, podUploaded, podPending };
  }, [lrs]);

  // Open Upload POD dialog
  const handleOpenUploadPod = (lr: LRRecord) => {
    setPodTargetLr(lr);
    setPodReceiverName(lr.deliveredTo || lr.consigneeName || '');
    setPodReceiverPhone(lr.receiverMobile || lr.consigneeMobile || '');
    setPodDeliveryDate(
      lr.podDetails?.deliveryDate || new Date().toISOString().split('T')[0]
    );
    setPodDeliveryTime(
      lr.podDetails?.deliveryTime || new Date().toTimeString().slice(0, 5)
    );
    setPodRemarks(
      lr.podDetails?.remarks ||
        'Consignment received in intact condition with authorized rubber stamp & signature.'
    );
    setPodDocumentUrl(lr.podDetails?.documentUrl || '');
    setPodFileName(lr.podDetails?.fileName || '');
    setPodUploadModalOpen(true);
  };

  // Open Tracking Status Update dialog
  const handleOpenTrackingUpdate = (lr: LRRecord) => {
    setTrackingTargetLr(lr);
    setNewStatus(lr.status === 'BOOKED' ? 'IN TRANSIT' : lr.status);
    setNewLocation(lr.currentLocation || lr.toLocation || '');
    setNewRemarks('');
    setTrackingUpdateModalOpen(true);
  };

  // Handle file selection and read as base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please select a photo or document under 8MB.');
      return;
    }

    setPodFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPodDocumentUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Quick sample POD stamp generator for testing
  const handleUseSamplePod = (lr: LRRecord) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);

    // Header border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 760, 560);

    // Company banner
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PROOF OF DELIVERY (P.O.D) ACKNOWLEDGMENT', 140, 60);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('NEW SHREE SWAMI SAMARTH TRANSPORT • CHAKAN PUNE', 180, 85);

    // Divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 100);
    ctx.lineTo(760, 100);
    ctx.stroke();

    // LR Information
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`LR Number: ${lr.lrNumber}`, 50, 140);
    ctx.fillText(`Booking Date: ${lr.bookingDate}`, 500, 140);

    ctx.font = '14px sans-serif';
    ctx.fillText(`Consignor: ${lr.consignorName}`, 50, 180);
    ctx.fillText(`Consignee: ${lr.consigneeName}`, 50, 215);
    ctx.fillText(`Destination: ${lr.toLocation}`, 50, 250);
    ctx.fillText(`Vehicle No: ${lr.vehicleNumber || 'MH-14'}`, 500, 180);
    ctx.fillText(`Packages / Weight: ${lr.totalQuantity} Pkgs / ${lr.totalActualWeight} Kg`, 500, 215);

    // Box for delivery confirmation
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 280, 700, 120);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(50, 280, 700, 120);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('DELIVERY ACKNOWLEDGMENT & SATISFACTION CERTIFICATE', 70, 310);

    ctx.fillStyle = '#334155';
    ctx.font = '13px sans-serif';
    ctx.fillText('Received all material/packages mentioned above in complete & intact condition.', 70, 340);
    ctx.fillText(`Delivered By: Shree Swami Samarth Transport Dispatch Team`, 70, 370);

    // Simulated Rubber Stamp
    ctx.save();
    ctx.translate(560, 480);
    ctx.rotate(-0.08);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.strokeRect(-120, -50, 240, 95);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(lr.consigneeName.slice(0, 24).toUpperCase(), -110, -25);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('GOODS RECEIVED & VERIFIED', -100, 0);
    ctx.fillText(`DATE: ${podDeliveryDate} • STAMP & SIGN`, -105, 25);
    ctx.restore();

    // Receiver Signature simulation
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(120, 520);
    ctx.bezierCurveTo(150, 470, 180, 550, 220, 490);
    ctx.bezierCurveTo(240, 460, 270, 510, 310, 480);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Authorized Receiver Signature: ${podReceiverName || lr.consigneeName}`, 80, 545);

    const generatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPodDocumentUrl(generatedDataUrl);
    setPodFileName(`STAMPED-POD-${lr.lrNumber}.jpg`);
  };

  // Submit POD upload
  const handleSavePod = () => {
    if (!podTargetLr) return;
    if (!podReceiverName.trim()) {
      alert('Please enter the name of the Person / Department who received the consignment.');
      return;
    }

    try {
      StorageService.uploadLRPOD(
        podTargetLr.id,
        {
          receivedBy: podReceiverName.trim(),
          receiverPhone: podReceiverPhone.trim(),
          deliveryDate: podDeliveryDate,
          deliveryTime: podDeliveryTime,
          documentUrl: podDocumentUrl || '/company_logo.jpg',
          fileName: podFileName || `POD-${podTargetLr.lrNumber}.jpg`,
          remarks: podRemarks.trim(),
        },
        currentUser.name || currentUser.username
      );
      setPodUploadModalOpen(false);
      onRefresh();
      alert(`Proof of Delivery (POD) successfully uploaded and linked to ${podTargetLr.lrNumber}! Status marked as DELIVERED.`);
    } catch (err: any) {
      alert(`Failed to save POD: ${err.message}`);
    }
  };

  // Submit Tracking checkpoint update
  const handleSaveTrackingUpdate = () => {
    if (!trackingTargetLr) return;
    try {
      StorageService.updateLRTracking(
        trackingTargetLr.id,
        newStatus,
        newLocation.trim(),
        newRemarks.trim(),
        currentUser.name || currentUser.username
      );
      setTrackingUpdateModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update tracking: ${err.message}`);
    }
  };

  // Share tracking on WhatsApp
  const handleShareWhatsApp = (lr: LRRecord) => {
    const text = encodeURIComponent(
      `*SHREE SWAMI SAMARTH TRANSPORT - CONSIGNMENT TRACKING*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *LR No:* ${lr.lrNumber}\n` +
      `📅 *Booking Date:* ${lr.bookingDate}\n` +
      `🏭 *From:* ${lr.fromLocation}\n` +
      `📍 *To:* ${lr.toLocation}\n` +
      `🏢 *Consignee:* ${lr.consigneeName}\n` +
      `🚚 *Vehicle No:* ${lr.vehicleNumber || 'Assigned'}\n` +
      `👤 *Driver:* ${lr.driverName || 'N/A'} (${lr.driverMobile || 'N/A'})\n` +
      `📊 *Status:* ${lr.status}\n` +
      `📄 *POD Status:* ${lr.podStatus || 'PENDING'}\n` +
      (lr.podDetails
        ? `✅ *Delivered To:* ${lr.podDetails.receivedBy} on ${lr.podDetails.deliveryDate}\n`
        : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Transporter: New Shree Swami Samarth Transport, Chakan, Pune.\n` +
      `Helpline / Dispatch: +91 98818 98635`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                LR LIVE TRACKING & POD MODULE
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                एल.आर ट्रॅकिंग व डिलिव्हरी पावती (POD) अपलोड • Real-Time Consignment Journey & Proof of Delivery
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Upload POD button for active LR */}
          {activeLR && (
            <button
              onClick={() => handleOpenUploadPod(activeLR)}
              id="btn-quick-upload-pod-header"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>UPLOAD POD ({activeLR.lrNumber})</span>
            </button>
          )}

          {activeLR && (
            <button
              onClick={() => handleOpenTrackingUpdate(activeLR)}
              id="btn-update-tracking-header"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>UPDATE STATUS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Consignments */}
        <div
          onClick={() => {
            setFilterPodStatus('ALL');
            setFilterMovementStatus('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition cursor-pointer shadow-xs ${
            filterPodStatus === 'ALL' && filterMovementStatus === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>All LRs</span>
            <FileText className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total Booked LRs</div>
        </div>

        {/* In Transit */}
        <div
          onClick={() => {
            setFilterMovementStatus('IN TRANSIT');
            setFilterPodStatus('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition cursor-pointer shadow-xs ${
            filterMovementStatus === 'IN TRANSIT'
              ? 'border-amber-500 ring-2 ring-amber-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-[11px] font-bold uppercase tracking-wider">
            <span>In Transit</span>
            <Truck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono">
            {stats.inTransit}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Vehicles On Highway</div>
        </div>

        {/* Delivered */}
        <div
          onClick={() => {
            setFilterMovementStatus('DELIVERED');
            setFilterPodStatus('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition cursor-pointer shadow-xs ${
            filterMovementStatus === 'DELIVERED'
              ? 'border-emerald-500 ring-2 ring-emerald-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
            <span>Delivered</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 font-mono">
            {stats.delivered}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Reached Consignee</div>
        </div>

        {/* POD Pending */}
        <div
          onClick={() => {
            setFilterPodStatus('PENDING');
            setFilterMovementStatus('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition cursor-pointer shadow-xs ${
            filterPodStatus === 'PENDING'
              ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-[11px] font-bold uppercase tracking-wider">
            <span>POD Pending</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono">
            {stats.podPending}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-0.5">Upload Required</div>
        </div>

        {/* POD Uploaded */}
        <div
          onClick={() => {
            setFilterPodStatus('UPLOADED');
            setFilterMovementStatus('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition cursor-pointer shadow-xs ${
            filterPodStatus === 'UPLOADED'
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
            <span>POD Uploaded</span>
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 font-mono">
            {stats.podUploaded}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Receipt Attached</div>
        </div>
      </div>

      {/* 3. ACTIVE LR TRACKER & POD SHOWCASE */}
      {activeLR && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Top: LR Main identity & quick switcher */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                LR
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg sm:text-xl font-black text-amber-400 tracking-tight">
                    {activeLR.lrNumber}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                    HUB: {activeLR.branchCode}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      activeLR.status === 'DELIVERED'
                        ? 'bg-emerald-500 text-white'
                        : activeLR.status === 'IN TRANSIT'
                        ? 'bg-amber-500 text-slate-950'
                        : activeLR.status === 'DISPATCHED'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {activeLR.status}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      activeLR.podStatus === 'UPLOADED' || activeLR.podStatus === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-rose-950 text-rose-300 border-rose-500'
                    }`}
                  >
                    POD: {activeLR.podStatus || 'PENDING'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                  <span>Booking Date: <strong className="text-white">{activeLR.bookingDate}</strong></span>
                  <span>•</span>
                  <span>Payment: <strong className="text-amber-300">{activeLR.paymentMode}</strong></span>
                  <span>•</span>
                  <span>Delivery Type: <strong className="text-white">{activeLR.deliveryType}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions for active LR */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => handleShareWhatsApp(activeLR)}
                title="Share Tracking with Party via WhatsApp"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Share</span>
              </button>

              <button
                onClick={() => onViewLR(activeLR)}
                title="View Full LR Details"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View LR</span>
              </button>

              <button
                onClick={() => downloadLRHtmlFile(activeLR, companyProfile)}
                title="Download Standalone HTML File with PhonePe QR"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">HTML File</span>
              </button>

              <button
                onClick={() => onPrintLR(activeLR)}
                title="Print LR Consignment Note"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print A4</span>
              </button>
            </div>
          </div>

          {/* Consignment Route & Details Grid */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Route & Transport */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Route & Destination</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span>{activeLR.fromLocation}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-blue-700">{activeLR.toLocation}</span>
              </div>
              <div className="mt-2 text-slate-600 space-y-0.5 text-[11px]">
                <div>Destination Hub: <strong>{activeLR.freightUpToBranch || activeLR.toBranch}</strong></div>
                <div>E-Way Bill: <strong className="font-mono">{activeLR.eWayBillNo || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Consignor & Consignee */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Parties Involved</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Consignor (प्रेषक):</span>
                  <div className="font-bold text-slate-900 truncate" title={activeLR.consignorName}>
                    {activeLR.consignorName}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Consignee (प्राप्तकर्ता):</span>
                  <div className="font-bold text-blue-900 truncate" title={activeLR.consigneeName}>
                    {activeLR.consigneeName}
                  </div>
                  {activeLR.consigneeMobile && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{activeLR.consigneeMobile}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle & Movement */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vehicle & Cargo</span>
              </div>
              <div className="space-y-1 text-slate-700 text-[11px]">
                <div>
                  Vehicle: <strong className="font-mono text-slate-900 text-xs">{activeLR.vehicleNumber || 'To Be Assigned'}</strong>
                </div>
                <div>
                  Driver: <strong>{activeLR.driverName || 'N/A'}</strong>{' '}
                  {activeLR.driverMobile && (
                    <span className="font-mono text-blue-700">({activeLR.driverMobile})</span>
                  )}
                </div>
                <div>
                  Packages: <strong>{activeLR.totalQuantity} Pkgs</strong> • Wt: <strong>{activeLR.totalActualWeight} Kg</strong>
                </div>
                <div>
                  Freight: <strong className="font-mono text-emerald-700 font-bold">₹{(activeLR.charges?.grandTotal || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Tracking Stepper */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                  Live Consignment Journey & Milestone Checkpoints
                </h3>
              </div>
              <button
                onClick={() => handleOpenTrackingUpdate(activeLR)}
                className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Tracking Log</span>
              </button>
            </div>

            {/* Stepper Visualization */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Consignment Booked */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">1. Consignment Booked & LR Issued</span>
                    <span className="text-[10px] font-mono text-slate-500">{activeLR.bookingDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Booked at <strong>{activeLR.branchName || 'CHAKAN MAIN'}</strong> hub. Consignor <em>{activeLR.consignorName}</em> generated LR {activeLR.lrNumber}.
                  </p>
                </div>
              </div>

              {/* Step 2: Manifested / LHS */}
              <div className="relative flex items-start gap-3">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                  activeLR.status !== 'BOOKED' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">2. Loading & Manifest Dispatch</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {activeLR.status !== 'BOOKED' ? 'Dispatched' : 'Pending Loading'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Assigned to Vehicle <strong>{activeLR.vehicleNumber || 'MH-14 (Scheduled)'}</strong> with driver <strong>{activeLR.driverName || 'Assigned Driver'}</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3: In Transit */}
              <div className="relative flex items-start gap-3">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                  activeLR.status === 'IN TRANSIT' || activeLR.status === 'DELIVERED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">3. Highway Transit & Movement</span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold">
                      {activeLR.status === 'DELIVERED' ? 'Completed' : activeLR.status === 'IN TRANSIT' ? 'Active In-Transit' : 'Awaiting Departure'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Route: {activeLR.fromLocation} → {activeLR.toLocation}. Current location: <strong>{activeLR.currentLocation || 'Main Pune Expressway / Highway'}</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4: Delivered & POD Status */}
              <div className="relative flex items-start gap-3">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                  activeLR.status === 'DELIVERED' && activeLR.podStatus === 'UPLOADED'
                    ? 'bg-emerald-600 text-white'
                    : activeLR.status === 'DELIVERED'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div className={`p-3.5 rounded-xl border flex-1 ${
                  activeLR.podStatus === 'UPLOADED' || activeLR.podStatus === 'VERIFIED'
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-amber-50/60 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 flex items-center gap-2">
                      <span>4. Consignment Delivered & POD Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeLR.podStatus === 'UPLOADED' || activeLR.podStatus === 'VERIFIED'
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}>
                        {activeLR.podStatus === 'UPLOADED' ? 'POD Uploaded' : activeLR.podStatus === 'VERIFIED' ? 'POD Verified' : 'POD Pending'}
                      </span>
                    </span>
                    {activeLR.deliveredAt && (
                      <span className="text-[10px] font-mono text-slate-500">{activeLR.deliveredAt}</span>
                    )}
                  </div>

                  {/* POD Status explanation */}
                  {activeLR.podDetails ? (
                    <div className="mt-2 text-xs text-slate-700 space-y-1">
                      <div>Received By: <strong>{activeLR.podDetails.receivedBy}</strong> ({activeLR.podDetails.receiverPhone || 'Contact verified'})</div>
                      <div>Delivery Date & Time: <strong>{activeLR.podDetails.deliveryDate} at {activeLR.podDetails.deliveryTime}</strong></div>
                      <div>Remarks: <em>{activeLR.podDetails.remarks}</em></div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setViewPodLr(activeLR);
                            setViewPodModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Signed POD Photo / Slip</span>
                        </button>
                        <button
                          onClick={() => handleOpenUploadPod(activeLR)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Re-upload / Replace</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-amber-900">
                      <p className="leading-relaxed">
                        Proof of Delivery (POD) has not been uploaded yet for this LR. Once the goods are received by the consignee with stamp & signature, upload the POD below.
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleOpenUploadPod(activeLR)}
                          id="btn-upload-pod-step"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>UPLOAD POD NOW (डिलिव्हरी पावती अपलोड करा)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* POD DOCUMENT PREVIEW CARD (If already uploaded) */}
          {activeLR.podDetails && (
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proof of Delivery (POD) Signed Document</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setViewPodLr(activeLR);
                      setViewPodModalOpen(true);
                    }}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Full Document</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {/* Thumbnail */}
                <div
                  onClick={() => {
                    setViewPodLr(activeLR);
                    setViewPodModalOpen(true);
                  }}
                  className="w-32 h-32 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer group relative flex items-center justify-center"
                >
                  <img
                    src={activeLR.podDetails.documentUrl || '/company_logo.jpg'}
                    alt="POD Document"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 text-xs space-y-1">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>{activeLR.podDetails.fileName || `POD-${activeLR.lrNumber}.jpg`}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      ACKNOWLEDGED
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Received By: <strong className="text-slate-900">{activeLR.podDetails.receivedBy}</strong>
                  </div>
                  {activeLR.podDetails.receiverPhone && (
                    <div className="text-slate-600">
                      Receiver Mobile: <strong className="font-mono text-slate-900">{activeLR.podDetails.receiverPhone}</strong>
                    </div>
                  )}
                  <div className="text-slate-600">
                    Delivery Date & Time: <strong>{activeLR.podDetails.deliveryDate} {activeLR.podDetails.deliveryTime}</strong>
                  </div>
                  <div className="text-slate-600">
                    Remarks: <em>{activeLR.podDetails.remarks}</em>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Uploaded by <strong>{activeLR.podDetails.uploadedBy}</strong> on {new Date(activeLR.podDetails.uploadedAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. "EACH & EVERY LR TRACKING WITH POD STATUS" MASTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>EACH & EVERY LR TRACKING WITH POD STATUS</span>
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {filteredLRs.length} RECORDS
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रत्येक LR चे लाईव्ह ट्रॅकिंग व POD स्टेटस • Search, Track, and Upload POD for any consignment
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPodStatus('ALL');
                setFilterMovementStatus('ALL');
                setFilterBranch('ALL');
              }}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Search LR No / Party / Vehicle</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search LR-CHK-..., Tata Motors..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* POD Status filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">POD Status</label>
            <select
              value={filterPodStatus}
              onChange={(e) => setFilterPodStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All POD Statuses</option>
              <option value="PENDING">POD Pending (पावती शिल्लक)</option>
              <option value="UPLOADED">POD Uploaded (अपलोड पूर्ण)</option>
              <option value="VERIFIED">POD Verified (पडताळणी पूर्ण)</option>
            </select>
          </div>

          {/* Movement Status filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Movement Status</label>
            <select
              value={filterMovementStatus}
              onChange={(e) => setFilterMovementStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Movements</option>
              <option value="BOOKED">BOOKED (नोंदणी)</option>
              <option value="DISPATCHED">DISPATCHED (रवाना)</option>
              <option value="IN TRANSIT">IN TRANSIT (मार्गावर)</option>
              <option value="DELIVERED">DELIVERED (पोहोचले)</option>
            </select>
          </div>

          {/* Branch filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master Tracking Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider select-none font-bold">
                <th className="py-2.5 px-3">LR Number</th>
                <th className="py-2.5 px-3">Date / Hub</th>
                <th className="py-2.5 px-3">Consignor → Consignee</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Vehicle & Driver</th>
                <th className="py-2.5 px-2 text-center">Movement</th>
                <th className="py-2.5 px-3 text-center">POD Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLRs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Search className="w-6 h-6 text-slate-300" />
                      <span className="font-semibold text-xs">No consignment records found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLRs.map((lr) => {
                  const isSelected = lr.id === selectedLrId;
                  const hasPod = lr.podStatus === 'UPLOADED' || lr.podStatus === 'VERIFIED';
                  return (
                    <tr
                      key={lr.id}
                      className={`hover:bg-blue-50/50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 font-medium' : ''
                      }`}
                      onClick={() => setSelectedLrId(lr.id)}
                    >
                      {/* LR Number */}
                      <td className="py-2.5 px-3 font-mono font-black text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          <span>{lr.lrNumber}</span>
                        </div>
                      </td>

                      {/* Date & Hub */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        <div>{lr.bookingDate}</div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1 rounded font-bold">
                          {lr.branchCode}
                        </span>
                      </td>

                      {/* Consignor -> Consignee */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate" title={lr.consignorName}>
                          {lr.consignorName}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate flex items-center gap-1" title={lr.consigneeName}>
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{lr.consigneeName}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 text-[11px]">
                        <div>{lr.fromLocation} → {lr.toLocation}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {lr.totalQuantity} Pkgs • {lr.totalActualWeight} Kg
                        </div>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                        <div>{lr.vehicleNumber || '—'}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{lr.driverName || 'N/A'}</div>
                      </td>

                      {/* Movement Status */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            lr.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lr.status === 'IN TRANSIT'
                              ? 'bg-amber-100 text-amber-900'
                              : lr.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {lr.status}
                        </span>
                      </td>

                      {/* POD Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {hasPod ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewPodLr(lr);
                              setViewPodModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition shadow-2xs cursor-pointer"
                            title="Click to view uploaded POD Photo"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-700" />
                            <span>POD UPLOADED</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUploadPod(lr);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition shadow-2xs cursor-pointer"
                            title="Click to upload POD now"
                          >
                            <Upload className="w-3 h-3 text-rose-600" />
                            <span>POD PENDING</span>
                          </button>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Track button */}
                          <button
                            onClick={() => setSelectedLrId(lr.id)}
                            id={`btn-track-row-${lr.id}`}
                            title="Track this Consignment"
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          {/* Upload POD button */}
                          <button
                            onClick={() => handleOpenUploadPod(lr)}
                            id={`btn-upload-pod-row-${lr.id}`}
                            title={hasPod ? 'Re-upload / Update POD' : 'Upload Proof of Delivery'}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>

                          {/* Share WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(lr)}
                            title="Share on WhatsApp"
                            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. UPLOAD POD MODAL DIALOG */}
      {podUploadModalOpen && podTargetLr && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Upload Proof of Delivery (POD पावती)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    LR: <strong className="text-amber-400 font-mono">{podTargetLr.lrNumber}</strong> • {podTargetLr.consignorName} → {podTargetLr.consigneeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPodUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* File upload zone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select POD Photo / Scanned Delivery Receipt (JPG, PNG, PDF)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-emerald-50/30 transition cursor-pointer"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="font-bold text-slate-700">
                      {podFileName ? `Selected: ${podFileName}` : 'Click to Upload Document / Take Camera Photo'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports Camera Snap, Mobile gallery photo, PNG or JPG up to 8MB
                    </span>
                  </div>
                </div>

                {/* Quick button to generate sample stamped POD */}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleUseSamplePod(podTargetLr)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Generate Sample Stamped & Signed POD (झटपट डेमो पावती)</span>
                  </button>
                </div>

                {/* Live preview */}
                {podDocumentUrl && (
                  <div className="mt-3 p-2 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                      POD Document Preview:
                    </div>
                    <img
                      src={podDocumentUrl}
                      alt="POD Preview"
                      className="max-h-48 rounded object-contain mx-auto border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Delivery Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Receiver Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Received By (माल स्वीकारणाऱ्याचे नाव) *
                  </label>
                  <input
                    type="text"
                    value={podReceiverName}
                    onChange={(e) => setPodReceiverName(e.target.value)}
                    placeholder="e.g. Kailas Shinde (Store Incharge)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                {/* Receiver Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Receiver Contact No. (मोबाईल नंबर)
                  </label>
                  <input
                    type="text"
                    value={podReceiverPhone}
                    onChange={(e) => setPodReceiverPhone(e.target.value)}
                    placeholder="e.g. +91 98220 54321"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delivery Date (डिलिव्हरी दिनांक)
                  </label>
                  <input
                    type="date"
                    value={podDeliveryDate}
                    onChange={(e) => setPodDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delivery Time (डिलिव्हरी वेळ)
                  </label>
                  <input
                    type="time"
                    value={podDeliveryTime}
                    onChange={(e) => setPodDeliveryTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Delivery Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Delivery Remarks & Acknowledgment Notes
                </label>
                <textarea
                  value={podRemarks}
                  onChange={(e) => setPodRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPodUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePod}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE POD & CONFIRM DELIVERY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TRACKING STATUS UPDATE MODAL */}
      {trackingUpdateModalOpen && trackingTargetLr && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm uppercase">Update Movement Status</h3>
              </div>
              <button
                onClick={() => setTrackingUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-2.5 bg-slate-100 rounded-lg">
                <span className="text-slate-500 font-medium">Consignment:</span>{' '}
                <strong className="font-mono text-blue-700">{trackingTargetLr.lrNumber}</strong>
                <div className="text-slate-600 mt-0.5">
                  {trackingTargetLr.fromLocation} → {trackingTargetLr.toLocation}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LRStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="BOOKED">BOOKED (नोंदणी)</option>
                  <option value="DISPATCHED">DISPATCHED (रवाना)</option>
                  <option value="IN TRANSIT">IN TRANSIT (मार्गावर)</option>
                  <option value="ARRIVED">ARRIVED (पोहोचले)</option>
                  <option value="OUT FOR DELIVERY">OUT FOR DELIVERY (डिलिव्हरीसाठी बाहेर)</option>
                  <option value="DELIVERED">DELIVERED (स्वीकारले)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Location / Checkpoint</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Shikrapur Toll, Nagar Road, Waluj Hub"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Movement Remarks</label>
                <textarea
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="e.g. Crossing Ahmednagar, expected arrival in 3 hours."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTrackingUpdateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTrackingUpdate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FULLSCREEN VIEW POD LIGHTBOX MODAL */}
      {viewPodModalOpen && viewPodLr && viewPodLr.podDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm uppercase">
                    Proof of Delivery (POD) Document
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    LR: <strong className="text-amber-400 font-mono">{viewPodLr.lrNumber}</strong> • Delivered to: {viewPodLr.podDetails.receivedBy}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewPodModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Document display */}
              <div className="bg-slate-100 rounded-xl p-2 border border-slate-300 flex items-center justify-center min-h-[300px]">
                <img
                  src={viewPodLr.podDetails.documentUrl || '/company_logo.jpg'}
                  alt="POD Full View"
                  className="max-h-[60vh] max-w-full rounded shadow object-contain bg-white"
                />
              </div>

              {/* Acknowledgment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Recipient:</span>
                  <div className="font-bold text-slate-900">{viewPodLr.podDetails.receivedBy}</div>
                  {viewPodLr.podDetails.receiverPhone && (
                    <div className="font-mono text-slate-600">{viewPodLr.podDetails.receiverPhone}</div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Delivery Date & Time:</span>
                  <div className="font-bold text-slate-900">
                    {viewPodLr.podDetails.deliveryDate} at {viewPodLr.podDetails.deliveryTime}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Uploaded By:</span>
                  <div className="font-bold text-slate-900">{viewPodLr.podDetails.uploadedBy}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(viewPodLr.podDetails.uploadedAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {viewPodLr.podDetails.remarks && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Remarks:</span>
                  <p className="mt-0.5 italic">{viewPodLr.podDetails.remarks}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewPodModalOpen(false);
                  handleOpenUploadPod(viewPodLr);
                }}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Document</span>
              </button>

              <div className="flex items-center gap-2">
                {viewPodLr.podDetails.documentUrl && (
                  <a
                    href={viewPodLr.podDetails.documentUrl}
                    download={viewPodLr.podDetails.fileName || `POD-${viewPodLr.lrNumber}.jpg`}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download POD</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewPodModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
