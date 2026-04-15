
import { Document, DocStatus, DayType, UserRole, User, Activity, Contestation } from './types';
import { FileText, Clock, AlertTriangle } from 'lucide-react';

export const ECUADOR_HOLIDAYS_2025 = [
    '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-18', '2025-05-01', 
    '2025-05-23', '2025-08-11', '2025-10-10', '2025-11-02', '2025-11-03', '2025-12-25'
];

/**
 * Formats an ISO date string (YYYY-MM-DD) to the display format (DD/MM/YYYY).
 */
export const displayDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  return `${day}/${month}/${year}`;
};

export const isEcuadorBusinessDay = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return !ECUADOR_HOLIDAYS_2025.includes(dateStr);
};

// Datos de usuario por defecto
const DEFAULT_USER: User = {
  id: 'u1',
  name: 'Galo Castrillon',
  email: 'Impuestos@corriente.com.ec',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/id/1005/150/150'
};

/**
 * Obtiene el usuario actual desde el almacenamiento local o devuelve el predeterminado.
 */
export const getCurrentUser = (): User => {
  const stored = localStorage.getItem('tax_control_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_USER;
    }
  }
  return DEFAULT_USER;
};

// Exportamos CURRENT_USER como una referencia inicial, 
// pero los componentes deben usar getCurrentUser() para obtener datos frescos.
export const CURRENT_USER = getCurrentUser();

const MOCK_CONTESTATION: Contestation = {
    id: 'c1',
    date: '2026-01-23',
    authority: 'SRI',
    notes: 'Se envía a SRI Zamora la documentación respaldo para devolución IVA 08-2025',
    contact_method: 'Ventanilla Física',
    files: [
      { id: 'f1', name: 'EVIDENCIA PRESENTACION SOLICITUD IVA 08-25.pdf' }
    ],
    registered_by: 'Galo Castrillon',
    registration_date: '2026-01-26'
};

const INITIAL_DOCS: Document[] = [
  {
    id: 'd1',
    title: 'Providencia de Admisión a Trámite y Término de Prueba',
    trarniteNumber: '9170120250000492',
    company: 'ECSA',
    authority: 'SRI',
    department: 'Dirección Nacional de Grandes Contribuyentes',
    notificationDate: '2025-01-17',
    daysLimit: 10,
    dayType: DayType.BUSINESS,
    dueDate: '2025-01-31',
    status: DocStatus.IN_PROGRESS,
    summaryEs: 'Solicitud de devolución del Impuesto al Valor Agregado (IVA) presentada por ECUACORRIENTE S.A.',
    summaryCn: 'ECUACORRIENTE S.A. 提交的增值税 (IVA) 退税申请',
    fileName: '20250117_Providencia_Administrativa_9170120250000492.pdf',
    fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCtUMNAzUCtUMFQzVDAwVSuwtAQARZADCAplbmRzdHJlYW0KMyAwIG9iago0MgplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s0IDAgUl0+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHJ1ZVR5cGUvQmFzZUZvbnQvSGVsdmV0aWNhL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmxlbmRvYmoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKNyAwIG9iago8PC9Qcm9kdWNlcihRVFBkZiAxLjEpL0NyZWF0aW9uRGF0ZShEOjIwMjUwMTI0MTUwMDAwKzAwJzAwJyk+PgplbmRvYmoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAwMTkgMDAwMDAgbiAKMDAwMDAwMDExMiAwMDAwMCBuIAowMDAwMDAwMjE0IDAwMDAwIG4gCjAwMDAwMDAzMTEgMDAwMDAgbiAKMDAwMDAwMDQwMyAwMDAwMCBuIAowMDAwMDAwNDUxIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA4L1Jvb3QgNiAwIFIvSW5mbyA3IDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9GCg==',
    createdBy: 'Galo Castrillon',
    createdAt: '2025-01-17',
    contestations: [MOCK_CONTESTATION]
  }
];

export const getDocuments = async (): Promise<Document[]> => {
    try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Failed to fetch documents');
        return await response.json();
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
};

export const saveDocument = async (doc: Document) => {
    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc)
        });
        if (!response.ok) throw new Error('Failed to save document');
    } catch (error) {
        console.error('Error saving document:', error);
    }
};

export const updateDocument = async (updatedDoc: Document) => {
    try {
        const response = await fetch(`/api/documents/${updatedDoc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDoc)
        });
        if (!response.ok) throw new Error('Failed to update document');
    } catch (error) {
        console.error('Error updating document:', error);
    }
};

export const deleteDocument = async (id: string) => {
    try {
        const response = await fetch(`/api/documents/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete document');
    } catch (error) {
        console.error('Error deleting document:', error);
    }
};

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    docId: 'd1',
    description: 'Ingresar documentos soportes en SRI',
    subDescription: 'Envío de documentos soportes que avalan devolución.',
    status: 'Completed',
    dueDate: '2026-01-23',
    priority: 'High',
    completedBy: 'Galo Castrillon'
  }
];

export const STATS_CONFIG = [
  { id: 'total', label: 'Documentos Totales', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { id: 'progress', label: 'En progreso', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'upcoming', label: 'Plazos Próximos', icon: AlertTriangle, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'overdue', label: 'Plazos Vencidos', icon: AlertTriangle, color: 'bg-red-100 text-red-600' }
];
