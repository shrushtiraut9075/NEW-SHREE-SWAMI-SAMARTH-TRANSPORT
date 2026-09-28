import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  Search,
  Building2,
  DollarSign,
  Package,
  Truck,
  Boxes,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  LRRecord,
  MRRecord,
  LHSRecord,
  PaymentRecord,
  StockTransferRecord,
  Customer,
  Branch,
  CompanyProfile,
} from '../types';
import { exportToExcel, exportToPDF } from '../services/reportExport';

export type ReportCategory =
  | 'LR_REPORT'
  | 'MR_REPORT'
  | 'LHS_REPORT'
  | 'STOCK_REPORT'
  | 'PAYMENT_REPORT'
  | 'PARTY_LEDGER_REPORT'
  | 'OUTSTANDING_REPORT';

interface ReportsModuleProps {
  lrs: LRRecord[];
  mrs: MRRecord[];
  lhsList: LHSRecord[];
  payments: PaymentRecord[];
  stockTransfers?: StockTransferRecord[];
  customers?: Customer[];
  branches: Branch[];
  companyProfile: CompanyProfile;
  initialReportType?: ReportCategory;
  onPrintLR?: (lr: LRRecord) => void;
  onPrintMR?: (mr: MRRecord) => void;
  onPrintLHS?: (lhs: LHSRecord) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  lrs,
  mrs,
  lhsList,
  payments,
  stockTransfers = [],
  customers = [],
  branches,
  companyProfile,
  initialReportType = 'LR_REPORT',
  onPrintLR,
  onPrintMR,
  onPrintLHS,
}) => {
  const [reportType, setReportType] = useState<ReportCategory>(initialReportType);

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Branch & Payment mode filters
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Preset Helper
  const applyDatePreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30' | 'ALL_TIME') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'THIS_WEEK') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'LAST_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ALL_TIME') {
      setStartDate('2020-01-01');
      setEndDate(todayStr);
    }
  };

  // 1. Filtered LRs
  const filteredLRs = useMemo(() => {
    return lrs.filter((l) => {
      if (selectedBranch !== 'ALL' && l.branchCode !== selectedBranch) return false;
      if (selectedPaymentMode !== 'ALL' && l.paymentMode !== selectedPaymentMode) return false;
      if (l.bookingDate < startDate || l.bookingDate > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          l.lrNumber.toLowerCase().includes(q) ||
          l.consignorName.toLowerCase().includes(q) ||
          l.consigneeName.toLowerCase().includes(q) ||
          l.vehicleNumber.toLowerCase().includes(q) ||
          l.fromLocation.toLowerCase().includes(q) ||
          l.toLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lrs, selectedBranch, selectedPaymentMode, startDate, endDate, searchQuery]);

  // 2. Filtered MRs
  const filteredMRs = useMemo(() => {
    return mrs.filter((m) => {
      if (selectedBranch !== 'ALL' && m.branchCode !== selectedBranch) return false;
      if (m.date < startDate || m.date > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.mrNumber.toLowerCase().includes(q) ||
          m.vehicleNumber.toLowerCase().includes(q) ||
          m.driverName.toLowerCase().includes(q) ||
          m.fromBranch.toLowerCase().includes(q) ||
          m.toBranch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mrs, selectedBranch, startDate, endDate, searchQuery]);

  // 3. Filtered LHS
  const filteredLHS = useMemo(() => {
    return lhsList.filter((lhs) => {
      if (selectedBranch !== 'ALL' && lhs.branchCode !== selectedBranch) return false;
      if (lhs.date < startDate || lhs.date > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lhs.lhsNumber.toLowerCase().includes(q) ||
          lhs.vehicleNumber.toLowerCase().includes(q) ||
          lhs.driverName.toLowerCase().includes(q) ||
          lhs.fromBranch.toLowerCase().includes(q) ||
          lhs.toBranch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lhsList, selectedBranch, startDate, endDate, searchQuery]);

  // 4. Filtered Stock (Inventory currently in hub/godown or in transit)
  const filteredStock = useMemo(() => {
    return lrs.filter((l) => {
      if (selectedBranch !== 'ALL' && l.branchCode !== selectedBranch) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          l.lrNumber.toLowerCase().includes(q) ||
          l.consignorName.toLowerCase().includes(q) ||
          l.consigneeName.toLowerCase().includes(q) ||
          l.toLocation.toLowerCase().includes(q)
        );
      }
      // Consider BOOKED, IN TRANSIT, or DISPATCHED as active stock
      return l.status !== 'DELIVERED' && l.status !== 'CANCELLED';
    });
  }, [lrs, selectedBranch, searchQuery]);

  // 5. Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = p.date || p.paymentDate || '';
      if (pDate && (pDate < startDate || pDate > endDate)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (p.receiptNumber || p.receiptNo || '').toLowerCase().includes(q) ||
          p.lrNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          (p.referenceNo || p.transactionRef || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, startDate, endDate, searchQuery]);

  // 6. Party Ledger
  const partyLedgerData = useMemo(() => {
    const partyMap: Record<
      string,
      {
        partyName: string;
        consignmentsCount: number;
        totalPkgs: number;
        totalWeight: number;
        totalFreight: number;
        totalPaid: number;
        balanceDue: number;
      }
    > = {};

    filteredLRs.forEach((lr) => {
      // Consignor aggregation
      const consignor = lr.consignorName.trim() || 'Unknown Consignor';
      if (!partyMap[consignor]) {
        partyMap[consignor] = {
          partyName: consignor,
          consignmentsCount: 0,
          totalPkgs: 0,
          totalWeight: 0,
          totalFreight: 0,
          totalPaid: 0,
          balanceDue: 0,
        };
      }
      const p = partyMap[consignor];
      p.consignmentsCount += 1;
      p.totalPkgs += lr.totalQuantity || 0;
      p.totalWeight += lr.totalActualWeight || 0;
      const freight = lr.charges?.grandTotal || 0;
      p.totalFreight += freight;
      const paid = lr.paymentMode === 'PAID' ? freight : lr.paidAmount || 0;
      p.totalPaid += paid;
      p.balanceDue += freight - paid;
    });

    return Object.values(partyMap).sort((a, b) => b.totalFreight - a.totalFreight);
  }, [filteredLRs]);

  // 7. Outstanding Dues (Unpaid freight on TO PAY / TBB or partial payments)
  const outstandingLRs = useMemo(() => {
    return filteredLRs.filter((l) => {
      if (l.status === 'CANCELLED') return false;
      const grandTotal = l.charges?.grandTotal || 0;
      const paid = l.paymentMode === 'PAID' ? grandTotal : l.paidAmount || 0;
      return grandTotal - paid > 0;
    });
  }, [filteredLRs]);

  // Summary Totals Calculation
  const lrTotalFreight = filteredLRs.reduce((sum, l) => sum + (l.charges?.grandTotal || 0), 0);
  const lrTotalWeight = filteredLRs.reduce((sum, l) => sum + (l.totalActualWeight || 0), 0);
  const lrTotalPkgs = filteredLRs.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);

  const mrTotalFreight = filteredMRs.reduce((sum, m) => sum + (m.totalFreight || 0), 0);
  const mrTotalWeight = filteredMRs.reduce((sum, m) => sum + (m.totalWeight || 0), 0);
  const mrTotalPkgs = filteredMRs.reduce((sum, m) => sum + (m.totalPackages || 0), 0);

  const lhsTotalFreight = filteredLHS.reduce((sum, l) => sum + (l.totalFreight || 0), 0);
  const lhsTotalAdvance = filteredLHS.reduce((sum, l) => sum + (l.advancePaid || 0), 0);
  const lhsTotalBalance = filteredLHS.reduce((sum, l) => sum + (l.balanceAmount || 0), 0);

  const paymentTotal = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstandingAmount = outstandingLRs.reduce((sum, l) => {
    const grand = l.charges?.grandTotal || 0;
    const paid = l.paymentMode === 'PAID' ? grand : l.paidAmount || 0;
    return sum + (grand - paid);
  }, 0);

  // Common CSV Downloader
  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to compile data payload for export
  const getReportPayload = () => {
    if (reportType === 'LR_REPORT') {
      const headers = [
        'LR Number',
        'Booking Date',
        'Branch',
        'Consignor Name',
        'Consignee Name',
        'From',
        'To',
        'Vehicle No',
        'Packages',
        'Actual Wt (kg)',
        'Charged Wt (kg)',
        'Freight Rate (₹)',
        'Grand Total (₹)',
        'Payment Mode',
        'Status',
      ];
      const rows = filteredLRs.map((l) => [
        l.lrNumber,
        l.bookingDate,
        l.branchCode,
        l.consignorName,
        l.consigneeName,
        l.fromLocation,
        l.toLocation,
        l.vehicleNumber || '—',
        l.totalQuantity,
        l.totalActualWeight,
        l.totalChargeWeight,
        l.charges?.freight || 0,
        l.charges?.grandTotal || 0,
        l.paymentMode,
        l.status,
      ]);
      const summaryStats = [
        { label: 'Total Consignments', value: `${filteredLRs.length} LRs` },
        { label: 'Total Packages', value: `${lrTotalPkgs} Pkgs` },
        { label: 'Total Weight', value: `${lrTotalWeight.toLocaleString()} kg` },
        { label: 'Total Freight Billed', value: `₹${lrTotalFreight.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'LR Consignment Register Report',
        filename: 'LR_Consignment_Report',
        headers,
        rows,
        summaryStats,
      };
    } else if (reportType === 'MR_REPORT') {
      const headers = [
        'MR Number',
        'Date',
        'Branch',
        'Vehicle Number',
        'Driver Name',
        'From Hub',
        'To Hub',
        'Total LRs',
        'Total Packages',
        'Total Weight (kg)',
        'Total Freight (₹)',
      ];
      const rows = filteredMRs.map((m) => [
        m.mrNumber,
        m.date,
        m.branchName,
        m.vehicleNumber,
        m.driverName,
        m.fromBranch,
        m.toBranch,
        m.totalLRs,
        m.totalPackages,
        m.totalWeight,
        m.totalFreight,
      ]);
      const summaryStats = [
        { label: 'Total Manifests', value: `${filteredMRs.length} MRs` },
        { label: 'Total Packages', value: `${mrTotalPkgs} Pkgs` },
        { label: 'Total Weight', value: `${mrTotalWeight.toLocaleString()} kg` },
        { label: 'Total Manifest Freight', value: `₹${mrTotalFreight.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'Trip Manifest (MR) Report',
        filename: 'Trip_Manifest_Report',
        headers,
        rows,
        summaryStats,
      };
    } else if (reportType === 'LHS_REPORT') {
      const headers = [
        'LHS Number',
        'Date',
        'Branch',
        'Vehicle Number',
        'Driver Name',
        'From Hub',
        'To Hub',
        'Total LRs',
        'Total Freight (₹)',
        'Advance Paid (₹)',
        'Balance Due (₹)',
      ];
      const rows = filteredLHS.map((lhs) => [
        lhs.lhsNumber,
        lhs.date,
        lhs.branchName,
        lhs.vehicleNumber,
        lhs.driverName,
        lhs.fromBranch,
        lhs.toBranch,
        lhs.totalLRs,
        lhs.totalFreight,
        lhs.advancePaid,
        lhs.balanceAmount,
      ]);
      const summaryStats = [
        { label: 'Total Loading Sheets', value: `${filteredLHS.length} LHS` },
        { label: 'Total Trip Freight', value: `₹${lhsTotalFreight.toLocaleString('en-IN')}` },
        { label: 'Total Driver Advance', value: `₹${lhsTotalAdvance.toLocaleString('en-IN')}` },
        { label: 'Total Balance Due', value: `₹${lhsTotalBalance.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'Loading Sheet (LHS) Report',
        filename: 'Loading_Sheet_LHS_Report',
        headers,
        rows,
        summaryStats,
      };
    } else if (reportType === 'STOCK_REPORT') {
      const headers = [
        'LR Number',
        'Booking Date',
        'Branch Hub',
        'Consignor',
        'Consignee',
        'Destination',
        'Packages',
        'Actual Weight (kg)',
        'Status',
        'Payment Mode',
      ];
      const rows = filteredStock.map((l) => [
        l.lrNumber,
        l.bookingDate,
        l.branchName,
        l.consignorName,
        l.consigneeName,
        l.toLocation,
        l.totalQuantity,
        l.totalActualWeight,
        l.status,
        l.paymentMode,
      ]);
      const totalStockPkgs = filteredStock.reduce((sum, l) => sum + l.totalQuantity, 0);
      const totalStockWt = filteredStock.reduce((sum, l) => sum + l.totalActualWeight, 0);
      const summaryStats = [
        { label: 'Items In Hub', value: `${filteredStock.length} Consignments` },
        { label: 'Total Stock Packages', value: `${totalStockPkgs} Pkgs` },
        { label: 'Total Stock Weight', value: `${totalStockWt.toLocaleString()} kg` },
      ];
      return {
        title: 'Hub Stock & Godown Inventory Report',
        filename: 'Hub_Stock_Report',
        headers,
        rows,
        summaryStats,
      };
    } else if (reportType === 'PAYMENT_REPORT') {
      const headers = [
        'Receipt No',
        'Date',
        'LR Number',
        'Party Name',
        'Payment Mode',
        'Reference / UTR',
        'Amount (₹)',
        'Status',
        'Received By',
      ];
      const rows = filteredPayments.map((p) => [
        p.receiptNumber || p.receiptNo || '—',
        p.date || p.paymentDate || '—',
        p.lrNumber,
        p.customerName,
        p.paymentMode,
        p.referenceNo || p.transactionRef || '—',
        p.amount,
        p.status,
        p.receivedBy || 'System',
      ]);
      const summaryStats = [
        { label: 'Total Receipts', value: `${filteredPayments.length} Transactions` },
        { label: 'Total Amount Collected', value: `₹${paymentTotal.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'Payment & Collection Register Report',
        filename: 'Payment_Collection_Report',
        headers,
        rows,
        summaryStats,
      };
    } else if (reportType === 'PARTY_LEDGER_REPORT') {
      const headers = [
        'Party / Customer Name',
        'Total Consignments',
        'Total Packages',
        'Total Weight (kg)',
        'Total Freight Billed (₹)',
        'Total Collected (₹)',
        'Outstanding Balance (₹)',
      ];
      const rows = partyLedgerData.map((p) => [
        p.partyName,
        p.consignmentsCount,
        p.totalPkgs,
        p.totalWeight,
        p.totalFreight,
        p.totalPaid,
        p.balanceDue,
      ]);
      const summaryStats = [
        { label: 'Total Active Parties', value: `${partyLedgerData.length} Accounts` },
        { label: 'Total Freight Billed', value: `₹${lrTotalFreight.toLocaleString('en-IN')}` },
        { label: 'Total Outstanding Due', value: `₹${totalOutstandingAmount.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'Party-Wise Freight Ledger Report',
        filename: 'Party_Ledger_Report',
        headers,
        rows,
        summaryStats,
      };
    } else {
      // OUTSTANDING_REPORT
      const headers = [
        'LR Number',
        'Booking Date',
        'Branch',
        'Consignor Name',
        'Consignee Name',
        'Destination',
        'Payment Mode',
        'Total Freight (₹)',
        'Paid Amount (₹)',
        'Balance Due (₹)',
      ];
      const rows = outstandingLRs.map((l) => {
        const grand = l.charges?.grandTotal || 0;
        const paid = l.paymentMode === 'PAID' ? grand : l.paidAmount || 0;
        return [
          l.lrNumber,
          l.bookingDate,
          l.branchCode,
          l.consignorName,
          l.consigneeName,
          l.toLocation,
          l.paymentMode,
          grand,
          paid,
          grand - paid,
        ];
      });
      const summaryStats = [
        { label: 'Unpaid Consignments', value: `${outstandingLRs.length} LRs` },
        { label: 'Total Outstanding Dues', value: `₹${totalOutstandingAmount.toLocaleString('en-IN')}` },
      ];
      return {
        title: 'Outstanding Freight Dues Report',
        filename: 'Outstanding_Freight_Report',
        headers,
        rows,
        summaryStats,
      };
    }
  };

  // Handle Excel (.xlsx) Download
  const handleDownloadExcel = () => {
    const payload = getReportPayload();
    exportToExcel(
      {
        ...payload,
        dateRange: { start: startDate, end: endDate },
        branch: selectedBranch,
      },
      companyProfile
    );
  };

  // Handle PDF (.pdf) Download
  const handleDownloadPDF = () => {
    const payload = getReportPayload();
    exportToPDF(
      {
        ...payload,
        dateRange: { start: startDate, end: endDate },
        branch: selectedBranch,
      },
      companyProfile
    );
  };

  // Handle CSV Download
  const handleDownloadCSV = () => {
    const payload = getReportPayload();
    downloadCSV(payload.filename, [payload.headers, ...payload.rows]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with EXCEL & PDF Download Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white rounded-xl p-1 border-2 border-amber-400 shadow-xs flex items-center justify-center flex-shrink-0">
            <img
              src="/company_logo.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                AUDIT-READY EXPORT SUITE
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Excel (.xlsx) & PDF Reports
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              REPORTS & EXPORT PORTAL
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate & download full operational and financial reports in Excel (.xlsx) and PDF formats
            </p>
          </div>
        </div>

        {/* Primary Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* DOWNLOAD EXCEL (.xlsx) */}
          <button
            onClick={handleDownloadExcel}
            id="btn-download-excel"
            title="Download Complete Report as Microsoft Excel Workbook (.xlsx)"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md transition cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>DOWNLOAD EXCEL (.XLSX)</span>
          </button>

          {/* DOWNLOAD PDF (.pdf) */}
          <button
            onClick={handleDownloadPDF}
            id="btn-download-pdf"
            title="Download Complete Report as Formatted Audit PDF (.pdf)"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-md transition cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-rose-100" />
            <span>DOWNLOAD PDF (.PDF)</span>
          </button>

          {/* DOWNLOAD CSV */}
          <button
            onClick={handleDownloadCSV}
            id="btn-download-csv"
            title="Export Raw CSV Data"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          {/* PRINT REPORT */}
          <button
            onClick={() => window.print()}
            id="btn-print-report"
            title="Print report using browser printer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Report Category Selector Pills */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            SELECT REPORT CATEGORY
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: <span className="font-bold text-blue-800">{reportType.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportType('LR_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'LR_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>LR Consignment (Bilty)</span>
          </button>

          <button
            onClick={() => setReportType('MR_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'MR_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Trip Manifest (MR)</span>
          </button>

          <button
            onClick={() => setReportType('LHS_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'LHS_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Loading Sheet (LHS)</span>
          </button>

          <button
            onClick={() => setReportType('STOCK_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'STOCK_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Hub Stock & Godown</span>
          </button>

          <button
            onClick={() => setReportType('PAYMENT_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'PAYMENT_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payment & Collections</span>
          </button>

          <button
            onClick={() => setReportType('PARTY_LEDGER_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'PARTY_LEDGER_REPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Party-Wise Ledger</span>
          </button>

          <button
            onClick={() => setReportType('OUTSTANDING_REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              reportType === 'OUTSTANDING_REPORT'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Outstanding Dues</span>
          </button>
        </div>
      </div>

      {/* Date Presets, Date Pickers & Hub Filters Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Quick Presets:</span>
            <button
              onClick={() => applyDatePreset('TODAY')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              Today
            </button>
            <button
              onClick={() => applyDatePreset('YESTERDAY')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              Yesterday
            </button>
            <button
              onClick={() => applyDatePreset('THIS_WEEK')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              This Week
            </button>
            <button
              onClick={() => applyDatePreset('THIS_MONTH')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              This Month
            </button>
            <button
              onClick={() => applyDatePreset('LAST_30')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyDatePreset('ALL_TIME')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-[11px]"
            >
              All Time
            </button>
          </div>

          {/* Quick Stats Indicator */}
          <div className="text-[11px] text-slate-500 font-mono">
            Period: <span className="font-bold text-slate-900">{startDate}</span> to{' '}
            <span className="font-bold text-slate-900">{endDate}</span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by party, LR, vehicle..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Hub & Payment Mode */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">All Hubs / Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>

            {reportType === 'LR_REPORT' && (
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="w-32 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
              >
                <option value="ALL">All Modes</option>
                <option value="PAID">PAID</option>
                <option value="TO PAY">TO PAY</option>
                <option value="TBB">TBB</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Summary Metric Cards */}
      {reportType === 'LR_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              Total Consignments
            </span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredLRs.length} LRs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              Total Packages
            </span>
            <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
              {lrTotalPkgs} Pkgs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              Total Cargo Weight
            </span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {lrTotalWeight.toLocaleString()} kg
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              Total Freight Billed
            </span>
            <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
              ₹{lrTotalFreight.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {reportType === 'MR_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Trip Manifests</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredMRs.length} MRs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Packages</span>
            <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
              {mrTotalPkgs} Pkgs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Manifest Weight</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {mrTotalWeight.toLocaleString()} kg
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Manifest Freight</span>
            <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
              ₹{mrTotalFreight.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {reportType === 'LHS_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Loading Sheets</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredLHS.length} LHS
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Trip Freight</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              ₹{lhsTotalFreight.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Driver Advance</span>
            <span className="text-xl font-black font-mono text-amber-700 mt-1 block">
              ₹{lhsTotalAdvance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Balance Due</span>
            <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
              ₹{lhsTotalBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {reportType === 'STOCK_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Stock In Godown</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredStock.length} Consignments
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Stock Packages</span>
            <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
              {filteredStock.reduce((s, l) => s + l.totalQuantity, 0)} Pkgs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Stock Weight</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredStock.reduce((s, l) => s + l.totalActualWeight, 0).toLocaleString()} kg
            </span>
          </div>
        </div>
      )}

      {reportType === 'PAYMENT_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Transactions</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {filteredPayments.length} Receipts
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Amount Collected</span>
            <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
              ₹{paymentTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">PhonePe & UPI Collections</span>
            <span className="text-xl font-black font-mono text-purple-700 mt-1 block">
              ₹
              {filteredPayments
                .filter((p) => p.paymentMode === 'PhonePe' || p.paymentMode === 'UPI')
                .reduce((s, p) => s + p.amount, 0)
                .toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {reportType === 'PARTY_LEDGER_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Active Customer Accounts</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {partyLedgerData.length} Parties
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Freight Billed</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              ₹{lrTotalFreight.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Collections</span>
            <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
              ₹{partyLedgerData.reduce((s, p) => s + p.totalPaid, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Outstanding Due</span>
            <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
              ₹{totalOutstandingAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {reportType === 'OUTSTANDING_REPORT' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Pending Consignments</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {outstandingLRs.length} LRs
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Outstanding Freight</span>
            <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
              ₹{totalOutstandingAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Pending TO PAY Freight</span>
            <span className="text-xl font-black font-mono text-amber-700 mt-1 block">
              ₹
              {outstandingLRs
                .filter((l) => l.paymentMode === 'TO PAY')
                .reduce((s, l) => s + ((l.charges?.grandTotal || 0) - (l.paidAmount || 0)), 0)
                .toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Table Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Info */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>
              {reportType === 'LR_REPORT' && `LR Consignment Register (${filteredLRs.length} Records)`}
              {reportType === 'MR_REPORT' && `Trip Manifest (MR) Register (${filteredMRs.length} Records)`}
              {reportType === 'LHS_REPORT' && `Loading Sheet (LHS) Register (${filteredLHS.length} Records)`}
              {reportType === 'STOCK_REPORT' && `Hub Godown Stock Register (${filteredStock.length} Consignments)`}
              {reportType === 'PAYMENT_REPORT' && `Payment Collections Ledger (${filteredPayments.length} Receipts)`}
              {reportType === 'PARTY_LEDGER_REPORT' && `Party-Wise Ledger Summary (${partyLedgerData.length} Parties)`}
              {reportType === 'OUTSTANDING_REPORT' && `Outstanding Dues Register (${outstandingLRs.length} Unpaid LRs)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded text-[11px] font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-800" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {/* 1. LR REPORT TABLE */}
          {reportType === 'LR_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2 text-center">Hub</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-2 text-center">Pkgs</th>
                  <th className="py-2.5 px-2 text-right">Actual Wt</th>
                  <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                  <th className="py-2.5 px-2 text-center">Payment</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLRs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-semibold">
                      No consignment records found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLRs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{l.lrNumber}</td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{l.bookingDate}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                        {l.branchCode}
                      </td>
                      <td className="py-2 px-3 text-slate-900 font-medium">{l.consignorName}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">{l.consigneeName}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {l.fromLocation} → {l.toLocation}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                        {l.totalQuantity}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-800">
                        {l.totalActualWeight} kg
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-950">
                        ₹{(l.charges?.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                          {l.paymentMode}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            l.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {onPrintLR && (
                          <button
                            type="button"
                            onClick={() => onPrintLR(l)}
                            title={`Print LR ${l.lrNumber} (A4 3-in-1)`}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition cursor-pointer border border-blue-200 inline-flex items-center justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLRs.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL SUMMARY ({filteredLRs.length} LRs):
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">{lrTotalPkgs}</td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {lrTotalWeight.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹{lrTotalFreight.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 2. MR (MANIFEST) REPORT TABLE */}
          {reportType === 'MR_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">MR Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2 text-center">Branch</th>
                  <th className="py-2.5 px-3">Vehicle No</th>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Route (From → To)</th>
                  <th className="py-2.5 px-2 text-center">LRs</th>
                  <th className="py-2.5 px-2 text-center">Packages</th>
                  <th className="py-2.5 px-2 text-right">Total Wt</th>
                  <th className="py-2.5 px-3 text-right">Manifest Freight (₹)</th>
                  <th className="py-2.5 px-2 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMRs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-semibold">
                      No trip manifest records found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMRs.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-sky-700">{m.mrNumber}</td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{m.date}</td>
                      <td className="py-2 px-2 text-center font-mono">{m.branchCode || m.branchName}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.vehicleNumber}</td>
                      <td className="py-2 px-3 text-slate-800">{m.driverName}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {m.fromBranch} → {m.toBranch}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">
                        {m.totalLRs}
                      </td>
                      <td className="py-2 px-2 text-center font-mono">{m.totalPackages}</td>
                      <td className="py-2 px-2 text-right font-mono">{m.totalWeight} kg</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                        ₹{m.totalFreight.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {onPrintMR && (
                          <button
                            type="button"
                            onClick={() => onPrintMR(m)}
                            title={`Print Manifest ${m.mrNumber}`}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md transition cursor-pointer border border-sky-200 inline-flex items-center justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredMRs.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL SUMMARY ({filteredMRs.length} MRs):
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      {filteredMRs.reduce((s, m) => s + m.totalLRs, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">{mrTotalPkgs}</td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {mrTotalWeight.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹{mrTotalFreight.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 3. LHS (LOADING SHEET) REPORT TABLE */}
          {reportType === 'LHS_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">LHS Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2 text-center">Branch</th>
                  <th className="py-2.5 px-3">Vehicle No</th>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-2 text-center">LRs</th>
                  <th className="py-2.5 px-3 text-right">Trip Freight (₹)</th>
                  <th className="py-2.5 px-3 text-right">Advance (₹)</th>
                  <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                  <th className="py-2.5 px-2 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLHS.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-semibold">
                      No loading sheet records found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLHS.map((lhs) => (
                    <tr key={lhs.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700">{lhs.lhsNumber}</td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{lhs.date}</td>
                      <td className="py-2 px-2 text-center font-mono">{lhs.branchCode || lhs.branchName}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{lhs.vehicleNumber}</td>
                      <td className="py-2 px-3 text-slate-800">{lhs.driverName}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {lhs.fromBranch} → {lhs.toBranch}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">
                        {lhs.totalLRs}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-950">
                        ₹{lhs.totalFreight.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                        ₹{lhs.advancePaid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                        ₹{lhs.balanceAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {onPrintLHS && (
                          <button
                            type="button"
                            onClick={() => onPrintLHS(lhs)}
                            title={`Print LHS ${lhs.lhsNumber}`}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition cursor-pointer border border-indigo-200 inline-flex items-center justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLHS.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL SUMMARY ({filteredLHS.length} LHS):
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      {filteredLHS.reduce((s, l) => s + l.totalLRs, 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-950">
                      ₹{filteredLHS.reduce((s, l) => s + l.totalFreight, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                      ₹{filteredLHS.reduce((s, l) => s + l.advancePaid, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹{lhsTotalBalance.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 4. STOCK & GODOWN INVENTORY REPORT TABLE */}
          {reportType === 'STOCK_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Booking Date</th>
                  <th className="py-2.5 px-2 text-center">Hub Location</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-2 text-center">Packages</th>
                  <th className="py-2.5 px-2 text-right">Actual Wt</th>
                  <th className="py-2.5 px-2 text-center">Current Status</th>
                  <th className="py-2.5 px-2 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold">
                      No active stock items currently in hub storage.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{l.lrNumber}</td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{l.bookingDate}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                        {l.branchCode}
                      </td>
                      <td className="py-2 px-3 text-slate-900">{l.consignorName}</td>
                      <td className="py-2 px-3 text-slate-800">{l.consigneeName}</td>
                      <td className="py-2 px-3 text-slate-600">{l.toLocation}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                        {l.totalQuantity}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{l.totalActualWeight} kg</td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          {l.paymentMode}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredStock.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL IN-HUB STOCK ({filteredStock.length} Consignments):
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      {filteredStock.reduce((s, l) => s + l.totalQuantity, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {filteredStock.reduce((s, l) => s + l.totalActualWeight, 0).toLocaleString()} kg
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 5. PAYMENT & COLLECTIONS REPORT TABLE */}
          {reportType === 'PAYMENT_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Receipt No.</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Reference / UTR</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                      No payment receipts found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-purple-800">
                        {p.receiptNumber || p.receiptNo || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">
                        {p.date || p.paymentDate}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{p.lrNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{p.customerName}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {p.referenceNo || p.transactionRef || '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {p.receivedBy || p.createdBy || 'Cashier'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL COLLECTIONS ({filteredPayments.length} Receipts):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹{paymentTotal.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 6. PARTY-WISE FREIGHT LEDGER TABLE */}
          {reportType === 'PARTY_LEDGER_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Party / Customer Name</th>
                  <th className="py-2.5 px-2 text-center">Consignments</th>
                  <th className="py-2.5 px-2 text-center">Total Packages</th>
                  <th className="py-2.5 px-2 text-right">Total Weight (kg)</th>
                  <th className="py-2.5 px-3 text-right">Total Freight (₹)</th>
                  <th className="py-2.5 px-3 text-right">Paid Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partyLedgerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                      No customer ledger accounts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  partyLedgerData.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-semibold text-slate-900">{p.partyName}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">
                        {p.consignmentsCount}
                      </td>
                      <td className="py-2 px-2 text-center font-mono">{p.totalPkgs}</td>
                      <td className="py-2 px-2 text-right font-mono">{p.totalWeight.toLocaleString()} kg</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                        ₹{p.totalFreight.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{p.totalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                        ₹{p.balanceDue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {partyLedgerData.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 uppercase text-[11px]">
                      TOTAL SUMMARY ({partyLedgerData.length} Accounts):
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      {partyLedgerData.reduce((s, p) => s + p.consignmentsCount, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">
                      {partyLedgerData.reduce((s, p) => s + p.totalPkgs, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {partyLedgerData.reduce((s, p) => s + p.totalWeight, 0).toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ₹{lrTotalFreight.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹{partyLedgerData.reduce((s, p) => s + p.totalPaid, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                      ₹{totalOutstandingAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 7. OUTSTANDING FREIGHT DUES REPORT TABLE */}
          {reportType === 'OUTSTANDING_REPORT' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2 text-center">Hub</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-2 text-center">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                  <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                  <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingLRs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-emerald-600 font-bold">
                      ✓ No outstanding dues! All freight amounts are fully collected.
                    </td>
                  </tr>
                ) : (
                  outstandingLRs.map((l) => {
                    const grand = l.charges?.grandTotal || 0;
                    const paid = l.paymentMode === 'PAID' ? grand : l.paidAmount || 0;
                    const due = grand - paid;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{l.lrNumber}</td>
                        <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{l.bookingDate}</td>
                        <td className="py-2 px-2 text-center font-mono">{l.branchCode}</td>
                        <td className="py-2 px-3 text-slate-900">{l.consignorName}</td>
                        <td className="py-2 px-3 text-slate-800 font-semibold">{l.consigneeName}</td>
                        <td className="py-2 px-3 text-slate-600">{l.toLocation}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                            {l.paymentMode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800">
                          ₹{grand.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                          ₹{due.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {outstandingLRs.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={7} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      TOTAL OUTSTANDING DUE ({outstandingLRs.length} LRs):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ₹{outstandingLRs.reduce((s, l) => s + (l.charges?.grandTotal || 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ₹
                      {outstandingLRs
                        .reduce((s, l) => s + (l.paymentMode === 'PAID' ? l.charges?.grandTotal || 0 : l.paidAmount || 0), 0)
                        .toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                      ₹{totalOutstandingAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
