import express from 'express';
import { db } from '../db.js';
import { sendVerificationEmail, getSmtpConfig } from '../emailHelper.js';
import { logAccess } from '../auditHelper.js';

const router = express.Router();

// Helper: Foydalanuvchidan maxfiy ma'lumotlarni chiqarib tashlash
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Xotirada saqlanadigan email tasdiqlash kodlari (email -> { code, expiresAt })
const verificationCodes = new Map();

// 1. Emailga tasdiqlash kodi yuborish
router.post('/send-code', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: "To'g'ri email manzil kiriting" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Takroriy email tekshirish
    const existing = db.find('users', u => (u.email || '').toLowerCase() === cleanEmail);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Ushbu email allaqachon ro'yxatdan o'tgan. Tizimga kiring." 
      });
    }

    // Maxfiy tasdiqlash kodi hammaga bir xil: imperia
    const code = 'imperia';
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 soat

    verificationCodes.set(cleanEmail, { code, expiresAt, name: name || '' });

    console.log(`====================================================`);
    console.log(`📨 [EMAIL TASDIQLASH KODI] Manzil: ${cleanEmail} | Kod: ${code}`);
    console.log(`====================================================`);

    // Haqiqiy pochtaga yuborishga urinish
    const mailRes = await sendVerificationEmail({ 
      to: cleanEmail, 
      name: name || '', 
      code 
    });

    if (mailRes.emailSent) {
      res.json({
        success: true,
        message: `Maxfiy tasdiqlash kodi ${cleanEmail} emailiga yuborildi! Pochtani (Spam papkasini ham) tekshiring.`
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Emailga maxfiy kodni yuborib bo'lmadi: ${mailRes.error || mailRes.reason || "Pochta xatosi"}. Iltimos, emailingizni tekshirib qaytadan urinib ko'ring.`
      });
    }
  } catch (err) {
    console.error("Send code error:", err);
    res.status(500).json({ success: false, message: "Kodni yuborishda xatolik yuz berdi" });
  }
});

// 2. Yangi foydalanuvchini ro'yxatdan o'tkazish (Faqat to'g'ri kod bilan)
router.post('/register', (req, res) => {
  try {
    const { name, phone, email, password, code } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ism-sharifingizni kiriting" });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: "Telefon raqamingizni kiriting" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email manzilingizni kiriting" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Parol kamida 4 ta belgidan iborat bo'lishi kerak" });
    }
    // Maxfiy kodni tekshirish (imperia)
    const inputCode = String(code || '').trim().toLowerCase();
    if (inputCode !== 'imperia') {
      logAccess(req, {
        action: "Ro'yxatdan o'tish urinishi",
        status: "Xatolik (Noto'g'ri kod)",
        userEmail: email,
        userName: name,
        details: "Maxfiy kod 'imperia' xato kiritildi"
      });
      return res.status(400).json({ 
        success: false, 
        message: "Kiritilgan maxfiy kod noto'g'ri! Tizimga kirish uchun to'g'ri maxfiy kodni yozing." 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Takroriy email yoki telefonni tekshirish
    const existing = db.find('users', u => 
      (u.email && u.email.toLowerCase() === cleanEmail) || 
      (u.phone && u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))
    );

    if (existing.length > 0) {
      logAccess(req, {
        action: "Ro'yxatdan o'tish urinishi",
        status: "Xatolik (Takroriy hisob)",
        userEmail: cleanEmail,
        userName: name,
        details: "Email yoki telefon avval ro'yxatdan o'tgan"
      });
      return res.status(400).json({ 
        success: false, 
        message: "Ushbu email yoki telefon raqami allaqachon ro'yxatdan o'tgan" 
      });
    }

    const allUsers = db.get('users');
    const isFirstUser = allUsers.length === 0;

    const newUser = db.insert('users', {
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: password, // Lokal ERP tizimi uchun
      role: isFirstUser ? 'admin' : 'staff',
      canEdit: isFirstUser ? true : false,
      allowedTabs: isFirstUser ? ['*'] : ['dashboard', 'fabrics'],
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      createdAt: new Date().toISOString()
    });

    logAccess(req, {
      action: "Ro'yxatdan o'tish",
      status: "Muvaffaqiyatli",
      userEmail: cleanEmail,
      userName: newUser.name,
      userId: newUser.id,
      details: isFirstUser ? "Bosh Administrator sifatida ro'yxatdan o'tdi" : "Xodim sifatida ro'yxatdan o'tdi"
    });

    res.json({
      success: true,
      message: isFirstUser 
        ? "Bosh Administrator sifatida ro'yxatdan o'tdingiz!" 
        : "Muvaffaqiyatli ro'yxatdan o'tdingiz! Administrator ruxsat bergach barcha bo'limlar ochiladi.",
      data: {
        user: sanitizeUser(newUser),
        token: `erp_token_${newUser.id}_${Date.now()}`
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Ro'yxatdan o'tishda xatolik yuz berdi" });
  }
});

// 2. Tizimga kirish (Login - Email yoki Telefon va Parol)
router.post('/login', (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !emailOrPhone.trim()) {
      return res.status(400).json({ success: false, message: "Email yoki telefon raqamingizni kiriting" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Parolingizni kiriting" });
    }

    const loginInput = emailOrPhone.trim().toLowerCase();
    const phoneInputDigits = loginInput.replace(/\D/g, '');

    const user = db.find('users', u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      return uEmail === loginInput || (phoneInputDigits && uPhoneDigits === phoneInputDigits);
    })[0];

    if (!user) {
      logAccess(req, {
        action: "Tizimga kirish urinishi",
        status: "Xatolik (Topilmadi)",
        userEmail: loginInput,
        details: "Bunday email yoki telefonli hisob topilmadi"
      });
      return res.status(401).json({ 
        success: false, 
        message: "Foydalanuvchi topilmadi. Email/telefon raqamni tekshirib qaytadan urinib ko'ring." 
      });
    }

    if (user.password !== password) {
      logAccess(req, {
        action: "Tizimga kirish urinishi",
        status: "Xatolik (Noto'g'ri parol)",
        userEmail: user.email,
        userName: user.name,
        userId: user.id,
        details: "Parol noto'g'ri kiritildi"
      });
      return res.status(401).json({ 
        success: false, 
        message: "Kiritilgan parol noto'g'ri!" 
      });
    }

    if (user.status === 'blocked') {
      logAccess(req, {
        action: "Tizimga kirish urinishi",
        status: "Taqiqlangan (Bloklangan)",
        userEmail: user.email,
        userName: user.name,
        userId: user.id,
        details: "Bloklangan hisob bilan kirishga urinildi"
      });
      return res.status(403).json({ 
        success: false, 
        message: "Sizning hisobingiz administrator tomonidan bloklangan. Ma'muriyatga murojaat qiling." 
      });
    }

    logAccess(req, {
      action: "Tizimga kirish",
      status: "Muvaffaqiyatli",
      userEmail: user.email,
      userName: user.name,
      userId: user.id,
      details: `Hisob turi: ${user.role}`
    });

    res.json({
      success: true,
      message: `Xush kelibsiz, ${user.name}!`,
      data: {
        user: sanitizeUser(user),
        token: `erp_token_${user.id}_${Date.now()}`
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Tizimga kirishda server xatosi" });
  }
});

// 3. Kirishlar va Xavfsizlik Jurnali (Audit & Access Logs)
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.get('access_logs') || [];
    
    // Statistika
    const total = logs.length;
    const successful = logs.filter(l => l.status === 'Muvaffaqiyatli').length;
    const failed = logs.filter(l => l.status.startsWith('Xatolik') || l.status.startsWith('Taqiqlangan')).length;
    
    // Noyob IP lar
    const uniqueIps = Array.from(new Set(logs.map(l => l.ip).filter(Boolean)));
    
    // Qurilmalar statistikasi
    const devices = {
      desktop: logs.filter(l => l.deviceType === 'desktop').length,
      mobile: logs.filter(l => l.deviceType === 'mobile').length,
      tablet: logs.filter(l => l.deviceType === 'tablet').length
    };

    res.json({
      success: true,
      data: {
        logs,
        summary: {
          total,
          successful,
          failed,
          uniqueIpsCount: uniqueIps.length,
          uniqueIps,
          devices,
          lastActivity: logs[0] ? logs[0].formattedTime : null
        }
      }
    });
  } catch (err) {
    console.error("Fetch audit logs error:", err);
    res.status(500).json({ success: false, message: "Audit jurnallarini olishda xatolik yuz berdi" });
  }
});

// 4. Kirishlar jurnalini tozalash (Admin uchun)
router.delete('/audit-logs', (req, res) => {
  try {
    const clearEntry = logAccess(req, {
      action: "Xavfsizlik jurnali tozalandi",
      status: "Ogohlantirish",
      userName: "Administrator",
      details: "Barcha oldingi kirish yozuvlari tozalandi"
    });
    
    db.set('access_logs', clearEntry ? [clearEntry] : []);
    
    res.json({
      success: true,
      message: "Kirishlar jurnali muvaffaqiyatli tozalandi."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Jurnalni tozalashda xatolik" });
  }
});

// 5. Frontenddan tashrifni qayd qilish (Ekran o'lchami va platforma bilan)
router.post('/record-visit', (req, res) => {
  try {
    const { userId, userName, userEmail, screenResolution, platform } = req.body || {};
    const details = [
      screenResolution ? `Ekran: ${screenResolution}` : null,
      platform ? `Platforma: ${platform}` : null
    ].filter(Boolean).join(' | ');

    logAccess(req, {
      action: userId ? "Faol Sessiya" : "Saytga tashrif",
      status: "Tashrif",
      userId,
      userName: userName || "Mehmon",
      userEmail,
      details: details || "Web ilova ochildi"
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// 4. Joriy foydalanuvchi ma'lumotlarini yangilash / olish (/me)
router.get('/me', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Foydalanuvchi ID si ko'rsatilmadi" });
    }

    const user = db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Foydalanuvchi ma'lumotlarini olishda xatolik" });
  }
});

// 5. Barcha foydalanuvchilar ro'yxatini olish (Admin uchun)
router.get('/users', (req, res) => {
  try {
    const users = db.get('users').map(sanitizeUser);
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Foydalanuvchilarni yuklashda xatolik" });
  }
});

// 6. Administrator tomonidan ruxsatlarni o'zgartirish (RBAC)
router.put('/users/:id/permissions', (req, res) => {
  try {
    const { id } = req.params;
    const { role, canEdit, allowedTabs, status, name, phone } = req.body;

    const user = db.findById('users', id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    const updates = {};
    if (typeof role !== 'undefined') updates.role = role;
    if (typeof canEdit !== 'undefined') updates.canEdit = Boolean(canEdit);
    if (Array.isArray(allowedTabs)) updates.allowedTabs = allowedTabs;
    if (typeof status !== 'undefined') updates.status = status;
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();

    // Agar role 'admin' bo'lsa, avtomatik ravishda barcha bo'limlar va tahrirlash huquqi beriladi
    if (updates.role === 'admin') {
      updates.canEdit = true;
      updates.allowedTabs = ['*'];
    }

    const updatedUser = db.update('users', id, updates);

    res.json({
      success: true,
      message: `${updatedUser.name} foydalanuvchisining huquqlari muvaffaqiyatli saqlandi!`,
      data: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error("Permissions update error:", err);
    res.status(500).json({ success: false, message: "Huquqlarni saqlashda xatolik" });
  }
});

// 7. Foydalanuvchini o'chirish (Admin uchun)
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findById('users', id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    // Oxirgi yoki asosiy adminni o'chirib yubormaslik
    if (user.role === 'admin') {
      const allAdmins = db.find('users', u => u.role === 'admin');
      if (allAdmins.length <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Tizimdagi yagona administratorni o'chirish mumkin emas!" 
        });
      }
    }

    db.delete('users', id);
    res.json({
      success: true,
      message: `${user.name} tizimdan muvaffaqiyatli o'chirildi.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Foydalanuvchini o'chirishda xatolik" });
  }
});

export default router;
