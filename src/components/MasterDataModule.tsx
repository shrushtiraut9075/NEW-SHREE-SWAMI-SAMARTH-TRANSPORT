import React, { useState } from 'react';
import {
  Building2,
  Users2,
  Truck,
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileText,
} from 'lucide-react';
import { Branch, Customer, Vehicle, Driver, User } from '../types';
import { StorageService } from '../services/storage';

interface MasterDataModuleProps {
  type: 'BRANCHES' | 'CUSTOMERS' | 'VEHICLES' | 'DRIVERS';
  branches: Branch[];
  customers: Customer[];
  vehicles: Vehicle[];
  drivers: Driver[];
  currentUser: User;
  onRefresh: () => void;
}

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({
  type,
  branches,
  customers,
  vehicles,
  drivers,
  currentUser,
  onRefresh,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isOperator = currentUser.role === 'OPERATOR';
  const canEdit = isAdmin || isOperator;

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states for Branch
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    code: '',
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
    status: 'ACTIVE',
  });

  // Form states for Customer
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    name: '',
    gstin: '',
    pan: '',
    address: '',
    contact: '',
    email: '',
    paymentTerms: '30 Days Credit',
    status: 'ACTIVE',
  });

  // Form states for Vehicle
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
    vehicleNumber: '',
    vehicleType: 'Heavy Truck 10-Wheeler (16T)',
    capacityTons: 16,
    ownerName: 'Company Owned',
    fitnessExpiry: '',
    insuranceExpiry: '',
    status: 'AVAILABLE',
  });

  // Form states for Driver
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({
    name: '',
    licenseNumber: '',
    mobile: '',
    address: '',
    licenseExpiry: '',
    status: 'ACTIVE',
  });

  const openAddModal = () => {
    setEditingItem(null);
    if (type === 'BRANCHES') {
      setBranchForm({ code: '', name: '', address: '', contactPerson: '', phone: '', status: 'ACTIVE' });
    } else if (type === 'CUSTOMERS') {
      setCustomerForm({ name: '', gstin: '', pan: '', address: '', contact: '', email: '', paymentTerms: '30 Days Credit', status: 'ACTIVE' });
    } else if (type === 'VEHICLES') {
      setVehicleForm({ vehicleNumber: '', vehicleType: 'Heavy Truck 10-Wheeler (16T)', capacityTons: 16, ownerName: 'Company Owned', fitnessExpiry: '', insuranceExpiry: '', status: 'AVAILABLE' });
    } else if (type === 'DRIVERS') {
      setDriverForm({ name: '', licenseNumber: '', mobile: '', address: '', licenseExpiry: '', status: 'ACTIVE' });
    }
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (type === 'BRANCHES') setBranchForm(item);
    else if (type === 'CUSTOMERS') setCustomerForm(item);
    else if (type === 'VEHICLES') setVehicleForm(item);
    else if (type === 'DRIVERS') setDriverForm(item);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'BRANCHES') {
      const b: Branch = {
        id: editingItem?.id || `branch-${Date.now()}`,
        code: (branchForm.code || '').toUpperCase().trim(),
        name: branchForm.name?.trim() || '',
        address: branchForm.address?.trim() || '',
        contactPerson: branchForm.contactPerson?.trim() || '',
        phone: branchForm.phone?.trim() || '',
        status: branchForm.status || 'ACTIVE',
      };
      StorageService.saveBranch(b);
    } else if (type === 'CUSTOMERS') {
      const c: Customer = {
        id: editingItem?.id || `cust-${Date.now()}`,
        name: customerForm.name?.trim() || '',
        gstin: (customerForm.gstin || '').toUpperCase().trim(),
        pan: (customerForm.pan || '').toUpperCase().trim(),
        address: customerForm.address?.trim() || '',
        contact: customerForm.contact?.trim() || '',
        email: customerForm.email?.trim() || '',
        paymentTerms: customerForm.paymentTerms || '30 Days Credit',
        status: customerForm.status || 'ACTIVE',
      };
      StorageService.saveCustomer(c);
    } else if (type === 'VEHICLES') {
      const v: Vehicle = {
        id: editingItem?.id || `veh-${Date.now()}`,
        vehicleNumber: (vehicleForm.vehicleNumber || '').toUpperCase().trim(),
        vehicleType: vehicleForm.vehicleType || 'Heavy Truck 10-Wheeler',
        capacityTons: Number(vehicleForm.capacityTons) || 16,
        ownerName: vehicleForm.ownerName?.trim() || 'Company Owned',
        fitnessExpiry: vehicleForm.fitnessExpiry || '',
        insuranceExpiry: vehicleForm.insuranceExpiry || '',
        status: vehicleForm.status || 'AVAILABLE',
      };
      StorageService.saveVehicle(v);
    } else if (type === 'DRIVERS') {
      const d: Driver = {
        id: editingItem?.id || `drv-${Date.now()}`,
        name: driverForm.name?.trim() || '',
        licenseNumber: (driverForm.licenseNumber || '').toUpperCase().trim(),
        mobile: driverForm.mobile?.trim() || '',
        address: driverForm.address?.trim() || '',
        licenseExpiry: driverForm.licenseExpiry || '',
        status: driverForm.status || 'ACTIVE',
      };
      StorageService.saveDriver(d);
    }

    setShowModal(false);
    onRefresh();
  };

  const getTitle = () => {
    switch (type) {
      case 'BRANCHES':
        return { name: 'Branch Master', sub: 'Operating transport hubs, godowns and booking stations', icon: Building2 };
      case 'CUSTOMERS':
        return { name: 'Customer / Party Master', sub: 'Consignors, Consignees, GST numbers and billing profiles', icon: Users2 };
      case 'VEHICLES':
        return { name: 'Vehicle Master', sub: 'Fleet trucks, trailers, capacity in metric tons and fitness validity', icon: Truck };
      case 'DRIVERS':
        return { name: 'Driver Master', sub: 'Licensed heavy vehicle drivers, contact information and license details', icon: UserCheck };
    }
  };

  const titleInfo = getTitle();
  const Icon = titleInfo.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700 border border-blue-200">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Master Data Management
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {titleInfo.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{titleInfo.sub}</p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD NEW ENTRY</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${titleInfo.name}...`}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-900"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* 1. BRANCH MASTER TABLE */}
      {type === 'BRANCHES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Branch Code</th>
                  <th className="py-3 px-3">Hub Name</th>
                  <th className="py-3 px-3">Address & Godown</th>
                  <th className="py-3 px-3">Manager / In-Charge</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {canEdit && <th className="py-3 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches
                  .filter((b) =>
                    searchQuery
                      ? b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.name.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-black text-blue-700">{b.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{b.name}</td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{b.address}</td>
                      <td className="py-2.5 px-3 text-slate-800">{b.contactPerson}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{b.phone}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {b.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER MASTER TABLE */}
      {type === 'CUSTOMERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Customer / Company Name</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">PAN</th>
                  <th className="py-3 px-3">Address & Plant</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-2 text-center">Payment Terms</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {canEdit && <th className="py-3 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers
                  .filter((c) =>
                    searchQuery
                      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.gstin.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{c.gstin}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{c.pan}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{c.address}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{c.contact}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                          {c.paymentTerms}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VEHICLE MASTER TABLE */}
      {type === 'VEHICLES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Vehicle Number</th>
                  <th className="py-3 px-3">Vehicle Type</th>
                  <th className="py-3 px-2 text-center">Capacity (MT)</th>
                  <th className="py-3 px-3">Owner / Contractor</th>
                  <th className="py-3 px-3">Fitness Expiry</th>
                  <th className="py-3 px-3">Insurance Expiry</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {canEdit && <th className="py-3 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles
                  .filter((v) =>
                    searchQuery
                      ? v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                        {v.vehicleNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{v.vehicleType}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-700">
                        {v.capacityTons} MT
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{v.ownerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{v.fitnessExpiry}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{v.insuranceExpiry}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {v.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DRIVER MASTER TABLE */}
      {type === 'DRIVERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Driver Name</th>
                  <th className="py-3 px-3">License Number</th>
                  <th className="py-3 px-3">Mobile Phone</th>
                  <th className="py-3 px-3">Residential Address</th>
                  <th className="py-3 px-3">License Expiry</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {canEdit && <th className="py-3 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers
                  .filter((d) =>
                    searchQuery
                      ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{d.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {d.licenseNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{d.mobile}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{d.address}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{d.licenseExpiry}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {d.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MASTER DATA EDIT / ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h2 className="text-sm font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
              {editingItem ? 'Edit Entry' : 'Add New Entry'} - {titleInfo.name}
            </h2>

            <form onSubmit={handleSave} className="space-y-3">
              {type === 'BRANCHES' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                      <input
                        type="text"
                        value={branchForm.code}
                        onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                        required
                        placeholder="CHK"
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hub Name *</label>
                      <input
                        type="text"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                        required
                        placeholder="Chakan Hub"
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={branchForm.contactPerson}
                        onChange={(e) => setBranchForm({ ...branchForm, contactPerson: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {type === 'CUSTOMERS' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer / Party Name *</label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={customerForm.gstin}
                        onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PAN</label>
                      <input
                        type="text"
                        value={customerForm.pan}
                        onChange={(e) => setCustomerForm({ ...customerForm, pan: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={customerForm.contact}
                        onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={customerForm.paymentTerms}
                        onChange={(e) => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                      />
                    </div>
                  </div>
                </>
              )}

              {type === 'VEHICLES' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vehicle Number *</label>
                      <input
                        type="text"
                        value={vehicleForm.vehicleNumber}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Capacity (MT) *</label>
                      <input
                        type="number"
                        value={vehicleForm.capacityTons}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, capacityTons: Number(e.target.value) })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                    <input
                      type="text"
                      value={vehicleForm.vehicleType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owner / Transporter</label>
                    <input
                      type="text"
                      value={vehicleForm.ownerName}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, ownerName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                </>
              )}

              {type === 'DRIVERS' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">License No. *</label>
                      <input
                        type="text"
                        value={driverForm.licenseNumber}
                        onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value.toUpperCase() })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                      <input
                        type="text"
                        value={driverForm.mobile}
                        onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={driverForm.address}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-black shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
