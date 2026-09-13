import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Tayyor kiyimlar ombori
router.get('/', (req, res) => {
  const apparel = db.get('finished_apparel');
  res.json({ success: true, data: apparel });
});

// Tayyor kiyim ma'lumotlarini yangilash (narx, qoldiq)
router.put('/:id', (req, res) => {
  const updated = db.update('finished_apparel', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Mahsulot topilmadi" });
  }
  res.json({ success: true, data: updated, message: "Mahsulot yangilandi" });
});

// Yangi tayyor kiyim partiyasi qo'lda kirim qilish
router.post('/', (req, res) => {
  const { name, size, quantity, unitCost, sellingPrice, color } = req.body;
  const newApp = db.insert('finished_apparel', {
    name,
    size: size || "Standart",
    quantity: Number(quantity) || 0,
    unitCost: Number(unitCost) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    color: color || "Standart"
  });
  res.status(201).json({ success: true, data: newApp });
});

export default router;
