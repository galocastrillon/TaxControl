
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

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Galo Castrillon',
  email: 'Impuestos@corriente.com.ec',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/id/1005/150/150'
};

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
    createdBy: 'Galo Castrillon',
    createdAt: '2025-01-17',
    contestations: [MOCK_CONTESTATION]
  }
];

export const getDocuments = (): Document[] => {
    const stored = localStorage.getItem('tax_control_docs');
    if (!stored) {
        localStorage.setItem('tax_control_docs', JSON.stringify(INITIAL_DOCS));
        return INITIAL_DOCS;
    }
    return JSON.parse(stored);
};

export const saveDocument = (doc: Document) => {
    const docs = getDocuments();
    docs.push(doc);
    localStorage.setItem('tax_control_docs', JSON.stringify(docs));
};

export const updateDocument = (updatedDoc: Document) => {
    const docs = getDocuments();
    const index = docs.findIndex(d => d.id === updatedDoc.id);
    if (index !== -1) {
        docs[index] = updatedDoc;
        localStorage.setItem('tax_control_docs', JSON.stringify(docs));
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
