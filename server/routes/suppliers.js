import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Ta'minotchilar ro'yxati
router.get('/', (req, res) => {
  const suppliers = db.get('suppliers');
  res.json({ success: true, data: suppliers });
});

// Yangi ta'minotchi
router.post('/', (req, res) => {
  const { name, company, phone, address, notes } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Ta'minotchi nomi kiritilishi shart" });
  }

  const newSup = db.insert('suppliers', {
    name,
    company: company || "",
    phone: phone || "",
    address: address || "",
    totalPurchased: 0,
    balanceDue: 0,
    rating: 5.0,
    notes: notes || ""
  });

  res.status(201).json({ success: true, data: newSup, message: "Ta'minotchi qo'shildi" });
});

// Ta'minotchini yangilash
router.put('/:id', (req, res) => {
  const updated = db.update('suppliers', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Ta'minotchi topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Ta'minotchi ma'lumotlari yangilandi" });
});

export default router;
