import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Xodimlar ro'yxati
router.get('/', (req, res) => {
  const employees = db.get('employees');
  res.json({ success: true, data: employees });
});

// Yangi xodim qo'shish
router.post('/', (req, res) => {
  const { name, role, phone, salaryType, baseSalary, pieceRate } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Xodim ismi kiritilishi shart" });
  }

  const newEmp = db.insert('employees', {
    name,
    role: role || "Tikuvchi-usta",
    phone: phone || "",
    salaryType: salaryType || "oylik",
    baseSalary: Number(baseSalary) || 0,
    pieceRate: Number(pieceRate) || 0,
    totalEarnings: Number(baseSalary) || 0,
    status: "faol"
  });

  res.status(201).json({ success: true, data: newEmp, message: "Yangi xodim ro'yxatga olindi" });
});

// Xodimni yangilash
router.put('/:id', (req, res) => {
  const updated = db.update('employees', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Xodim topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Xodim ma'lumotlari yangilandi" });
});

// Ish haqi to'lovi
router.post('/:id/pay-salary', (req, res) => {
  const { amount, account, notes } = req.body;
  const payAmt = Number(amount);
  if (!payAmt || payAmt <= 0) {
    return res.status(400).json({ success: false, message: "To'lov summasini to'g'ri kiriting" });
  }

  const employee = db.findById('employees', req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, message: "Xodim topilmadi" });
  }

  db.insert('finance_transactions', {
    type: "chiqim",
    category: "maosh",
    account: account || "naqd_kassa",
    amount: payAmt,
    referenceType: "salary",
    referenceId: employee.id,
    description: `${employee.name} (${employee.role}) ga ish haqi to'landi: ${payAmt} so'm. ${notes || ''}`
  });

  res.json({
    success: true,
    message: `${employee.name} ga ${payAmt} so'm maosh to'landi va kassadan chiqim qilindi`
  });
});

export default router;
