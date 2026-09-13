import express from 'express';
import QRCode from 'qrcode';
import { db } from '../db.js';

const router = express.Router();

// 1. QR kod orqali rulon va matoni qidirish (Skaner uchun)
router.get('/lookup/:code', (req, res) => {
  const code = req.params.code.trim();
  const rolls = db.get('rolls');
  const fabrics = db.get('fabrics');
  const defects = db.get('defects');
  const suppliers = db.get('suppliers');

  // Rulonni qidirish: ID, qrCode, yoki BATCH raqami bo'yicha
  const roll = rolls.find(r =>
    r.id.toLowerCase() === code.toLowerCase() ||
    (r.qrCode && r.qrCode.toLowerCase() === code.toLowerCase()) ||
    (r.batchNumber && r.batchNumber.toLowerCase() === code.toLowerCase()) ||
    `ERP-${r.id}`.toLowerCase() === code.toLowerCase()
  );

  if (!roll) {
    // Balki bu to'g'ridan-to'g'ri mato artikulidir?
    const fabric = fabrics.find(f =>
      f.id.toLowerCase() === code.toLowerCase() ||
      f.code.toLowerCase() === code.toLowerCase()
    );
    if (fabric) {
      const fabRolls = rolls.filter(r => r.fabricId === fabric.id && (r.status === 'in_stock' || r.status === 'partially_sold'));
      return res.json({
        success: true,
        type: "fabric",
        data: {
          fabric,
          rolls: fabRolls
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: `QR kod yoki rulon kodi bo'yicha ma'lumot topilmadi: "${code}"`
    });
  }

  const fabric = fabrics.find(f => f.id === roll.fabricId) || {};
  const supplier = suppliers.find(s => s.id === roll.supplierId) || {};
  const rollDefects = defects.filter(d => d.rollId === roll.id);

  res.json({
    success: true,
    type: "roll",
    data: {
      roll,
      fabric,
      supplier,
      defects: rollDefects
    }
  });
});

// 2. QR Kod rasm Data URL (Base64 PNG) olish
router.get('/image/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const qrDataUrl = await QRCode.toDataURL(code, {
      width: 300,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.json({ success: true, qrDataUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: "QR kod generatsiya xatosi", error: err.message });
  }
});

// 3. Stiker / Yorliq ma'lumotlarini batch (bir nechta rulon uchun) olish
router.post('/labels', (req, res) => {
  const { rollIds } = req.body;
  if (!Array.isArray(rollIds) || rollIds.length === 0) {
    return res.status(400).json({ success: false, message: "Rulon ID lari ro'yxati berilishi kerak" });
  }

  const rolls = db.get('rolls');
  const fabrics = db.get('fabrics');
  const settings = db.getSettings();

  const labels = rollIds.map(id => {
    const roll = rolls.find(r => r.id === id);
    if (!roll) return null;
    const fabric = fabrics.find(f => f.id === roll.fabricId) || {};

    return {
      rollId: roll.id,
      qrCode: roll.qrCode || `ERP-${roll.id}`,
      batchNumber: roll.batchNumber,
      initialMeters: roll.initialMeters,
      currentMeters: roll.currentMeters,
      weightKg: roll.weightKg,
      qualityGrade: roll.qualityGrade,
      location: roll.location,
      sellingPricePerMeter: roll.sellingPricePerMeter,
      fabricName: fabric.name || "",
      fabricCode: fabric.code || "",
      fabricComposition: fabric.composition || "",
      fabricColor: fabric.color || "",
      fabricWidth: fabric.width || 0,
      fabricDensity: fabric.density || 0,
      companyName: settings.brandName || settings.companyName,
      phone: settings.phone
    };
  }).filter(Boolean);

  res.json({ success: true, data: labels });
});

export default router;
