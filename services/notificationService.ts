
import { Document } from '../types';
import { displayDate } from '../constants';

export interface NotificationResponse {
  success: boolean;
  message: string;
  recipient: string;
}

/**
 * Simula el envío de una notificación por correo electrónico basada en la configuración SMTP.
 * En una aplicación productiva, este servicio llamaría a un endpoint de backend o API de terceros.
 */
export const sendNewDocumentNotification = async (doc: Document): Promise<NotificationResponse | null> => {
  const smtpConfigStr = localStorage.getItem('tax_control_smtp');
  const autoNotify = localStorage.getItem('tax_control_auto_notify') === 'true';

  if (!autoNotify || !smtpConfigStr) return null;

  const smtpConfig = JSON.parse(smtpConfigStr);
  const recipient = smtpConfig.testEmail || 'admin@corriente.com.ec';

  // Simulamos el proceso de conexión y envío
  console.log(`%c[SMTP] Iniciando conexión con ${smtpConfig.host}:${smtpConfig.port}...`, 'color: #3B82F6; font-weight: bold;');
  console.log(`%c[SMTP] Autenticando como ${smtpConfig.user}...`, 'color: #3B82F6;');
  
  // Simulamos latencia de red
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`%c[SMTP] Enviando correo a: ${recipient}`, 'color: #10B981; font-weight: bold;');
  console.log(`%c[SMTP] Asunto: NUEVO TRÁMITE REGISTRADO - ${doc.trarniteNumber}`, 'color: #10B981;');

  return {
    success: true,
    message: `Notificación enviada con éxito vía ${smtpConfig.host}`,
    recipient: recipient
  };
};
