
export enum UserRole {
  ADMIN = 'Admin',
  OPERATOR = 'Operator',
  READER = 'Lector'
}

export enum DocStatus {
  INITIALIZED = 'Inicializado',
  IN_PROGRESS = 'En progreso',
  COMPLETED = 'Completado',
  OVERDUE = 'Vencido'
}

export enum DayType {
  BUSINESS = 'Días hábiles',
  CALENDAR = 'Días calendario'
}

export interface ContestationFile {
  id: string;
  name: string;
  url?: string;
  type?: string; 
}

export interface Contestation {
  id: string;
  date: string;
  authority: string;
  notes: string;
  contact_method: string;
  files: ContestationFile[];
  registered_by: string;
  registration_date: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  trarniteNumber: string;
  company: string;
  authority: string;
  department?: string;
  notificationDate: string;
  daysLimit: number;
  dayType: DayType;
  dueDate: string;
  status: DocStatus;
  summaryEs: string;
  summaryCn: string;
  fileUrl?: string;
  fileName?: string;
  relatedDoc?: string;
  createdBy?: string;
  createdAt?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  contestations?: Contestation[];
  attachments?: ContestationFile[];
}

export interface Activity {
  id: string;
  docId: string;
  description: string;
  subDescription?: string;
  status: 'Pending' | 'Completed';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completedBy?: string;
  completedAt?: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
