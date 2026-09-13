import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Matolar ro'yxati va umumiy statistikasi (KG va Rulonlar soni)
router.get('/', (req, res) => {
  const fabrics = db.get('fabrics');
  const rolls = db.get('rolls');
  const defects = db.get('defects');

  const fabricsWithStats = fabrics.map(fab => {
    const fabRolls = rolls.filter(r => r.fabricId === fab.id);
    const activeRolls = fabRolls.filter(r => r.status === 'in_stock' || r.status === 'partially_sold');
    
    const totalKg = activeRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
    const rawKg = activeRolls.filter(r => r.fabricType === 'xom').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
    const dyedKg = activeRolls.filter(r => r.fabricType === 'boyalgan').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
    const dyeingKg = fabRolls.filter(r => r.status === 'dyeing').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);

    const totalRollsCount = activeRolls.length;
    const fabDefectsCount = defects.filter(d => d.fabricId === fab.id).length;
    const isLowStock = totalKg < (fab.min_stock_alert_kg || 100);

    return {
      ...fab,
      unit: "kg",
      totalKg: Number(totalKg.toFixed(2)),
      rawKg: Number(rawKg.toFixed(2)),
      dyedKg: Number(dyedKg.toFixed(2)),
      dyeingKg: Number(dyeingKg.toFixed(2)),
      totalRollsCount,
      defectsCount: fabDefectsCount,
      isLowStock
    };
  });

  res.json({ success: true, data: fabricsWithStats });
});

// 2. Bitta mato tafsilotlari
router.get('/:id', (req, res) => {
  const fabric = db.findById('fabrics', req.params.id);
  if (!fabric) {
    return res.status(404).json({ success: false, message: "Mato topilmadi" });
  }

  const rolls = db.find('rolls', r => r.fabricId === fabric.id);
  const defects = db.find('defects', d => d.fabricId === fabric.id);

  res.json({
    success: true,
    data: {
      ...fabric,
      rolls,
      defects
    }
  });
});

// 3. Yangi mato turi qo'shish (KG va USD narxlari)
router.post('/', (req, res) => {
  const {
    name,
    code,
    type, // 'xom' yoki 'boyalgan'
    composition,
    color,
    pantoneCode,
    width,
    density,
    purchasePricePerKgUsd,
    sellingPricePerKgUsd,
    category,
    min_stock_alert_kg,
    notes
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: "Mato nomi va artikul kodi kiritilishi shart" });
  }

  const newFabric = db.insert('fabrics', {
    name,
    code,
    type: type || "xom",
    composition: composition || "100% Paxta",
    color: color || "Xom Tabiiy",
    pantoneCode: pantoneCode || "",
    width: Number(width) || 180,
    density: Number(density) || 200,
    unit: "kg",
    purchasePricePerKgUsd: Number(purchasePricePerKgUsd) || 3.50,
    sellingPricePerKgUsd: Number(sellingPricePerKgUsd) || 5.00,
    category: category || "Suprem",
    min_stock_alert_kg: Number(min_stock_alert_kg) || 100,
    notes: notes || ""
  });

  res.status(201).json({ success: true, data: newFabric, message: "Yangi mato katalogga qo'shildi" });
});

// 4. Matoni tahrirlash
router.put('/:id', (req, res) => {
  const updated = db.update('fabrics', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Mato topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Mato ma'lumotlari yangilandi" });
});

// 5. Matoni o'chirish
router.delete('/:id', (req, res) => {
  const rolls = db.find('rolls', r => r.fabricId === req.params.id);
  if (rolls.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Ushbu matoga tegishli rulonlar mavjud. Avval rulonlarni o'chiring yoki arxivlang."
    });
  }

  const deleted = db.delete('fabrics', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Mato topilmadi" });
  }
  res.json({ success: true, message: "Mato o'chirildi" });
});

export default router;
