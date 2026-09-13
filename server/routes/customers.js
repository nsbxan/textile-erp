import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Mijozlar ro'yxati (kengaytirilgan xaridlar, to'lovlar va reyting bilan)
router.get('/', (req, res) => {
  const customers = db.get('customers');
  const sales = db.get('sales');
  const transactions = db.get('finance_transactions') || [];
  const rate = db.getSettings().usdExchangeRate || 12850;

  const list = customers.map(c => {
    const custSales = sales.filter(s => s.customerId === c.id || (s.customerName && s.customerName.toLowerCase() === (c.name || '').toLowerCase()));
    const custDebtPayments = transactions.filter(t => t.referenceId === c.id || (t.description && t.description.includes(c.name)));

    let totalKg = 0;
    let salesTotalUsd = 0;
    let paidFromSalesUsd = 0;

    custSales.forEach(s => {
      salesTotalUsd += Number(s.totalAmountUsd || 0);
      paidFromSalesUsd += Number(s.totalPaidInUsdTerms !== undefined ? s.totalPaidInUsdTerms : (s.paidAmountUsd || 0));
      if (Array.isArray(s.items)) {
        s.items.forEach(it => {
          totalKg += Number(it.kg || 0);
        });
      }
    });

    let paidDebtTransactionsUsd = 0;
    custDebtPayments.forEach(p => {
      paidDebtTransactionsUsd += Number(p.amountUsd || 0);
    });

    const totalPaidUsd = Number((paidFromSalesUsd + paidDebtTransactionsUsd).toFixed(2));
    const debtUsd = Number(c.debtUsd !== undefined ? c.debtUsd : (c.debt ? Number(c.debt) / rate : 0));
    const debtUzs = Math.round(debtUsd * rate);
    const hasDebt = debtUsd > 0.05;

    // Total spent (prioritize database spent or calculated sales total)
    const baseSpent = Number(c.totalSpentUsd);
    const totalSpentUsd = (!isNaN(baseSpent) && baseSpent > 0) ? baseSpent : (salesTotalUsd > 0 ? salesTotalUsd : 0);

    // Reyting va daraja hisoblash (1.0 dan 5.0 gacha)
    let score = 3.5;
    if (totalSpentUsd >= 50000 || totalKg >= 8000) score += 1.0;
    else if (totalSpentUsd >= 15000 || totalKg >= 3000) score += 0.7;
    else if (totalSpentUsd >= 5000 || totalKg >= 1000) score += 0.4;

    if (!hasDebt && (custSales.length > 0 || totalSpentUsd > 0)) {
      score += 0.5; // Qarzini to'liq yopgan intizomli mijoz
    } else if (debtUsd > 50000) {
      score -= 0.6;
    } else if (debtUsd > 20000) {
      score -= 0.3;
    }

    score = Math.min(5.0, Math.max(1.0, Number(score.toFixed(1))));

    let tier = 'Bronza';
    let tierColor = 'amber';
    if (score >= 4.8) {
      tier = 'VIP Platina';
      tierColor = 'purple';
    } else if (score >= 4.2) {
      tier = 'Oltin (Gold)';
      tierColor = 'yellow';
    } else if (score >= 3.6) {
      tier = 'Kumush (Silver)';
      tierColor = 'slate';
    }

    // Mato hajmi bo'yicha maxsus toifa
    let fabricTier = 'Kichik Ishlab Chiqaruvchi';
    if (totalKg >= 50000) fabricTier = '👑 Mega Xaridor (50t+)';
    else if (totalKg >= 20000) fabricTier = '💎 Katta Ulgurji (20-50t)';
    else if (totalKg >= 5000) fabricTier = '🥇 O\'rta Korxona (5-20t)';
    else if (totalKg > 0) fabricTier = '🥈 Kichik Ishlab Chiqaruvchi';

    // Eng oxirgi xarid vaqti
    const sortedSales = [...custSales].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const lastSale = sortedSales[0] || null;

    return {
      ...c,
      salesCount: custSales.length,
      totalPurchasedKg: Number(totalKg.toFixed(1)),
      totalPurchasedTonnes: Number((totalKg / 1000).toFixed(2)),
      estimatedRolls: Math.round(totalKg / 25),
      fabricTier,
      totalSalesUsd: Number(salesTotalUsd.toFixed(2)),
      totalPaidUsd,
      totalSpentUsd: Number(totalSpentUsd.toFixed(2)),
      debtUsd: Number(debtUsd.toFixed(2)),
      debtUzs,
      hasDebt,
      ratingScore: score,
      tier,
      tierColor,
      lastPurchaseDate: lastSale ? (lastSale.createdAt || lastSale.date) : null
    };
  });

  // Jami sotilgan mato ulushini hisoblash
  const totalAllKg = list.reduce((acc, cur) => acc + (cur.totalPurchasedKg || 0), 0);
  const fabricSorted = [...list].sort((a, b) => (b.totalPurchasedKg || 0) - (a.totalPurchasedKg || 0));

  list.forEach(c => {
    c.fabricMarketSharePercent = totalAllKg > 0 ? Number(((c.totalPurchasedKg / totalAllKg) * 100).toFixed(1)) : 0;
    c.fabricRank = fabricSorted.findIndex(item => item.id === c.id) + 1;
  });

  list.sort((a, b) => (b.totalPurchasedKg || 0) - (a.totalPurchasedKg || 0));
  res.json({ success: true, data: list });
});

// 1.1. Bitta mijozning batafsil xarid va to'lovlar tarixi (vaqti-soati bilan)
router.get('/:id/history', (req, res) => {
  const customer = db.findById('customers', req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Mijoz topilmadi" });
  }

  const sales = db.get('sales');
  const transactions = db.get('finance_transactions') || [];
  const rate = db.getSettings().usdExchangeRate || 12850;

  // Mijozning barcha sotuvlari
  const custSales = sales.filter(s => s.customerId === customer.id || (s.customerName && s.customerName.toLowerCase() === (customer.name || '').toLowerCase()));
  custSales.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  let overallKg = 0;
  let overallSalesUsd = 0;
  let overallPaidUsd = 0;

  // Har bir sotuv ma'lumotlarini qulay formatga keltirish
  const purchases = custSales.map(sale => {
    let totalKg = 0;
    const items = (sale.items || []).map(it => {
      const itKg = Number(it.kg || 0);
      totalKg += itKg;
      return {
        rollId: it.rollId,
        rollCode: it.rollCode || it.rollId,
        fabricName: it.fabricName || "Bo'yalgan Mato",
        colorName: it.colorName || "Standart",
        pantoneCode: it.pantoneCode || "",
        qualityGrade: it.qualityGrade || "1-nav",
        kg: itKg,
        unitPriceUsd: Number(it.unitPriceUsd || it.pricePerKgUsd || 0),
        lineTotalUsd: Number(it.lineTotalUsd || 0),
        lineTotalUzs: Number(it.lineTotalUzs || 0)
      };
    });

    overallKg += totalKg;
    const totalUsd = Number(sale.totalAmountUsd || 0);
    overallSalesUsd += totalUsd;
    const paidUsd = Number(sale.totalPaidInUsdTerms !== undefined ? sale.totalPaidInUsdTerms : (sale.paidAmountUsd || 0));
    overallPaidUsd += paidUsd;
    const debtUsd = Number(sale.remainingDebtUsd !== undefined ? sale.remainingDebtUsd : Math.max(0, totalUsd - paidUsd));
    const hasRemainingDebt = debtUsd > 0.05;

    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber || sale.id,
      createdAt: sale.createdAt || sale.date || new Date().toISOString(),
      items,
      totalKg: Number(totalKg.toFixed(1)),
      totalAmountUsd: totalUsd,
      totalAmountUzs: Number(sale.totalAmountUzs || Math.round(totalUsd * rate)),
      paidAmountUsd: Number(sale.paidAmountUsd || 0),
      paidAmountUzs: Number(sale.paidAmountUzs || 0),
      totalPaidInUsdTerms: paidUsd,
      remainingDebtUsd: debtUsd,
      remainingDebtUzs: Number(sale.remainingDebtUzs || Math.round(debtUsd * rate)),
      hasRemainingDebt,
      status: sale.status || (hasRemainingDebt ? 'qisman' : 'tolandi'),
      paymentType: sale.paymentType || 'dollar_naqd',
      paymentAccount: sale.paymentAccount || 'dollar_kassa',
      notes: sale.notes || ""
    };
  });

  // Mijozning qarz to'lovlari
  const custDebtPayments = transactions.filter(t => t.referenceId === customer.id || (t.description && t.description.includes(customer.name)));
  custDebtPayments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  let totalDebtRepaidUsd = 0;
  const debtPayments = custDebtPayments.map(p => {
    const pUsd = Number(p.amountUsd || 0);
    totalDebtRepaidUsd += pUsd;
    return {
      id: p.id,
      createdAt: p.createdAt,
      amountUsd: pUsd,
      amountUzs: Number(p.amountUzs || 0),
      currency: p.currency || 'USD',
      account: p.account,
      description: p.description
    };
  });

  const currentDebtUsd = Number(customer.debtUsd !== undefined ? customer.debtUsd : (customer.debt ? Number(customer.debt) / rate : 0));
  const currentDebtUzs = Math.round(currentDebtUsd * rate);

  res.json({
    success: true,
    data: {
      customer: {
        ...customer,
        totalPurchasedKg: Number(overallKg.toFixed(1)),
        totalSalesUsd: Number(overallSalesUsd.toFixed(2)),
        totalPaidUsd: Number((overallPaidUsd + totalDebtRepaidUsd).toFixed(2)),
        debtUsd: Number(currentDebtUsd.toFixed(2)),
        debtUzs: currentDebtUzs,
        hasDebt: currentDebtUsd > 0.05
      },
      purchases,
      debtPayments
    }
  });
});

// 2. Yangi mijoz qo'shish
router.post('/', (req, res) => {
  const { name, phone, company, address, notes, initialDebtUsd } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Mijoz ismi kiritilishi shart" });
  }

  const rate = db.getSettings().usdExchangeRate || 12850;
  const initDebtUsd = Number(initialDebtUsd) || 0;

  const newCust = db.insert('customers', {
    name,
    phone: phone || "",
    company: company || "",
    address: address || "",
    notes: notes || "",
    debtUsd: initDebtUsd,
    debtUzs: Math.round(initDebtUsd * rate),
    totalSpentUsd: 0
  });

  res.status(201).json({ success: true, data: newCust, message: "Yangi mijoz ro'yxatga olindi" });
});

// 3. Mijozni tahrirlash
router.put('/:id', (req, res) => {
  const updated = db.update('customers', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Mijoz topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Mijoz ma'lumotlari yangilandi" });
});

// 4. Mijozni o'chirish
router.delete('/:id', (req, res) => {
  const cust = db.findById('customers', req.params.id);
  if (!cust) {
    return res.status(404).json({ success: false, message: "Mijoz topilmadi" });
  }

  const sales = db.find('sales', s => s.customerId === req.params.id);
  if (sales.length > 0 && Number(cust.debtUsd || cust.debt || 0) > 0) {
    return res.status(400).json({
      success: false,
      message: `Ushbu mijozning qarzdorligi mavjud ($${cust.debtUsd || cust.debt}). Avval qarzni yopish lozim.`
    });
  }

  const deleted = db.delete('customers', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Mijoz topilmadi" });
  }
  res.json({ success: true, message: "Mijoz muvaffaqiyatli o'chirildi" });
});

// 5. Qarz so'ndirish (To'lov qabul qilish - USD, UZS yoki ARALASH: bir qismi dollar, bir qismi so'mda)
router.post('/:id/pay-debt', (req, res) => {
  const {
    amountUsd,
    amountUzs,
    currency, // 'USD' | 'UZS' | 'SPLIT' (aralash)
    paymentAccountUsd,
    paymentAccountUzs,
    notes
  } = req.body;

  const cust = db.findById('customers', req.params.id);
  if (!cust) {
    return res.status(404).json({ success: false, message: "Mijoz topilmadi" });
  }

  const rate = db.getSettings().usdExchangeRate || 12850;
  const valUsd = Number(amountUsd) > 0 ? Number(amountUsd) : 0;
  const valUzs = Number(amountUzs) > 0 ? Number(amountUzs) : 0;
  const uzsInUsd = valUzs > 0 ? valUzs / rate : 0;

  const totalPaidEquivalentUsd = Number((valUsd + uzsInUsd).toFixed(2));

  if (totalPaidEquivalentUsd <= 0) {
    return res.status(400).json({ success: false, message: "To'lov summasini (dollar yoki so'mda) to'g'ri kiriting" });
  }

  const currentDebtUsd = Number(cust.debtUsd || 0);
  const newDebtUsd = Math.max(0, Number((currentDebtUsd - totalPaidEquivalentUsd).toFixed(2)));
  const newDebtUzs = Math.round(newDebtUsd * rate);

  db.update('customers', cust.id, {
    debtUsd: newDebtUsd,
    debtUzs: newDebtUzs,
    totalSpentUsd: Number(((cust.totalSpentUsd || 0) + totalPaidEquivalentUsd).toFixed(2))
  });

  // 1. Agar dollarda to'lov bo'lsa - Dollar kassa kirimi
  if (valUsd > 0) {
    db.insert('finance_transactions', {
      type: "kirim",
      category: "qarz_qaytarish",
      account: paymentAccountUsd || "dollar_kassa",
      amountUsd: Number(valUsd.toFixed(2)),
      amountUzs: Math.round(valUsd * rate),
      currency: "USD",
      referenceType: "customer_debt_repayment",
      referenceId: cust.id,
      description: `${cust.name} tomonidan qarzning bir qismi dollarda so'ndirildi ($${valUsd.toFixed(2)})`
    });
  }

  // 2. Agar so'mda to'lov bo'lsa - So'm kassa kirimi
  if (valUzs > 0) {
    db.insert('finance_transactions', {
      type: "kirim",
      category: "qarz_qaytarish",
      account: paymentAccountUzs || "som_kassa",
      amountUsd: Number(uzsInUsd.toFixed(2)),
      amountUzs: Math.round(valUzs),
      currency: "UZS",
      referenceType: "customer_debt_repayment",
      referenceId: cust.id,
      description: `${cust.name} tomonidan qarzning bir qismi so'mda so'ndirildi (${Math.round(valUzs).toLocaleString()} so'm = $${uzsInUsd.toFixed(2)})`
    });
  }

  let paymentSummaryText = "";
  if (valUsd > 0 && valUzs > 0) {
    paymentSummaryText = `$${valUsd.toFixed(2)} + ${Math.round(valUzs).toLocaleString()} so'm (Jami: $${totalPaidEquivalentUsd.toFixed(2)})`;
  } else if (valUsd > 0) {
    paymentSummaryText = `$${valUsd.toFixed(2)}`;
  } else {
    paymentSummaryText = `${Math.round(valUzs).toLocaleString()} so'm ($${uzsInUsd.toFixed(2)})`;
  }

  res.json({
    success: true,
    data: {
      paidUsd: valUsd,
      paidUzs: valUzs,
      totalPaidEquivalentUsd,
      newDebtUsd,
      newDebtUzs
    },
    message: `Qarz to'lovi qabul qilindi: ${paymentSummaryText}. Qolgan qarz: $${newDebtUsd} (${newDebtUzs.toLocaleString()} so'm)`
  });
});

export default router;
