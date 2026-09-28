export type UserRole = 'ADMIN' | 'OPERATOR' | 'USER' | 'VIEWER';

export interface UserPermissions {
  canModifyLR: boolean; // default false for non-admin (LR modification Restricted)
  canCancelLR: boolean; // default false for non-admin
  canDeleteLR: boolean; // default false for non-admin
  canCreateLR: boolean; // default true for operator
  canViewCompanyProfile: boolean; // default false for non-admin (Company Profile Hide from User)
  canEditCompanyProfile: boolean; // default false for non-admin
  canManageMaster: boolean; // default false for non-admin
  canAccessDataSafe: boolean; // default false for non-admin
  canManageUsers: boolean; // default false for non-admin
}

export interface User {
  id: string;
  username: string;
  name: string;
  fullName?: string;
  role: UserRole;
  designation?: string;
  branchCode: string; // 'ALL' or specific like 'CHK'
  phone?: string;
  contact?: string;
  email?: string;
  active: boolean;
  pin?: string;
  password?: string;
  permissions?: UserPermissions;
}

export interface Branch {
  id: string;
  name: string;
  code: string; // CHK, PUN, MUM, etc.
  address: string;
  contact?: string;
  contactPerson?: string;
  phone?: string;
  gstin?: string;
  status: 'Active' | 'Inactive';
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gstin: string;
  pan: string;
  contact: string;
  email: string;
  paymentTerms?: string;
  status: 'Active' | 'Inactive';
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string; // 'Open Truck', 'Container 32ft', 'Taurus 21T', 'Trailer 40ft', 'Pick-up 14ft'
  vehicleNature?: 'Own' | 'Attached' | 'Market';
  ownerName: string;
  capacityTonnes?: number;
  capacityTons?: number;
  fitnessExpiry?: string;
  insuranceExpiry?: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  licenseExpiry?: string;
  address: string;
  status: 'Active' | 'On Trip' | 'Inactive';
}

export interface GoodsItem {
  id: string;
  description: string;
  packingType: string; // Bags, Boxes, Wooden Crates, Drums, Pallets, Loose, Heavy Machinery
  quantity: number;
  units: string; // Nos, Pkgs, Bundles, MT, Bags, Crates
  actualWeight: number; // KG
  chargeWeight: number; // KG
  ratePerKg: number;
  freight: number;
}

export type LRStatus = 'BOOKED' | 'DISPATCHED' | 'IN TRANSIT' | 'ARRIVED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMode = 'PAID' | 'TO PAY' | 'TBB';
export type DeliveryType = 'DOOR DELIVERY' | 'GODOWN DELIVERY';
export type LRCopyType = 'CONSIGNOR' | 'CONSIGNEE' | 'DRIVER';
export type PODStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

export interface TrackingCheckpoint {
  id: string;
  status: LRStatus;
  timestamp: string; // ISO string
  location: string;
  remarks: string;
  updatedBy: string;
}

export interface PODRecord {
  id: string;
  lrId: string;
  lrNumber: string;
  status: PODStatus;
  receivedBy: string;
  receiverPhone?: string;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime?: string; // HH:mm
  documentUrl?: string; // Base64 or image URL
  fileName?: string;
  fileType?: string;
  remarks?: string;
  uploadedAt: string;
  uploadedBy: string;
  verifiedAt?: string;
  verifiedBy?: string;
  receiverSignature?: string; // Optional signature acknowledgment
}

export interface LRRecord {
  id: string;
  lrNumber: string; // Format: LR-CHK-2026-00001
  bookingDate: string; // YYYY-MM-DD
  branchCode: string;
  branchName: string;
  consignorName: string;
  consignorGstin: string;
  consignorAddress: string;
  consignorMobile?: string;
  consigneeName: string;
  consigneeGstin: string;
  consigneeAddress: string;
  consigneeMobile?: string;
  fromLocation: string;
  toLocation: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile?: string;
  paymentMode: PaymentMode;
  deliveryType: DeliveryType;
  eWayBillNo: string;
  freightUpToBranch: string;
  toBranch: string;
  collectionType: string;
  ccType: string;
  specialRemarks: string;
  items: GoodsItem[];
  totalQuantity: number;
  totalActualWeight: number;
  totalChargeWeight: number;
  totalFreight: number;
  charges: {
    freight: number;
    vasuli: number;
    handling: number;
    doorCollection: number;
    doorDelivery: number;
    otherCharges: number;
    gstTax: number;
    grandTotal: number;
  };
  status: LRStatus;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  paidAmount: number;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  podStatus?: PODStatus;
  podDetails?: PODRecord;
  trackingHistory?: TrackingCheckpoint[];
  currentLocation?: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  deliveredTo?: string;
  receiverMobile?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface MRRecord {
  id: string;
  mrNumber: string; // Format: MR-CHK-2026-00001
  date: string;
  branchCode: string;
  branchName?: string;
  vehicleNumber: string;
  vehicleType?: string;
  vehicleNature?: string;
  driverName: string;
  driverMobile: string;
  vendor?: string;
  loader?: string;
  loaderName?: string;
  supervisor?: string;
  supervisorName?: string;
  fromBranch?: string;
  toBranch: string;
  weight?: number;
  awbNo?: string;
  lhsNo?: string;
  driverAmount?: number;
  remarks: string;
  selectedLrIds?: string[];
  lrIds?: string[];
  selectedLrNumbers?: string[];
  totalLR?: number;
  totalLRs?: number;
  totalPackages?: number;
  totalQuantity?: number;
  totalWeight?: number;
  totalFreight?: number;
  status: 'PREPARED' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED' | 'CREATED';
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface LHSRecord {
  id: string;
  lhsNumber: string; // Format: LHS-CHK-2026-00001
  date: string;
  branchCode: string;
  branchName?: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile?: string;
  loader?: string;
  supervisor?: string;
  fromBranch: string;
  toBranch: string;
  selectedLrIds?: string[];
  lrIds?: string[];
  selectedLrNumbers?: string[];
  selectedMrIds?: string[];
  totalPackages: number;
  totalWeight: number;
  totalLRs?: number;
  totalFreight?: number;
  advancePaid?: number;
  hamaliCharges?: number;
  balanceAmount?: number;
  remarks: string;
  status: 'PREPARED' | 'LOADED' | 'COMPLETED' | 'CREATED';
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string; // Format: TRF-CHK-2026-00001
  date: string;
  fromBranch: string;
  toBranch: string;
  lrId?: string;
  lrNumber: string;
  mrNumber?: string;
  lhsNumber?: string;
  itemDescription?: string;
  quantity?: number;
  packagesCount?: number;
  units?: string;
  actualWeight?: number;
  weightKg?: number;
  chargeWeight?: number;
  vehicleNumber: string;
  driverName: string;
  status: 'Pending' | 'In Transit' | 'Received' | 'Cancelled' | 'IN TRANSIT';
  remarks: string;
  transferredBy?: string;
  receivedAt?: string;
  receivedBy?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PaymentRecord {
  id: string;
  receiptNo: string;
  receiptNumber?: string;
  paymentDate: string;
  date?: string;
  lrId?: string;
  lrNumber: string;
  customerName: string;
  amount: number;
  paymentMode: 'PhonePe' | 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  transactionRef: string;
  referenceNo?: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'SUCCESS';
  remarks: string;
  receivedBy?: string;
  createdAt: string;
  createdBy: string;
}

export const DEFAULT_UNIT_RATES: Record<string, number> = {
  'KG': 5,
  'MT': 3500,
  'Ton': 3500,
  'Pkgs': 120,
  'Boxes': 150,
  'Nos': 50,
  'Crates': 200,
  'Pallets': 500,
  'Bags': 80,
  'Bundles': 100,
  'Drums': 300,
  'TRIP': 4500,
};

// Common transport materials with default packing and unit
export interface CommonMaterial {
  name: string;
  marathi: string;
  defaultPacking: string;
  defaultUnit: string;
  suggestedRate?: number;
}

export const COMMON_MATERIALS: CommonMaterial[] = [
  { name: 'Auto Parts / Spare Parts', marathi: 'ऑटो पार्ट्स / सुटे भाग', defaultPacking: 'Boxes', defaultUnit: 'Boxes', suggestedRate: 150 },
  { name: 'Industrial Machinery', marathi: 'औद्योगिक मशिनरी', defaultPacking: 'Wooden Crates', defaultUnit: 'Crates', suggestedRate: 200 },
  { name: 'Steel Coils / Pipes / Sheets', marathi: 'स्टील कॉइल / पाईप्स', defaultPacking: 'Bundles', defaultUnit: 'MT', suggestedRate: 3500 },
  { name: 'Chemical / Lubricant Drums', marathi: 'केमिकल / ऑइल ड्रम्स', defaultPacking: 'Drums', defaultUnit: 'Drums', suggestedRate: 300 },
  { name: 'Cement / Fertilizer / Sugar Bags', marathi: 'सिमेंट / खत / साखर बॅग्ज', defaultPacking: 'Bags', defaultUnit: 'Bags', suggestedRate: 80 },
  { name: 'Electrical & Hardware Goods', marathi: 'इलेक्ट्रिकल व हार्डवेअर', defaultPacking: 'Boxes', defaultUnit: 'Boxes', suggestedRate: 150 },
  { name: 'Agricultural Produce / Grains', marathi: 'धान्य / कृषी माल', defaultPacking: 'Bags', defaultUnit: 'Bags', suggestedRate: 80 },
  { name: 'Plastic Granules & Products', marathi: 'प्लास्टिक साहित्य', defaultPacking: 'Bags', defaultUnit: 'Bags', suggestedRate: 80 },
  { name: 'Engine Assemblies & Castings', marathi: 'इंजिन ब्लॉक व कास्टिंग', defaultPacking: 'Wooden Crates', defaultUnit: 'Nos', suggestedRate: 50 },
  { name: 'Electronics & Precision Items', marathi: 'इलेक्ट्रॉनिक सुटे भाग', defaultPacking: 'Boxes', defaultUnit: 'Boxes', suggestedRate: 150 },
  { name: 'Fabricated Metal Structures', marathi: 'मेटल फॅब्रिकेशन', defaultPacking: 'Loose / Machinery', defaultUnit: 'MT', suggestedRate: 3500 },
  { name: 'Full Vehicle Load Consignment', marathi: 'पूर्ण गाडी लोड', defaultPacking: 'Loose / Machinery', defaultUnit: 'TRIP', suggestedRate: 4500 },
];


export interface OfficialWebsiteOffice {
  city: string;
  branchCode: string;
  officeName: string;
  address: string;
  phones: string[];
  timing: string;
}

export interface CompanyProfile {
  name: string;
  companyName?: string;
  adminName?: string;
  proprietor?: string;
  tagline: string;
  subTagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  mobile: string;
  phone?: string;
  phoneAlt: string;
  email: string;
  website: string;
  logoUrl: string;
  phonePeQrUrl: string;
  upiId: string;
  operatingHours?: string;
  websiteServices?: string[];
  websiteOffices?: OfficialWebsiteOffice[];
  bankDetails: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
  };
  terms: string[];
  termsConditions?: string;
  unitRates?: Record<string, number>;
}

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  module: string;
  recordId: string;
  timestamp: string;
  details: string;
}

export type SecurityAuditLog = AuditLogItem;

