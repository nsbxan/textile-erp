import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Sozlamalarni olish
router.get('/', (req, res) => {
  const settings = db.getSettings();
  res.json({ success: true, data: settings });
});

// 2. Sozlamalarni saqlash
router.post('/', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated, message: "Sozlamalar muvaffaqiyatli saqlandi" });
});

// 3. Dollar kursini tezkor yangilash
router.post('/rate', (req, res) => {
  const { rate } = req.body;
  const newRate = Number(rate);
  if (!newRate || newRate <= 0) {
    return res.status(400).json({ success: false, message: "Dollar kursini to'g'ri kiriting" });
  }

  const updated = db.updateSettings({ usdExchangeRate: newRate });
  res.json({ success: true, data: updated, message: `Dollar kursi yangilandi: 1$ = ${newRate.toLocaleString()} so'm` });
});

// 4. Baza zaxira nusxasi (Backup)
router.get('/backup', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=textile_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db.cache, null, 2));
});

export default router;
