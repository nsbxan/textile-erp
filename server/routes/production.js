import express from 'express';
import { db } from '../db.js';
import { getMultiPeriodAnalytics } from '../analyticsHelper.js';

const router = express.Router();

// 0. Ko'p davrli to'quv ishlab chiqarish analitikasi (Kunlik, 7 kunlik, 30 kunlik, Yillik KG)
router.get('/analytics', (req, res) => {
  const allAnalytics = getMultiPeriodAnalytics();
  res.json({ success: true, data: allAnalytics });
});

// 1. Dastgohlar (To'quv mashinalari) ro'yxati
router.get('/looms', (req, res) => {
  let looms = db.get('looms');
  if (looms.length === 0) {
    // Demo dastgohlar
    const demoLooms = [
      { id: "DAS-01", name: "Picanol OmniPlus-1", model: "Picanol 220cm", status: "ishlamoqda", currentFabricId: "FAB-001", operator: "Rustam Karimov", rpm: 650, efficiency: 94, todayKg: 145.5 },
      { id: "DAS-02", name: "Picanol OmniPlus-2", model: "Picanol 220cm", status: "ishlamoqda", currentFabricId: "FAB-002", operator: "Alisher Valiyev", rpm: 620, efficiency: 91, todayKg: 128.0 },
      { id: "DAS-03", name: "Itema R9500-1", model: "Itema 190cm", status: "ishlamoqda", currentFabricId: "FAB-001", operator: "Javohir Toshmatov", rpm: 580, efficiency: 88, todayKg: 110.2 },
      { id: "DAS-04", name: "Itema R9500-2", model: "Itema 190cm", status: "tamirlashda", currentFabricId: "FAB-003", operator: "Sobir Usmonov", rpm: 0, efficiency: 0, todayKg: 0 }
    ];
    demoLooms.forEach(l => db.insert('looms', l));
    looms = db.get('looms');
  }

  const fabrics = db.get('fabrics');
  const enriched = looms.map(l => {
    const f = fabrics.find(fab => fab.id === l.currentFabricId) || {};
    return {
      ...l,
      fabricName: f.name || "Xom mato turi belgilanmagan"
    };
  });

  res.json({ success: true, data: enriched });
});

// 2. Yangi dastgoh qo'shish
router.post('/looms', (req, res) => {
  const { name, model, currentFabricId, operator, rpm } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Dastgoh nomi kiritilishi shart" });
  }

  const newLoom = db.insert('looms', {
    name,
    model: model || "To'quv Dastgohi",
    status: "ishlamoqda",
    currentFabricId: currentFabricId || "",
    operator: operator || "Operator",
    rpm: Number(rpm) || 600,
    efficiency: 92,
    todayKg: 0
  });

  res.status(201).json({ success: true, data: newLoom, message: "Yangi dastgoh ro'yxatga olindi" });
});

// 3. Dastgoh ma'lumotlarini yangilash
router.put('/looms/:id', (req, res) => {
  const updated = db.update('looms', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Dastgoh topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Dastgoh holati yangilandi" });
});

// 4. Dastgohni o'chirish
router.delete('/looms/:id', (req, res) => {
  const deleted = db.delete('looms', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Dastgoh topilmadi" });
  }
  res.json({ success: true, message: "Dastgoh o'chirildi" });
});

// 5. To'quv ishlab chiqarish partiyalari ro'yxati
router.get('/batches', (req, res) => {
  const batches = db.get('weaving_batches');
  batches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: batches });
});

// 6. Yangi to'qilgan xom mato rulonini kiritish (Dastgohdan chiqish + Avtomatik QR kod)
router.post('/produce-roll', (req, res) => {
  const {
    fabricId,
    loomId,
    yarnLot,
    weightKg,
    tareKg,
    operator,
    qualityGrade,
    location,
    notes,
    batchNumber
  } = req.body;

  if (!fabricId || !weightKg || Number(weightKg) <= 0) {
    return res.status(400).json({ success: false, message: "Mato turi va og'irlik (kg) kiritilishi shart" });
  }

  const fabric = db.findById('fabrics', fabricId);
  if (!fabric) {
    return res.status(404).json({ success: false, message: "Mato topilmadi" });
  }

  const rollId = db.generateId('rolls');
  const qrCode = `ERP-${rollId}`;
  const brutto = Number(weightKg);
  const tare = Number(tareKg) || 0.5;
  const net = Number(Math.max(0.1, brutto - tare).toFixed(2));

  const newRoll = db.insert('rolls', {
    id: rollId,
    fabricId,
    fabricType: "xom",
    qrCode,
    supplierId: "",
    batchNumber: batchNumber || `TOQ-${new Date().getFullYear()}-${String(db.get('rolls').length + 1).padStart(3, '0')}`,
    loomNumber: loomId || "Dastgoh #1",
    yarnLot: yarnLot || "LOT-Paxta-30/1",
    colorName: "Xom Paxta (Ranglanmagan)",
    pantoneCode: "RAW-NATURAL",
    initialKg: net,
    currentKg: net,
    grossKg: brutto,
    tareKg: tare,
    netKg: net,
    purchasePricePerKgUsd: Number(fabric.purchasePricePerKgUsd) || 3.20,
    sellingPricePerKgUsd: Number(fabric.sellingPricePerKgUsd) || 4.50,
    qualityGrade: qualityGrade || "1-nav",
    status: "in_stock",
    location: location || "Xom Matolar Ombori (A-Sektor)",
    operator: operator || "Usta to'quvchi",
    notes: notes || `Dastgohdan to'qib chiqarildi. Ip partiyasi: ${yarnLot || 'Standart'}`,
    receivedDate: new Date().toISOString().split('T')[0]
  });

  // Dastgoh bugungi chiqishini yangilash
  if (loomId) {
    const loom = db.findById('looms', loomId);
    if (loom) {
      db.update('looms', loomId, {
        todayKg: Number(((loom.todayKg || 0) + net).toFixed(2))
      });
    }
  }

  res.status(201).json({
    success: true,
    data: newRoll,
    message: `Xom mato ruloni (${rollId}, ${net} kg) to'quvdan qabul qilindi va QR kod biriktirildi`
  });
});

// 7. To'quvga berilgan buyurtmalar ro'yxati (Weaving production orders)
router.get('/orders', (req, res) => {
  let orders = db.get('weaving_orders');
  if (orders.length === 0) {
    const demoOrders = [
      {
        id: "TOQ-ORD-2026-001",
        orderNumber: "TOQ-ORD-2026-001",
        customerName: "Imperia Textile MCHJ",
        fabricId: "FAB-001",
        fabricName: "Suprem Penye Paxta 30/1 (Xom)",
        orderedKg: 3500,
        producedKg: 1850,
        deadline: "2026-09-20",
        dispatchDate: "2026-09-12",
        loomId: "DAS-01",
        loomName: "Picanol OmniPlus-1",
        operator: "Rustam Karimov",
        yarnLot: "LOT-Paxta-30/1 Kompakt",
        widthCm: 185,
        densityGsm: 160,
        yarnCount: "Ne 30/1 Paxta 100%",
        qualityGrade: "1-nav",
        status: "toqilmoqda",
        notes: "Xalqaro standart: qalinligi bir tekis, tugunlarsiz, 1-nav me'yorlariga qat'iy rioya qilinsin.",
        createdAt: "2026-09-12T08:00:00.000Z"
      },
      {
        id: "TOQ-ORD-2026-002",
        orderNumber: "TOQ-ORD-2026-002",
        customerName: "Premier Fashion Tekstil",
        fabricId: "FAB-002",
        fabricName: "Futyer 3-ipli Penye Dioganal (Xom)",
        orderedKg: 5000,
        producedKg: 0,
        deadline: "2026-09-25",
        dispatchDate: "2026-09-13",
        loomId: "DAS-03",
        loomName: "Itema R9500-1",
        operator: "Javohir Toshmatov",
        yarnLot: "LOT-Futyer-30/70 Paxta",
        widthCm: 190,
        densityGsm: 320,
        yarnCount: "30/1 + 20/1 + 10/1",
        qualityGrade: "1-nav",
        status: "yangi",
        notes: "Kuzgi kolleksiya uchun qalin dioganal to'qilish. Har bir rulon 25 kg bo'lsin.",
        createdAt: "2026-09-13T09:30:00.000Z"
      },
      {
        id: "TOQ-ORD-2026-003",
        orderNumber: "TOQ-ORD-2026-003",
        customerName: "O'zbek Yulduzi Tekstil",
        fabricId: "FAB-003",
        fabricName: "Ribana 1x1 Penye Likrali (Xom)",
        orderedKg: 2000,
        producedKg: 2000,
        deadline: "2026-09-15",
        dispatchDate: "2026-09-08",
        loomId: "DAS-02",
        loomName: "Picanol OmniPlus-2",
        operator: "Alisher Valiyev",
        yarnLot: "LOT-Ribana-20/1-Lycra",
        widthCm: 160,
        densityGsm: 220,
        yarnCount: "Ne 20/1 Paxta 95% + 5% Likra",
        qualityGrade: "1-nav",
        status: "bajarildi",
        notes: "Topshiriq to'liq bajarildi, xom omborga 80 ta rulon kirim qilindi.",
        createdAt: "2026-09-08T10:00:00.000Z"
      }
    ];
    demoOrders.forEach(o => db.insert('weaving_orders', o));
    orders = db.get('weaving_orders');
  }

  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: orders });
});

// 8. Yangi to'quv buyurtmasi berish
router.post('/orders', (req, res) => {
  const {
    customerName,
    fabricId,
    fabricName,
    orderedKg,
    deadline,
    loomId,
    loomName,
    operator,
    yarnLot,
    widthCm,
    densityGsm,
    yarnCount,
    qualityGrade,
    notes
  } = req.body;

  if (!fabricId || !orderedKg || Number(orderedKg) <= 0) {
    return res.status(400).json({ success: false, message: "Mato turi va buyurtma vazni (kg) kiritilishi shart" });
  }

  if (!deadline) {
    return res.status(400).json({ success: false, message: "Buyurtma topshirish muddati kiritilishi shart" });
  }

  const orderId = db.generateId('weaving_orders');
  const count = db.get('weaving_orders').length + 1;
  const orderNumber = `TOQ-ORD-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  const newOrder = db.insert('weaving_orders', {
    id: orderId,
    orderNumber,
    customerName: customerName || "Ichki Ishlab Chiqarish",
    fabricId,
    fabricName: fabricName || "Xom Mato",
    orderedKg: Number(orderedKg),
    producedKg: 0,
    deadline,
    dispatchDate: new Date().toISOString().split('T')[0],
    loomId: loomId || "",
    loomName: loomName || "Belgilanmagan dastgoh",
    operator: operator || "Usta to'quvchi",
    yarnLot: yarnLot || "LOT-Paxta-Standart",
    widthCm: Number(widthCm) || 180,
    densityGsm: Number(densityGsm) || 160,
    yarnCount: yarnCount || "Paxta 100%",
    qualityGrade: qualityGrade || "1-nav",
    status: "yangi",
    notes: notes || "",
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    data: newOrder,
    message: `To'quvga yangi buyurtma (${orderNumber}, ${orderedKg} kg, muddati: ${deadline}) ro'yxatga olindi`
  });
});

// 9. To'quv buyurtmasi holatini yangilash
router.put('/orders/:id', (req, res) => {
  const updated = db.update('weaving_orders', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "To'quv buyurtmasi topilmadi" });
  }
  res.json({ success: true, data: updated, message: "To'quv buyurtmasi yangilandi" });
});

// 10. To'quv buyurtmasini o'chirish
router.delete('/orders/:id', (req, res) => {
  const deleted = db.delete('weaving_orders', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "To'quv buyurtmasi topilmadi" });
  }
  res.json({ success: true, message: "To'quv buyurtmasi o'chirildi" });
});

export default router;

