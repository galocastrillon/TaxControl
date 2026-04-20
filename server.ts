import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hashPassword(id: string, password: string): string {
  return crypto.createHash('sha256').update(id + password).digest('hex');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
  app.use(express.json({ limit: '20mb' }));

  // Database Connection Pool
  let pool: mysql.Pool | null = null;
  let useMemoryFallback = false;

  // In-memory session fallback: token -> { userId, role, expiresAt }
  const memorySessions = new Map<string, { userId: string; role: string; expiresAt: Date }>();
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  let memoryDocs: any[] = [
    {
      id: 'd1',
      title: 'Providencia de Admisión a Trámite y Término de Prueba',
      trarniteNumber: '9170120250000492',
      company: 'ECSA',
      authority: 'SRI',
      department: 'Dirección Nacional de Grandes Contribuyentes',
      notificationDate: '2025-01-17',
      daysLimit: 10,
      dayType: 'Días hábiles',
      dueDate: '2025-01-31',
      status: 'En progreso',
      summaryEs: 'Solicitud de devolución del Impuesto al Valor Agregado (IVA) presentada por ECUACORRIENTE S.A.',
      summaryCn: 'ECUACORRIENTE S.A. 提交的增值税 (IVA) 退税申请',
      fileName: '20250117_Providencia_Administrativa_9170120250000492.pdf',
      createdBy: 'Galo Castrillon',
      createdAt: '2025-01-17'
    }
  ];

  // Default admin for memory fallback — password: Password123
  const memoryUsers = [
    {
      id: 'u1',
      name: 'Administrador',
      email: 'impuestos@corriente.com.ec',
      password_hash: hashPassword('u1', 'Password123'),
      role: 'Admin'
    }
  ];

  const mapDocToFrontend = (row: any) => ({
    id: row.id,
    title: row.title,
    trarniteNumber: row.trarnite_number,
    company: row.company || 'ECSA',
    authority: row.authority,
    department: row.department || 'General',
    notificationDate: row.notification_date,
    daysLimit: row.days_limit,
    dayType: row.day_type,
    dueDate: row.due_date,
    status: row.status,
    summaryEs: row.summary_es,
    summaryCn: row.summary_cn,
    fileName: row.file_name,
    createdBy: row.created_by,
    createdAt: row.created_at
  });

  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tax_control',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
  };

  // Retry loop — en Docker, MariaDB puede tardar unos segundos en estar lista
  let retries = 5;
  while (retries > 0) {
    try {
      pool = mysql.createPool(poolConfig);
      await pool.getConnection();
      console.log('✅ Connected to MariaDB successfully.');
      break;
    } catch (error) {
      retries--;
      pool = null;
      if (retries === 0) {
        console.warn('⚠️ Could not connect to MariaDB. Falling back to In-Memory storage.');
        useMemoryFallback = true;
      } else {
        console.warn(`⚠️ MariaDB not ready, retrying in 3s... (${retries} attempts left)`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  // --- Session helpers: DB-backed when MariaDB is available, in-memory otherwise ---

  async function createSession(token: string, userId: string, role: string): Promise<void> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    if (!useMemoryFallback && pool) {
      await pool.query(
        'INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)',
        [token, userId, role, expiresAt]
      );
    } else {
      memorySessions.set(token, { userId, role, expiresAt });
    }
  }

  async function getSession(token: string): Promise<{ userId: string; role: string } | null> {
    if (!useMemoryFallback && pool) {
      const [rows]: any = await pool.query(
        'SELECT user_id, role FROM sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      );
      if (rows.length === 0) return null;
      return { userId: rows[0].user_id, role: rows[0].role };
    }
    const s = memorySessions.get(token);
    if (!s) return null;
    if (s.expiresAt < new Date()) { memorySessions.delete(token); return null; }
    return { userId: s.userId, role: s.role };
  }

  async function deleteSession(token: string): Promise<void> {
    if (!useMemoryFallback && pool) {
      await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
    } else {
      memorySessions.delete(token);
    }
  }

  // Purge expired sessions every hour
  setInterval(async () => {
    if (!useMemoryFallback && pool) {
      await pool.query('DELETE FROM sessions WHERE expires_at < NOW()').catch(() => {});
    } else {
      const now = new Date();
      for (const [t, s] of memorySessions.entries()) {
        if (s.expiresAt < now) memorySessions.delete(t);
      }
    }
  }, 60 * 60 * 1000);

  // Auth middleware — protects all /api/* except /api/health and /api/auth/*
  const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const session = await getSession(token);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      req.user = session;
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // --- Public routes ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: useMemoryFallback ? 'memory' : 'mariadb' });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    try {
      let user: any = null;

      if (useMemoryFallback) {
        const candidate = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (candidate && candidate.password_hash === hashPassword(candidate.id, password)) {
          user = candidate;
        }
      } else {
        const [rows]: any = await pool!.query(
          'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
          [email]
        );
        if (rows.length > 0) {
          const candidate = rows[0];
          if (hashPassword(candidate.id, password) === candidate.password_hash) {
            user = candidate;
          }
        }
      }

      if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

      const token = crypto.randomBytes(32).toString('hex');
      await createSession(token, user.id, user.role);
      res.json({ token, name: user.name, role: user.role });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/auth/logout', authMiddleware, async (req: any, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) await deleteSession(token);
    res.json({ message: 'Logged out' });
  });

  // --- Protected: Gemini document analysis (server-side — key stays secret) ---

  app.post('/api/analyze', authMiddleware, async (req, res) => {
    const { fileData, mimeType } = req.body;
    if (!fileData) return res.status(400).json({ error: 'fileData requerido' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Gemini API key no configurada' });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.0-flash';

      const systemInstruction = `
        Actúa como un Socio de Impuestos Senior y Auditor de Cumplimiento Legal experto en el régimen tributario de Ecuador.
        Tu misión es analizar el documento adjunto y devolver un JSON con TODOS los campos solicitados.

        INSTRUCCIONES DE EXTRACCIÓN:
        1. authority: Institución emisora del documento (ej. "Servicio de Rentas Internas", "IESS", "Superintendencia de Compañías").
        2. department: Unidad o departamento específico dentro de la institución (ej. "Dirección Nacional de Grandes Contribuyentes").
        3. notificationDate: Fecha legal de notificación en formato YYYY-MM-DD. Si no existe, usar la fecha de emisión.
        4. emissionDate: Fecha de emisión del documento en formato YYYY-MM-DD.
        5. trarniteNumber: Número de expediente, resolución, oficio o trámite del documento.
        6. title: Título breve y descriptivo del documento (máx. 120 caracteres), en español.
        7. company: Empresa destinataria del documento. Si no se identifica claramente, usar "ECSA".
        8. daysLimit: Número entero de días otorgados para responder. Si no se menciona plazo, usar 15.
        9. dayType: "Días hábiles" o "Días calendario" según el documento. Por defecto "Días hábiles".
        10. activities: Lista de acciones o requerimientos concretos que debe ejecutar el receptor.

        CAMPO summaryEs (resumen ejecutivo en ESPAÑOL):
        Redacta un resumen profesional y estructurado con estas secciones:
        A. ENTIDAD EMISORA Y NATURALEZA DEL DOCUMENTO
        B. RESUMEN EJECUTIVO
        C. OBLIGACIONES Y REQUERIMIENTOS
        D. BASE LEGAL Y ANÁLISIS TÉCNICO
        E. CALENDARIO DE PROCEDIMIENTOS Y PLAZOS
        F. MATRIZ DE RIESGOS
        G. IMPACTO ESTRATÉGICO Y RECOMENDACIONES

        CAMPO summaryCn (resumen ejecutivo en CHINO MANDARÍN SIMPLIFICADO 简体中文):
        Traduce y adapta el contenido del summaryEs al chino mandarín simplificado (简体中文).
        Mantén la misma estructura de secciones pero en chino. Usa terminología legal y tributaria china equivalente.
        El texto debe ser fluido y natural para un lector chino de negocios.
      `;

      const parts: any[] = mimeType
        ? [{ inlineData: { data: fileData, mimeType } }]
        : [{ text: `Context:\n${fileData}` }];

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              authority: { type: Type.STRING },
              department: { type: Type.STRING },
              company: { type: Type.STRING },
              notificationDate: { type: Type.STRING },
              emissionDate: { type: Type.STRING },
              daysLimit: { type: Type.NUMBER },
              dayType: { type: Type.STRING },
              trarniteNumber: { type: Type.STRING },
              title: { type: Type.STRING },
              summaryEs: { type: Type.STRING },
              summaryCn: { type: Type.STRING },
              activities: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['authority', 'department', 'summaryEs', 'summaryCn', 'trarniteNumber']
          }
        }
      });

      if (response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
      res.status(500).json({ error: 'Respuesta vacía del modelo' });
    } catch (error) {
      console.error('Gemini analysis error:', error);
      res.status(500).json({ error: 'Error en análisis de documento' });
    }
  });

  // --- Protected: Documents CRUD ---

  app.get('/api/documents', authMiddleware, async (req, res) => {
    try {
      if (useMemoryFallback) return res.json(memoryDocs);
      const [rows]: any = await pool!.query('SELECT * FROM documents ORDER BY created_at DESC');
      res.json(rows.map(mapDocToFrontend));
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/documents/:id', authMiddleware, async (req, res) => {
    try {
      if (useMemoryFallback) {
        const doc = memoryDocs.find(d => d.id === req.params.id);
        return doc ? res.json(doc) : res.status(404).json({ error: 'Not found' });
      }
      const [rows]: any = await pool!.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(mapDocToFrontend(rows[0]));
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/documents', authMiddleware, async (req, res) => {
    const doc = req.body;
    try {
      if (useMemoryFallback) {
        memoryDocs.unshift({ ...doc, createdAt: new Date().toISOString() });
        return res.status(201).json({ message: 'Created (Memory)' });
      }
      await pool!.query(
        `INSERT INTO documents
          (id, title, trarnite_number, company_id, authority, department,
           notification_date, days_limit, day_type, due_date, status,
           summary_es, summary_cn, file_name, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doc.id, doc.title, doc.trarniteNumber, doc.companyId || null,
          doc.authority, doc.department || null, doc.notificationDate,
          doc.daysLimit, doc.dayType, doc.dueDate, doc.status,
          doc.summaryEs, doc.summaryCn, doc.fileName, doc.createdBy
        ]
      );
      res.status(201).json({ message: 'Created' });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/api/documents/:id', authMiddleware, async (req, res) => {
    const doc = req.body;
    try {
      if (useMemoryFallback) {
        const index = memoryDocs.findIndex(d => d.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Not found' });
        memoryDocs[index] = { ...memoryDocs[index], ...doc };
        return res.json({ message: 'Updated (Memory)' });
      }
      await pool!.query(
        `UPDATE documents
         SET title = ?, trarnite_number = ?, company_id = ?, authority = ?,
             department = ?, notification_date = ?, days_limit = ?, day_type = ?,
             due_date = ?, status = ?, summary_es = ?, summary_cn = ?, file_name = ?
         WHERE id = ?`,
        [
          doc.title, doc.trarniteNumber, doc.companyId || null, doc.authority,
          doc.department || null, doc.notificationDate, doc.daysLimit, doc.dayType,
          doc.dueDate, doc.status, doc.summaryEs, doc.summaryCn, doc.fileName,
          req.params.id
        ]
      );
      res.json({ message: 'Updated' });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
    try {
      if (useMemoryFallback) {
        memoryDocs = memoryDocs.filter(d => d.id !== req.params.id);
        return res.json({ message: 'Deleted (Memory)' });
      }
      await pool!.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // --- Email helper ---

  async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || user;
    const fromName = process.env.SMTP_FROM_NAME || 'Tax Control';
    const from = `${fromName} <${fromEmail}>`;

    if (!host || !user || !pass) throw new Error('SMTP no configurado');

    // Port 587 uses STARTTLS (secure:false + requireTLS:true)
    // Port 465 uses implicit SSL (secure:true)
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,   // forzar STARTTLS en puerto 587
      auth: { user, pass },
      tls: {
        // Permite certificados autofirmados (servidores Exchange corporativos)
        rejectUnauthorized: false
      }
    });
    await transporter.sendMail({ from, to, subject, html });
  }

  async function getAllUserEmails(): Promise<string[]> {
    if (useMemoryFallback) return memoryUsers.map(u => u.email);
    const [rows]: any = await pool!.query('SELECT email FROM users');
    return rows.map((r: any) => r.email);
  }

  // --- Protected: Email notifications ---

  // Called by frontend when a new document is uploaded
  app.post('/api/notify/new-document', authMiddleware, async (req, res) => {
    const { doc } = req.body;
    if (!doc) return res.status(400).json({ error: 'doc requerido' });
    try {
      const emails = await getAllUserEmails();
      const subject = `📄 Nuevo trámite registrado: ${doc.trarniteNumber}`;
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#3B82F6;padding:24px;color:white">
            <h2 style="margin:0">Nuevo Trámite Registrado</h2>
            <p style="margin:4px 0 0;opacity:.85;font-size:14px">Tax Control — ECSA</p>
          </div>
          <div style="padding:24px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#6b7280;width:140px">Trámite #</td><td style="font-weight:600">${doc.trarniteNumber}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Título</td><td>${doc.title}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Autoridad</td><td>${doc.authority}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Notificación</td><td>${doc.notificationDate}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Vencimiento</td><td style="color:#EF4444;font-weight:700">${doc.dueDate}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:4px;font-size:13px">
              <strong>Plazo:</strong> ${doc.daysLimit} ${doc.dayType}
            </div>
          </div>
          <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">
            Tax Control · ECSA © ${new Date().getFullYear()}
          </div>
        </div>`;
      await sendEmail(emails, subject, html);
      res.json({ success: true, recipients: emails.length });
    } catch (error: any) {
      console.error('Error sending new-document email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check expiring docs and email all users — called by the daily scheduler and optionally manually
  async function sendExpiringAlerts(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let expiringDocs: any[] = [];
      if (useMemoryFallback) {
        expiringDocs = memoryDocs.filter(d =>
          d.dueDate >= today && d.dueDate <= in7Days &&
          d.status !== 'Completado' && d.status !== 'Vencido'
        );
      } else {
        const [rows]: any = await pool!.query(
          `SELECT * FROM documents WHERE due_date BETWEEN ? AND ? AND status NOT IN ('Completado','Vencido')`,
          [today, in7Days]
        );
        expiringDocs = rows.map(mapDocToFrontend);
      }

      if (expiringDocs.length === 0) return;

      const emails = await getAllUserEmails();
      const rows = expiringDocs.map(d => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${d.trarniteNumber}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${d.title}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${d.authority}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#EF4444;font-weight:700">${d.dueDate}</td>
        </tr>`).join('');

      const html = `
        <div style="font-family:sans-serif;max-width:680px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#EF4444;padding:24px;color:white">
            <h2 style="margin:0">⚠️ Alerta de Vencimientos</h2>
            <p style="margin:4px 0 0;opacity:.85;font-size:14px">${expiringDocs.length} trámite(s) vencen en los próximos 7 días</p>
          </div>
          <div style="padding:24px">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Trámite #</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Título</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Autoridad</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Vencimiento</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">
            Tax Control · ECSA © ${new Date().getFullYear()}
          </div>
        </div>`;

      await sendEmail(emails, `⚠️ ${expiringDocs.length} trámite(s) vencen en ≤7 días`, html);
      console.log(`✅ Alerta de vencimientos enviada a ${emails.length} usuario(s).`);
    } catch (error) {
      console.error('Error en sendExpiringAlerts:', error);
    }
  }

  // Trigger manually from admin panel
  app.post('/api/notify/check-expiring', authMiddleware, async (req, res) => {
    try {
      await sendExpiringAlerts();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Daily scheduler: runs once on startup then every 24h
  sendExpiringAlerts();
  setInterval(sendExpiringAlerts, 24 * 60 * 60 * 1000);

  // Vite middleware for development — dynamic import so `vite` devDependency is never loaded in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
