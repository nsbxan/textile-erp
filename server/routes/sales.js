import express from 'express';
import { db } from '../db.js';
import { getMultiPeriodAnalytics } from '../analyticsHelper.js';

const router = express.Router();

// 0. Ko'p davrli sotuv analitikasi (Kunlik, 7 kunlik, 30 kunlik, Yillik KG va $)
router.get('/analytics', (req, res) => {
  const allAnalytics = getMultiPeriodAnalytics();
  res.json({ success: true, data: allAnalytics });
});

// 1. Sotuvlar ro'yxati
router.get('/', (req, res) => {
  const sales = db.get('sales');
  sales.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: sales });
});

// --- Xaridordan Qaytgan Matolar (Vozvratlar) ---
router.get('/returns', (req, res) => {
  const returns = db.get('sales_returns');
  returns.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: returns });
});

router.post('/returns', (req, res) => {
  const {
    invoiceNumber,
    customerId,
    customerName,
    fabricId,
    fabricName,
    colorName,
    pantoneCode,
    returnedKg,
    pricePerKgUsd,
    reason,
    detailedReasonNotes,
    actionTaken, // 'omborga_kirim_1nav', 'omborga_kirim_2nav', 'brak_3nav', 'chiqit'
    refundType, // 'qarzdan_ayirish', 'pul_qaytarildi', 'almashtirildi'
    responsiblePerson
  } = req.body;

  const kg = Number(returnedKg);
  if (!kg || kg <= 0) {
    return res.status(400).json({ success: false, message: "Qaytarilgan mato vaznini (kg) to'g'ri kiriting" });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: "Mato nima sababdan qaytganligi ko'rsatilishi shart" });
  }

  const rate = db.getSettings().usdExchangeRate || 12850;
  const unitPrice = Number(pricePerKgUsd) || 5.20;
  const refundTotalUsd = Number((kg * unitPrice).toFixed(2));
  const refundTotalUzs = Math.round(refundTotalUsd * rate);

  const returnNumber = `RET-${new Date().getFullYear()}-${String(db.get('sales_returns').length + 1).padStart(4, '0')}`;

  // 1. Agar omborga qaytarilsa (1-nav yoki 2-nav), yangi rulon yoki zaxirani tiklash
  let createdRoll = null;
  if (actionTaken === 'omborga_kirim_1nav' || actionTaken === 'omborga_kirim_2nav') {
    const quality = actionTaken === 'omborga_kirim_2nav' ? '2-nav' : '1-nav';
    const rollId = db.generateId('rolls');
    createdRoll = db.insert('rolls', {
      id: rollId,
      fabricId: fabricId || 'FAB-002',
      fabricType: 'boyalgan',
      fabricName: fabricName || "Bo'yalgan Mato",
      batchNumber: `${returnNumber}-VOZ`,
      colorName: colorName || "Qora",
      pantoneCode: pantoneCode || "TCX-19-4008",
      initialKg: kg,
      currentKg: kg,
      tareKg: 0.5,
      netKg: Number((kg - 0.5).toFixed(2)),
      purchasePricePerKgUsd: unitPrice * 0.7,
      sellingPricePerKgUsd: quality === '2-nav' ? unitPrice * 0.85 : unitPrice,
      qualityGrade: quality,
      status: 'in_stock',
      location: "Bo'yalgan Matolar Ombori (Vozvrat Sektori)",
      notes: `Mijoz (${customerName || 'Mijoz'}) dan qaytarilgan (${returnNumber}). Sabab: ${reason}. Izoh: ${detailedReasonNotes || ''}`,
      receivedDate: new Date().toISOString().split('T')[0]
    });
  } else if (actionTaken === 'brak_3nav') {
    // Brakka chiqarish
    const rollId = db.generateId('rolls');
    createdRoll = db.insert('rolls', {
      id: rollId,
      fabricId: fabricId || 'FAB-002',
      fabricType: 'boyalgan',
      fabricName: fabricName || "Bo'yalgan Mato",
      batchNumber: `${returnNumber}-BRK`,
      colorName: colorName || "Qora",
      pantoneCode: pantoneCode || "TCX-19-4008",
      initialKg: kg,
      currentKg: kg,
      tareKg: 0.5,
      netKg: Number((kg - 0.5).toFixed(2)),
      purchasePricePerKgUsd: unitPrice * 0.5,
      sellingPricePerKgUsd: unitPrice * 0.5,
      qualityGrade: '3-nav',
      status: 'in_stock',
      location: "Brak va Nuqsonli Matolar Ombori (C-Sektor)",
      notes: `Mijozdan qaytgan brak: ${reason}. ${detailedReasonNotes || ''}`,
      receivedDate: new Date().toISOString().split('T')[0]
    });

    db.insert('defects', {
      rollId,
      fabricId: fabricId || 'FAB-002',
      defectType: 'xaridordan_vozvrat',
      severity: 'yuqori',
      penaltyDiscountPercent: 50,
      actionTaken: "3-nav (Brak) ga chiqarildi",
      inspectorName: responsiblePerson || "Sifat Nazoratchisi",
      notes: `Mijoz (${customerName}) dan qaytgan brak: ${reason}. ${detailedReasonNotes || ''}`
    });
  }

  // 2. Moliyaviy chora (qarzdan chegirish yoki pul qaytarish)
  if (customerId && refundType === 'qarzdan_ayirish') {
    const customer = db.findById('customers', customerId);
    if (customer) {
      const currentDebt = Number(customer.debtUsd || 0);
      const newDebtUsd = Math.max(0, Number((currentDebt - refundTotalUsd).toFixed(2)));
      db.update('customers', customer.id, {
        debtUsd: newDebtUsd,
        debtUzs: Math.round(newDebtUsd * rate)
      });
    }
  } else if (refundType === 'pul_qaytarildi') {
    db.insert('finance_transactions', {
      type: "chiqim",
      category: "vozvrat_qaytish",
      account: "dollar_kassa",
      amountUsd: refundTotalUsd,
      amountUzs: refundTotalUzs,
      currency: "USD",
      referenceType: "return",
      referenceId: returnNumber,
      description: `${customerName || 'Mijoz'} ga qaytarilgan mato uchun pul qaytarildi (${returnNumber}, ${kg} kg x $${unitPrice})`
    });
  }

  // 3. Qaytgan mato yozuvini kiritish
  const newReturn = db.insert('sales_returns', {
    returnNumber,
    invoiceNumber: invoiceNumber || "",
    customerId: customerId || "",
    customerName: customerName || "Chakana xaridor",
    fabricId: fabricId || "",
    fabricName: fabricName || "Bo'yalgan Mato",
    colorName: colorName || "Qora",
    pantoneCode: pantoneCode || "TCX-19-4008",
    returnedKg: kg,
    pricePerKgUsd: unitPrice,
    refundTotalUsd,
    refundTotalUzs,
    reason,
    detailedReasonNotes: detailedReasonNotes || "",
    actionTaken: actionTaken || "omborga_kirim_2nav",
    refundType: refundType || "qarzdan_ayirish",
    responsiblePerson: responsiblePerson || "Sifat nazoratchisi",
    returnDate: new Date().toISOString().split('T')[0],
    createdRollId: createdRoll ? createdRoll.id : null
  });

  res.status(201).json({
    success: true,
    data: newReturn,
    createdRoll,
    message: `Qaytarilgan mato (${returnNumber}) muvaffaqiyatli ro'yxatga olindi (${kg} kg)!`
  });
});

router.delete('/returns/:id', (req, res) => {
  const deleted = db.delete('sales_returns', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Vozvrat yozuvi topilmadi" });
  }
  res.json({ success: true, message: "Vozvrat yozuvi o'chirildi" });
});

// 2. Bitta invoys ma'lumotlari
router.get('/:id', (req, res) => {
  const sale = db.findById('sales', req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: "Invoys topilmadi" });
  }
  const customer = db.findById('customers', sale.customerId);
  const settings = db.getSettings();

  res.json({
    success: true,
    data: {
      ...sale,
      customer,
      company: settings
    }
  });
});

// 3. Yangi sotuv amalga oshirish (Faqat mato - KG va USD/$ + So'm kursi)
router.post('/', (req, res) => {
  const {
    customerId,
    customerName,
    items,
    exchangeRate,
    discountUsd,
    paidAmountUsd,
    paidAmountUzs,
    paymentType, // 'dollar_naqd', 'som_naqd', 'som_karta', 'som_otkazma', 'nasiya', 'aralash'
    paymentAccount,
    notes
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Sotuv savatchasi bo'sh bo'lishi mumkin emas" });
  }

  const rate = Number(exchangeRate) || db.getSettings().usdExchangeRate || 12850;
  const rolls = db.get('rolls');

  // Omborda yetarli mato (kg) borligini tekshirish
  for (const item of items) {
    const roll = rolls.find(r => r.id === item.rollId);
    if (!roll) {
      return res.status(400).json({ success: false, message: `Rulon topilmadi: ${item.rollCode || item.rollId}` });
    }
    const neededKg = Number(item.kg);
    if (roll.currentKg < neededKg) {
      return res.status(400).json({
        success: false,
        message: `${roll.id} (${roll.fabricName || 'Mato'}) rulonida yetarli vazn yo'q! Mavjud: ${roll.currentKg} kg, talab: ${neededKg} kg`
      });
    }
  }

  // Hisob-kitoblar (USD va UZS)
  let subtotalUsd = 0;
  const processedItems = items.map(item => {
    const roll = rolls.find(r => r.id === item.rollId);
    const kg = Number(item.kg);
    const unitPriceUsd = Number(item.unitPriceUsd || item.pricePerKgUsd || 5.00);
    const lineTotalUsd = Number((kg * unitPriceUsd).toFixed(2));
    const lineTotalUzs = Math.round(lineTotalUsd * rate);

    subtotalUsd += lineTotalUsd;

    return {
      rollId: item.rollId,
      rollCode: item.rollCode || item.rollId,
      fabricName: item.fabricName || (roll ? roll.fabricName : "Mato"),
      colorName: item.colorName || (roll ? roll.colorName : "Standart"),
      pantoneCode: item.pantoneCode || (roll ? roll.pantoneCode : ""),
      qualityGrade: item.qualityGrade || (roll ? roll.qualityGrade : "1-nav"),
      kg,
      unitPriceUsd,
      lineTotalUsd,
      lineTotalUzs
    };
  });

  const discUsd = Number(discountUsd) || 0;
  const totalAmountUsd = Number(Math.max(0, subtotalUsd - discUsd).toFixed(2));
  const totalAmountUzs = Math.round(totalAmountUsd * rate);

  // To'langan summa
  const paidUsd = Number(paidAmountUsd) || 0;
  const paidUzs = Number(paidAmountUzs) || 0;
  const totalPaidInUsdTerms = Number((paidUsd + (paidUzs / rate)).toFixed(2));
  const remainingDebtUsd = Number(Math.max(0, totalAmountUsd - totalPaidInUsdTerms).toFixed(2));
  const remainingDebtUzs = Math.round(remainingDebtUsd * rate);

  let status = 'tolandi';
  if (totalPaidInUsdTerms === 0) {
    status = 'kutilmoqda'; // Nasiya
  } else if (remainingDebtUsd > 0.05) {
    status = 'qisman';
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(db.get('sales').length + 1).padStart(4, '0')}`;
  const saleId = db.generateId('sales');

  // Ombordagi rulonlardan mato og'irligini (kg) yechish
  for (const item of processedItems) {
    const roll = rolls.find(r => r.id === item.rollId);
    if (roll) {
      const newKg = Number(Math.max(0, roll.currentKg - item.kg).toFixed(2));
      const newStatus = newKg === 0 ? 'sold' : 'partially_sold';
      db.update('rolls', roll.id, {
        currentKg: newKg,
        status: newStatus,
        notes: (roll.notes || '') + `\n[${new Date().toLocaleDateString('uz-UZ')}] ${item.kg} kg sotildi (${invoiceNumber}). Qoldiq: ${newKg} kg`
      });
    }
  }

  // Invoysni saqlash
  const newSale = db.insert('sales', {
    id: saleId,
    invoiceNumber,
    customerId: customerId || "",
    customerName: customerName || "Chakana xaridor",
    items: processedItems,
    exchangeRate: rate,
    subtotalUsd,
    discountUsd: discUsd,
    totalAmountUsd,
    totalAmountUzs,
    paidAmountUsd: paidUsd,
    paidAmountUzs: paidUzs,
    totalPaidInUsdTerms,
    remainingDebtUsd,
    remainingDebtUzs,
    paymentType: paymentType || "dollar_naqd",
    paymentAccount: paymentAccount || "dollar_kassa",
    status,
    notes: notes || ""
  });

  // Moliya kassa tranzaksiyasi
  if (paidUsd > 0) {
    db.insert('finance_transactions', {
      type: "kirim",
      category: "sotuv_tushumi",
      account: "dollar_kassa",
      amountUsd: paidUsd,
      amountUzs: Math.round(paidUsd * rate),
      currency: "USD",
      referenceType: "sale",
      referenceId: newSale.id,
      description: `${customerName || 'Mijoz'} ga mato sotuvi (USD tushum: ${invoiceNumber})`
    });
  }

  if (paidUzs > 0) {
    db.insert('finance_transactions', {
      type: "kirim",
      category: "sotuv_tushumi",
      account: paymentAccount || "som_kassa",
      amountUsd: Number((paidUzs / rate).toFixed(2)),
      amountUzs: paidUzs,
      currency: "UZS",
      referenceType: "sale",
      referenceId: newSale.id,
      description: `${customerName || 'Mijoz'} ga mato sotuvi (So'm tushum: ${invoiceNumber})`
    });
  }

  // Mijoz balansini va qarzini yangilash
  if (customerId) {
    const customer = db.findById('customers', customerId);
    if (customer) {
      db.update('customers', customerId, {
        totalSpentUsd: Number((customer.totalSpentUsd || 0) + totalAmountUsd).toFixed(2),
        debtUsd: Number((customer.debtUsd || 0) + remainingDebtUsd).toFixed(2),
        debtUzs: Math.round(((customer.debtUsd || 0) + remainingDebtUsd) * rate)
      });
    }
  }

  res.status(201).json({
    success: true,
    data: newSale,
    message: `Sotuv muvaffaqiyatli amalga oshirildi! Invoys: ${invoiceNumber} ($${totalAmountUsd})`
  });
});

export default router;
