import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Database Connection Pool
  let pool: mysql.Pool | null = null;
  let useMemoryFallback = false;
  
  // Initial data for fallback
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

  const mapDocToFrontend = (row: any) => ({
    id: row.id,
    title: row.title,
    trarniteNumber: row.trarnite_number,
    company: row.company || 'ECSA', // Fallback if join missing
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

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tax_control',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    await pool.getConnection();
    console.log('✅ Connected to MariaDB successfully.');
  } catch (error) {
    console.warn('⚠️ Could not connect to MariaDB. Falling back to In-Memory storage.');
    useMemoryFallback = true;
    pool = null;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: useMemoryFallback ? 'memory' : 'mariadb' });
  });

  app.get('/api/documents', async (req, res) => {
    try {
      if (useMemoryFallback) return res.json(memoryDocs);
      const [rows]: any = await pool!.query('SELECT * FROM documents ORDER BY created_at DESC');
      res.json(rows.map(mapDocToFrontend));
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/documents/:id', async (req, res) => {
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

  app.post('/api/documents', async (req, res) => {
    const doc = req.body;
    try {
      if (useMemoryFallback) {
        memoryDocs.unshift({ ...doc, createdAt: new Date().toISOString() });
        return res.status(201).json({ message: 'Created (Memory)' });
      }
      await pool!.query(
        'INSERT INTO documents (id, title, trarnite_number, authority, notification_date, days_limit, day_type, due_date, status, summary_es, summary_cn, file_name, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [doc.id, doc.title, doc.trarniteNumber, doc.authority, doc.notificationDate, doc.daysLimit, doc.dayType, doc.dueDate, doc.status, doc.summaryEs, doc.summaryCn, doc.fileName, doc.createdBy]
      );
      res.status(201).json({ message: 'Created' });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/api/documents/:id', async (req, res) => {
    const doc = req.body;
    try {
      if (useMemoryFallback) {
        const index = memoryDocs.findIndex(d => d.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Not found' });
        memoryDocs[index] = { ...memoryDocs[index], ...doc };
        return res.json({ message: 'Updated (Memory)' });
      }
      await pool!.query(
        'UPDATE documents SET title = ?, trarnite_number = ?, authority = ?, notification_date = ?, days_limit = ?, day_type = ?, due_date = ?, status = ?, summary_es = ?, summary_cn = ?, file_name = ? WHERE id = ?',
        [doc.title, doc.trarniteNumber, doc.authority, doc.notificationDate, doc.daysLimit, doc.dayType, doc.dueDate, doc.status, doc.summaryEs, doc.summaryCn, doc.fileName, req.params.id]
      );
      res.json({ message: 'Updated' });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
