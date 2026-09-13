import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Bo'yoqxona partiyalari ro'yxati
router.get('/', (req, res) => {
  const dyeingOrders = db.get('dyeing_orders').map(order => {
    if (!order.expectedReturnDate) {
      const baseDate = order.dispatchDate ? new Date(order.dispatchDate) : new Date();
      const target = new Date(baseDate);
      target.setDate(target.getDate() + 5);
      return { ...order, expectedReturnDate: target.toISOString().split('T')[0] };
    }
    return order;
  });
  dyeingOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: dyeingOrders });
});

// --- Bo'yoqxonalar (Dyehouses) Boshqaruvi ---
router.get('/dyehouses', (req, res) => {
  let list = db.get('dyehouses');
  if (!list || list.length === 0) {
    const settings = db.getSettings();
    const defaultNames = settings.dyehouses || [
      "Andijon Tekstil Bo'yoqxona",
      "Toshkent Global Dyeing",
      "Namangan Rangli Mato MCHJ",
      "Samarqand To'qima Bo'yash"
    ];
    list = defaultNames.map((name, idx) => ({
      id: `DYE-00${idx + 1}`,
      name,
      phone: idx === 0 ? "+998 74 223 44 55" : idx === 1 ? "+998 71 280 90 10" : idx === 2 ? "+998 69 234 11 22" : "+998 66 233 55 77",
      address: idx === 0 ? "Andijon viloyati, Asaka sh., Sanoat hududi 4-bino" : idx === 1 ? "Toshkent sh., Chilonzor tumani, Kichik halqa yo'li 15" : idx === 2 ? "Namangan sh., Kosonsoy yo'li 88" : "Samarqand sh., Spitamen shoh ko'chasi 42",
      contactPerson: idx === 0 ? "Jamshidbek Karimov" : idx === 1 ? "Farrux Zokirov" : idx === 2 ? "Dilshod Mansurov" : "Aziz Qodirov",
      standardPricePerKgUsd: idx === 0 ? 0.85 : idx === 1 ? 0.90 : idx === 2 ? 0.80 : 0.75,
      rating: 4.8,
      createdAt: new Date().toISOString()
    }));
    list.forEach(item => db.insert('dyehouses', item));
  }
  res.json({ success: true, data: list });
});

router.post('/dyehouses', (req, res) => {
  const { name, phone, address, contactPerson, standardPricePerKgUsd } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Bo'yoqxona nomi kiritilishi shart" });
  }

  const existing = db.find('dyehouses', d => d.name.toLowerCase() === name.trim().toLowerCase());
  if (existing && existing.length > 0) {
    return res.status(400).json({ success: false, message: "Bunday nomli bo'yoqxona allaqachon mavjud" });
  }

  const newDyehouse = db.insert('dyehouses', {
    id: `DYE-${String(Date.now()).slice(-4)}`,
    name: name.trim(),
    phone: phone || "",
    address: address || "",
    contactPerson: contactPerson || "",
    standardPricePerKgUsd: Number(standardPricePerKgUsd) || 0.85,
    rating: 5.0
  });

  // Settings dagi dyehouses massivini ham sinxronlashtirish
  const settings = db.getSettings();
  const currentNames = settings.dyehouses || [];
  if (!currentNames.includes(newDyehouse.name)) {
    db.updateSettings({ dyehouses: [...currentNames, newDyehouse.name] });
  }

  res.status(201).json({ success: true, data: newDyehouse, message: "Yangi bo'yoqxona muvaffaqiyatli qo'shildi" });
});

router.delete('/dyehouses/:id', (req, res) => {
  const dyehouse = db.findById('dyehouses', req.params.id) || db.find('dyehouses', d => d.name === req.params.id)[0];
  if (!dyehouse) {
    return res.status(404).json({ success: false, message: "Bo'yoqxona topilmadi" });
  }

  // Bo'yoqxonada faol partiyalar bormi tekshirish
  const activeOrders = db.find('dyeing_orders', o => o.dyehouseName === dyehouse.name && o.status !== 'qabul_qilindi');
  if (activeOrders && activeOrders.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Ushbu bo'yoqxonada ${activeOrders.length} ta faol partiya mavjud. Avval partiyalarni qabul qiling yoki yakunlang!`
    });
  }

  db.delete('dyehouses', dyehouse.id);

  // Settings dagi ro'yxatdan ham o'chirish
  const settings = db.getSettings();
  const currentNames = settings.dyehouses || [];
  db.updateSettings({ dyehouses: currentNames.filter(n => n !== dyehouse.name) });

  res.json({ success: true, message: "Bo'yoqxona muvaffaqiyatli o'chirildi" });
});

// 2. Bitta bo'yoqxona partiyasi tafsilotlari
router.get('/:id', (req, res) => {
  const order = db.findById('dyeing_orders', req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Bo'yoqxona partiyasi topilmadi" });
  }
  res.json({ success: true, data: order });
});

// 3. Xom matoni bo'yoqxonaga jo'natish (Partiya ochish)
router.post('/dispatch', (req, res) => {
  const {
    dyehouseName,
    fabricId,
    selectedRollIds,
    colorName,
    pantoneCode,
    pricePerKgUsd,
    sentKg,
    responsiblePerson,
    notes,
    expectedReturnDate
  } = req.body;

  if (!dyehouseName || !fabricId) {
    return res.status(400).json({ success: false, message: "Bo'yoqxona nomi va mato turi tanlanishi shart" });
  }

  const fabric = db.findById('fabrics', fabricId);
  if (!fabric) {
    return res.status(404).json({ success: false, message: "Mato topilmadi" });
  }

  const rolls = db.get('rolls');
  let calculatedSentKg = 0;
  const usedRollsInfo = [];

  if (Array.isArray(selectedRollIds) && selectedRollIds.length > 0) {
    selectedRollIds.forEach(rollId => {
      const roll = rolls.find(r => r.id === rollId);
      if (roll && (roll.status === 'in_stock' || roll.status === 'partially_sold')) {
        calculatedSentKg += Number(roll.currentKg || 0);
        usedRollsInfo.push({
          rollId: roll.id,
          batchNumber: roll.batchNumber,
          kg: Number(roll.currentKg || 0)
        });
        // Rulon holatini 'dyeing' ga o'zgartirish
        db.update('rolls', roll.id, {
          status: 'dyeing',
          notes: (roll.notes || '') + `\n[${new Date().toLocaleDateString('uz-UZ')}] Bo'yoqxonaga yuborildi (${dyehouseName}, ${colorName || ''})`
        });
      }
    });
  } else if (Number(sentKg) > 0) {
    calculatedSentKg = Number(sentKg);
  } else {
    return res.status(400).json({ success: false, message: "Yuboriladigan xom mato rulonlari yoki og'irligi (kg) kiritilishi shart" });
  }

  const batchNumber = `BOY-${new Date().getFullYear()}-${String(db.get('dyeing_orders').length + 1).padStart(3, '0')}`;
  const defaultReturnDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const newOrder = db.insert('dyeing_orders', {
    orderNumber: batchNumber,
    dyehouseName,
    fabricId,
    fabricName: fabric.name,
    colorName: colorName || "Qora (Standart)",
    pantoneCode: pantoneCode || "TCX-19-4008",
    colorHex: req.body.colorHex || "#101820",
    sentKg: Number(calculatedSentKg.toFixed(2)),
    receivedKg: 0,
    shrinkageKg: 0,
    shrinkagePercentage: 0,
    dyeingPricePerKgUsd: Number(pricePerKgUsd) || 0.85,
    totalDyeingCostUsd: Number((calculatedSentKg * (Number(pricePerKgUsd) || 0.85)).toFixed(2)),
    status: "yuborildi", // yuborildi, boyalmoqda, qaytdi, qabul_qilindi
    usedRolls: usedRollsInfo,
    producedRolls: [],
    responsiblePerson: responsiblePerson || "Bo'yoqxona Nazoratchisi",
    dispatchDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: expectedReturnDate || defaultReturnDate,
    receivedDate: null,
    notes: notes || ""
  });

  res.status(201).json({
    success: true,
    data: newOrder,
    message: `Partiya ${batchNumber} bo'yoqxonaga yuborildi (${calculatedSentKg} kg, muddati: ${newOrder.expectedReturnDate})`
  });
});

// 4. Bo'yoqxona buyurtmasi ma'lumotlarini yangilash (muddat, eslatma va boshqalar)
router.put('/:id', (req, res) => {
  const order = db.findById('dyeing_orders', req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Partiya topilmadi" });
  }

  const updated = db.update('dyeing_orders', order.id, req.body);
  res.json({ success: true, data: updated, message: "Partiya ma'lumotlari yangilandi" });
});

// 4.1. Bo'yoqxona holatini o'zgartirish
router.put('/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const order = db.findById('dyeing_orders', req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Partiya topilmadi" });
  }

  const updates = { status };
  if (notes) updates.notes = (order.notes || '') + '\n' + notes;

  const updated = db.update('dyeing_orders', order.id, updates);
  res.json({ success: true, data: updated, message: `Partiya holati yangilandi: ${status}` });
});

// 5. Bo'yoqxonadan qabul qilish (Uvalka / Shrinkage hisobi va Bo'yalgan mato rulonlarini yaratish)
router.post('/receive/:id', (req, res) => {
  const {
    receivedKg,
    numberOfRolls,
    qualityGrade,
    sellingPriceUsd,
    location,
    notes,
    payFromAccount
  } = req.body;

  const order = db.findById('dyeing_orders', req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Bo'yoqxona partiyasi topilmadi" });
  }

  const actualReceived = Number(receivedKg);
  if (!actualReceived || actualReceived <= 0) {
    return res.status(400).json({ success: false, message: "Qabul qilingan og'irlikni (kg) to'g'ri kiriting" });
  }

  // Uvalka (yo'qotish/kirishish) hisobi
  const shrinkageKg = Number((order.sentKg - actualReceived).toFixed(2));
  const shrinkagePercentage = Number(((shrinkageKg / order.sentKg) * 100).toFixed(2));

  // Rulonlarni taqsimlash
  const rollsCount = Math.max(1, parseInt(numberOfRolls) || 1);
  const avgKgPerRoll = Number((actualReceived / rollsCount).toFixed(2));
  const createdRolls = [];

  const fabric = db.findById('fabrics', order.fabricId) || {};
  const settings = db.getSettings();

  for (let i = 1; i <= rollsCount; i++) {
    const rollId = db.generateId('rolls');
    const qrCode = `ERP-${rollId}`;
    const thisRollKg = (i === rollsCount)
      ? Number((actualReceived - (avgKgPerRoll * (rollsCount - 1))).toFixed(2))
      : avgKgPerRoll;

    const newRoll = db.insert('rolls', {
      id: rollId,
      fabricId: order.fabricId,
      fabricType: "boyalgan",
      qrCode,
      dyeingOrderId: order.id,
      supplierId: "",
      batchNumber: `${order.orderNumber}-R${i}`,
      colorName: order.colorName,
      pantoneCode: order.pantoneCode,
      colorHex: order.colorHex || "#101820",
      initialKg: thisRollKg,
      currentKg: thisRollKg,
      tareKg: 0.5,
      netKg: Number((thisRollKg - 0.5).toFixed(2)),
      purchasePricePerKgUsd: Number((fabric.purchasePricePerKgUsd || 3.5) + (order.dyeingPricePerKgUsd || 0.85)),
      sellingPricePerKgUsd: Number(sellingPriceUsd) || Number(fabric.sellingPricePerKgUsd || 5.20),
      qualityGrade: qualityGrade || "1-nav",
      status: "in_stock",
      location: location || "Bo'yalgan Matolar Ombori (B-Sektor)",
      notes: `Bo'yoqxona: ${order.dyehouseName}, Rang: ${order.colorName} (${order.pantoneCode}). Uvalka: ${shrinkagePercentage}%`,
      receivedDate: new Date().toISOString().split('T')[0]
    });
    createdRolls.push(newRoll);
  }

  // Yuborilgan xom mato rulonlarini arxivlash (sold / processed)
  if (Array.isArray(order.usedRolls)) {
    order.usedRolls.forEach(ur => {
      db.update('rolls', ur.rollId, {
        status: 'sold',
        currentKg: 0,
        notes: `Bo'yoqxonada ishlatildi (${order.orderNumber}).`
      });
    });
  }

  // Bo'yash xizmati to'lovini moliya chiqimiga yozish
  const dyeingTotalCostUsd = Number((actualReceived * order.dyeingPricePerKgUsd).toFixed(2));
  const dyeingCostUzs = Math.round(dyeingTotalCostUsd * (settings.usdExchangeRate || 12850));

  if (payFromAccount && dyeingCostUzs > 0) {
    db.insert('finance_transactions', {
      type: "chiqim",
      category: "boyash_xizmati",
      account: payFromAccount,
      amountUsd: dyeingTotalCostUsd,
      amountUzs: dyeingCostUzs,
      referenceType: "dyeing",
      referenceId: order.id,
      description: `${order.dyehouseName} ga bo'yash xizmati uchun to'lov (${actualReceived} kg x $${order.dyeingPricePerKgUsd})`
    });
  }

  // Buyurtmani yangilash
  const updatedOrder = db.update('dyeing_orders', order.id, {
    receivedKg: actualReceived,
    shrinkageKg,
    shrinkagePercentage,
    status: "qabul_qilindi",
    receivedDate: new Date().toISOString().split('T')[0],
    producedRolls: createdRolls.map(r => r.id),
    notes: (order.notes || '') + `\n[${new Date().toLocaleDateString('uz-UZ')}] Qabul qilindi: ${actualReceived} kg (${rollsCount} ta rulon). Uvalka: ${shrinkagePercentage}%`
  });

  res.json({
    success: true,
    data: updatedOrder,
    createdRolls,
    message: `Bo'yoqxonadan ${actualReceived} kg (${rollsCount} ta rulon) qabul qilindi. Uvalka yo'qotishi: ${shrinkagePercentage}%`
  });
});

// 6. Partiyani o'chirish
router.delete('/:id', (req, res) => {
  const deleted = db.delete('dyeing_orders', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Partiya topilmadi" });
  }
  res.json({ success: true, message: "Bo'yoqxona partiyasi o'chirildi" });
});

export default router;
