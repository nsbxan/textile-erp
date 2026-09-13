import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 1. Moliya umumiy balansi va P&L
router.get('/stats', (req, res) => {
  const transactions = db.get('finance_transactions');
  const sales = db.get('sales');
  const rolls = db.get('rolls');
  const apparel = db.get('finished_apparel');
  const customers = db.get('customers');
  const suppliers = db.get('suppliers');

  let totalIncome = 0;
  let totalExpense = 0;
  let cashBalance = 0;
  let bankBalance = 0;
  let cardBalance = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount || 0);
    if (t.type === 'kirim') {
      totalIncome += amt;
      if (t.account === 'naqd_kassa') cashBalance += amt;
      else if (t.account === 'bank_hisob') bankBalance += amt;
      else if (t.account === 'plastik_terminal') cardBalance += amt;
    } else if (t.type === 'chiqim') {
      totalExpense += amt;
      if (t.account === 'naqd_kassa') cashBalance -= amt;
      else if (t.account === 'bank_hisob') bankBalance -= amt;
      else if (t.account === 'plastik_terminal') cardBalance -= amt;
    }
  });

  // Ombor tovar qoldiqlari qiymati
  const fabricStockValue = rolls.reduce((sum, r) => {
    if (r.status === 'in_stock' || r.status === 'partially_sold') {
      return sum + (Number(r.currentMeters || 0) * Number(r.purchasePricePerMeter || 0));
    }
    return sum;
  }, 0);

  const apparelStockValue = apparel.reduce((sum, a) => {
    return sum + (Number(a.quantity || 0) * Number(a.unitCost || 0));
  }, 0);

  // Qarzdorliklar
  const totalCustomerDebt = customers.reduce((sum, c) => sum + Number(c.debt || 0), 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);

  const netProfit = totalIncome - totalExpense;

  res.json({
    success: true,
    data: {
      totalIncome,
      totalExpense,
      netProfit,
      accounts: {
        cashBalance,
        bankBalance,
        cardBalance,
        totalLiquid: cashBalance + bankBalance + cardBalance
      },
      stockValue: {
        fabricStockValue,
        apparelStockValue,
        totalStockValue: fabricStockValue + apparelStockValue
      },
      debts: {
        totalCustomerDebt, // Bizga berilishi kerak
        totalSupplierDebt  // Biz to'lashimiz kerak
      }
    }
  });
});

// 2. Tranzaksiyalar ro'yxati
router.get('/transactions', (req, res) => {
  const transactions = db.get('finance_transactions');
  transactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: transactions });
});

// 3. Yangi qo'lda kassa tranzaksiyasi kiritish
router.post('/transactions', (req, res) => {
  const { type, category, account, amount, description } = req.body;

  if (!type || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Tranzaksiya turi va summasi kiritilishi shart" });
  }

  const newTxn = db.insert('finance_transactions', {
    type: type === 'kirim' ? 'kirim' : 'chiqim',
    category: category || "boshqa",
    account: account || "naqd_kassa",
    amount: Number(amount),
    referenceType: "manual",
    referenceId: null,
    description: description || "Qo'lda kiritilgan kassa amalioti"
  });

  res.status(201).json({ success: true, data: newTxn, message: "Kassa yozuvi saqlandi" });
});

export default router;
