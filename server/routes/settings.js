import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { getSmtpConfig } from '../emailHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 1. Sozlamalarni olish
router.get('/', (req, res) => {
  const settings = db.getSettings();
  const smtp = getSmtpConfig();
  res.json({ 
    success: true, 
    data: {
      ...settings,
      smtp: {
        user: smtp.user || '',
        pass: smtp.pass ? '••••••••••••••••' : '',
        host: smtp.host || 'smtp.gmail.com',
        port: smtp.port || 465,
        isConfigured: smtp.isConfigured
      }
    } 
  });
});

// 2. Sozlamalarni saqlash
router.post('/', (req, res) => {
  const { smtp, ...restSettings } = req.body;

  // Agar yangi SMTP ma'lumotlari kiritilgan bo'lsa
  if (smtp && smtp.user) {
    const cleanUser = smtp.user.trim();
    process.env.SMTP_USER = cleanUser;

    let cleanPass = process.env.SMTP_PASS || '';
    if (smtp.pass && !smtp.pass.includes('•••')) {
      cleanPass = smtp.pass.trim().replace(/\s+/g, '');
      process.env.SMTP_PASS = cleanPass;
    }

    // .env fayllariga yangilab qo'yish
    const envContent = `# Textile ERP Server Environment Variables
PORT=5000

# ==========================================
# EMAIL YUBORISH (SMTP - Gmail yoki boshqa pochta)
# ==========================================
SMTP_HOST=${smtp.host || 'smtp.gmail.com'}
SMTP_PORT=${smtp.port || 465}
SMTP_USER=${cleanUser}
SMTP_PASS=${cleanPass}
SMTP_FROM_NAME="Textile ERP Tizimi"
`;
    try {
      fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
      fs.writeFileSync(path.join(__dirname, '../../.env'), envContent);
    } catch (e) {
      console.error("Error writing .env:", e);
    }
  }

  const updated = db.updateSettings(restSettings);
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
