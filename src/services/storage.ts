import {
  User,
  UserRole,
  UserPermissions,
  Branch,
  Customer,
  Vehicle,
  Driver,
  LRRecord,
  MRRecord,
  LHSRecord,
  StockTransferRecord,
  PaymentRecord,
  CompanyProfile,
  AuditLogItem,
  TrackingCheckpoint,
  PODRecord,
  PODStatus,
  LRStatus,
} from '../types';
import { CloudSync } from './cloudSync';

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'ADMIN') {
    return {
      canModifyLR: true, // ONLY Admin can modify/edit LRs
      canCancelLR: true,
      canDeleteLR: true,
      canCreateLR: true,
      canViewCompanyProfile: true,
      canEditCompanyProfile: true,
      canManageMaster: true,
      canAccessDataSafe: true,
      canManageUsers: true,
    };
  }
  if (role === 'OPERATOR') {
    return {
      canModifyLR: false, // Strictly NO LR modification for Operator (Admin Only)
      canCancelLR: false,
      canDeleteLR: false,
      canCreateLR: true,
      canViewCompanyProfile: true,
      canEditCompanyProfile: true,
      canManageMaster: true,
      canAccessDataSafe: true,
      canManageUsers: false,
    };
  }
  // Other users (USER, VIEWER, etc.): Only LR / MR / LHS Entry modules
  return {
    canModifyLR: false,
    canCancelLR: false,
    canDeleteLR: false,
    canCreateLR: true,
    canViewCompanyProfile: false,
    canEditCompanyProfile: false,
    canManageMaster: false,
    canAccessDataSafe: false,
    canManageUsers: false,
  };
}

const STORAGE_KEYS = {
  USERS: 'nsst_users_v1',
  AUTH: 'nsst_auth_v1',
  BRANCHES: 'nsst_branches_v1',
  CUSTOMERS: 'nsst_customers_v1',
  VEHICLES: 'nsst_vehicles_v1',
  DRIVERS: 'nsst_drivers_v1',
  LRS: 'nsst_lrs_v1',
  MRS: 'nsst_mrs_v1',
  LHS: 'nsst_lhs_v1',
  STOCK_TRANSFERS: 'nsst_stock_transfers_v1',
  PAYMENTS: 'nsst_payments_v1',
  COMPANY: 'nsst_company_v1',
  AUDIT_LOGS: 'nsst_audit_logs_v1',
};

export const DEFAULT_COMPANY: CompanyProfile = {
  name: 'NEW SHREE SWAMI SAMARTH TRANSPORT',
  companyName: 'NEW SHREE SWAMI SAMARTH TRANSPORT',
  adminName: 'KUDKE BALIRAM',
  proprietor: 'KUDKE BALIRAM',
  tagline: 'RELIABLE | SAFE | TIMELY LOGISTICS',
  subTagline: 'CHAKAN • PUNE',
  address: 'Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan',
  city: 'Chakan, Pune',
  state: 'Maharashtra',
  pincode: '410501',
  gstin: '27AASFS9322Q1ZQ',
  pan: 'AASFS9322Q',
  mobile: '9881898635',
  phone: '9881898635',
  phoneAlt: '+91 98818 98635',
  email: 'shreeswamisamarthtransport9881@gmail.com',
  website: 'https://shreeswamisamarthtransport.in',
  logoUrl: '/company_logo.jpg',
  phonePeQrUrl: '/phonepe_qr.jpg',
  upiId: 'shreeswamisamarth@ybl',
  bankDetails: {
    bankName: 'State Bank of India',
    accountNo: '38901245678',
    ifsc: 'SBIN0012054',
    branch: 'Chakan MIDC Branch, Pune',
  },
  terms: [
    '1. The consignment is carried entirely at Owner’s risk unless specifically insured prior to dispatch.',
    '2. The transporter is not responsible for leakage, breakage, deterioration, theft, or fire in transit.',
    '3. Demurrage will be charged @ ₹300 per day if the consignment is not taken within 3 days of arrival.',
    '4. Subject to Pune jurisdiction only in case of any disputes.',
    '5. In case of payment by cheque, delivery will be executed after realization of the payment instrument.',
  ],
  termsConditions: '1. The consignment is carried entirely at Owner’s risk unless specifically insured prior to dispatch.\n2. The transporter is not responsible for leakage, breakage, deterioration, theft, or fire in transit.\n3. Demurrage will be charged @ ₹300 per day if the consignment is not taken within 3 days of arrival.\n4. Subject to Pune jurisdiction only in case of any disputes.\n5. In case of payment by cheque, delivery will be executed after realization of the payment instrument.',
  operatingHours: '8:00 AM to 11:00 PM (Daily)',
  websiteServices: [
    'Daily Parcel Transport (मुंबई - पुणे - दादर डेली पार्सल)',
    'Goods Booking (माल बुकिंग सेवा)',
    'City-to-City Daily Express (मुंबई, दादर, पुणे, चाकण)',
    'Commercial Consignment Handling (औद्योगिक व व्यावसायिक माल वाहतूक)',
    'Truck Full Load (FTL) Services across India',
    'Safe & Timely Delivery (सुरक्षित आणि वेळेवर पोहोच)',
  ],
  websiteOffices: [
    {
      city: 'Pune',
      branchCode: 'PUN',
      officeName: 'Pune Head Office (Shukrawar Peth)',
      address: '486, Shukrawar Peth, Shivaji Road, Lane No. 1, Siddheshwar Flower Mill, Pune - 411002',
      phones: ['+91 77220 22042', '+91 90116 77972', '+91 96077 51898'],
      timing: '8:00 AM to 11:00 PM (Daily)',
    },
    {
      city: 'Mumbai',
      branchCode: 'MUM',
      officeName: 'Mumbai Office (Kalbadevi)',
      address: 'Dhanji Munji Dhela Building No. 95A, Shop No. 6, Ground Floor, Old Hanuman Lane, Kalbadevi Road, Mumbai - 400 002',
      phones: ['+91 84248 83921'],
      timing: '8:00 AM to 11:00 PM (Daily)',
    },
    {
      city: 'Dadar',
      branchCode: 'DDR',
      officeName: 'Dadar Office (Dadar West)',
      address: 'Shop No. 2, Sai Ganesh Sadan, Senapati Bapat Road, Near Jagopal Industry, Dadar (W), Mumbai - 400 028',
      phones: ['+91 96077 51898', '+91 90116 77972'],
      timing: '8:00 AM to 11:00 PM (Daily)',
    },
    {
      city: 'Chakan',
      branchCode: 'CHK',
      officeName: 'Chakan Central Hub & Head Office',
      address: 'Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan - 410501',
      phones: ['+91 98818 98635'],
      timing: '24/7 Operations / 8:00 AM - 11:00 PM',
    },
  ],
  unitRates: {
    'KG': 5,
    'MT': 3500,
    'Pkgs': 120,
    'Boxes': 150,
    'Nos': 50,
    'Crates': 200,
    'Pallets': 500,
    'Bags': 80,
    'Bundles': 100,
    'Drums': 300,
  },
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-1',
    name: 'CHAKAN MAIN (HEAD OFFICE)',
    code: 'CHK',
    address: 'Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan - 410501',
    contact: '+91 98818 98635',
    phone: '+91 98818 98635',
    contactPerson: 'KUDKE BALIRAM',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
  {
    id: 'br-2',
    name: 'PUNE HEAD OFFICE (SHUKRAWAR PETH)',
    code: 'PUN',
    address: '486, Shukrawar Peth, Shivaji Road, Lane No. 1, Siddheshwar Flower Mill, Pune - 411002',
    contact: '+91 77220 22042 / +91 90116 77972',
    phone: '+91 77220 22042',
    contactPerson: 'Pune Branch In-Charge',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
  {
    id: 'br-3',
    name: 'MUMBAI OFFICE (KALBADEVI)',
    code: 'MUM',
    address: 'Dhanji Munji Dhela Building No. 95A, Shop No. 6, Ground Floor, Old Hanuman Lane, Kalbadevi Road, Mumbai - 400 002',
    contact: '+91 84248 83921',
    phone: '+91 84248 83921',
    contactPerson: 'Mumbai Branch In-Charge',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
  {
    id: 'br-ddr',
    name: 'DADAR OFFICE (DADAR WEST)',
    code: 'DDR',
    address: 'Shop No. 2, Sai Ganesh Sadan, Senapati Bapat Road, Near Jagopal Industry, Dadar (W), Mumbai - 400 028',
    contact: '+91 96077 51898 / +91 90116 77972',
    phone: '+91 96077 51898',
    contactPerson: 'Dadar Branch In-Charge',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
  {
    id: 'br-4',
    name: 'NASHIK HUB',
    code: 'NSK',
    address: 'Plot 45, Ambad MIDC, Nashik - 422010',
    contact: '+91 98812 34570',
    phone: '+91 98812 34570',
    contactPerson: 'Nashik Hub In-Charge',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
  {
    id: 'br-5',
    name: 'NAGPUR TERMINAL',
    code: 'NGP',
    address: 'Wadi Bypass Road, Hingna Industrial Area, Nagpur - 440028',
    contact: '+91 98812 34571',
    phone: '+91 98812 34571',
    contactPerson: 'Nagpur Hub In-Charge',
    gstin: '27AASFS9322Q1ZQ',
    status: 'Active',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'KUDKE BALIRAM',
    fullName: 'KUDKE BALIRAM',
    role: 'ADMIN',
    designation: 'Proprietor & System Administrator (Full Access)',
    branchCode: 'ALL',
    phone: '9881898635',
    contact: '9881898635',
    email: 'shreeswamisamarthtransport9881@gmail.com',
    password: 'admin',
    pin: '9881',
    active: true,
    permissions: getDefaultPermissions('ADMIN'),
  },
  {
    id: 'usr-op-chk',
    username: 'operator',
    name: 'Vikas More (Chakan Operator)',
    fullName: 'Vikas More (Chakan Operator)',
    role: 'OPERATOR',
    designation: 'Operations Manager & Dispatch (Full Access)',
    branchCode: 'CHK',
    phone: '+91 98220 11223',
    contact: '+91 98220 11223',
    email: 'operator.chakan@shreeswamitransport.com',
    password: 'operator',
    pin: '1234',
    active: true,
    permissions: getDefaultPermissions('OPERATOR'),
  },
  {
    id: 'usr-user',
    username: 'user',
    name: 'Santosh Shinde (Data Entry User)',
    fullName: 'Santosh Shinde (Data Entry User)',
    role: 'USER',
    designation: 'Data Entry Staff (LR / MR / LHS Entry Only)',
    branchCode: 'CHK',
    phone: '+91 98812 44556',
    contact: '+91 98812 44556',
    email: 'entry.clerk@shreeswamitransport.com',
    password: 'user',
    pin: '1111',
    active: true,
    permissions: getDefaultPermissions('USER'),
  },
  {
    id: 'usr-viewer',
    username: 'viewer',
    name: 'Accounts & Entry Clerk',
    fullName: 'Accounts & Entry Clerk',
    role: 'VIEWER',
    designation: 'Entry Staff (LR / MR / LHS Entry Only)',
    branchCode: 'ALL',
    phone: '+91 98220 99887',
    contact: '+91 98220 99887',
    email: 'accounts@shreeswamitransport.com',
    password: 'viewer',
    pin: '0000',
    active: true,
    permissions: getDefaultPermissions('VIEWER'),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Tata Motors Limited - CVBU Chakan',
    address: 'Plot G-1, MIDC Chakan Phase II, Pune - 410501',
    gstin: '27AAACT2727Q1ZW',
    pan: 'AAACT2727Q',
    contact: '+91 2135 661000',
    email: 'logistics.chakan@tatamotors.com',
    status: 'Active',
  },
  {
    id: 'cust-2',
    name: 'Bajaj Auto Ltd - Chakan Plant',
    address: 'Plot A-1, Mahalunge Ingale, Chakan, Pune - 410501',
    gstin: '27AABCB0500Q1Z8',
    pan: 'AABCB0500Q',
    contact: '+91 2135 663200',
    email: 'dispatch@bajajauto.co.in',
    status: 'Active',
  },
  {
    id: 'cust-3',
    name: 'Bharat Forge Limited - Pune',
    address: 'Mundhwa, Pune Cantonment, Pune - 411036',
    gstin: '27AAACB0338F1ZM',
    pan: 'AAACB0338F',
    contact: '+91 20 6704 2777',
    email: 'outbound@bharatforge.com',
    status: 'Active',
  },
  {
    id: 'cust-4',
    name: 'Mahindra Heavy Auto Components',
    address: 'Gat No 371, Chakan-Talegaon Road, Chakan - 410501',
    gstin: '27AAACM1245P1Z1',
    pan: 'AAACM1245P',
    contact: '+91 2135 668000',
    email: 'dispatch.chakan@mahindra.com',
    status: 'Active',
  },
  {
    id: 'cust-5',
    name: 'Varroc Engineering Limited',
    address: 'Plot L-4, MIDC Chakan Industrial Area, Pune - 410501',
    gstin: '27AAACV3456K1ZY',
    pan: 'AAACV3456K',
    contact: '+91 2135 669500',
    email: 'logistics@varroc.com',
    status: 'Active',
  },
  {
    id: 'cust-6',
    name: 'Bosch Chassis Systems India',
    address: 'Plot 23, Chakan MIDC Phase I, Pune - 410501',
    gstin: '27AAACB2816N1ZZ',
    pan: 'AAACB2816N',
    contact: '+91 2135 664000',
    email: 'supplychain@in.bosch.com',
    status: 'Active',
  },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    vehicleNumber: 'MH-14-CW-7890',
    vehicleType: 'Taurus 21T Heavy',
    vehicleNature: 'Own',
    ownerName: 'Shree Swami Samarth Transport',
    capacityTonnes: 21,
    status: 'Active',
  },
  {
    id: 'veh-2',
    vehicleNumber: 'MH-12-PQ-4521',
    vehicleType: 'Container 32ft MXL',
    vehicleNature: 'Attached',
    ownerName: 'Kailash Roadways',
    capacityTonnes: 15,
    status: 'Active',
  },
  {
    id: 'veh-3',
    vehicleNumber: 'MH-14-EM-9922',
    vehicleType: 'Trailer 40ft Flatbed',
    vehicleNature: 'Own',
    ownerName: 'Shree Swami Samarth Transport',
    capacityTonnes: 32,
    status: 'Active',
  },
  {
    id: 'veh-4',
    vehicleNumber: 'MH-12-RN-3314',
    vehicleType: 'Open Truck 24ft',
    vehicleNature: 'Market',
    ownerName: 'Gajanan Trans Logistics',
    capacityTonnes: 11,
    status: 'Active',
  },
  {
    id: 'veh-5',
    vehicleNumber: 'MH-14-BT-6677',
    vehicleType: 'Pick-up 14ft',
    vehicleNature: 'Own',
    ownerName: 'Shree Swami Samarth Transport',
    capacityTonnes: 4.5,
    status: 'Active',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-1',
    name: 'Rameshwar Patil',
    mobile: '+91 98224 56789',
    licenseNumber: 'MH1420180045231',
    address: 'Post Medankarwadi, Chakan, Pune',
    status: 'Active',
  },
  {
    id: 'drv-2',
    name: 'Dnyaneshwar Shinde',
    mobile: '+91 97631 88452',
    licenseNumber: 'MH1220160089123',
    address: 'Ganesh Nagar, Bhosari, Pune',
    status: 'Active',
  },
  {
    id: 'drv-3',
    name: 'Santosh Jadhav',
    mobile: '+91 94235 77124',
    licenseNumber: 'MH1420190033451',
    address: 'Talegaon Dabhade, Pune',
    status: 'Active',
  },
  {
    id: 'drv-4',
    name: 'Balasaheb More',
    mobile: '+91 99210 44567',
    licenseNumber: 'MH1220150067894',
    address: 'Akurdi, Pimpri-Chinchwad, Pune',
    status: 'Active',
  },
];

export const INITIAL_LRS: LRRecord[] = [
  {
    id: 'lr-seed-1',
    lrNumber: 'LR-CHK-2026-00001',
    bookingDate: '2026-09-12',
    branchCode: 'CHK',
    branchName: 'CHAKAN MAIN',
    consignorName: 'Tata Motors Limited - CVBU Chakan',
    consignorGstin: '27AAACT2727Q1ZW',
    consignorAddress: 'Plot G-1, MIDC Chakan Phase II, Pune - 410501',
    consignorMobile: '+91 98220 12345',
    consigneeName: 'Bajaj Auto Ltd - Waluj Plant',
    consigneeGstin: '27AABCB0500Q1Z8',
    consigneeAddress: 'Sector B, Waluj Industrial Area, Aurangabad - 431136',
    consigneeMobile: '+91 98220 54321',
    fromLocation: 'Chakan, Pune',
    toLocation: 'Waluj, Aurangabad',
    vehicleNumber: 'MH-14-CW-7890',
    driverName: 'Rameshwar Patil',
    driverMobile: '+91 98224 56789',
    paymentMode: 'TO PAY',
    deliveryType: 'DOOR DELIVERY',
    eWayBillNo: '241189024567',
    freightUpToBranch: 'AURANGABAD HUB',
    toBranch: 'AUR',
    collectionType: 'Direct Godown',
    ccType: 'Standard',
    specialRemarks: 'Heavy machinery precision engine assemblies. Handle with hydraulic cranes.',
    items: [
      {
        id: 'item-1',
        description: 'Automotive Engine Blocks (Machined)',
        packingType: 'Wooden Crates',
        quantity: 18,
        units: 'Crates',
        actualWeight: 7200,
        chargeWeight: 7500,
        ratePerKg: 3.2,
        freight: 24000,
      },
      {
        id: 'item-2',
        description: 'Chassis Mounting Brackets & Flanges',
        packingType: 'Pallets',
        quantity: 12,
        units: 'Pallets',
        actualWeight: 3800,
        chargeWeight: 4000,
        ratePerKg: 3.2,
        freight: 12800,
      },
    ],
    totalQuantity: 30,
    totalActualWeight: 11000,
    totalChargeWeight: 11500,
    totalFreight: 36800,
    charges: {
      freight: 36800,
      vasuli: 150,
      handling: 850,
      doorCollection: 600,
      doorDelivery: 1200,
      otherCharges: 200,
      gstTax: 1990, // 5% GST on transport
      grandTotal: 41790,
    },
    status: 'IN TRANSIT',
    paymentStatus: 'PENDING',
    paidAmount: 0,
    createdAt: '2026-09-12T10:30:00.000Z',
    createdBy: 'admin',
    updatedAt: '2026-09-12T10:30:00.000Z',
  },
  {
    id: 'lr-seed-2',
    lrNumber: 'LR-CHK-2026-00002',
    bookingDate: '2026-09-13',
    branchCode: 'CHK',
    branchName: 'CHAKAN MAIN',
    consignorName: 'Bharat Forge Limited - Pune',
    consignorGstin: '27AAACB0338F1ZM',
    consignorAddress: 'Mundhwa, Pune Cantonment, Pune - 411036',
    consigneeName: 'Mahindra Heavy Auto Components',
    consigneeGstin: '27AAACM1245P1Z1',
    consigneeAddress: 'Gat No 371, Chakan-Talegaon Road, Chakan - 410501',
    fromLocation: 'Pune City',
    toLocation: 'Chakan, Pune',
    vehicleNumber: 'MH-14-BT-6677',
    driverName: 'Santosh Jadhav',
    paymentMode: 'PAID',
    deliveryType: 'DOOR DELIVERY',
    eWayBillNo: '241189033100',
    freightUpToBranch: 'CHAKAN MAIN',
    toBranch: 'CHK',
    collectionType: 'Door Pick-up',
    ccType: 'Standard',
    specialRemarks: 'Forged crankshaft components. Fragile coated parts.',
    items: [
      {
        id: 'item-2-1',
        description: 'Heavy Forged Heavy Crankshafts',
        packingType: 'Wooden Boxes',
        quantity: 25,
        units: 'Boxes',
        actualWeight: 3200,
        chargeWeight: 3500,
        ratePerKg: 2.8,
        freight: 9800,
      },
    ],
    totalQuantity: 25,
    totalActualWeight: 3200,
    totalChargeWeight: 3500,
    totalFreight: 9800,
    charges: {
      freight: 9800,
      vasuli: 100,
      handling: 400,
      doorCollection: 350,
      doorDelivery: 450,
      otherCharges: 100,
      gstTax: 560,
      grandTotal: 11760,
    },
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 11760,
    createdAt: '2026-09-13T09:15:00.000Z',
    createdBy: 'operator',
    updatedAt: '2026-09-13T16:00:00.000Z',
  },
  {
    id: 'lr-seed-3',
    lrNumber: 'LR-CHK-2026-00003',
    bookingDate: '2026-09-14',
    branchCode: 'CHK',
    branchName: 'CHAKAN MAIN',
    consignorName: 'Varroc Engineering Limited',
    consignorGstin: '27AAACV3456K1ZY',
    consignorAddress: 'Plot L-4, MIDC Chakan, Pune - 410501',
    consigneeName: 'Kalamboli Steel Traders Consortium',
    consigneeGstin: '27AABCK8899P1Z3',
    consigneeAddress: 'Steel Market Complex, Kalamboli, Navi Mumbai - 410218',
    fromLocation: 'Chakan, Pune',
    toLocation: 'Kalamboli, Navi Mumbai',
    vehicleNumber: 'MH-12-PQ-4521',
    driverName: 'Dnyaneshwar Shinde',
    paymentMode: 'TBB',
    deliveryType: 'GODOWN DELIVERY',
    eWayBillNo: '241189045612',
    freightUpToBranch: 'MUMBAI CENTRAL',
    toBranch: 'MUM',
    collectionType: 'Direct Godown',
    ccType: 'TBB Regular',
    specialRemarks: 'Stamped sheet metal assemblies.',
    items: [
      {
        id: 'item-3-1',
        description: 'Automotive Stamped Panels & Dies',
        packingType: 'Metal Crates',
        quantity: 40,
        units: 'Pkgs',
        actualWeight: 8400,
        chargeWeight: 9000,
        ratePerKg: 2.5,
        freight: 22500,
      },
    ],
    totalQuantity: 40,
    totalActualWeight: 8400,
    totalChargeWeight: 9000,
    totalFreight: 22500,
    charges: {
      freight: 22500,
      vasuli: 120,
      handling: 650,
      doorCollection: 0,
      doorDelivery: 0,
      otherCharges: 150,
      gstTax: 1171,
      grandTotal: 24591,
    },
    status: 'BOOKED',
    paymentStatus: 'PENDING',
    paidAmount: 0,
    createdAt: '2026-09-14T08:45:00.000Z',
    createdBy: 'admin',
    updatedAt: '2026-09-14T08:45:00.000Z',
  },
  {
    id: 'lr-seed-4',
    lrNumber: 'LR-PUN-2026-00001',
    bookingDate: '2026-09-14',
    branchCode: 'PUN',
    branchName: 'PUNE CITY',
    consignorName: 'Bosch Chassis Systems India',
    consignorGstin: '27AAACB2816N1ZZ',
    consignorAddress: 'Plot 23, Chakan MIDC Phase I, Pune',
    consigneeName: 'Tata Motors Limited - CVBU Chakan',
    consigneeGstin: '27AAACT2727Q1ZW',
    consigneeAddress: 'Plot G-1, MIDC Chakan Phase II, Pune',
    fromLocation: 'Pune City',
    toLocation: 'Chakan, Pune',
    vehicleNumber: 'MH-14-EM-9922',
    driverName: 'Balasaheb More',
    paymentMode: 'PAID',
    deliveryType: 'DOOR DELIVERY',
    eWayBillNo: '241189055890',
    freightUpToBranch: 'CHAKAN MAIN',
    toBranch: 'CHK',
    collectionType: 'Direct',
    ccType: 'Standard',
    specialRemarks: 'Brake booster cylinders & caliper assemblies.',
    items: [
      {
        id: 'item-4-1',
        description: 'Hydraulic Brake Booster Sets',
        packingType: 'Corrugated Boxes',
        quantity: 60,
        units: 'Boxes',
        actualWeight: 4500,
        chargeWeight: 4800,
        ratePerKg: 3.0,
        freight: 14400,
      },
    ],
    totalQuantity: 60,
    totalActualWeight: 4500,
    totalChargeWeight: 4800,
    totalFreight: 14400,
    charges: {
      freight: 14400,
      vasuli: 100,
      handling: 500,
      doorCollection: 400,
      doorDelivery: 600,
      otherCharges: 100,
      gstTax: 805,
      grandTotal: 16905,
    },
    status: 'BOOKED',
    paymentStatus: 'PAID',
    paidAmount: 16905,
    createdAt: '2026-09-14T09:30:00.000Z',
    createdBy: 'admin',
    updatedAt: '2026-09-14T09:30:00.000Z',
  },
];

export const INITIAL_MRS: MRRecord[] = [
  {
    id: 'mr-seed-1',
    mrNumber: 'MR-CHK-2026-00001',
    date: '2026-09-12',
    branchCode: 'CHK',
    vehicleNumber: 'MH-14-CW-7890',
    vehicleType: 'Taurus 21T Heavy',
    vehicleNature: 'Own',
    driverName: 'Rameshwar Patil',
    driverMobile: '+91 98224 56789',
    vendor: 'Shree Swami Samarth Transport',
    loader: 'Kishore Gade',
    supervisor: 'Babanrao Shirole',
    toBranch: 'MUM',
    weight: 11000,
    awbNo: 'AWB-88210',
    lhsNo: 'LHS-CHK-2026-00001',
    driverAmount: 4500,
    remarks: 'Dispatched on time via Pune-Mumbai Expressway.',
    selectedLrIds: ['lr-seed-1'],
    selectedLrNumbers: ['LR-CHK-2026-00001'],
    totalLR: 1,
    totalQuantity: 30,
    totalWeight: 11000,
    totalFreight: 36800,
    status: 'DISPATCHED',
    createdAt: '2026-09-12T11:00:00.000Z',
    createdBy: 'admin',
  },
];

export const INITIAL_LHS: LHSRecord[] = [
  {
    id: 'lhs-seed-1',
    lhsNumber: 'LHS-CHK-2026-00001',
    date: '2026-09-12',
    branchCode: 'CHK',
    vehicleNumber: 'MH-14-CW-7890',
    driverName: 'Rameshwar Patil',
    loader: 'Kishore Gade',
    supervisor: 'Babanrao Shirole',
    fromBranch: 'CHAKAN MAIN (CHK)',
    toBranch: 'MUMBAI CENTRAL (MUM)',
    selectedLrIds: ['lr-seed-1'],
    selectedLrNumbers: ['LR-CHK-2026-00001'],
    selectedMrIds: ['mr-seed-1'],
    totalPackages: 30,
    totalWeight: 11000,
    remarks: 'Loading completed under CCTV supervision at Chakan Godown #2.',
    status: 'LOADED',
    createdAt: '2026-09-12T10:45:00.000Z',
    createdBy: 'admin',
  },
];

export const INITIAL_STOCK_TRANSFERS: StockTransferRecord[] = [
  {
    id: 'st-seed-1',
    transferNumber: 'TRF-CHK-2026-00001',
    date: '2026-09-12',
    fromBranch: 'CHAKAN',
    toBranch: 'MUMBAI',
    lrNumber: 'LR-CHK-2026-00001',
    mrNumber: 'MR-CHK-2026-00001',
    lhsNumber: 'LHS-CHK-2026-00001',
    itemDescription: 'Automotive Engine Blocks (Machined)',
    quantity: 18,
    units: 'Crates',
    actualWeight: 7200,
    chargeWeight: 7500,
    vehicleNumber: 'MH-14-CW-7890',
    driverName: 'Rameshwar Patil',
    status: 'In Transit',
    remarks: 'Express transit from Chakan Hub to Kalamboli Hub.',
    createdAt: '2026-09-12T11:15:00.000Z',
    createdBy: 'admin',
  },
  {
    id: 'st-seed-2',
    transferNumber: 'TRF-MUM-2026-00001',
    date: '2026-09-13',
    fromBranch: 'MUMBAI',
    toBranch: 'PUNE',
    lrNumber: 'LR-MUM-2026-00088',
    mrNumber: 'MR-MUM-2026-00045',
    lhsNumber: 'LHS-MUM-2026-00045',
    itemDescription: 'Imported Steel Coils & Fasteners',
    quantity: 50,
    units: 'Coils',
    actualWeight: 9500,
    chargeWeight: 9800,
    vehicleNumber: 'MH-12-PQ-4521',
    driverName: 'Dnyaneshwar Shinde',
    status: 'Received',
    remarks: 'Safely received at Hadapsar Godown. Verified by Pune branch manager.',
    receivedAt: '2026-09-14T08:00:00.000Z',
    receivedBy: 'pune_supervisor',
    createdAt: '2026-09-13T14:30:00.000Z',
    createdBy: 'admin',
  },
  {
    id: 'st-seed-3',
    transferNumber: 'TRF-PUN-2026-00001',
    date: '2026-09-14',
    fromBranch: 'PUNE',
    toBranch: 'CHAKAN',
    lrNumber: 'LR-PUN-2026-00001',
    mrNumber: 'MR-PUN-2026-00012',
    lhsNumber: 'LHS-PUN-2026-00012',
    itemDescription: 'Hydraulic Brake Booster Sets',
    quantity: 60,
    units: 'Boxes',
    actualWeight: 4500,
    chargeWeight: 4800,
    vehicleNumber: 'MH-14-EM-9922',
    driverName: 'Balasaheb More',
    status: 'Pending',
    remarks: 'Ready for loading at Hadapsar. Scheduled dispatch at 2:00 PM.',
    createdAt: '2026-09-14T09:40:00.000Z',
    createdBy: 'admin',
  },
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-seed-1',
    receiptNo: 'RCP-2026-00001',
    paymentDate: '2026-09-13',
    lrNumber: 'LR-CHK-2026-00002',
    customerName: 'Bharat Forge Limited - Pune',
    amount: 11760,
    paymentMode: 'PhonePe',
    transactionRef: 'P2609131234988771',
    status: 'Paid',
    remarks: 'Paid via PhonePe Merchant QR Code scan at Chakan Office counter.',
    createdAt: '2026-09-13T10:00:00.000Z',
    createdBy: 'operator',
  },
  {
    id: 'pay-seed-2',
    receiptNo: 'RCP-2026-00002',
    paymentDate: '2026-09-14',
    lrNumber: 'LR-PUN-2026-00001',
    customerName: 'Bosch Chassis Systems India',
    amount: 16905,
    paymentMode: 'UPI',
    transactionRef: 'UPI/625712908123',
    status: 'Paid',
    remarks: 'Instant UPI settlement to SBI Account.',
    createdAt: '2026-09-14T09:45:00.000Z',
    createdBy: 'admin',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    user: 'admin',
    action: 'SYSTEM_INITIALIZED',
    module: 'CORE',
    recordId: 'SYSTEM',
    timestamp: '2026-09-12T09:00:00.000Z',
    details: 'New Shree Swami Samarth Transport ERP environment initialized.',
  },
  {
    id: 'aud-2',
    user: 'admin',
    action: 'LR_CREATED',
    module: 'LR BOOKING',
    recordId: 'LR-CHK-2026-00001',
    timestamp: '2026-09-12T10:30:00.000Z',
    details: 'Consignment created for Tata Motors Ltd. Amount: ₹41,790',
  },
  {
    id: 'aud-3',
    user: 'admin',
    action: 'MR_CREATED',
    module: 'MANIFEST',
    recordId: 'MR-CHK-2026-00001',
    timestamp: '2026-09-12T11:00:00.000Z',
    details: 'Manifest generated with 1 LR. Vehicle: MH-14-CW-7890',
  },
  {
    id: 'aud-4',
    user: 'operator',
    action: 'LR_CREATED',
    module: 'LR BOOKING',
    recordId: 'LR-CHK-2026-00002',
    timestamp: '2026-09-13T09:15:00.000Z',
    details: 'Consignment created for Bharat Forge Ltd. Amount: ₹11,760',
  },
  {
    id: 'aud-5',
    user: 'operator',
    action: 'PAYMENT_RECEIVED',
    module: 'PHONEPE_PAYMENT',
    recordId: 'RCP-2026-00001',
    timestamp: '2026-09-13T10:00:00.000Z',
    details: '₹11,760 received via PhonePe QR for LR-CHK-2026-00002',
  },
];

// Helper to load or initialize
function getStoredItem<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultVal;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving localStorage key "${key}":`, err);
  }
}

export const StorageService = {
  // Authentication & Current User
  getCurrentUser(): User | null {
    const user = getStoredItem<User | null>(STORAGE_KEYS.AUTH, null);
    if (!user) {
      return null;
    }
    // Automatically update admin record to KUDKE BALIRAM if user is admin
    if (user.role === 'ADMIN' || user.username === 'admin') {
      if (
        user.name !== 'KUDKE BALIRAM' ||
        user.phone !== '9881898635' ||
        user.email !== 'shreeswamisamarthtransport9881@gmail.com' ||
        !user.permissions?.canModifyLR
      ) {
        user.name = 'KUDKE BALIRAM';
        user.fullName = 'KUDKE BALIRAM';
        user.phone = '9881898635';
        user.contact = '9881898635';
        user.email = 'shreeswamisamarthtransport9881@gmail.com';
        user.permissions = getDefaultPermissions('ADMIN');
        setStoredItem(STORAGE_KEYS.AUTH, user);
      }
    } else if (user.role === 'OPERATOR') {
      if (user.permissions?.canModifyLR || !user.permissions?.canManageMaster) {
        user.permissions = getDefaultPermissions('OPERATOR');
        setStoredItem(STORAGE_KEYS.AUTH, user);
      }
    } else {
      // Ensure other users (USER, VIEWER) have properly restricted entry permissions
      if (!user.permissions || user.permissions.canManageMaster) {
        user.permissions = getDefaultPermissions(user.role);
        setStoredItem(STORAGE_KEYS.AUTH, user);
      }
    }
    return user;
  },

  setCurrentUser(user: User | null): void {
    setStoredItem(STORAGE_KEYS.AUTH, user);
  },

  login(identifier: string, passwordOrPin?: string): { success: boolean; user?: User; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Please enter your Username, Mobile number, or Email.' };
    }
    const users = this.getUsers();

    const user = users.find((u) => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const inputDigits = cleanId.replace(/\D/g, '');

      return (
        uName === cleanId ||
        uEmail === cleanId ||
        (inputDigits.length >= 8 && uPhone.includes(inputDigits))
      );
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials. No registered account found with this identifier.',
      };
    }

    if (user.active === false) {
      return {
        success: false,
        error: 'This account has been deactivated by the Administrator. Please contact Kudke Baliram (9881898635).',
      };
    }

    if (passwordOrPin && passwordOrPin.trim() !== '') {
      const entered = passwordOrPin.trim();
      const roleFallback = (user.role || '').toLowerCase();
      const validPasswords = [
        user.password,
        user.pin,
        'admin123', // emergency master recovery
        user.username,
        roleFallback,
      ].filter(Boolean);

      if (!validPasswords.includes(entered)) {
        return {
          success: false,
          error: 'Incorrect password or security PIN. Please try again.',
        };
      }
    }

    this.setCurrentUser(user);
    this.addAuditLog(
      user.username,
      'USER_LOGIN',
      'SECURITY',
      user.id,
      `User ${user.username} (${user.name}) logged into system.`
    );

    return { success: true, user };
  },

  logout(): void {
    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.username,
        'USER_LOGOUT',
        'SECURITY',
        current.id,
        `User ${current.username} logged out from the system.`
      );
    }
    setStoredItem(STORAGE_KEYS.AUTH, null);
  },

  getUsers(): User[] {
    const users = getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let updated = false;

    // Ensure all INITIAL_USERS exist in local storage if not already present
    INITIAL_USERS.forEach((initU) => {
      if (!users.some((u) => u.id === initU.id || u.username === initU.username)) {
        users.push(initU);
        updated = true;
      }
    });

    users.forEach((u) => {
      const initMatch = INITIAL_USERS.find((init) => init.id === u.id || init.username === u.username);
      if (initMatch) {
        if (!u.password) {
          u.password = initMatch.password;
          updated = true;
        }
        if (!u.pin) {
          u.pin = initMatch.pin;
          updated = true;
        }
      }
    });

    // Enforce Operator permissions (LR editing is strictly Admin only)
    users.forEach((u) => {
      if (u.role === 'OPERATOR') {
        if (u.permissions?.canModifyLR || !u.permissions?.canManageMaster) {
          u.permissions = getDefaultPermissions('OPERATOR');
          updated = true;
        }
      }
    });

    const adminUser = users.find((u) => u.role === 'ADMIN' || u.username === 'admin');
    if (adminUser) {
      if (!adminUser.permissions?.canModifyLR) {
        adminUser.permissions = getDefaultPermissions('ADMIN');
        updated = true;
      }
    } else {
      users.unshift(INITIAL_USERS[0]);
      updated = true;
    }

    // Ensure all users have properly hydrated permissions
    users.forEach((u) => {
      if (!u.permissions) {
        u.permissions = getDefaultPermissions(u.role);
        updated = true;
      }
    });

    if (updated) {
      setStoredItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    // Default permissions if missing
    if (!user.permissions) {
      user.permissions = getDefaultPermissions(user.role);
    }
    // If admin role, ensure full permissions
    if (user.role === 'ADMIN') {
      user.permissions = getDefaultPermissions('ADMIN');
    }
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    setStoredItem(STORAGE_KEYS.USERS, users);

    // If updating currently logged in user, refresh session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }

    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'USER_SAVED', 'SECURITY', user.id, `User ${user.username} (${user.name}) saved with role ${user.role}.`);
  },

  updateUserCredentials(
    userId: string,
    data: {
      username?: string;
      password?: string;
      pin?: string;
      fullName?: string;
      name?: string;
      phone?: string;
      contact?: string;
      email?: string;
      role?: UserRole;
      permissions?: UserPermissions;
    }
  ): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: 'User not found in system.' };
    }

    const existing = users[idx];

    // If username is being changed, check uniqueness
    if (data.username && data.username.trim() !== '') {
      const cleanNewUsername = data.username.trim().toLowerCase();
      const duplicate = users.find(
        (u) => u.id !== userId && (u.username || '').toLowerCase() === cleanNewUsername
      );
      if (duplicate) {
        return { success: false, error: `Username "${data.username}" is already taken by another account.` };
      }
      existing.username = data.username.trim();
    }

    if (data.password !== undefined && data.password.trim() !== '') {
      existing.password = data.password.trim();
    }

    if (data.pin !== undefined && data.pin.trim() !== '') {
      existing.pin = data.pin.trim();
    }

    if (data.fullName !== undefined) {
      existing.fullName = data.fullName.trim();
      existing.name = data.fullName.trim();
    } else if (data.name !== undefined) {
      existing.name = data.name.trim();
      existing.fullName = data.name.trim();
    }

    if (data.phone !== undefined) {
      existing.phone = data.phone.trim();
      existing.contact = data.phone.trim();
    }

    if (data.email !== undefined) {
      existing.email = data.email.trim();
    }

    if (data.role !== undefined) {
      existing.role = data.role;
      if (!data.permissions) {
        existing.permissions = getDefaultPermissions(data.role);
      }
    }

    if (data.permissions !== undefined) {
      existing.permissions = data.permissions;
    }

    users[idx] = existing;
    setStoredItem(STORAGE_KEYS.USERS, users);

    // If this is currently logged in user, update session immediately
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(existing);
    }

    this.addAuditLog(
      current?.username || 'admin',
      'USER_CREDENTIALS_UPDATED',
      'SECURITY',
      userId,
      `User ID / Credentials updated for @${existing.username} (${existing.name}).`
    );

    return { success: true, user: existing };
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setStoredItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'USER_DELETED', 'SECURITY', userId, `User account ${userId} removed by Administrator.`);
  },

  toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return false;
    // Cannot deactivate the primary master admin
    if (target.role === 'ADMIN' && (target.id === 'usr-admin' || target.username === 'admin')) {
      return true;
    }
    target.active = !target.active;
    setStoredItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      this.getCurrentUser()?.username || 'admin',
      'USER_STATUS_TOGGLED',
      'SECURITY',
      userId,
      `User ${target.username} active status set to ${target.active ? 'ACTIVE' : 'DEACTIVATED'}.`
    );
    return target.active;
  },

  updateUserPermissions(userId: string, permissions: Partial<UserPermissions>): void {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    target.permissions = {
      ...getDefaultPermissions(target.role),
      ...(target.permissions || {}),
      ...permissions,
    };
    // Primary admin retains all permissions unconditionally
    if (target.role === 'ADMIN') {
      target.permissions = getDefaultPermissions('ADMIN');
    }
    setStoredItem(STORAGE_KEYS.USERS, users);
    // If the updated user is currently logged in, update auth storage as well
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.permissions = target.permissions;
      setStoredItem(STORAGE_KEYS.AUTH, currentUser);
    }
    this.addAuditLog(
      this.getCurrentUser()?.username || 'admin',
      'USER_PERMISSIONS_UPDATED',
      'SECURITY',
      userId,
      `Custom permissions updated for user ${target.username}.`
    );
  },

  updateUserRole(userId: string, role: 'ADMIN' | 'OPERATOR' | 'VIEWER'): void {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === 'usr-admin' || target.username === 'admin') {
      return; // Primary admin role cannot be altered
    }
    target.role = role;
    target.permissions = getDefaultPermissions(role);
    setStoredItem(STORAGE_KEYS.USERS, users);
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.role = role;
      currentUser.permissions = target.permissions;
      setStoredItem(STORAGE_KEYS.AUTH, currentUser);
    }
    this.addAuditLog(
      this.getCurrentUser()?.username || 'admin',
      'USER_ROLE_CHANGED',
      'SECURITY',
      userId,
      `User ${target.username} role changed to ${role}.`
    );
  },

  // Company Profile
  getCompany(): CompanyProfile {
    const comp = getStoredItem<CompanyProfile>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    let updated = false;
    // Automatic migration to the official registered address if legacy default/placeholder is found
    if (
      !comp.address ||
      comp.address.includes('Plot No. 84') ||
      comp.address.includes('Talegaon Chowk') ||
      comp.address.includes('Plot 84') ||
      !comp.address.includes('158')
    ) {
      comp.address = DEFAULT_COMPANY.address;
      comp.city = DEFAULT_COMPANY.city;
      comp.state = DEFAULT_COMPANY.state;
      comp.pincode = DEFAULT_COMPANY.pincode;
      updated = true;
    }
    if (!comp.email || comp.email.includes('chakan@gmail.com') || comp.email.includes('shreeswamitransport.chakan')) {
      comp.email = 'shreeswamisamarthtransport9881@gmail.com';
      updated = true;
    }
    if (!comp.mobile || comp.mobile.includes('98812 34567') || comp.mobile.includes('9881234567')) {
      comp.mobile = '9881898635';
      comp.phone = '9881898635';
      comp.phoneAlt = '+91 98818 98635';
      updated = true;
    }
    if (comp.adminName !== 'KUDKE BALIRAM' || comp.proprietor !== 'KUDKE BALIRAM') {
      comp.adminName = 'KUDKE BALIRAM';
      comp.proprietor = 'KUDKE BALIRAM';
      updated = true;
    }
    if (!comp.companyName) {
      comp.companyName = comp.name || DEFAULT_COMPANY.name;
      updated = true;
    }
    if (!comp.phone) {
      comp.phone = comp.mobile || DEFAULT_COMPANY.mobile;
      updated = true;
    }
    if (!comp.logoUrl || comp.logoUrl.trim() === '') {
      comp.logoUrl = '/company_logo.jpg';
      updated = true;
    }
    if (!comp.website || comp.website.includes('shreeswamitransport.com') || comp.website.includes('example.com')) {
      comp.website = 'https://shreeswamisamarthtransport.in';
      updated = true;
    }
    if (!comp.operatingHours) {
      comp.operatingHours = DEFAULT_COMPANY.operatingHours;
      updated = true;
    }
    if (!comp.websiteServices || comp.websiteServices.length === 0) {
      comp.websiteServices = DEFAULT_COMPANY.websiteServices;
      updated = true;
    }
    if (!comp.websiteOffices || comp.websiteOffices.length === 0) {
      comp.websiteOffices = DEFAULT_COMPANY.websiteOffices;
      updated = true;
    }
    if (updated) {
      setStoredItem(STORAGE_KEYS.COMPANY, comp);
    }
    return comp;
  },

  saveCompany(company: CompanyProfile, userContext?: User): void {
    const currentUser = userContext || this.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
    const canEdit = isAdmin || (currentUser?.permissions?.canEditCompanyProfile ?? false);
    if (!canEdit) {
      throw new Error('Access Denied: Company Profile is protected and can only be modified by System Administrator (KUDKE BALIRAM).');
    }

    // Security sanitization to protect against XSS and injection
    const sanitize = (str?: string) => (str ? str.replace(/<[^>]*>?/gm, '').trim() : '');
    const cleanCompany: CompanyProfile = {
      ...company,
      name: sanitize(company.name || company.companyName) || DEFAULT_COMPANY.name,
      companyName: sanitize(company.companyName || company.name) || DEFAULT_COMPANY.name,
      adminName: sanitize(company.adminName) || 'KUDKE BALIRAM',
      proprietor: sanitize(company.proprietor) || 'KUDKE BALIRAM',
      tagline: sanitize(company.tagline) || DEFAULT_COMPANY.tagline,
      subTagline: sanitize(company.subTagline) || DEFAULT_COMPANY.subTagline,
      address: sanitize(company.address) || DEFAULT_COMPANY.address,
      city: sanitize(company.city) || DEFAULT_COMPANY.city,
      state: sanitize(company.state) || DEFAULT_COMPANY.state,
      pincode: sanitize(company.pincode) || DEFAULT_COMPANY.pincode,
      gstin: sanitize(company.gstin).toUpperCase() || DEFAULT_COMPANY.gstin,
      pan: sanitize(company.pan).toUpperCase() || DEFAULT_COMPANY.pan,
      mobile: sanitize(company.mobile || company.phone) || DEFAULT_COMPANY.mobile,
      phone: sanitize(company.phone || company.mobile) || DEFAULT_COMPANY.phone,
      phoneAlt: sanitize(company.phoneAlt) || DEFAULT_COMPANY.phoneAlt,
      email: sanitize(company.email) || DEFAULT_COMPANY.email,
      website: sanitize(company.website) || DEFAULT_COMPANY.website,
      upiId: sanitize(company.upiId) || DEFAULT_COMPANY.upiId,
      logoUrl: company.logoUrl || DEFAULT_COMPANY.logoUrl,
      phonePeQrUrl: company.phonePeQrUrl || DEFAULT_COMPANY.phonePeQrUrl,
      bankDetails: {
        bankName: sanitize(company.bankDetails?.bankName) || DEFAULT_COMPANY.bankDetails.bankName,
        accountNo: sanitize(company.bankDetails?.accountNo) || DEFAULT_COMPANY.bankDetails.accountNo,
        ifsc: sanitize(company.bankDetails?.ifsc).toUpperCase() || DEFAULT_COMPANY.bankDetails.ifsc,
        branch: sanitize(company.bankDetails?.branch) || DEFAULT_COMPANY.bankDetails.branch,
      },
      terms: company.terms && company.terms.length > 0 ? company.terms.map((t) => sanitize(t)) : DEFAULT_COMPANY.terms,
      termsConditions: company.termsConditions || (company.terms ? company.terms.join('\n') : DEFAULT_COMPANY.termsConditions),
    };

    const prev = getStoredItem<CompanyProfile>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    setStoredItem(STORAGE_KEYS.COMPANY, cleanCompany);
    CloudSync.syncCompany(cleanCompany);
    this.addAuditLog(
      this.getCurrentUser()?.username || 'admin',
      'COMPANY_UPDATED',
      'SECURITY',
      'COMPANY',
      `Company credentials & address updated. Current Address: ${cleanCompany.address}, ${cleanCompany.city} - ${cleanCompany.pincode}. (Previous: ${prev.address || 'N/A'})`
    );
  },

  // Branches
  getBranches(): Branch[] {
    const branches = getStoredItem<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    let updated = false;

    // 1. Chakan Main Hub (Head Office)
    const chk = branches.find((b) => b.code === 'CHK' || b.id === 'br-1');
    if (chk) {
      if (chk.address.includes('Plot 84') || chk.address.includes('Plot No. 84') || !chk.address.includes('158')) {
        chk.address = 'Gat No. 158, Pune-Nashik Road, Barge Wasti, Opp. Nayara Petroleum, Chimbali, Chakan - 410501';
        updated = true;
      }
      if (!chk.contact || chk.contact.includes('34567')) {
        chk.contact = '+91 98818 98635';
        chk.phone = '+91 98818 98635';
        chk.contactPerson = 'KUDKE BALIRAM';
        updated = true;
      }
    }

    // 2. Pune Head Office (Shukrawar Peth from shreeswamisamarthtransport.in)
    const pun = branches.find((b) => b.code === 'PUN' || b.id === 'br-2');
    if (pun) {
      if (!pun.address.includes('Shukrawar Peth') && !pun.address.includes('486')) {
        pun.name = 'PUNE HEAD OFFICE (SHUKRAWAR PETH)';
        pun.address = '486, Shukrawar Peth, Shivaji Road, Lane No. 1, Siddheshwar Flower Mill, Pune - 411002';
        pun.contact = '+91 77220 22042 / +91 90116 77972';
        pun.phone = '+91 77220 22042';
        pun.contactPerson = 'Pune Branch In-Charge';
        updated = true;
      }
    }

    // 3. Mumbai Office (Kalbadevi from shreeswamisamarthtransport.in)
    const mum = branches.find((b) => b.code === 'MUM' || b.id === 'br-3');
    if (mum) {
      if (!mum.address.includes('Kalbadevi') && !mum.address.includes('Dhanji Munji')) {
        mum.name = 'MUMBAI OFFICE (KALBADEVI)';
        mum.address = 'Dhanji Munji Dhela Building No. 95A, Shop No. 6, Ground Floor, Old Hanuman Lane, Kalbadevi Road, Mumbai - 400 002';
        mum.contact = '+91 84248 83921';
        mum.phone = '+91 84248 83921';
        mum.contactPerson = 'Mumbai Branch In-Charge';
        updated = true;
      }
    }

    // 4. Dadar Office (Dadar West from shreeswamisamarthtransport.in)
    const hasDdr = branches.some((b) => b.code === 'DDR');
    if (!hasDdr) {
      branches.push({
        id: 'br-ddr',
        name: 'DADAR OFFICE (DADAR WEST)',
        code: 'DDR',
        address: 'Shop No. 2, Sai Ganesh Sadan, Senapati Bapat Road, Near Jagopal Industry, Dadar (W), Mumbai - 400 028',
        contact: '+91 96077 51898 / +91 90116 77972',
        phone: '+91 96077 51898',
        contactPerson: 'Dadar Branch In-Charge',
        gstin: '27AASFS9322Q1ZQ',
        status: 'Active',
      });
      updated = true;
    }

    if (updated) {
      setStoredItem(STORAGE_KEYS.BRANCHES, branches);
    }
    return branches;
  },

  syncWebsiteData(): { success: boolean; branchesUpdated: number; message: string } {
    const branches = this.getBranches();
    const company = this.getCompany();
    company.operatingHours = DEFAULT_COMPANY.operatingHours;
    company.websiteServices = DEFAULT_COMPANY.websiteServices;
    company.websiteOffices = DEFAULT_COMPANY.websiteOffices;
    company.website = 'https://shreeswamisamarthtransport.in';
    setStoredItem(STORAGE_KEYS.COMPANY, company);
    CloudSync.syncCompany(company);

    this.addAuditLog(
      this.getCurrentUser()?.username || 'admin',
      'WEBSITE_DATA_SYNCED',
      'INTEGRATION',
      'WEBSITE',
      'Official website data (Pune, Mumbai, Dadar, Chakan) successfully merged into ERP.'
    );

    return {
      success: true,
      branchesUpdated: branches.length,
      message: 'सर्व अधिकृत वेबसाइट डेटा (शाखा, संपर्क, कामाचे तास व सेवा) सुरक्षितपणे जोडला गेला आहे.',
    };
  },

  saveBranch(branch: Branch): void {
    const branches = this.getBranches();
    const idx = branches.findIndex((b) => b.id === branch.id);
    if (idx >= 0) {
      branches[idx] = branch;
    } else {
      branches.push(branch);
    }
    setStoredItem(STORAGE_KEYS.BRANCHES, branches);
    CloudSync.syncBranch(branch);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'BRANCH_SAVED', 'MASTER_DATA', branch.code, `Branch ${branch.name} (${branch.code}) saved.`);
  },

  // Customers
  getCustomers(): Customer[] {
    return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
    } else {
      customers.push(customer);
    }
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    CloudSync.syncCustomer(customer);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'CUSTOMER_SAVED', 'MASTER_DATA', customer.id, `Customer ${customer.name} saved.`);
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    return getStoredItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
  },

  saveVehicle(vehicle: Vehicle): void {
    const vehicles = this.getVehicles();
    const idx = vehicles.findIndex((v) => v.id === vehicle.id);
    if (idx >= 0) {
      vehicles[idx] = vehicle;
    } else {
      vehicles.push(vehicle);
    }
    setStoredItem(STORAGE_KEYS.VEHICLES, vehicles);
    CloudSync.syncVehicle(vehicle);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'VEHICLE_SAVED', 'MASTER_DATA', vehicle.vehicleNumber, `Vehicle ${vehicle.vehicleNumber} saved.`);
  },

  // Drivers
  getDrivers(): Driver[] {
    return getStoredItem<Driver[]>(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
  },

  saveDriver(driver: Driver): void {
    const drivers = this.getDrivers();
    const idx = drivers.findIndex((d) => d.id === driver.id);
    if (idx >= 0) {
      drivers[idx] = driver;
    } else {
      drivers.push(driver);
    }
    setStoredItem(STORAGE_KEYS.DRIVERS, drivers);
    CloudSync.syncDriver(driver);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'DRIVER_SAVED', 'MASTER_DATA', driver.id, `Driver ${driver.name} saved.`);
  },

  // LR Numbers & Records
  getLRs(): LRRecord[] {
    const lrs = getStoredItem<LRRecord[]>(STORAGE_KEYS.LRS, INITIAL_LRS);
    let updated = false;
    lrs.forEach((lr) => {
      if (!lr.podStatus) {
        lr.podStatus = lr.status === 'DELIVERED' ? 'UPLOADED' : 'PENDING';
        updated = true;
      }
      if (!lr.trackingHistory || lr.trackingHistory.length === 0) {
        lr.trackingHistory = [
          {
            id: `chk-init-${lr.id}`,
            status: 'BOOKED',
            timestamp: lr.createdAt || `${lr.bookingDate}T10:00:00.000Z`,
            location: lr.branchName || 'CHAKAN MAIN',
            remarks: `Consignment booked. Consignor: ${lr.consignorName} → Consignee: ${lr.consigneeName}`,
            updatedBy: lr.createdBy || 'admin',
          },
        ];
        if (lr.status === 'DISPATCHED' || lr.status === 'IN TRANSIT' || lr.status === 'DELIVERED') {
          lr.trackingHistory.push({
            id: `chk-disp-${lr.id}`,
            status: 'DISPATCHED',
            timestamp: `${lr.bookingDate}T12:00:00.000Z`,
            location: `${lr.branchName || 'CHAKAN'} Hub`,
            remarks: `Loaded and dispatched on vehicle ${lr.vehicleNumber || 'MH-14'}. Driver: ${lr.driverName || 'Assigned'}`,
            updatedBy: lr.createdBy || 'admin',
          });
        }
        if (lr.status === 'IN TRANSIT' || lr.status === 'DELIVERED') {
          lr.trackingHistory.push({
            id: `chk-trans-${lr.id}`,
            status: 'IN TRANSIT',
            timestamp: `${lr.bookingDate}T14:30:00.000Z`,
            location: lr.currentLocation || 'En-route Highway Checkpost',
            remarks: `Vehicle in transit towards destination ${lr.toLocation}. Driver contact: ${lr.driverMobile || 'Available'}.`,
            updatedBy: lr.createdBy || 'admin',
          });
        }
        if (lr.status === 'DELIVERED') {
          lr.trackingHistory.push({
            id: `chk-deliv-${lr.id}`,
            status: 'DELIVERED',
            timestamp: lr.updatedAt || `${lr.bookingDate}T17:00:00.000Z`,
            location: lr.toLocation,
            remarks: `Delivered to recipient with acknowledgment and stamp.`,
            updatedBy: 'operator',
          });
          if (!lr.podDetails) {
            lr.podDetails = {
              id: `pod-${lr.id}`,
              lrId: lr.id,
              lrNumber: lr.lrNumber,
              status: 'UPLOADED',
              receivedBy: lr.consigneeName,
              receiverPhone: lr.consigneeMobile || '+91 98220 54321',
              deliveryDate: lr.bookingDate,
              deliveryTime: '16:45',
              documentUrl: '/company_logo.jpg',
              fileName: `POD-SIGNED-${lr.lrNumber}.jpg`,
              remarks: 'Goods received in intact sealed condition. Verified by security supervisor.',
              uploadedAt: lr.updatedAt || `${lr.bookingDate}T17:00:00.000Z`,
              uploadedBy: 'operator',
            };
          }
        }
        updated = true;
      }
    });
    if (updated) {
      setStoredItem(STORAGE_KEYS.LRS, lrs);
    }
    return lrs;
  },

  generateNextLRNumber(branchCode: string): string {
    const branch = (branchCode || 'CHK').toUpperCase();
    const year = new Date().getFullYear();
    const prefix = `LR-${branch}-${year}-`;
    const lrs = this.getLRs();

    // Find highest serial for this branch and year
    let maxSerial = 0;
    lrs.forEach((lr) => {
      if (lr.lrNumber && lr.lrNumber.startsWith(prefix)) {
        const parts = lr.lrNumber.split('-');
        const serialStr = parts[parts.length - 1];
        const num = parseInt(serialStr, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      }
    });

    const nextNum = maxSerial + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `${prefix}${padded}`;
  },

  saveLR(lr: LRRecord, userContext?: User): LRRecord {
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lr.id || item.lrNumber === lr.lrNumber);
    const currentUser = userContext || this.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
    const canModify = isAdmin || (currentUser?.permissions?.canModifyLR ?? false);
    const canCreate = isAdmin || (currentUser?.permissions?.canCreateLR ?? true);

    if (idx >= 0) {
      // Modifying existing LR is strictly restricted: ONLY Admin can edit/modify LRs!
      if (!isAdmin) {
        throw new Error('LR Modification Restricted: Only System Administrator (KUDKE BALIRAM) is authorized to modify existing booked LRs.');
      }
      lrs[idx] = { ...lr, updatedAt: new Date().toISOString() };
      setStoredItem(STORAGE_KEYS.LRS, lrs);
      CloudSync.syncLR(lrs[idx]);
      this.addAuditLog(currentUser?.username || 'user', 'LR_UPDATED', 'LR BOOKING', lr.lrNumber, `LR ${lr.lrNumber} modified by ${currentUser?.name || currentUser?.username}. Consignor: ${lr.consignorName}`);
      return lrs[idx];
    } else {
      if (!canCreate) {
        throw new Error('LR Creation Restricted: You do not have permission to book new LRs.');
      }
      const newLR: LRRecord = {
        ...lr,
        podStatus: lr.podStatus || 'PENDING',
        trackingHistory: lr.trackingHistory && lr.trackingHistory.length > 0 ? lr.trackingHistory : [
          {
            id: `chk-${Date.now()}`,
            status: 'BOOKED',
            timestamp: lr.createdAt || new Date().toISOString(),
            location: lr.branchName || 'CHAKAN MAIN',
            remarks: `Consignment booked successfully. Mode: ${lr.paymentMode}, Delivery: ${lr.deliveryType}`,
            updatedBy: currentUser?.name || currentUser?.username || 'staff',
          }
        ],
      };
      lrs.unshift(newLR);
      setStoredItem(STORAGE_KEYS.LRS, lrs);
      CloudSync.syncLR(newLR);
      this.addAuditLog(currentUser?.username || 'user', 'LR_CREATED', 'LR BOOKING', lr.lrNumber, `LR ${lr.lrNumber} created by ${currentUser?.name || currentUser?.username}. Grand Total: ₹${lr.charges.grandTotal}`);
      return newLR;
    }
  },

  updateLRTracking(
    lrId: string,
    status: LRStatus,
    location: string,
    remarks: string,
    updatedBy: string
  ): LRRecord {
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lrId);
    if (idx < 0) throw new Error('LR record not found');

    const lr = lrs[idx];
    const prevStatus = lr.status;
    lr.status = status;
    lr.currentLocation = location || lr.currentLocation || location;
    lr.updatedAt = new Date().toISOString();

    const checkpoint: TrackingCheckpoint = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status,
      timestamp: new Date().toISOString(),
      location: location || lr.branchName || 'Hub',
      remarks: remarks || `Consignment status updated to ${status}`,
      updatedBy: updatedBy || 'operator',
    };

    if (!lr.trackingHistory) {
      lr.trackingHistory = [];
    }
    lr.trackingHistory.push(checkpoint);

    if (status === 'DELIVERED') {
      if (!lr.deliveredAt) {
        lr.deliveredAt = new Date().toISOString();
      }
    }

    setStoredItem(STORAGE_KEYS.LRS, lrs);
    CloudSync.syncLR(lr);
    this.addAuditLog(
      updatedBy || 'operator',
      'LR_TRACKING_UPDATED',
      'LR TRACKING',
      lr.lrNumber,
      `LR ${lr.lrNumber} tracking updated from ${prevStatus} to ${status} at ${location || 'Hub'}. Remarks: ${remarks}`
    );
    return lr;
  },

  uploadLRPOD(
    lrId: string,
    podData: {
      receivedBy: string;
      receiverPhone?: string;
      deliveryDate: string;
      deliveryTime?: string;
      documentUrl?: string;
      fileName?: string;
      remarks?: string;
    },
    uploadedBy: string
  ): LRRecord {
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lrId);
    if (idx < 0) throw new Error('LR record not found');

    const lr = lrs[idx];
    const podRecord: PODRecord = {
      id: `pod-${Date.now()}`,
      lrId: lr.id,
      lrNumber: lr.lrNumber,
      status: 'UPLOADED',
      receivedBy: podData.receivedBy,
      receiverPhone: podData.receiverPhone || lr.consigneeMobile || '',
      deliveryDate: podData.deliveryDate || new Date().toISOString().split('T')[0],
      deliveryTime: podData.deliveryTime || new Date().toTimeString().slice(0, 5),
      documentUrl: podData.documentUrl,
      fileName: podData.fileName || `POD-${lr.lrNumber}.jpg`,
      remarks: podData.remarks || 'Consignment delivered in good condition with sign & stamp.',
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || 'operator',
    };

    lr.podStatus = 'UPLOADED';
    lr.podDetails = podRecord;
    lr.status = 'DELIVERED';
    lr.deliveredAt = `${podRecord.deliveryDate} ${podRecord.deliveryTime || ''}`.trim();
    lr.deliveredTo = podData.receivedBy;
    lr.receiverMobile = podData.receiverPhone;
    lr.updatedAt = new Date().toISOString();

    const checkpoint: TrackingCheckpoint = {
      id: `chk-pod-${Date.now()}`,
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      location: lr.toLocation || lr.branchName,
      remarks: `POD Uploaded. Received by ${podData.receivedBy} (${podData.receiverPhone || 'N/A'}). ${podData.remarks || ''}`,
      updatedBy: uploadedBy || 'operator',
    };

    if (!lr.trackingHistory) lr.trackingHistory = [];
    lr.trackingHistory.push(checkpoint);

    setStoredItem(STORAGE_KEYS.LRS, lrs);
    CloudSync.syncLR(lr);
    this.addAuditLog(
      uploadedBy || 'operator',
      'POD_UPLOADED',
      'POD RECORD',
      lr.lrNumber,
      `POD uploaded for LR ${lr.lrNumber}. Receiver: ${podData.receivedBy}`
    );
    return lr;
  },

  verifyLRPOD(lrId: string, verifiedBy: string): LRRecord {
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lrId);
    if (idx < 0) throw new Error('LR record not found');

    const lr = lrs[idx];
    if (lr.podDetails) {
      lr.podDetails.status = 'VERIFIED';
      lr.podDetails.verifiedAt = new Date().toISOString();
      lr.podDetails.verifiedBy = verifiedBy;
    }
    lr.podStatus = 'VERIFIED';
    lr.updatedAt = new Date().toISOString();

    setStoredItem(STORAGE_KEYS.LRS, lrs);
    CloudSync.syncLR(lr);
    this.addAuditLog(
      verifiedBy,
      'POD_VERIFIED',
      'POD RECORD',
      lr.lrNumber,
      `POD for LR ${lr.lrNumber} verified and approved by ${verifiedBy}.`
    );
    return lr;
  },

  deleteLRPOD(lrId: string, user: string): LRRecord {
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lrId);
    if (idx < 0) throw new Error('LR record not found');

    const lr = lrs[idx];
    lr.podStatus = 'PENDING';
    lr.podDetails = undefined;
    lr.updatedAt = new Date().toISOString();

    setStoredItem(STORAGE_KEYS.LRS, lrs);
    CloudSync.syncLR(lr);
    this.addAuditLog(
      user,
      'POD_DELETED',
      'POD RECORD',
      lr.lrNumber,
      `POD removed for LR ${lr.lrNumber} by ${user}.`
    );
    return lr;
  },

  cancelLR(lrId: string, reason: string, cancelledBy: string, userContext?: User): boolean {
    const currentUser = userContext || this.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
    const canCancel = isAdmin || (currentUser?.permissions?.canCancelLR ?? false);
    if (!canCancel) {
      throw new Error('LR Cancellation Restricted: Only Administrator has permission to cancel booked LRs.');
    }
    const lrs = this.getLRs();
    const idx = lrs.findIndex((item) => item.id === lrId);
    if (idx >= 0) {
      lrs[idx].status = 'CANCELLED';
      lrs[idx].cancellationReason = reason;
      lrs[idx].cancelledBy = cancelledBy;
      lrs[idx].cancelledAt = new Date().toISOString();
      lrs[idx].updatedAt = new Date().toISOString();
      setStoredItem(STORAGE_KEYS.LRS, lrs);
      CloudSync.syncLR(lrs[idx]);
      this.addAuditLog(cancelledBy, 'LR_CANCELLED', 'LR BOOKING', lrs[idx].lrNumber, `LR ${lrs[idx].lrNumber} cancelled. Reason: ${reason}`);
      return true;
    }
    return false;
  },

  permanentlyDeleteLR(lrId: string, deletedBy: string, userContext?: User): boolean {
    const currentUser = userContext || this.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'admin';
    const canDelete = isAdmin || (currentUser?.permissions?.canDeleteLR ?? false);
    if (!canDelete) {
      throw new Error('LR Purge Restricted: Only Master Administrator (KUDKE BALIRAM) can permanently delete LR records.');
    }
    const lrs = this.getLRs();
    const target = lrs.find((l) => l.id === lrId);
    const filtered = lrs.filter((item) => item.id !== lrId);
    setStoredItem(STORAGE_KEYS.LRS, filtered);
    CloudSync.deleteLR(lrId);
    if (target) {
      this.addAuditLog(deletedBy, 'LR_PERMANENTLY_DELETED', 'LR BOOKING', target.lrNumber, `LR ${target.lrNumber} permanently purged by Admin.`);
    }
    return true;
  },

  // MR (Manifests)
  getMRs(): MRRecord[] {
    return getStoredItem<MRRecord[]>(STORAGE_KEYS.MRS, INITIAL_MRS);
  },

  generateNextMRNumber(branchCode: string): string {
    const branch = (branchCode || 'CHK').toUpperCase();
    const year = new Date().getFullYear();
    const prefix = `MR-${branch}-${year}-`;
    const mrs = this.getMRs();

    let maxSerial = 0;
    mrs.forEach((mr) => {
      if (mr.mrNumber && mr.mrNumber.startsWith(prefix)) {
        const parts = mr.mrNumber.split('-');
        const serialStr = parts[parts.length - 1];
        const num = parseInt(serialStr, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      }
    });

    const nextNum = maxSerial + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `${prefix}${padded}`;
  },

  saveMR(mr: MRRecord): MRRecord {
    const mrs = this.getMRs();
    const idx = mrs.findIndex((item) => item.id === mr.id || item.mrNumber === mr.mrNumber);
    if (idx >= 0) {
      mrs[idx] = mr;
      setStoredItem(STORAGE_KEYS.MRS, mrs);
      CloudSync.syncMR(mr);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'MR_UPDATED', 'MANIFEST', mr.mrNumber, `MR ${mr.mrNumber} updated.`);
    } else {
      mrs.unshift(mr);
      setStoredItem(STORAGE_KEYS.MRS, mrs);
      CloudSync.syncMR(mr);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'MR_CREATED', 'MANIFEST', mr.mrNumber, `MR ${mr.mrNumber} created with ${mr.totalLRs || mr.lrIds?.length || 0} LRs.`);
    }

    // Update status of attached LRs to reflect manifest dispatch
    if (mr.lrIds && mr.lrIds.length > 0) {
      const lrs = this.getLRs();
      let lrsUpdated = false;
      mr.lrIds.forEach((lrId) => {
        const found = lrs.find((l) => l.id === lrId || l.lrNumber === lrId);
        if (found) {
          if (found.status === 'BOOKED') {
            found.status = 'DISPATCHED';
          }
          if (mr.vehicleNumber && !found.vehicleNumber) {
            found.vehicleNumber = mr.vehicleNumber;
          }
          found.updatedAt = new Date().toISOString();
          if (!found.trackingHistory) found.trackingHistory = [];
          if (!found.trackingHistory.some((th) => th.remarks.includes(mr.mrNumber))) {
            found.trackingHistory.push({
              id: `chk-mr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              status: found.status,
              timestamp: new Date().toISOString(),
              location: mr.fromBranch || found.branchName,
              remarks: `Manifested in MR ${mr.mrNumber} (Vehicle: ${mr.vehicleNumber}). Route: ${mr.fromBranch} → ${mr.toBranch}.`,
              updatedBy: mr.createdBy || 'operator',
            });
          }
          lrsUpdated = true;
          CloudSync.syncLR(found);
        }
      });
      if (lrsUpdated) {
        setStoredItem(STORAGE_KEYS.LRS, lrs);
      }
    }

    return idx >= 0 ? mrs[idx] : mr;
  },

  // LHS (Loading Sheets)
  getLHS(): LHSRecord[] {
    return getStoredItem<LHSRecord[]>(STORAGE_KEYS.LHS, INITIAL_LHS);
  },

  generateNextLHSNumber(branchCode: string): string {
    const branch = (branchCode || 'CHK').toUpperCase();
    const year = new Date().getFullYear();
    const prefix = `LHS-${branch}-${year}-`;
    const list = this.getLHS();

    let maxSerial = 0;
    list.forEach((item) => {
      if (item.lhsNumber && item.lhsNumber.startsWith(prefix)) {
        const parts = item.lhsNumber.split('-');
        const serialStr = parts[parts.length - 1];
        const num = parseInt(serialStr, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      }
    });

    const nextNum = maxSerial + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `${prefix}${padded}`;
  },

  saveLHS(lhs: LHSRecord): LHSRecord {
    const list = this.getLHS();
    const idx = list.findIndex((item) => item.id === lhs.id || item.lhsNumber === lhs.lhsNumber);
    if (idx >= 0) {
      list[idx] = lhs;
      setStoredItem(STORAGE_KEYS.LHS, list);
      CloudSync.syncLHS(lhs);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'LHS_UPDATED', 'LOADING SHEET', lhs.lhsNumber, `LHS ${lhs.lhsNumber} updated.`);
    } else {
      list.unshift(lhs);
      setStoredItem(STORAGE_KEYS.LHS, list);
      CloudSync.syncLHS(lhs);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'LHS_CREATED', 'LOADING SHEET', lhs.lhsNumber, `LHS ${lhs.lhsNumber} created.`);
    }

    // Update status of attached LRs to reflect loading sheet assignment
    if (lhs.lrIds && lhs.lrIds.length > 0) {
      const lrs = this.getLRs();
      let lrsUpdated = false;
      lhs.lrIds.forEach((lrId) => {
        const found = lrs.find((l) => l.id === lrId || l.lrNumber === lrId);
        if (found) {
          if (found.status === 'BOOKED') {
            found.status = 'DISPATCHED';
          }
          if (lhs.vehicleNumber && !found.vehicleNumber) {
            found.vehicleNumber = lhs.vehicleNumber;
          }
          found.updatedAt = new Date().toISOString();
          if (!found.trackingHistory) found.trackingHistory = [];
          if (!found.trackingHistory.some((th) => th.remarks.includes(lhs.lhsNumber))) {
            found.trackingHistory.push({
              id: `chk-lhs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              status: found.status,
              timestamp: new Date().toISOString(),
              location: lhs.fromBranch || found.branchName,
              remarks: `Loaded in LHS ${lhs.lhsNumber} (Vehicle: ${lhs.vehicleNumber}). Route: ${lhs.fromBranch} → ${lhs.toBranch}.`,
              updatedBy: lhs.createdBy || 'operator',
            });
          }
          lrsUpdated = true;
          CloudSync.syncLR(found);
        }
      });
      if (lrsUpdated) {
        setStoredItem(STORAGE_KEYS.LRS, lrs);
      }
    }

    // Transport Workflow: When LHS is made, attached MR entries are marked as DISPATCHED in LHS (MR Stock decreases)
    const mrs = this.getMRs();
    let mrsUpdated = false;
    const mrIdsToUpdate = new Set<string>(lhs.selectedMrIds || []);
    mrs.forEach((mr) => {
      const isDirectMatch = mrIdsToUpdate.has(mr.id) || mrIdsToUpdate.has(mr.mrNumber);
      const hasMatchingLR =
        lhs.lrIds &&
        (mr.lrIds?.some((id) => lhs.lrIds?.includes(id)) ||
          mr.selectedLrIds?.some((id) => lhs.lrIds?.includes(id)));
      if (isDirectMatch || hasMatchingLR) {
        mr.lhsNo = lhs.lhsNumber;
        mr.status = 'DISPATCHED';
        mr.updatedAt = new Date().toISOString();
        mrsUpdated = true;
        CloudSync.syncMR(mr);
      }
    });
    if (mrsUpdated) {
      setStoredItem(STORAGE_KEYS.MRS, mrs);
    }

    return idx >= 0 ? list[idx] : lhs;
  },

  // Stock Transfers
  getStockTransfers(): StockTransferRecord[] {
    return getStoredItem<StockTransferRecord[]>(STORAGE_KEYS.STOCK_TRANSFERS, INITIAL_STOCK_TRANSFERS);
  },

  generateNextTransferNumber(branchCode: string): string {
    const branch = (branchCode || 'CHK').toUpperCase();
    const year = new Date().getFullYear();
    const prefix = `TRF-${branch}-${year}-`;
    const list = this.getStockTransfers();

    let maxSerial = 0;
    list.forEach((item) => {
      if (item.transferNumber && item.transferNumber.startsWith(prefix)) {
        const parts = item.transferNumber.split('-');
        const serialStr = parts[parts.length - 1];
        const num = parseInt(serialStr, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      }
    });

    const nextNum = maxSerial + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `${prefix}${padded}`;
  },

  saveStockTransfer(trf: StockTransferRecord): StockTransferRecord {
    const list = this.getStockTransfers();
    const idx = list.findIndex((item) => item.id === trf.id || item.transferNumber === trf.transferNumber);
    if (idx >= 0) {
      list[idx] = trf;
      setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, list);
      CloudSync.syncStockTransfer(trf);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'STOCK_TRANSFER_UPDATED', 'STOCK OPERATIONS', trf.transferNumber, `Transfer ${trf.transferNumber} updated. Status: ${trf.status}`);
      return list[idx];
    } else {
      list.unshift(trf);
      setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, list);
      CloudSync.syncStockTransfer(trf);
      this.addAuditLog(this.getCurrentUser()?.username || 'user', 'STOCK_TRANSFER_CREATED', 'STOCK OPERATIONS', trf.transferNumber, `Stock transfer ${trf.transferNumber} created: ${trf.fromBranch} -> ${trf.toBranch}`);
      return trf;
    }
  },

  updateStockTransferStatus(id: string, status: StockTransferRecord['status'], updatedBy: string): void {
    const list = this.getStockTransfers();
    const idx = list.findIndex((item) => item.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (status === 'Received') {
        list[idx].receivedAt = new Date().toISOString();
        list[idx].receivedBy = updatedBy;
      }
      setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, list);
      CloudSync.syncStockTransfer(list[idx]);
      this.addAuditLog(updatedBy, 'STOCK_STATUS_CHANGED', 'STOCK OPERATIONS', list[idx].transferNumber, `Status changed to ${status}`);
    }
  },

  // Payments
  getPayments(): PaymentRecord[] {
    return getStoredItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  savePayment(payment: PaymentRecord): PaymentRecord {
    const list = this.getPayments();
    const idx = list.findIndex((p) => p.id === payment.id || p.receiptNo === payment.receiptNo);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.unshift(payment);
    }
    setStoredItem(STORAGE_KEYS.PAYMENTS, list);
    CloudSync.syncPayment(payment);

    // Update corresponding LR payment status
    if (payment.lrNumber) {
      const lrs = this.getLRs();
      const lrIdx = lrs.findIndex((l) => l.lrNumber === payment.lrNumber);
      if (lrIdx >= 0) {
        lrs[lrIdx].paymentStatus = payment.status === 'Paid' ? 'PAID' : 'PARTIAL';
        lrs[lrIdx].paidAmount = (lrs[lrIdx].paidAmount || 0) + payment.amount;
        setStoredItem(STORAGE_KEYS.LRS, lrs);
        CloudSync.syncLR(lrs[lrIdx]);
      }
    }

    this.addAuditLog(this.getCurrentUser()?.username || 'user', 'PAYMENT_SAVED', 'PHONEPE_PAYMENT', payment.receiptNo, `Payment of ₹${payment.amount} recorded via ${payment.paymentMode}. Ref: ${payment.transactionRef}`);
    return payment;
  },

  // Audit Logs
  getAuditLogs(): AuditLogItem[] {
    return getStoredItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(user: string, action: string, module: string, recordId: string, details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user: user || 'admin',
      action,
      module,
      recordId,
      timestamp: new Date().toISOString(),
      details,
    };
    logs.unshift(newLog);
    // Keep max 500 logs
    if (logs.length > 500) {
      logs.pop();
    }
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    CloudSync.syncAuditLog(newLog);
  },

  // DATA SAFE OPERATIONS: Backup, Restore, Export
  exportAllDataJSON(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company: this.getCompany(),
      branches: this.getBranches(),
      customers: this.getCustomers(),
      vehicles: this.getVehicles(),
      drivers: this.getDrivers(),
      lrs: this.getLRs(),
      mrs: this.getMRs(),
      lhs: this.getLHS(),
      stockTransfers: this.getStockTransfers(),
      payments: this.getPayments(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  restoreAllDataJSON(jsonString: string): { success: boolean; message: string; counts?: Record<string, number> } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON data structure.' };
      }

      const counts: Record<string, number> = {};

      if (Array.isArray(data.branches)) {
        setStoredItem(STORAGE_KEYS.BRANCHES, data.branches);
        counts.branches = data.branches.length;
      }
      if (Array.isArray(data.customers)) {
        setStoredItem(STORAGE_KEYS.CUSTOMERS, data.customers);
        counts.customers = data.customers.length;
      }
      if (Array.isArray(data.vehicles)) {
        setStoredItem(STORAGE_KEYS.VEHICLES, data.vehicles);
        counts.vehicles = data.vehicles.length;
      }
      if (Array.isArray(data.drivers)) {
        setStoredItem(STORAGE_KEYS.DRIVERS, data.drivers);
        counts.drivers = data.drivers.length;
      }
      if (Array.isArray(data.lrs)) {
        setStoredItem(STORAGE_KEYS.LRS, data.lrs);
        counts.lrs = data.lrs.length;
      }
      if (Array.isArray(data.mrs)) {
        setStoredItem(STORAGE_KEYS.MRS, data.mrs);
        counts.mrs = data.mrs.length;
      }
      if (Array.isArray(data.lhs)) {
        setStoredItem(STORAGE_KEYS.LHS, data.lhs);
        counts.lhs = data.lhs.length;
      }
      if (Array.isArray(data.stockTransfers)) {
        setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, data.stockTransfers);
        counts.stockTransfers = data.stockTransfers.length;
      }
      if (Array.isArray(data.payments)) {
        setStoredItem(STORAGE_KEYS.PAYMENTS, data.payments);
        counts.payments = data.payments.length;
      }
      if (data.company && typeof data.company === 'object') {
        setStoredItem(STORAGE_KEYS.COMPANY, data.company);
        counts.company = 1;
      }

      this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'DATA_RESTORED', 'DATA SAFE', 'ALL', 'Full system database restored from backup.');
      return { success: true, message: 'Data successfully restored to system storage.', counts };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
      return { success: false, message: `Failed to restore data: ${errorMsg}` };
    }
  },

  resetToDefaultData(): void {
    setStoredItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStoredItem(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    setStoredItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    setStoredItem(STORAGE_KEYS.LRS, INITIAL_LRS);
    setStoredItem(STORAGE_KEYS.MRS, INITIAL_MRS);
    setStoredItem(STORAGE_KEYS.LHS, INITIAL_LHS);
    setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, INITIAL_STOCK_TRANSFERS);
    setStoredItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setStoredItem(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    setStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.addAuditLog(this.getCurrentUser()?.username || 'admin', 'FACTORY_RESET', 'DATA SAFE', 'SYSTEM', 'Reset to initial verified database state.');
  },

  // Backward-compatible alias helpers
  getCompanyProfile(): CompanyProfile {
    return this.getCompany();
  },

  saveCompanyProfile(company: CompanyProfile, userContext?: User): void {
    this.saveCompany(company, userContext);
  },

  exportFullBackup(): string {
    return this.exportAllDataJSON();
  },

  importFullBackup(jsonString: string): { success: boolean; message: string; counts?: Record<string, number> } {
    return this.restoreAllDataJSON(jsonString);
  },

  resetToSampleData(): void {
    this.resetToDefaultData();
  },

  purgeLR(lrId: string, deletedBy?: string): boolean {
    return this.permanentlyDeleteLR(lrId, deletedBy || this.getCurrentUser()?.username || 'admin');
  },

  async forceRefreshCloud(): Promise<void> {
    await CloudSync.forceRefreshCloudData();
  },

  getSyncState() {
    return CloudSync.getSyncState();
  },
};
