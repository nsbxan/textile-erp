import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './db.js';
import { seedDatabase } from './seed.js';

import fabricsRouter from './routes/fabrics.js';
import rollsRouter from './routes/rolls.js';
import defectsRouter from './routes/defects.js';
import qrRouter from './routes/qr.js';
import salesRouter from './routes/sales.js';
import productionRouter from './routes/production.js';
import dyeingRouter from './routes/dyeing.js';
import financeRouter from './routes/finance.js';
import customersRouter from './routes/customers.js';
import suppliersRouter from './routes/suppliers.js';
import employeesRouter from './routes/employees.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Agar baza bo'sh bo'lsa yoki eski formatda bo'lsa avtomatik seed qilish
if (db.get('fabrics').length === 0 || db.get('dyeing_orders').length === 0) {
  console.log("To'qimachilik ERP demo ma'lumotlari yuklanmoqda...");
  seedDatabase();
}

// API Routes
app.use('/api/fabrics', fabricsRouter);
app.use('/api/rolls', rollsRouter);
app.use('/api/defects', defectsRouter);
app.use('/api/qr', qrRouter);
app.use('/api/sales', salesRouter);
app.use('/api/production', productionRouter);
app.use('/api/dyeing', dyeingRouter);
app.use('/api/finance', financeRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: "Textile Fabric & Dyeing ERP API",
    time: new Date().toISOString()
  });
});

// Production build static serving
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.json({
        message: "Textile ERP Backend API ishlamoqda. Frontendni ishga tushirish uchun 'npm run dev' buyrug'ini bering."
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Textile Fabric & Dyeing ERP Serveri ishga tushdi: http://localhost:${PORT}`);
  console.log(`📦 Barcha API marshrutlari tayyor!`);
  console.log(`====================================================`);
});
