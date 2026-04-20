import { Document } from '../types';

export interface NotificationResponse {
  success: boolean;
  message: string;
  recipients: number;
}

export const sendNewDocumentNotification = async (doc: Document): Promise<NotificationResponse | null> => {
  const autoNotify = localStorage.getItem('tax_control_auto_notify') !== 'false';
  if (!autoNotify) return null;

  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('/api/notify/new-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ doc })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[Email] No se pudo enviar notificación:', err.error || res.status);
      return null;
    }

    const data = await res.json();
    return {
      success: true,
      message: `Notificación enviada a ${data.recipients} usuario(s)`,
      recipients: data.recipients
    };
  } catch (error) {
    console.warn('[Email] Error al enviar notificación:', error);
    return null;
  }
};
