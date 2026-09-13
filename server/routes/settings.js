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

// 5. Test Email yuborish (SMTP sozlamasini tekshirish)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    const settings = db.getSettings();
    const targetEmail = email || settings.smtp?.user || settings.email;

    if (!targetEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "Test xatini qaysi emailga yuborish kerakligini kiriting" 
      });
    }

    const { sendVerificationEmail } = await import('../emailHelper.js');
    const result = await sendVerificationEmail({
      to: targetEmail,
      name: "Administrator",
      code: Math.floor(100000 + Math.random() * 900000).toString()
    });

    if (result.emailSent) {
      res.json({
        success: true,
        message: `Test tasdiqlash xati ${targetEmail} pochtasiga muvaffaqiyatli yuborildi! Pochtani tekshiring.`
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Email yuborilmadi: ${result.error || result.reason || 'Noma\'lum xatolik'}`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: `Email xatosi: ${err.message}` });
  }
});

export default router;
