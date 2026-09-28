import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  Plus,
  Trash2,
  Calculator,
  ArrowLeft,
  Building2,
  Truck,
  User as UserIcon,
  Package,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Zap,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  LRRecord,
  GoodsItem,
  Branch,
  Customer,
  Vehicle,
  Driver,
  PaymentMode,
  DeliveryType,
  User,
  CompanyProfile,
  DEFAULT_UNIT_RATES,
  COMMON_MATERIALS,
  CommonMaterial,
} from '../types';
import { StorageService } from '../services/storage';
import { CustomerAutocomplete } from './CustomerAutocomplete';

interface LREntryProps {
  branches: Branch[];
  customers: Customer[];
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedBranch: string;
  initialLR?: LRRecord | null;
  onSaveSuccess: (savedLR: LRRecord, andPrint?: boolean) => void;
  onCancel: () => void;
  currentUser: User;
  companyProfile?: CompanyProfile;
}

export const LREntry: React.FC<LREntryProps> = ({
  branches,
  customers,
  vehicles,
  drivers,
  selectedBranch,
  initialLR,
  onSaveSuccess,
  onCancel,
  currentUser,
  companyProfile,
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.username === 'admin';
  const canModifyLR = isAdmin; // Strictly Admin only can edit/modify booked LRs!
  const canCreateLR = isAdmin || (currentUser.permissions?.canCreateLR ?? true);
  const isEditing = Boolean(initialLR);
  const isRestrictedEdit = isEditing && !canModifyLR;

  // Default branch
  const effectiveBranchCode =
    initialLR?.branchCode ||
    (selectedBranch !== 'ALL' ? selectedBranch : branches[0]?.code || 'CHK');

  const [branchCode, setBranchCode] = useState<string>(effectiveBranchCode);
  const [lrNumber, setLrNumber] = useState<string>(
    initialLR?.lrNumber || StorageService.generateNextLRNumber(effectiveBranchCode)
  );

  const [bookingDate, setBookingDate] = useState<string>(
    initialLR?.bookingDate || new Date().toISOString().split('T')[0]
  );

  // Consignor
  const [consignorName, setConsignorName] = useState<string>(initialLR?.consignorName || '');
  const [consignorGstin, setConsignorGstin] = useState<string>(initialLR?.consignorGstin || '');
  const [consignorAddress, setConsignorAddress] = useState<string>(initialLR?.consignorAddress || '');
  const [consignorMobile, setConsignorMobile] = useState<string>(initialLR?.consignorMobile || '');

  // Consignee
  const [consigneeName, setConsigneeName] = useState<string>(initialLR?.consigneeName || '');
  const [consigneeGstin, setConsigneeGstin] = useState<string>(initialLR?.consigneeGstin || '');
  const [consigneeAddress, setConsigneeAddress] = useState<string>(initialLR?.consigneeAddress || '');
  const [consigneeMobile, setConsigneeMobile] = useState<string>(initialLR?.consigneeMobile || '');

  // Route & Fleet
  const [fromLocation, setFromLocation] = useState<string>(initialLR?.fromLocation || 'Chakan, Pune');
  const [toLocation, setToLocation] = useState<string>(initialLR?.toLocation || '');
  const [vehicleNumber, setVehicleNumber] = useState<string>(initialLR?.vehicleNumber || '');
  const [driverName, setDriverName] = useState<string>(initialLR?.driverName || '');
  const [driverMobile, setDriverMobile] = useState<string>(initialLR?.driverMobile || '');

  // Meta & Billing
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialLR?.paymentMode || 'TO PAY');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialLR?.deliveryType || 'DOOR DELIVERY');
  const [eWayBillNo, setEWayBillNo] = useState<string>(initialLR?.eWayBillNo || '');
  const [freightUpToBranch, setFreightUpToBranch] = useState<string>(initialLR?.freightUpToBranch || '');
  const [toBranch, setToBranch] = useState<string>(initialLR?.toBranch || '');
  const [collectionType, setCollectionType] = useState<string>(initialLR?.collectionType || 'Direct Godown');
  const [ccType, setCcType] = useState<string>(initialLR?.ccType || 'Standard');
  const [specialRemarks, setSpecialRemarks] = useState<string>(initialLR?.specialRemarks || '');

  // Auto-Rate resolution based on selected Unit (Standard defaults or Company Profile overrides)
  const getUnitDefaultRate = (unit: string): number => {
    if (!unit) return 5;
    const cleanUnit = unit.trim();
    const custom = (companyProfile?.unitRates as Record<string, number>) || {};

    // 1. Case-insensitive lookup in companyProfile.unitRates
    const customKey = Object.keys(custom).find(
      (k) => k.toLowerCase() === cleanUnit.toLowerCase()
    );
    if (customKey && custom[customKey] !== undefined && Number(custom[customKey]) > 0) {
      return Number(custom[customKey]);
    }

    // 2. Case-insensitive lookup in DEFAULT_UNIT_RATES
    const defaultKey = Object.keys(DEFAULT_UNIT_RATES).find(
      (k) => k.toLowerCase() === cleanUnit.toLowerCase()
    );
    if (defaultKey && DEFAULT_UNIT_RATES[defaultKey] !== undefined) {
      return DEFAULT_UNIT_RATES[defaultKey];
    }

    // 3. Synonym matching
    const lower = cleanUnit.toLowerCase();
    if (lower.includes('bag') || lower.includes('बॅग') || lower.includes('पोती')) return 80;
    if (lower.includes('box') || lower.includes('खोके') || lower.includes('कार्टन')) return 150;
    if (lower.includes('no') || lower.includes('नग')) return 50;
    if (lower.includes('crate') || lower.includes('क्रेट')) return 200;
    if (lower.includes('drum') || lower.includes('ड्रम') || lower.includes('बॅरल')) return 300;
    if (lower.includes('pallet') || lower.includes('पॅलेट')) return 500;
    if (lower.includes('bundle') || lower.includes('बंडल')) return 100;
    if (lower.includes('kg') || lower.includes('kilo') || lower.includes('किलो')) return 5;
    if (lower.includes('ton') || lower.includes('mt') || lower.includes('टन')) return 3500;
    if (lower.includes('trip') || lower.includes('ट्रिप')) return 4500;
    if (lower.includes('pkg') || lower.includes('पॅकेज')) return 120;

    return 5;
  };

  const calculateItemFreight = (
    unit: string,
    qty: number,
    actWt: number,
    chgWt: number,
    rate: number
  ): number => {
    if (!rate || rate <= 0) return 0;
    const effectiveWt = chgWt > 0 ? chgWt : actWt;
    const effectiveQty = qty > 0 ? qty : 1;
    const lower = (unit || '').toLowerCase();

    if (lower === 'kg' || lower.includes('kilo') || lower.includes('किलो')) {
      return Math.round((effectiveWt > 0 ? effectiveWt : effectiveQty) * rate);
    } else if (lower === 'mt' || lower === 'ton' || lower.includes('टन')) {
      if (effectiveWt > 0) {
        return Math.round((effectiveWt / 1000) * rate);
      }
      return Math.round(effectiveQty * rate);
    } else {
      // Bags, Boxes, Nos, Crates, Pallets, Drums, Bundles, Pkgs, TRIP
      return Math.round(effectiveQty * rate);
    }
  };

  // Goods Items (Multiple Rows)
  const defaultUnit = 'Boxes';
  const defaultRate = getUnitDefaultRate(defaultUnit);
  const defaultItem: GoodsItem = {
    id: `item-${Date.now()}`,
    description: '',
    packingType: 'Boxes',
    quantity: 1,
    units: defaultUnit,
    actualWeight: 0,
    chargeWeight: 0,
    ratePerKg: defaultRate,
    freight: calculateItemFreight(defaultUnit, 1, 0, 0, defaultRate),
  };

  const [items, setItems] = useState<GoodsItem[]>(
    initialLR?.items && initialLR.items.length > 0 ? initialLR.items : [defaultItem]
  );

  // Additional Charges
  const [vasuli, setVasuli] = useState<number>(initialLR?.charges?.vasuli || 0);
  const [handling, setHandling] = useState<number>(initialLR?.charges?.handling || 0);
  const [doorCollection, setDoorCollection] = useState<number>(initialLR?.charges?.doorCollection || 0);
  const [doorDelivery, setDoorDelivery] = useState<number>(initialLR?.charges?.doorDelivery || 0);
  const [otherCharges, setOtherCharges] = useState<number>(initialLR?.charges?.otherCharges || 0);
  const [gstPercent, setGstPercent] = useState<number>(5); // Standard 5% GST for goods transport

  // UI state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Whenever branch changes, update auto LR number if creating a new one
  const handleBranchChange = (newCode: string) => {
    setBranchCode(newCode);
    if (!initialLR) {
      const nextNo = StorageService.generateNextLRNumber(newCode);
      setLrNumber(nextNo);
    }
  };

  // Quick select Consignor
  const handleSelectConsignor = (custName: string) => {
    setConsignorName(custName);
    const found = customers.find((c) => c.name === custName);
    if (found) {
      setConsignorGstin(found.gstin || '');
      setConsignorAddress(found.address || '');
      setConsignorMobile(found.contact || '');
    }
  };

  const handleSelectConsignorCustomer = (customer: Customer) => {
    setConsignorName(customer.name);
    setConsignorGstin(customer.gstin || '');
    setConsignorAddress(customer.address || '');
    setConsignorMobile(customer.contact || '');
  };

  // Quick select Consignee
  const handleSelectConsignee = (custName: string) => {
    setConsigneeName(custName);
    const found = customers.find((c) => c.name === custName);
    if (found) {
      setConsigneeGstin(found.gstin || '');
      setConsigneeAddress(found.address || '');
      setConsigneeMobile(found.contact || '');
    }
  };

  const handleSelectConsigneeCustomer = (customer: Customer) => {
    setConsigneeName(customer.name);
    setConsigneeGstin(customer.gstin || '');
    setConsigneeAddress(customer.address || '');
    setConsigneeMobile(customer.contact || '');
  };

  // Quick select Vehicle
  const handleSelectVehicle = (vNum: string) => {
    setVehicleNumber(vNum);
  };

  // Quick select Driver
  const handleSelectDriver = (dName: string) => {
    setDriverName(dName);
    const found = drivers.find((d) => d.name === dName);
    if (found) {
      setDriverMobile(found.mobile);
    }
  };

  // Item row operations
  const handleItemChange = (index: number, field: keyof GoodsItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // 1. Material Description changed -> Auto-detect common packing type & unit if currently default
    if (field === 'description') {
      const desc = String(value || '').toLowerCase();
      let matchedPacking = '';
      let matchedUnit = '';

      if (
        desc.includes('bag') ||
        desc.includes('बॅग') ||
        desc.includes('पोती') ||
        desc.includes('sugar') ||
        desc.includes('साखर') ||
        desc.includes('cement') ||
        desc.includes('सिमेंट') ||
        desc.includes('grain') ||
        desc.includes('धान्य') ||
        desc.includes('fertilizer') ||
        desc.includes('खत')
      ) {
        matchedPacking = 'Bags';
        matchedUnit = 'Bags';
      } else if (
        desc.includes('box') ||
        desc.includes('खोके') ||
        desc.includes('कार्टन') ||
        desc.includes('auto part') ||
        desc.includes('सुटे भाग') ||
        desc.includes('electronic') ||
        desc.includes('hardware')
      ) {
        matchedPacking = 'Boxes';
        matchedUnit = 'Boxes';
      } else if (
        desc.includes('drum') ||
        desc.includes('ड्रम') ||
        desc.includes('बॅरल') ||
        desc.includes('oil') ||
        desc.includes('chemical') ||
        desc.includes('liquid')
      ) {
        matchedPacking = 'Drums';
        matchedUnit = 'Drums';
      } else if (
        desc.includes('crate') ||
        desc.includes('क्रेट') ||
        desc.includes('machinery') ||
        desc.includes('मशिनरी') ||
        desc.includes('casting') ||
        desc.includes('engine')
      ) {
        matchedPacking = 'Wooden Crates';
        matchedUnit = 'Crates';
      } else if (desc.includes('pallet') || desc.includes('पॅलेट')) {
        matchedPacking = 'Pallets';
        matchedUnit = 'Pallets';
      } else if (
        desc.includes('coil') ||
        desc.includes('steel') ||
        desc.includes('स्टील') ||
        desc.includes('pipe') ||
        desc.includes('sheet') ||
        desc.includes('ton') ||
        desc.includes('टन')
      ) {
        matchedPacking = 'Bundles';
        matchedUnit = 'MT';
      } else if (desc.includes('trip') || desc.includes('ट्रिप') || desc.includes('पूर्ण गाडी')) {
        matchedPacking = 'Loose / Machinery';
        matchedUnit = 'TRIP';
      }

      // If user typed a recognized material, auto-fill packing & unit and fetch rate!
      if (matchedUnit && (!item.units || item.units === 'Boxes' || item.units === 'Pkgs')) {
        item.packingType = matchedPacking || item.packingType;
        item.units = matchedUnit;
        const autoRate = getUnitDefaultRate(matchedUnit);
        item.ratePerKg = autoRate;
        item.freight = calculateItemFreight(
          matchedUnit,
          Number(item.quantity || 1),
          Number(item.actualWeight || 0),
          Number(item.chargeWeight || 0),
          autoRate
        );
      }
    }

    // 2. Packing Type changed -> Auto-sync matching unit & its auto rate!
    if (field === 'packingType') {
      const packing = String(value);
      let matchedUnit = item.units;
      if (packing === 'Bags') matchedUnit = 'Bags';
      else if (packing === 'Boxes' || packing === 'Wooden Boxes') matchedUnit = 'Boxes';
      else if (packing === 'Drums') matchedUnit = 'Drums';
      else if (packing === 'Pallets') matchedUnit = 'Pallets';
      else if (packing === 'Wooden Crates' || packing === 'Metal Crates') matchedUnit = 'Crates';
      else if (packing === 'Bundles') matchedUnit = 'Bundles';

      if (matchedUnit !== item.units) {
        item.units = matchedUnit;
        const autoRate = getUnitDefaultRate(matchedUnit);
        item.ratePerKg = autoRate;
        item.freight = calculateItemFreight(
          matchedUnit,
          Number(item.quantity || 1),
          Number(item.actualWeight || 0),
          Number(item.chargeWeight || 0),
          autoRate
        );
      }
    }

    // 3. When Unit is selected -> AUTOMATICALLY fetch rate according to unit & calculate freight!
    if (field === 'units') {
      const autoRate = getUnitDefaultRate(value);
      item.ratePerKg = autoRate;
      item.freight = calculateItemFreight(
        value,
        Number(item.quantity || 1),
        Number(item.actualWeight || 0),
        Number(item.chargeWeight || 0),
        autoRate
      );
    } else if (
      field === 'chargeWeight' ||
      field === 'actualWeight' ||
      field === 'quantity' ||
      field === 'ratePerKg'
    ) {
      const unit = item.units || 'Boxes';
      const qty = field === 'quantity' ? Number(value) : Number(item.quantity || 1);
      const actWt = field === 'actualWeight' ? Number(value) : Number(item.actualWeight || 0);
      const chgWt = field === 'chargeWeight' ? Number(value) : Number(item.chargeWeight || 0);
      let rate = field === 'ratePerKg' ? Number(value) : Number(item.ratePerKg || 0);

      // If rate is currently 0 or empty, auto-fill unit rate
      if ((!rate || rate === 0) && field !== 'ratePerKg') {
        rate = getUnitDefaultRate(unit);
        item.ratePerKg = rate;
      }

      item.freight = calculateItemFreight(unit, qty, actWt, chgWt, rate);
    }

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    const unit = 'Boxes';
    const rate = getUnitDefaultRate(unit);
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length}`,
        description: '',
        packingType: 'Boxes',
        quantity: 1,
        units: unit,
        actualWeight: 0,
        chargeWeight: 0,
        ratePerKg: rate,
        freight: calculateItemFreight(unit, 1, 0, 0, rate),
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculated totals
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalActualWeight = items.reduce((sum, item) => sum + (Number(item.actualWeight) || 0), 0);
  const totalChargeWeight = items.reduce((sum, item) => sum + (Number(item.chargeWeight) || 0), 0);
  const totalFreight = items.reduce((sum, item) => sum + (Number(item.freight) || 0), 0);

  // Subtotal of charges before tax
  const subTotalCharges =
    totalFreight +
    Number(vasuli) +
    Number(handling) +
    Number(doorCollection) +
    Number(doorDelivery) +
    Number(otherCharges);

  const gstTax = Math.round((subTotalCharges * gstPercent) / 100);
  const grandTotal = subTotalCharges + gstTax;

  const executeSave = (andPrint: boolean) => {
    setValidationError(null);

    // RBAC Security Validations
    if (isRestrictedEdit) {
      setValidationError(
        'LR Modification Restricted: Only System Administrator (KUDKE BALIRAM) is authorized to modify existing booked consignments.'
      );
      return;
    }
    if (!isEditing && !canCreateLR) {
      setValidationError(
        'LR Creation Restricted: You do not have permission to book new LRs.'
      );
      return;
    }

    // Form Validations
    if (!lrNumber.trim()) {
      setValidationError('LR Number is required.');
      return;
    }
    if (!bookingDate) {
      setValidationError('Booking Date is required.');
      return;
    }
    if (!consignorName.trim()) {
      setValidationError('Consignor Name is required.');
      return;
    }
    if (!consigneeName.trim()) {
      setValidationError('Consignee Name is required.');
      return;
    }
    if (!fromLocation.trim()) {
      setValidationError('From (Booking Location) is required.');
      return;
    }
    if (!toLocation.trim()) {
      setValidationError('To (Destination) is required.');
      return;
    }
    if (items.length === 0 || !items[0].description.trim()) {
      setValidationError('Please specify at least one goods item description.');
      return;
    }
    if (totalQuantity <= 0) {
      setValidationError('Total quantity must be greater than 0.');
      return;
    }
    if (totalActualWeight <= 0) {
      setValidationError('Actual weight must be greater than 0 KG.');
      return;
    }

    setIsSubmitting(true);

    const branchObj = branches.find((b) => b.code === branchCode);

    const recordToSave: LRRecord = {
      id: initialLR?.id || `lr-${Date.now()}`,
      lrNumber: lrNumber.trim().toUpperCase(),
      bookingDate,
      branchCode,
      branchName: branchObj?.name || branchCode,
      consignorName: consignorName.trim(),
      consignorGstin: consignorGstin.trim(),
      consignorAddress: consignorAddress.trim(),
      consignorMobile: consignorMobile.trim(),
      consigneeName: consigneeName.trim(),
      consigneeGstin: consigneeGstin.trim(),
      consigneeAddress: consigneeAddress.trim(),
      consigneeMobile: consigneeMobile.trim(),
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverMobile: driverMobile.trim(),
      paymentMode,
      deliveryType,
      eWayBillNo: eWayBillNo.trim(),
      freightUpToBranch: freightUpToBranch.trim(),
      toBranch: toBranch.trim(),
      collectionType,
      ccType,
      specialRemarks: specialRemarks.trim(),
      items,
      totalQuantity,
      totalActualWeight,
      totalChargeWeight: totalChargeWeight > 0 ? totalChargeWeight : totalActualWeight,
      totalFreight,
      charges: {
        freight: totalFreight,
        vasuli: Number(vasuli) || 0,
        handling: Number(handling) || 0,
        doorCollection: Number(doorCollection) || 0,
        doorDelivery: Number(doorDelivery) || 0,
        otherCharges: Number(otherCharges) || 0,
        gstTax,
        grandTotal,
      },
      status: initialLR?.status || 'BOOKED',
      paymentStatus:
        paymentMode === 'PAID' ? 'PAID' : initialLR?.paymentStatus || 'PENDING',
      paidAmount: paymentMode === 'PAID' ? grandTotal : initialLR?.paidAmount || 0,
      createdAt: initialLR?.createdAt || new Date().toISOString(),
      createdBy: initialLR?.createdBy || currentUser.username,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = StorageService.saveLR(recordToSave);
      setIsSubmitting(false);
      onSaveSuccess(saved, andPrint);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown storage error';
      setValidationError(`Failed to save LR: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave(true); // Default form submission (e.g. pressing Enter) saves and opens print!
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            id="btn-lr-entry-back"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Return to Register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white rounded-xl p-1 border-2 border-amber-400 shadow-xs flex items-center justify-center flex-shrink-0">
            <img
              src="/company_logo.jpg"
              alt="Chakan Transport Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                Consignment Note
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {branchCode} Booking Office
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {initialLR ? `EDIT CONSIGNMENT: ${initialLR.lrNumber}` : 'NEW LR / CONSIGNMENT BOOKING'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-right mr-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Auto LR Number</span>
            <span className="text-sm sm:text-base font-black font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {lrNumber}
            </span>
          </div>

          {isRestrictedEdit ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/90 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-800" />
              <span>Modification Restricted (Admin Only)</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => executeSave(false)}
                disabled={isSubmitting}
                id="btn-lr-top-save-only"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                title="Save LR record to storage without opening print view"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Save Only</span>
              </button>

              <button
                type="button"
                onClick={() => executeSave(true)}
                disabled={isSubmitting}
                id="btn-lr-top-save-print"
                className="inline-flex items-center gap-2 px-4.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
                title="Save LR and immediately open 3-in-1 A4 print page"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>SAVE & PRINT A4</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ADMIN LR EDIT MODE BANNER */}
      {initialLR && canModifyLR && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-emerald-950 font-bold text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-2xs flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm uppercase text-emerald-900 flex items-center gap-2">
                <span>ADMIN LR EDIT MODE (LR संपादन मोड सुरू आहे)</span>
                <span className="font-mono text-xs bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded border border-emerald-400">
                  {initialLR.lrNumber}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                तुम्ही सिस्टीम ॲडमिन म्हणून या LR चे सर्व तपशील (पार्टी नाव, वजन, युनिट दर, चार्जेस, वाहन व ड्रायव्हर) थेट बदलू शकता.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <span className="text-[11px] font-mono font-black bg-white text-emerald-900 border border-emerald-400 px-3 py-1.5 rounded-lg shadow-2xs">
              Authorized: {currentUser.name}
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition"
            >
              Cancel Edit
            </button>
          </div>
        </div>
      )}

      {isRestrictedEdit && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 flex-shrink-0 text-amber-700" />
            <div>
              <div className="text-xs font-black uppercase tracking-wide">
                LR Modification Restricted (Read-Only Mode)
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Consignment {initialLR?.lrNumber} is protected. Only System Administrator (KUDKE BALIRAM) is authorized to modify existing booked consignments or alter freight charges.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2.5 py-1 rounded">
            Admin Only
          </span>
        </div>
      )}

      {isRestrictedEdit && (
        <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-950 font-bold text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <div className="font-black text-sm uppercase text-rose-900">
                LR संपादन केवळ ॲडमिन (Admin) यांनाच अनुमत आहे
              </div>
              <div className="text-[11px] text-rose-800 font-medium">
                कोणतीही LR ही ॲडमिन शिवाय एडिट करता येत नाही. LR {lrNumber} चे तपशील बदलण्यासाठी कृपया ॲडमिन (KUDKE BALIRAM) यांच्याशी संपर्क साधा.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex-shrink-0 cursor-pointer self-start sm:self-auto"
          >
            ← मागे जा (Back)
          </button>
        </div>
      )}

      {validationError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-lg flex items-center gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isRestrictedEdit} className="space-y-6 disabled:opacity-60 disabled:cursor-not-allowed">
        {/* SECTION 1: BOOKING & BRANCH DETAILS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>1. Booking Office & Consignment Header</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Branch Booking Hub <span className="text-rose-500">*</span>
              </label>
              <select
                value={branchCode}
                onChange={(e) => handleBranchChange(e.target.value)}
                id="select-lr-branch"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Booking Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                id="input-lr-date"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                id="select-lr-payment-mode"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="TO PAY">TO PAY (Pay on Delivery)</option>
                <option value="PAID">PAID (Pre-Paid at Booking)</option>
                <option value="TBB">TBB (To Be Billed / Credit)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Delivery Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                id="select-lr-delivery-type"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="DOOR DELIVERY">DOOR DELIVERY (Direct Consignee)</option>
                <option value="GODOWN DELIVERY">GODOWN DELIVERY (Hub Pick-up)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: CONSIGNOR & CONSIGNEE DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Consignor (Sender) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span>2. Consignor (Sender / Party)</span>
              </h3>
              {customers.length > 0 && (
                <select
                  tabIndex={-1}
                  onChange={(e) => handleSelectConsignor(e.target.value)}
                  defaultValue=""
                  id="select-quick-consignor"
                  className="text-[11px] bg-blue-50 text-blue-800 font-medium px-2 py-1 rounded border border-blue-200"
                >
                  <option value="" disabled>
                    Quick Fill from Master...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <CustomerAutocomplete
                id="input-consignor-name"
                label="Consignor Name / Company"
                required
                value={consignorName}
                onChange={setConsignorName}
                onSelectCustomer={handleSelectConsignorCustomer}
                customers={customers}
                placeholder="Type starting letters (e.g. Tata Motors...)"
                accentColor="blue"
                helpText="Type starting letters to see automatic customer suggestions"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consignor GSTIN</label>
                  <input
                    type="text"
                    value={consignorGstin}
                    onChange={(e) => setConsignorGstin(e.target.value.toUpperCase())}
                    id="input-consignor-gstin"
                    placeholder="27AAACT2727Q1ZW"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={consignorMobile}
                    onChange={(e) => setConsignorMobile(e.target.value)}
                    id="input-consignor-mobile"
                    placeholder="+91 98220 12345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consignor Address & Plant</label>
                <textarea
                  rows={2}
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  id="input-consignor-address"
                  placeholder="Plot G-1, MIDC Chakan Phase II, Pune - 410501"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Consignee (Receiver) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>3. Consignee (Receiver / Destination Party)</span>
              </h3>
              {customers.length > 0 && (
                <select
                  tabIndex={-1}
                  onChange={(e) => handleSelectConsignee(e.target.value)}
                  defaultValue=""
                  id="select-quick-consignee"
                  className="text-[11px] bg-emerald-50 text-emerald-800 font-medium px-2 py-1 rounded border border-emerald-200"
                >
                  <option value="" disabled>
                    Quick Fill from Master...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <CustomerAutocomplete
                id="input-consignee-name"
                label="Consignee Name / Company"
                required
                value={consigneeName}
                onChange={setConsigneeName}
                onSelectCustomer={handleSelectConsigneeCustomer}
                customers={customers}
                placeholder="Type starting letters (e.g. Bajaj Auto...)"
                accentColor="emerald"
                helpText="Type starting letters to see automatic customer suggestions"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consignee GSTIN</label>
                  <input
                    type="text"
                    value={consigneeGstin}
                    onChange={(e) => setConsigneeGstin(e.target.value.toUpperCase())}
                    id="input-consignee-gstin"
                    placeholder="27AABCB0500Q1Z8"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={consigneeMobile}
                    onChange={(e) => setConsigneeMobile(e.target.value)}
                    id="input-consignee-mobile"
                    placeholder="+91 98220 54321"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consignee Address & Godown</label>
                <textarea
                  rows={2}
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  id="input-consignee-address"
                  placeholder="Sector B, Waluj Industrial Area, Aurangabad - 431136"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ROUTE & FLEET DISPATCH DETAILS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>4. Route, Transit & Vehicle Assignment</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                From / Booking Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                id="input-lr-from"
                placeholder="Chakan, Pune"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                To / Destination <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                id="input-lr-to"
                placeholder="e.g. Waluj, Aurangabad / Kalamboli"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Vehicle Number</span>
                {vehicles.length > 0 && (
                  <select
                    onChange={(e) => handleSelectVehicle(e.target.value)}
                    defaultValue=""
                    className="text-[10px] text-blue-700 font-bold bg-transparent"
                  >
                    <option value="" disabled>
                      Select Vehicle
                    </option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNumber}>
                        {v.vehicleNumber} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <input
                type="text"
                list="lr-vehicles-datalist"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                id="input-lr-vehicle"
                placeholder="MH-14-CW-7890"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <datalist id="lr-vehicles-datalist">
                {vehicles.map((v) => (
                  <option key={v.id} value={v.vehicleNumber}>
                    {v.vehicleType} • {v.ownerName}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Driver Name & Phone</span>
                {drivers.length > 0 && (
                  <select
                    onChange={(e) => handleSelectDriver(e.target.value)}
                    defaultValue=""
                    className="text-[10px] text-blue-700 font-bold bg-transparent"
                  >
                    <option value="" disabled>
                      Select Driver
                    </option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  list="lr-drivers-datalist"
                  value={driverName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDriverName(val);
                    const matched = drivers.find((d) => d.name.toLowerCase() === val.trim().toLowerCase());
                    if (matched && matched.mobile) {
                      setDriverMobile(matched.mobile);
                    }
                  }}
                  id="input-lr-driver-name"
                  placeholder="Driver Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <input
                  type="text"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  id="input-lr-driver-phone"
                  placeholder="Mobile No."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <datalist id="lr-drivers-datalist">
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    Phone: {d.mobile}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-Way Bill No.</label>
              <input
                type="text"
                value={eWayBillNo}
                onChange={(e) => setEWayBillNo(e.target.value)}
                id="input-lr-eway"
                placeholder="12-digit E-Way Bill No."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Freight Up To Branch</label>
              <input
                type="text"
                value={freightUpToBranch}
                onChange={(e) => setFreightUpToBranch(e.target.value)}
                id="input-lr-freight-branch"
                placeholder="e.g. AURANGABAD HUB"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">To Branch Code</label>
              <input
                type="text"
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value.toUpperCase())}
                id="input-lr-to-branch"
                placeholder="e.g. AUR / MUM / PUN"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Collection / CC Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value)}
                  placeholder="Collection"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-slate-900 text-[11px]"
                />
                <input
                  type="text"
                  value={ccType}
                  onChange={(e) => setCcType(e.target.value)}
                  placeholder="CC Type"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-slate-900 text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: GOODS / PACKAGE SECTION (MULTIPLE ROWS & AUTO TOTALS) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>5. Consignment Goods & Packages (Multiple Item Rows)</span>
              </h2>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-emerald-800">
                  मटेरिअल टाकल्यानंतर युनिट (Units: Bags, Boxes, Nos, KG, Ton, Drums) निवडताच दर (Rate) आपोआप येईल आणि एकूण भाडे (Freight) ऑटो-कॅल्क्युलेट होईल.
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={addItemRow}
                id="btn-add-goods-row"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Goods Row</span>
              </button>
            </div>
          </div>

          {/* Quick Material Selection Chips */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Material Autofill (वारंवार लागणारे मटेरिअल - १ क्लिकवर भरा):</span>
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                Auto Unit & Rate Enabled
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {COMMON_MATERIALS.slice(0, 8).map((mat) => (
                <button
                  key={mat.name}
                  type="button"
                  onClick={() => {
                    // Update current first row or last empty row with this material
                    const updated = [...items];
                    let targetIdx = updated.findIndex((r) => !r.description.trim());
                    if (targetIdx < 0) targetIdx = 0;
                    const autoRate = getUnitDefaultRate(mat.defaultUnit);
                    updated[targetIdx] = {
                      ...updated[targetIdx],
                      description: mat.name,
                      packingType: mat.defaultPacking,
                      units: mat.defaultUnit,
                      ratePerKg: autoRate,
                      freight: calculateItemFreight(
                        mat.defaultUnit,
                        Number(updated[targetIdx].quantity || 1),
                        Number(updated[targetIdx].actualWeight || 0),
                        Number(updated[targetIdx].chargeWeight || 0),
                        autoRate
                      ),
                    };
                    setItems(updated);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-300 hover:border-blue-400 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>{mat.name.split('/')[0].trim()}</span>
                  <span className="text-[9px] text-slate-400">({mat.defaultUnit})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Datalist for fast material autocompletion */}
          <datalist id="common-goods-list">
            {COMMON_MATERIALS.map((mat) => (
              <option key={mat.name} value={mat.name}>
                {mat.marathi} ({mat.defaultUnit})
              </option>
            ))}
          </datalist>

          <div className="overflow-x-auto w-full max-w-full min-w-0">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 w-4/12">Description of Goods (मटेरिअल तपशील)</th>
                  <th className="py-2.5 px-2 w-2/12">Packing Type</th>
                  <th className="py-2.5 px-2 w-1/12 text-center">Qty</th>
                  <th className="py-2.5 px-2 w-2/12 text-center">
                    <span>Units (युनिट)</span>
                    <span className="block text-[8px] font-normal text-emerald-700">निवडताच दर ऑटो येतो</span>
                  </th>
                  <th className="py-2.5 px-2 w-1/12 text-right">Actual Wt (KG)</th>
                  <th className="py-2.5 px-2 w-1/12 text-right">Charge Wt (KG)</th>
                  <th className="py-2.5 px-2 w-1/12 text-right">
                    <span>Rate (दर)</span>
                    <span className="block text-[8px] font-bold text-emerald-800">Auto / Unit</span>
                  </th>
                  <th className="py-2.5 px-2 w-1/12 text-right">Freight (₹)</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        list="common-goods-list"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="उदा. Auto Parts / Cement Bags / Steel Coil"
                        required
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.packingType}
                        onChange={(e) => handleItemChange(idx, 'packingType', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Boxes">Boxes (खोके)</option>
                        <option value="Bags">Bags (बॅग्ज / पोती)</option>
                        <option value="Wooden Crates">Wooden Crates (लाकडी क्रेट्स)</option>
                        <option value="Wooden Boxes">Wooden Boxes</option>
                        <option value="Pallets">Pallets (पॅलेट्स)</option>
                        <option value="Drums">Drums (ड्रम)</option>
                        <option value="Metal Crates">Metal Crates</option>
                        <option value="Bundles">Bundles (बंडल)</option>
                        <option value="Loose / Machinery">Loose / Machinery</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-center font-mono font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.units}
                        onChange={(e) => handleItemChange(idx, 'units', e.target.value)}
                        className="w-full bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold rounded px-1.5 py-1.5 text-xs text-center focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                      >
                        <option value="Bags">Bags (बॅग्ज/पोती) - ₹{getUnitDefaultRate('Bags')}</option>
                        <option value="Boxes">Boxes (खोके/बॉक्स) - ₹{getUnitDefaultRate('Boxes')}</option>
                        <option value="Nos">Nos (नग) - ₹{getUnitDefaultRate('Nos')}</option>
                        <option value="Crates">Crates (क्रेट्स) - ₹{getUnitDefaultRate('Crates')}</option>
                        <option value="Drums">Drums (ड्रम) - ₹{getUnitDefaultRate('Drums')}</option>
                        <option value="Pallets">Pallets (पॅलेट्स) - ₹{getUnitDefaultRate('Pallets')}</option>
                        <option value="Bundles">Bundles (बंडल) - ₹{getUnitDefaultRate('Bundles')}</option>
                        <option value="Pkgs">Pkgs (पॅकेजेस) - ₹{getUnitDefaultRate('Pkgs')}</option>
                        <option value="KG">KG (किलो) - ₹{getUnitDefaultRate('KG')}</option>
                        <option value="MT">MT / Ton (टन) - ₹{getUnitDefaultRate('MT')}</option>
                        <option value="TRIP">TRIP (ट्रिप) - ₹{getUnitDefaultRate('TRIP')}</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.actualWeight || ''}
                        onChange={(e) => handleItemChange(idx, 'actualWeight', Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-right font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.chargeWeight || ''}
                        onChange={(e) => handleItemChange(idx, 'chargeWeight', Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-right font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.ratePerKg || ''}
                          onChange={(e) => handleItemChange(idx, 'ratePerKg', Number(e.target.value))}
                          placeholder={`₹/${item.units}`}
                          title={`Auto Rate: ₹${item.ratePerKg || 0} प्रति ${item.units}. You can edit this anytime.`}
                          className="w-full bg-emerald-50/70 border-2 border-emerald-500 rounded px-2 py-1.5 text-xs text-right font-mono font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                        />
                        <span className="absolute -top-2 right-1 px-1 bg-emerald-600 text-white text-[8px] font-black rounded uppercase shadow-2xs">
                          ₹/{item.units}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.freight || ''}
                        onChange={(e) => handleItemChange(idx, 'freight', Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (idx === items.length - 1) {
                              addItemRow();
                            }
                          }
                        }}
                        placeholder="₹"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-right font-mono font-black text-blue-700 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded cursor-pointer"
                        title="Remove Item Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-300 text-slate-900">
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-[11px] text-slate-700">
                    Calculated Goods Totals:
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-blue-700">{totalQuantity}</td>
                  <td className="py-2.5 px-2 text-center text-slate-500 text-[10px]">Total</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-900">{totalActualWeight} KG</td>
                  <td className="py-2.5 px-2 text-right font-mono text-blue-700">{totalChargeWeight} KG</td>
                  <td className="py-2.5 px-2 text-right text-slate-500">—</td>
                  <td className="py-2.5 px-2 text-right font-mono text-blue-700 font-black">
                    ₹{totalFreight.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 5: CHARGES, GST & GRAND TOTAL BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Remarks */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              6. Special Handling Remarks & Instructions
            </h3>
            <textarea
              rows={4}
              value={specialRemarks}
              onChange={(e) => setSpecialRemarks(e.target.value)}
              id="input-lr-remarks"
              placeholder="e.g. Heavy machinery precision assemblies. Handle with hydraulic cranes. Fragile parts."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Standard Terms Applied:</span>
              </div>
              <p className="text-slate-600">
                Goods carried at Owner's Risk. Demurrage charged after 3 days of arrival. Subject to Pune jurisdiction.
              </p>
            </div>
          </div>

          {/* Charges Ledger */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>7. Applicable Charges Breakdown & Grand Total</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Auto-Sum
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Base Freight (₹)</label>
                <input
                  type="number"
                  value={totalFreight}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Vasuli / Collection (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={vasuli || ''}
                  onChange={(e) => setVasuli(Number(e.target.value))}
                  id="input-charge-vasuli"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Handling / B.C. (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={handling || ''}
                  onChange={(e) => setHandling(Number(e.target.value))}
                  id="input-charge-handling"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Door Collection (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={doorCollection || ''}
                  onChange={(e) => setDoorCollection(Number(e.target.value))}
                  id="input-charge-door-col"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Door Delivery (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={doorDelivery || ''}
                  onChange={(e) => setDoorDelivery(Number(e.target.value))}
                  id="input-charge-door-del"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Other Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={otherCharges || ''}
                  onChange={(e) => setOtherCharges(Number(e.target.value))}
                  id="input-charge-other"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Subtotal & GST row */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Subtotal Charges</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ₹{subTotalCharges.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-bold">GST:</span>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="bg-slate-100 border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                  >
                    <option value="0">0% (RCM / Exempt)</option>
                    <option value="5">5% (Standard GTA)</option>
                    <option value="12">12% (Forward GTA)</option>
                    <option value="18">18% (Composite)</option>
                  </select>
                  <span className="font-mono font-bold text-slate-800">
                    +₹{gstTax.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Grand Total Amount
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
        </fieldset>

        {/* SUBMIT BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            id="btn-lr-cancel"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
          >
            Cancel & Return
          </button>

          {isRestrictedEdit ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 border border-amber-300 text-amber-950 rounded-lg text-xs font-bold shadow-2xs">
              <Lock className="w-4 h-4 text-amber-800" />
              <span>LR Modification Restricted (Only Administrator KUDKE BALIRAM can save modifications)</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => executeSave(false)}
                disabled={isSubmitting}
                id="btn-lr-save-only"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Save Only (Skip Print)</span>
              </button>

              <button
                type="button"
                onClick={() => executeSave(true)}
                disabled={isSubmitting}
                id="btn-lr-save-print"
                className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving & Preparing Document...' : 'SAVE & PRINT / PDF (3-in-1 A4)'}</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
