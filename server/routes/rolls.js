import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Barcha rulonlar ro'yxati (filtrlash bilan)
router.get('/', (req, res) => {
  const { fabricId, fabricType, status, qualityGrade, search } = req.query;
  const rolls = db.get('rolls');
  const fabrics = db.get('fabrics');
  const suppliers = db.get('suppliers');
  const defects = db.get('defects');

  let filtered = rolls.map(r => {
    const fabric = fabrics.find(f => f.id === r.fabricId) || {};
    const supplier = suppliers.find(s => s.id === r.supplierId) || {};
    const rollDefects = defects.filter(d => d.rollId === r.id);

    return {
      ...r,
      fabricName: fabric.name || "Noma'lum mato",
      fabricCode: fabric.code || "",
      fabricColor: r.colorName || fabric.color || "Tabiiy",
      pantoneCode: r.pantoneCode || fabric.pantoneCode || "",
      fabricWidth: fabric.width || 180,
      fabricDensity: fabric.density || 200,
      fabricComposition: fabric.composition || "100% Paxta",
      supplierName: supplier.name || "To'quv Ishlab Chiqarish",
      defectsCount: rollDefects.length,
      defects: rollDefects
    };
  });

  if (fabricId) {
    filtered = filtered.filter(r => r.fabricId === fabricId);
  }
  if (fabricType && fabricType !== 'all') {
    filtered = filtered.filter(r => r.fabricType === fabricType);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter(r => r.status === status);
  }
  if (qualityGrade && qualityGrade !== 'all') {
    filtered = filtered.filter(r => r.qualityGrade === qualityGrade);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.id.toLowerCase().includes(s) ||
      (r.qrCode && r.qrCode.toLowerCase().includes(s)) ||
      (r.batchNumber && r.batchNumber.toLowerCase().includes(s)) ||
      r.fabricName.toLowerCase().includes(s) ||
      (r.colorName && r.colorName.toLowerCase().includes(s)) ||
      (r.pantoneCode && r.pantoneCode.toLowerCase().includes(s)) ||
      (r.location && r.location.toLowerCase().includes(s)) ||
      (r.loomNumber && r.loomNumber.toLowerCase().includes(s))
    );
  }

  // Saralash: eng so'nggi rulonlar yuqorida
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ success: true, data: filtered });
});

// 2. Bitta rulon ma'lumoti
router.get('/:id', (req, res) => {
  const roll = db.findById('rolls', req.params.id);
  if (!roll) {
    return res.status(404).json({ success: false, message: "Rulon topilmadi" });
  }

  const fabric = db.findById('fabrics', roll.fabricId) || {};
  const supplier = db.findById('suppliers', roll.supplierId) || {};
  const defects = db.find('defects', d => d.rollId === roll.id);

  res.json({
    success: true,
    data: {
      ...roll,
      fabric,
      supplier,
      defects
    }
  });
});

// 3. Yangi rulon kirim qilish (Avtomatik QR kod generatsiya)
router.post('/', (req, res) => {
  const {
    fabricId,
    fabricType,
    supplierId,
    batchNumber,
    loomNumber,
    yarnLot,
    colorName,
    pantoneCode,
    initialKg,
    tareKg,
    purchasePricePerKgUsd,
    sellingPricePerKgUsd,
    qualityGrade,
    location,
    notes,
    receivedDate
  } = req.body;

  if (!fabricId || !initialKg || Number(initialKg) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Mato turi va og'irlik (kg) kiritilishi shart"
    });
  }

  const fabric = db.findById('fabrics', fabricId);
  if (!fabric) {
    return res.status(404).json({ success: false, message: "Belgilangan mato topilmadi" });
  }

  const rollId = db.generateId('rolls');
  const qrCode = `ERP-${rollId}`;
  const brutto = Number(initialKg);
  const tare = Number(tareKg) || 0.5;
  const net = Number(Math.max(0.1, brutto - tare).toFixed(2));

  const newRoll = db.insert('rolls', {
    id: rollId,
    fabricId,
    fabricType: fabricType || fabric.type || "xom",
    qrCode,
    supplierId: supplierId || "",
    batchNumber: batchNumber || `ROL-${Date.now().toString().slice(-4)}`,
    loomNumber: loomNumber || "",
    yarnLot: yarnLot || "",
    colorName: colorName || fabric.color || "Standart",
    pantoneCode: pantoneCode || fabric.pantoneCode || "",
    initialKg: net,
    currentKg: net,
    grossKg: brutto,
    tareKg: tare,
    netKg: net,
    purchasePricePerKgUsd: Number(purchasePricePerKgUsd) || Number(fabric.purchasePricePerKgUsd) || 3.50,
    sellingPricePerKgUsd: Number(sellingPricePerKgUsd) || Number(fabric.sellingPricePerKgUsd) || 5.00,
    qualityGrade: qualityGrade || "1-nav",
    status: "in_stock",
    location: location || (fabricType === 'boyalgan' ? "Bo'yalgan Matolar Ombori (B-Sektor)" : "Xom Matolar Ombori (A-Sektor)"),
    notes: notes || "",
    receivedDate: receivedDate || new Date().toISOString().split('T')[0]
  });

  res.status(201).json({
    success: true,
    data: newRoll,
    message: `Rulon ${newRoll.id} (${net} kg) qabul qilindi va QR kod biriktirildi`
  });
});

// 4. Rulondan KG kesish / bo'lish
router.post('/:id/cut', (req, res) => {
  const { cutKg, reason, customerName } = req.body;
  const kgToCut = Number(cutKg);

  if (!kgToCut || kgToCut <= 0) {
    return res.status(400).json({ success: false, message: "Kesiladigan og'irlikni (kg) to'g'ri kiriting" });
  }

  const roll = db.findById('rolls', req.params.id);
  if (!roll) {
    return res.status(404).json({ success: false, message: "Rulon topilmadi" });
  }

  if (roll.currentKg < kgToCut) {
    return res.status(400).json({
      success: false,
      message: `Rulonda yetarli mato yo'q! Mavjud: ${roll.currentKg} kg, so'raldi: ${kgToCut} kg`
    });
  }

  const newCurrentKg = Number((roll.currentKg - kgToCut).toFixed(2));
  const newStatus = newCurrentKg === 0 ? 'sold' : 'partially_sold';

  const updatedRoll = db.update('rolls', roll.id, {
    currentKg: newCurrentKg,
    status: newStatus,
    notes: (roll.notes || '') + `\n[${new Date().toLocaleDateString('uz-UZ')}] ${kgToCut} kg kesildi (${reason || "Namuna / Savdo"}). Qoldiq: ${newCurrentKg} kg`
  });

  res.json({
    success: true,
    data: updatedRoll,
    message: `${kgToCut} kg mato kesildi. Rulon qoldig'i: ${newCurrentKg} kg`
  });
});

// 5. Rulonni tahrirlash
router.put('/:id', (req, res) => {
  const updated = db.update('rolls', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Rulon topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Rulon ma'lumotlari yangilandi" });
});

// 6. Rulonni o'chirish
router.delete('/:id', (req, res) => {
  const deleted = db.delete('rolls', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Rulon topilmadi" });
  }
  res.json({ success: true, message: "Rulon o'chirildi" });
});

export default router;
