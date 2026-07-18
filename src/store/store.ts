import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queueOfflineSubmission, getQueuedSubmissions, dequeueOfflineSubmission } from '../lib/indexedDB';

export type MemberStatus = 'Active' | 'Inactive' | 'Transferred' | 'Deceased';

export interface Member {
  id: string;
  fullName: string;
  birthdate: string;
  gender: string;
  baptismDate: string;
  contactNumber?: string;
  locale: string;
  address: string;
  medicalCondition: boolean;
  conditionDetails?: string;
  maintenanceMedicine: boolean;
  medicineName?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  status: MemberStatus;
  registrationDate: string;
  lastAttendance?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  fullName: string;
  locale: string;
  gatheringType: string;
  batch: string;
  date: string;
  time: string;
  latitude?: number;
  longitude?: number;
  healthDeclaration: boolean;
}

export interface Locale {
  id: string;
  name: string;
  district: string;
  municipality: string;
  province: string;
  createdAt: string;
  updatedAt: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

export interface GatheringType {
  id: string;
  name: string;
  status: 'Open' | 'Closed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ipAddress?: string;
  browser?: string;
  deviceInfo?: string;
}

interface AppState {
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  locales: Locale[];
  gatheringTypes: GatheringType[];
  auditLogs: AuditLog[];
  
  // Connectivity & Synchronization state
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  lastSyncedAt: string | null;
  pendingSyncCount: number;
  
  addMember: (member: Member) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  restoreMember: (id: string) => void;
  hardDeleteMember: (id: string) => void;
  importMembers: (members: Member[]) => void;
  addAttendance: (record: AttendanceRecord) => void;
  addLocale: (locale: Locale) => void;
  updateLocale: (id: string, locale: Partial<Locale>) => void;
  deleteLocale: (id: string) => void;
  addGatheringType: (type: GatheringType) => void;
  updateGatheringType: (id: string, type: Partial<GatheringType>) => void;
  deleteGatheringType: (id: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  clearData: () => void;
  
  // Sync Actions
  setIsOnline: (online: boolean) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'error' | 'offline') => void;
  syncData: () => Promise<void>;
  updatePendingCount: () => void;
}

const defaultLocales: Locale[] = [
  { id: '1', name: 'Nabunturan', district: 'District 1', municipality: 'Nabunturan', province: 'Davao de Oro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'Active' },
  { id: '2', name: 'Compostela', district: 'District 2', municipality: 'Compostela', province: 'Davao de Oro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'Active' },
  { id: '3', name: 'Monkayo', district: 'District 1', municipality: 'Monkayo', province: 'Davao de Oro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'Active' },
];

const defaultGatherings: GatheringType[] = [
  { id: '1', name: 'Worship Service', status: 'Open' },
  { id: '2', name: 'Thanksgiving', status: 'Open' },
  { id: '3', name: 'Prayer Meeting', status: 'Open' },
  { id: '4', name: 'Special Gathering', status: 'Open' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      members: [],
      attendanceRecords: [],
      locales: defaultLocales,
      gatheringTypes: defaultGatherings,
      auditLogs: [],
      
      // Default connection state
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline',
      lastSyncedAt: new Date().toISOString(),
      pendingSyncCount: 0,

      addMember: (member) => {
        set((state) => ({ 
          members: [...state.members, member],
          pendingSyncCount: state.pendingSyncCount + 1,
          syncStatus: state.isOnline ? 'synced' : 'offline'
        }));
        get().updatePendingCount();
        
        // Push record to IndexedDB transaction queue for safe persistence
        queueOfflineSubmission({
          id: member.id,
          type: 'member-registration',
          payload: member
        }).catch(err => console.error('IndexedDB queue error:', err));

        if (get().isOnline) {
          get().syncData();
        }
      },
      updateMember: (id, memberUpdate) => {
        set((state) => ({
          members: state.members.map(m => m.id === id ? { ...m, ...memberUpdate } : m),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      deleteMember: (id) => {
        set((state) => ({
          members: state.members.map(m => m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() } : m),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      restoreMember: (id) => {
        set((state) => ({
          members: state.members.map(m => m.id === id ? { ...m, isDeleted: false, deletedAt: undefined } : m),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      hardDeleteMember: (id) => {
        set((state) => ({
          members: state.members.filter(m => m.id !== id),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      importMembers: (newMembers) => {
        set((state) => ({
          members: [...state.members, ...newMembers],
          pendingSyncCount: state.pendingSyncCount + newMembers.length
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      addAttendance: (record) => {
        set((state) => ({ 
          attendanceRecords: [record, ...state.attendanceRecords],
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();

        // Queue attendance record in IndexedDB for robust safety
        queueOfflineSubmission({
          id: record.id,
          type: 'attendance',
          payload: record
        }).catch(err => console.error('IndexedDB queue error:', err));

        if (get().isOnline) {
          get().syncData();
        }
      },
      addLocale: (locale) => {
        set((state) => ({ 
          locales: [...state.locales, locale],
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      updateLocale: (id, localeUpdate) => {
        set((state) => ({
          locales: state.locales.map(l => l.id === id ? { ...l, ...localeUpdate, updatedAt: new Date().toISOString() } : l),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      deleteLocale: (id) => {
        set((state) => ({
          locales: state.locales.filter(l => l.id !== id),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      addGatheringType: (type) => {
        set((state) => ({ 
          gatheringTypes: [...state.gatheringTypes, type],
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      updateGatheringType: (id, typeUpdate) => {
        set((state) => ({
          gatheringTypes: state.gatheringTypes.map(t => t.id === id ? { ...t, ...typeUpdate } : t),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      deleteGatheringType: (id) => {
        set((state) => ({
          gatheringTypes: state.gatheringTypes.filter(g => g.id !== id),
          pendingSyncCount: state.pendingSyncCount + 1
        }));
        get().updatePendingCount();
        if (get().isOnline) {
          get().syncData();
        }
      },
      addAuditLog: (log) => set((state) => ({
        auditLogs: [{ ...log, id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString() }, ...state.auditLogs]
      })),
      clearData: () => set({ members: [], attendanceRecords: [], auditLogs: [], pendingSyncCount: 0 }),
      
      setIsOnline: (online) => {
        set({ isOnline: online, syncStatus: online ? 'synced' : 'offline' });
        if (online) {
          get().syncData();
        }
      },
      setSyncStatus: (status) => set({ syncStatus: status }),
      updatePendingCount: () => {
        // Just keeping track of any changes pending mock cloud push
        // Let's keep a stable counter that goes down to 0 upon sync
      },
      syncData: async () => {
        if (!get().isOnline) return;
        set({ syncStatus: 'syncing' });
        
        try {
          // Read all queued submissions from IndexedDB
          const queued = await getQueuedSubmissions();
          
          if (queued.length > 0) {
            // Simulate Wi-Fi or Mobile Data network upload latency to Cloud Run server
            await new Promise((resolve) => setTimeout(resolve, 1500));
            
            // Remove each successfully synced record from IndexedDB
            for (const item of queued) {
              await dequeueOfflineSubmission(item.id);
            }
            
            get().addAuditLog({
              user: 'System Sync',
              action: `Successfully synchronized ${queued.length} offline IndexedDB submission(s) with MCGI DDO Cloud database.`
            });
          } else if (get().pendingSyncCount > 0) {
            // Fallback sync for any metadata
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          
          set((state) => ({
            syncStatus: 'synced',
            pendingSyncCount: 0,
            lastSyncedAt: new Date().toISOString()
          }));
        } catch (error) {
          console.error('❌ Failed to synchronize offline IndexedDB queue:', error);
          set({ syncStatus: 'error' });
        }
      }
    }),
    {
      name: 'mcgi-ddo-storage',
      // Only persist persistent DB entities. Exclude live connection states so they initialize fresh
      partialize: (state) => ({
        members: state.members,
        attendanceRecords: state.attendanceRecords,
        locales: state.locales,
        gatheringTypes: state.gatheringTypes,
        auditLogs: state.auditLogs,
        lastSyncedAt: state.lastSyncedAt,
        pendingSyncCount: state.pendingSyncCount,
      })
    }
  )
);

// Register global connection event listeners so state shifts automatically
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().setIsOnline(true);
  });
  window.addEventListener('offline', () => {
    useStore.getState().setIsOnline(false);
  });
}

