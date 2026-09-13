import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Barcha nuqsonlar ro'yxati
router.get('/', (req, res) => {
  const { rollId, fabricId, severity, defectType } = req.query;
  const defects = db.get('defects');
  const rolls = db.get('rolls');
  const fabrics = db.get('fabrics');

  let list = defects.map(d => {
    const roll = rolls.find(r => r.id === d.rollId) || {};
    const fabric = fabrics.find(f => f.id === d.fabricId || f.id === roll.fabricId) || {};

    return {
      ...d,
      rollCode: roll.id || d.rollId,
      rollQrCode: roll.qrCode || "",
      batchNumber: roll.batchNumber || "",
      fabricName: fabric.name || "Noma'lum mato",
      fabricCode: fabric.code || "",
      fabricColor: fabric.color || ""
    };
  });

  if (rollId) list = list.filter(d => d.rollId === rollId);
  if (fabricId) list = list.filter(d => d.fabricId === fabricId);
  if (severity) list = list.filter(d => d.severity === severity);
  if (defectType) list = list.filter(d => d.defectType === defectType);

  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ success: true, data: list });
});

// 2. Yangi kamchilik/nuqson qayd etish
router.post('/', (req, res) => {
  const {
    rollId,
    fabricId,
    meterPosition,
    defectType,
    severity,
    actionTaken,
    lossMeters,
    reportedBy,
    notes,
    updateQualityGrade
  } = req.body;

  if (!rollId || !defectType) {
    return res.status(400).json({
      success: false,
      message: "Rulon tanlanishi va nuqson turi kiritilishi shart"
    });
  }

  const roll = db.findById('rolls', rollId);
  if (!roll) {
    return res.status(404).json({ success: false, message: "Rulon topilmadi" });
  }

  const effectiveFabricId = fabricId || roll.fabricId;

  const newDefect = db.insert('defects', {
    rollId,
    fabricId: effectiveFabricId,
    meterPosition: meterPosition || "Aniqlanmadi",
    defectType: defectType || "boshqa",
    severity: severity || "orta",
    actionTaken: actionTaken || "belgilandi",
    lossMeters: Number(lossMeters) || 0,
    reportedBy: reportedBy || "Sifat nazoratchisi",
    notes: notes || ""
  });

  // Agar nuqson jiddiy bo'lsa yoki so'ralsa, rulon navini avtomatik 2-nav yoki brak qilish
  if (updateQualityGrade || severity === 'orta' || severity === 'yuqori') {
    let newGrade = roll.qualityGrade;
    if (severity === 'orta' && roll.qualityGrade === '1-nav') {
      newGrade = '2-nav';
    } else if (severity === 'yuqori') {
      newGrade = '3-nav';
    }
    db.update('rolls', roll.id, { qualityGrade: newGrade });
  }

  // Agar matoning bir qismi kesib tashlangan bo'lsa, rulon metrajini kamaytirish
  if (actionTaken === 'kesib_tashlandi' && Number(lossMeters) > 0) {
    const newMeters = Math.max(0, Number((roll.currentMeters - Number(lossMeters)).toFixed(2)));
    db.update('rolls', roll.id, {
      currentMeters: newMeters,
      notes: roll.notes + `\n[${new Date().toLocaleDateString('uz-UZ')}] Nuqson tufayli ${lossMeters}m kesib tashlandi.`
    });
  }

  res.status(201).json({
    success: true,
    data: newDefect,
    message: "Mato kamchiligi sifat daftariga qayd etildi"
  });
});

// 3. Nuqsonni yangilash
router.put('/:id', (req, res) => {
  const updated = db.update('defects', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Nuqson yozuvi topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Nuqson ma'lumotlari yangilandi" });
});

// 4. Nuqsonni o'chirish
router.delete('/:id', (req, res) => {
  const deleted = db.delete('defects', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Nuqson topilmadi" });
  }
  res.json({ success: true, message: "Nuqson yozuvi o'chirildi" });
});

export default router;
