import { create } from 'zustand';

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

export const useStore = create<AppState>((set) => ({
  members: [],
  attendanceRecords: [],
  locales: defaultLocales,
  gatheringTypes: defaultGatherings,
  auditLogs: [],
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, memberUpdate) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, ...memberUpdate } : m)
  })),
  deleteMember: (id) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() } : m)
  })),
  restoreMember: (id) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, isDeleted: false, deletedAt: undefined } : m)
  })),
  hardDeleteMember: (id) => set((state) => ({
    members: state.members.filter(m => m.id !== id)
  })),
  importMembers: (newMembers) => set((state) => ({
    members: [...state.members, ...newMembers]
  })),
  addAttendance: (record) => set((state) => ({ attendanceRecords: [record, ...state.attendanceRecords] })),
  addLocale: (locale) => set((state) => ({ locales: [...state.locales, locale] })),
  updateLocale: (id, localeUpdate) => set((state) => ({
    locales: state.locales.map(l => l.id === id ? { ...l, ...localeUpdate, updatedAt: new Date().toISOString() } : l)
  })),
  deleteLocale: (id) => set((state) => ({
    locales: state.locales.filter(l => l.id !== id)
  })),
  addGatheringType: (type) => set((state) => ({ gatheringTypes: [...state.gatheringTypes, type] })),
  updateGatheringType: (id, typeUpdate) => set((state) => ({
    gatheringTypes: state.gatheringTypes.map(t => t.id === id ? { ...t, ...typeUpdate } : t)
  })),
  deleteGatheringType: (id) => set((state) => ({
    gatheringTypes: state.gatheringTypes.filter(g => g.id !== id)
  })),
  addAuditLog: (log) => set((state) => ({
    auditLogs: [{ ...log, id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString() }, ...state.auditLogs]
  })),
  clearData: () => set({ members: [], attendanceRecords: [], auditLogs: [] })
}));
