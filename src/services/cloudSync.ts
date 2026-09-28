import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  LRRecord,
  MRRecord,
  LHSRecord,
  Customer,
  Branch,
  Vehicle,
  Driver,
  PaymentRecord,
  StockTransferRecord,
  CompanyProfile,
  User,
  AuditLogItem,
} from '../types';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  recordsCount: {
    lrs: number;
    mrs: number;
    lhs: number;
    customers: number;
  };
  errorMessage?: string;
}

type SyncListener = (state: SyncState) => void;
type DataChangeListener = () => void;

function cleanForFirestore<T>(data: T): Record<string, any> {
  return JSON.parse(JSON.stringify(data));
}

class CloudSyncService {
  private syncState: SyncState = {
    status: 'syncing',
    lastSyncedAt: null,
    recordsCount: { lrs: 0, mrs: 0, lhs: 0, customers: 0 },
  };

  private syncListeners: Set<SyncListener> = new Set();
  private dataChangeListeners: Set<DataChangeListener> = new Set();
  private unsubscribeFns: Array<() => void> = [];
  private isInitialized = false;

  public subscribeSyncState(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.syncState);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  public subscribeDataChange(listener: DataChangeListener): () => void {
    this.dataChangeListeners.add(listener);
    return () => {
      this.dataChangeListeners.delete(listener);
    };
  }

  private notifySyncState() {
    this.syncListeners.forEach((fn) => {
      try {
        fn({ ...this.syncState });
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  private notifyDataChange() {
    this.dataChangeListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in data change listener:', e);
      }
    });
  }

  // Initialize real-time listeners across all devices
  public initRealtimeSync() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      this.syncState.status = 'syncing';
      this.notifySyncState();

      // 1. LRs Collection listener
      const unsubLRs = onSnapshot(
        collection(db, 'lrs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: LRRecord[] = [];
            snapshot.forEach((d) => list.push(d.data() as LRRecord));
            // Sort by bookingDate desc
            list.sort((a, b) => new Date(b.bookingDate || 0).getTime() - new Date(a.bookingDate || 0).getTime());
            localStorage.setItem('nsst_lrs_v1', JSON.stringify(list));
            this.syncState.recordsCount.lrs = list.length;
          }
          this.syncState.status = 'connected';
          this.syncState.lastSyncedAt = new Date();
          this.notifySyncState();
          this.notifyDataChange();
        },
        (err) => {
          console.warn('LRs sync warning:', err);
          this.syncState.status = 'offline';
          this.notifySyncState();
        }
      );
      this.unsubscribeFns.push(unsubLRs);

      // 2. MRs Collection listener
      const unsubMRs = onSnapshot(
        collection(db, 'mrs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: MRRecord[] = [];
            snapshot.forEach((d) => list.push(d.data() as MRRecord));
            localStorage.setItem('nsst_mrs_v1', JSON.stringify(list));
            this.syncState.recordsCount.mrs = list.length;
          }
          this.syncState.status = 'connected';
          this.syncState.lastSyncedAt = new Date();
          this.notifySyncState();
          this.notifyDataChange();
        },
        (err) => console.warn('MRs sync warning:', err)
      );
      this.unsubscribeFns.push(unsubMRs);

      // 3. LHS Collection listener
      const unsubLHS = onSnapshot(
        collection(db, 'lhs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: LHSRecord[] = [];
            snapshot.forEach((d) => list.push(d.data() as LHSRecord));
            localStorage.setItem('nsst_lhs_v1', JSON.stringify(list));
            this.syncState.recordsCount.lhs = list.length;
          }
          this.syncState.status = 'connected';
          this.syncState.lastSyncedAt = new Date();
          this.notifySyncState();
          this.notifyDataChange();
        },
        (err) => console.warn('LHS sync warning:', err)
      );
      this.unsubscribeFns.push(unsubLHS);

      // 4. Customers Collection listener
      const unsubCustomers = onSnapshot(
        collection(db, 'customers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Customer[] = [];
            snapshot.forEach((d) => list.push(d.data() as Customer));
            localStorage.setItem('nsst_customers_v1', JSON.stringify(list));
            this.syncState.recordsCount.customers = list.length;
          }
          this.syncState.status = 'connected';
          this.syncState.lastSyncedAt = new Date();
          this.notifySyncState();
          this.notifyDataChange();
        },
        (err) => console.warn('Customers sync warning:', err)
      );
      this.unsubscribeFns.push(unsubCustomers);

      // 5. Branches Collection listener
      const unsubBranches = onSnapshot(
        collection(db, 'branches'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Branch[] = [];
            snapshot.forEach((d) => list.push(d.data() as Branch));
            localStorage.setItem('nsst_branches_v1', JSON.stringify(list));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Branches sync warning:', err)
      );
      this.unsubscribeFns.push(unsubBranches);

      // 6. Vehicles Collection listener
      const unsubVehicles = onSnapshot(
        collection(db, 'vehicles'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Vehicle[] = [];
            snapshot.forEach((d) => list.push(d.data() as Vehicle));
            localStorage.setItem('nsst_vehicles_v1', JSON.stringify(list));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Vehicles sync warning:', err)
      );
      this.unsubscribeFns.push(unsubVehicles);

      // 7. Drivers Collection listener
      const unsubDrivers = onSnapshot(
        collection(db, 'drivers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Driver[] = [];
            snapshot.forEach((d) => list.push(d.data() as Driver));
            localStorage.setItem('nsst_drivers_v1', JSON.stringify(list));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Drivers sync warning:', err)
      );
      this.unsubscribeFns.push(unsubDrivers);

      // 8. Payments Collection listener
      const unsubPayments = onSnapshot(
        collection(db, 'payments'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PaymentRecord[] = [];
            snapshot.forEach((d) => list.push(d.data() as PaymentRecord));
            localStorage.setItem('nsst_payments_v1', JSON.stringify(list));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Payments sync warning:', err)
      );
      this.unsubscribeFns.push(unsubPayments);

      // 9. Stock Transfers Collection listener
      const unsubStock = onSnapshot(
        collection(db, 'stock_transfers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: StockTransferRecord[] = [];
            snapshot.forEach((d) => list.push(d.data() as StockTransferRecord));
            localStorage.setItem('nsst_stock_transfers_v1', JSON.stringify(list));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Stock Transfers sync warning:', err)
      );
      this.unsubscribeFns.push(unsubStock);

      // 10. Company Profile listener
      const unsubCompany = onSnapshot(
        doc(db, 'company', 'profile'),
        (docSnap) => {
          if (docSnap.exists()) {
            const comp = docSnap.data() as CompanyProfile;
            localStorage.setItem('nsst_company_v1', JSON.stringify(comp));
          }
          this.notifyDataChange();
        },
        (err) => console.warn('Company sync warning:', err)
      );
      this.unsubscribeFns.push(unsubCompany);

      // Check if Firestore needs initial seeding from local/defaults
      this.checkAndSeedInitialData();
    } catch (e: any) {
      console.error('Failed to init Firestore realtime sync:', e);
      this.syncState.status = 'error';
      this.syncState.errorMessage = e?.message || 'Connection error';
      this.notifySyncState();
    }
  }

  // If cloud Firestore has 0 documents (new database), populate it so all devices start with identical records
  private async checkAndSeedInitialData() {
    try {
      const lrQuery = query(collection(db, 'lrs'), limit(1));
      const lrSnapshot = await getDocs(lrQuery);

      if (lrSnapshot.empty) {
        console.log('Seeding initial records to Firestore cloud database...');
        // Read whatever is in current localStorage (or defaults) and upload
        const rawLrs = localStorage.getItem('nsst_lrs_v1');
        const rawBranches = localStorage.getItem('nsst_branches_v1');
        const rawCust = localStorage.getItem('nsst_customers_v1');
        const rawVeh = localStorage.getItem('nsst_vehicles_v1');
        const rawDriv = localStorage.getItem('nsst_drivers_v1');
        const rawMrs = localStorage.getItem('nsst_mrs_v1');
        const rawLhs = localStorage.getItem('nsst_lhs_v1');
        const rawComp = localStorage.getItem('nsst_company_v1');
        const rawUsers = localStorage.getItem('nsst_users_v1');

        const batch = writeBatch(db);

        if (rawLrs) {
          const lrs: LRRecord[] = JSON.parse(rawLrs);
          lrs.slice(0, 50).forEach((lr) => {
            const dRef = doc(db, 'lrs', lr.id);
            batch.set(dRef, cleanForFirestore(lr), { merge: true });
          });
        }
        if (rawCust) {
          const custs: Customer[] = JSON.parse(rawCust);
          custs.forEach((c) => {
            const dRef = doc(db, 'customers', c.id);
            batch.set(dRef, cleanForFirestore(c), { merge: true });
          });
        }
        if (rawBranches) {
          const branches: Branch[] = JSON.parse(rawBranches);
          branches.forEach((b) => {
            const dRef = doc(db, 'branches', b.id);
            batch.set(dRef, cleanForFirestore(b), { merge: true });
          });
        }
        if (rawVeh) {
          const vehs: Vehicle[] = JSON.parse(rawVeh);
          vehs.forEach((v) => {
            const dRef = doc(db, 'vehicles', v.id);
            batch.set(dRef, cleanForFirestore(v), { merge: true });
          });
        }
        if (rawDriv) {
          const drivs: Driver[] = JSON.parse(rawDriv);
          drivs.forEach((d) => {
            const dRef = doc(db, 'drivers', d.id);
            batch.set(dRef, cleanForFirestore(d), { merge: true });
          });
        }
        if (rawMrs) {
          const mrs: MRRecord[] = JSON.parse(rawMrs);
          mrs.forEach((m) => {
            const dRef = doc(db, 'mrs', m.id);
            batch.set(dRef, cleanForFirestore(m), { merge: true });
          });
        }
        if (rawLhs) {
          const lhs: LHSRecord[] = JSON.parse(rawLhs);
          lhs.forEach((l) => {
            const dRef = doc(db, 'lhs', l.id);
            batch.set(dRef, cleanForFirestore(l), { merge: true });
          });
        }
        if (rawComp) {
          const comp: CompanyProfile = JSON.parse(rawComp);
          const dRef = doc(db, 'company', 'profile');
          batch.set(dRef, cleanForFirestore(comp), { merge: true });
        }
        if (rawUsers) {
          const users: User[] = JSON.parse(rawUsers);
          users.forEach((u) => {
            const dRef = doc(db, 'users', u.id);
            batch.set(dRef, cleanForFirestore(u), { merge: true });
          });
        }

        await batch.commit();
        console.log('Initial data seeded successfully to cloud Firestore.');
        this.syncState.status = 'connected';
        this.syncState.lastSyncedAt = new Date();
        this.notifySyncState();
      }
    } catch (e) {
      console.warn('Initial seeding note:', e);
    }
  }

  // Real-time mutations to Cloud Firestore
  public async syncLR(lr: LRRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'lrs', lr.id), cleanForFirestore(lr), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing LR to cloud:', e);
    }
  }

  public async deleteLR(lrId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'lrs', lrId));
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error deleting LR from cloud:', e);
    }
  }

  public async syncMR(mr: MRRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'mrs', mr.id), cleanForFirestore(mr), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing MR to cloud:', e);
    }
  }

  public async syncLHS(lhs: LHSRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'lhs', lhs.id), cleanForFirestore(lhs), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing LHS to cloud:', e);
    }
  }

  public async syncCustomer(customer: Customer): Promise<void> {
    try {
      await setDoc(doc(db, 'customers', customer.id), cleanForFirestore(customer), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing customer to cloud:', e);
    }
  }

  public async syncBranch(branch: Branch): Promise<void> {
    try {
      await setDoc(doc(db, 'branches', branch.id), cleanForFirestore(branch), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing branch to cloud:', e);
    }
  }

  public async syncVehicle(vehicle: Vehicle): Promise<void> {
    try {
      await setDoc(doc(db, 'vehicles', vehicle.id), cleanForFirestore(vehicle), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing vehicle to cloud:', e);
    }
  }

  public async syncDriver(driver: Driver): Promise<void> {
    try {
      await setDoc(doc(db, 'drivers', driver.id), cleanForFirestore(driver), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing driver to cloud:', e);
    }
  }

  public async syncPayment(payment: PaymentRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'payments', payment.id), cleanForFirestore(payment), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing payment to cloud:', e);
    }
  }

  public async syncStockTransfer(trf: StockTransferRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'stock_transfers', trf.id), cleanForFirestore(trf), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing stock transfer to cloud:', e);
    }
  }

  public async syncCompany(company: CompanyProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'company', 'profile'), cleanForFirestore(company), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing company profile to cloud:', e);
    }
  }

  public async syncUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), cleanForFirestore(user), { merge: true });
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
    } catch (e) {
      console.error('Error syncing user to cloud:', e);
    }
  }

  public async syncAuditLog(log: AuditLogItem): Promise<void> {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), cleanForFirestore(log), { merge: true });
    } catch (e) {
      console.warn('Error syncing audit log to cloud:', e);
    }
  }

  // Force sync / pull latest records immediately
  public async forceRefreshCloudData(): Promise<void> {
    try {
      this.syncState.status = 'syncing';
      this.notifySyncState();

      const [lrSnap, mrSnap, lhsSnap, custSnap, compSnap] = await Promise.all([
        getDocs(collection(db, 'lrs')),
        getDocs(collection(db, 'mrs')),
        getDocs(collection(db, 'lhs')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'company')),
      ]);

      if (!lrSnap.empty) {
        const lrs: LRRecord[] = [];
        lrSnap.forEach((d) => lrs.push(d.data() as LRRecord));
        lrs.sort((a, b) => new Date(b.bookingDate || 0).getTime() - new Date(a.bookingDate || 0).getTime());
        localStorage.setItem('nsst_lrs_v1', JSON.stringify(lrs));
        this.syncState.recordsCount.lrs = lrs.length;
      }

      if (!mrSnap.empty) {
        const mrs: MRRecord[] = [];
        mrSnap.forEach((d) => mrs.push(d.data() as MRRecord));
        localStorage.setItem('nsst_mrs_v1', JSON.stringify(mrs));
        this.syncState.recordsCount.mrs = mrs.length;
      }

      if (!lhsSnap.empty) {
        const lhs: LHSRecord[] = [];
        lhsSnap.forEach((d) => lhs.push(d.data() as LHSRecord));
        localStorage.setItem('nsst_lhs_v1', JSON.stringify(lhs));
        this.syncState.recordsCount.lhs = lhs.length;
      }

      if (!custSnap.empty) {
        const cust: Customer[] = [];
        custSnap.forEach((d) => cust.push(d.data() as Customer));
        localStorage.setItem('nsst_customers_v1', JSON.stringify(cust));
        this.syncState.recordsCount.customers = cust.length;
      }

      this.syncState.status = 'connected';
      this.syncState.lastSyncedAt = new Date();
      this.notifySyncState();
      this.notifyDataChange();
    } catch (e: any) {
      console.error('Error during forceRefreshCloudData:', e);
      this.syncState.status = 'error';
      this.syncState.errorMessage = e?.message;
      this.notifySyncState();
    }
  }

  public getSyncState(): SyncState {
    return { ...this.syncState };
  }
}

export const CloudSync = new CloudSyncService();
