import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Dastgohlar va operatorlar
const looms = [
  { id: 'DAS-01', operator: 'Rustam Karimov' },
  { id: 'DAS-02', operator: 'Alisher Valiyev' },
  { id: 'DAS-03', operator: 'Javohir Toshmatov' },
  { id: 'DAS-04', operator: 'Sobir Usmonov' },
  { id: 'DAS-05', operator: 'Azizbek Qobilov' },
  { id: 'DAS-06', operator: 'Sanjar Mirzayev' }
];

const rawFabricTypes = [
  { id: 'FAB-001', code: 'SUP-100-RAW', name: 'Suprem 100% Paxta (Xom Mato)', yarnLot: 'LOT-IMP-30/1', price: 4.20 },
  { id: 'FAB-007', code: 'PIK-100-RAW', name: 'Pikye Likrasiz (Xom Mato)', yarnLot: 'LOT-IMP-40/1', price: 4.80 },
  { id: 'FAB-010', code: 'FUT-LIK-RAW', name: 'Ikki Ipli Likrali Paxta (Xom Mato)', yarnLot: 'LOT-BUX-30/1', price: 4.30 }
];

const dyedFabricTypes = [
  { id: 'FAB-002', name: "Suprem Penye 30/1 (Bo'yalgan Qora)", colorName: 'Qora (Jet Black)', pantoneCode: 'TCX-19-4008', price: 5.60, sector: 'B-01' },
  { id: 'FAB-003', name: "Futyer 2-ipli Likrasiz (Bo'yalgan To'q Ko'k)", colorName: "To'q Ko'k (Navy Blue)", pantoneCode: 'TCX-19-3832', price: 6.00, sector: 'B-02' },
  { id: 'FAB-004', name: "Futyer 3-ipli Nakchyos (Bo'yalgan Melanj)", colorName: 'Kulrang Melanj', pantoneCode: 'TCX-14-4102', price: 6.80, sector: 'B-03' },
  { id: 'FAB-005', name: "Ribana 100% Paxta (Bo'yalgan Optik Oq)", colorName: 'Optik Oq', pantoneCode: 'TCX-11-0601', price: 5.80, sector: 'B-04' },
  { id: 'FAB-006', name: "Kashkorse Likrali (Bo'yalgan Qizil)", colorName: 'Qizil (True Red)', pantoneCode: 'TCX-18-1662', price: 6.20, sector: 'B-05' },
  { id: 'FAB-008', name: "Pikye Likrali Lakost (Bo'yalgan Xaki Yashil)", colorName: 'Xaki Yashil', pantoneCode: 'TCX-18-0316', price: 6.10, sector: 'B-06' },
  { id: 'FAB-009', name: "Interlok 100% Penye (Bo'yalgan Zumrad Yashil)", colorName: 'Zumrad Yashil', pantoneCode: 'TCX-17-5641', price: 6.40, sector: 'B-07' }
];

const defectReasons = [
  "Dastgoh reduktoridan yog' sachrashi oqibatida 18 metr bo'ylab ketmaydigan quyuq moy dog'i tushgan (To'quv sexi DAS-01)",
  "To'quv dastgohida igna sinishi natijasida 22 metr bo'ylab teshiklar va uzuq-yuluq bo'ylama yirtiq hosil bo'lgan (DAS-03)",
  "Bo'yoq reaktorida rang fiksatori erimay qolib, mato yuzasida quyuq ko'k dog'lar va rang notekisligi (raznoottenochnost) paydo bo'lgan",
  "Quritish pechida harorat me'yordan oshib mato kuygan, uvalka 13% ga yetib, eni 145 sm gacha qisqarib ketgan",
  "Ta'minotchi paxta ipi tarkibida pilling va begona tola ko'p chiqqani sababli to'qima yuzasi qora tuklar bilan qoplangan",
  "Bo'yoq tsilindrida mato burishib ezilishi oqibatida butun bo'yi bo'ylab oq yo'l izlari (zalomlar) tushgan",
  "O'rish iplarining tarangligi buzilishi natijasida 35 metr matoda to'lqinsimon qalin-yupqa chiziqlar nuqsoni yuzaga kelgan",
  "Kimyoviy oqartirish jarayonida vodorod periks konsentratsiyasi yuqori bo'lib, mato tolasi yemirilgan va mustahkamligi tushgan",
  "To'quv barabani to'xtab qolib, to'qima ustida eni 5 sm li ko'ndalang qora moyli iz paydo bo'lgan",
  "Sanforizatsiya jarayonida harorat yetishmasligi oqibatida yuvilganda 11% uvalka beradigan standartga to'g'ri kelmaydigan brak",
  "Bo'yoq silindrida qizil pigment notekis taqsimlanib, yorug'likda dog'-dog' soyalar hosil qilgan",
  "To'qimachilik moyi purkagichidan tomchilar sachrashi oqibatida matoning chekkasida sariq dog'lar qolgan",
  "Ip kalavasi aralashib ketib, 30/1 penye o'rniga kardli ip to'qilib mato yuzasi g'adir-budur bo'lib qolgan",
  "Bo'yoqxona tentirida haddan tashqari qattiq tortilishi tufayli qirralari yirtilgan va spiralsimon qiyshaygan",
  "Ip tugunlari me'yordan ko'p uchragani sababli mato yuzasida qalin bo'rtmalar va nuqsonlar soni 100 metrda 18 tadan oshgan"
];

const newRolls = [];
let rollCounter = 1;

// 1. Xom matolar (2160 ta rulon, 12 kunga 180 tadan)
const dates = ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];

dates.forEach((date) => {
  for (let i = 0; i < 180; i++) {
    const fab = rawFabricTypes[i % rawFabricTypes.length];
    const loom = looms[i % looms.length];
    // Vazn qat'iy 20 kg dan 30 kg gacha (o'rtacha 25.0 kg)
    const kg = Number((20.0 + (Math.sin(rollCounter * 17) * 4.5 + 5.0)).toFixed(1));
    const rollId = 'ROL-' + String(rollCounter).padStart(5, '0');
    newRolls.push({
      id: rollId,
      fabricId: fab.id,
      fabricType: 'xom',
      qrCode: 'ERP-' + rollId,
      batchNumber: 'LOT-' + fab.code.slice(0, 3) + '-' + date.slice(8) + '-' + (i % 6 + 1),
      loomNumber: loom.id,
      yarnLot: fab.yarnLot,
      colorName: 'Tabiiy Xom',
      pantoneCode: 'RAW-01',
      initialKg: kg,
      currentKg: kg,
      grossKg: Number((kg + 0.5).toFixed(1)),
      tareKg: 0.5,
      netKg: kg,
      purchasePricePerKgUsd: 3.20,
      sellingPricePerKgUsd: fab.price,
      qualityGrade: '1-nav',
      status: 'in_stock',
      location: 'Xom Matolar Ombori (Sektor A-' + (loom.id.slice(4) || '01') + ')',
      operator: loom.operator,
      receivedDate: date
    });
    rollCounter++;
  }
});

// 2. Bo'yalgan matolar (1840 ta rulon, har biri 20-30 kg)
for (let i = 0; i < 1840; i++) {
  const fab = dyedFabricTypes[i % dyedFabricTypes.length];
  const kg = Number((20.0 + (Math.cos(rollCounter * 13) * 4.5 + 5.0)).toFixed(1));
  const rollId = 'ROL-' + String(rollCounter).padStart(5, '0');
  const dIdx = i % dates.length;
  const is2nav = i % 10 === 0;
  newRolls.push({
    id: rollId,
    fabricId: fab.id,
    fabricType: 'boyalgan',
    qrCode: 'ERP-' + rollId,
    batchNumber: 'BOY-2026-B' + (i % 9 + 1),
    colorName: fab.colorName,
    pantoneCode: fab.pantoneCode,
    initialKg: kg,
    currentKg: kg,
    grossKg: Number((kg + 0.5).toFixed(1)),
    tareKg: 0.5,
    netKg: kg,
    purchasePricePerKgUsd: 4.20,
    sellingPricePerKgUsd: fab.price,
    qualityGrade: is2nav ? '2-nav' : '1-nav',
    status: 'in_stock',
    location: "Bo'yalgan Matolar Ombori (" + fab.sector + ")",
    receivedDate: dates[dIdx]
  });
  rollCounter++;
}

// 3. Brak matolar (240 ta rulon, har biri 20-30 kg)
for (let i = 0; i < 240; i++) {
  const fab = dyedFabricTypes[i % dyedFabricTypes.length];
  const reason = defectReasons[i % defectReasons.length];
  const kg = Number((20.0 + (Math.sin(rollCounter * 11) * 4.5 + 5.0)).toFixed(1));
  const rollId = 'ROL-BRK-' + String(i + 1).padStart(4, '0');
  const dIdx = i % dates.length;
  newRolls.push({
    id: rollId,
    fabricId: fab.id,
    fabricType: 'boyalgan',
    qrCode: 'ERP-' + rollId,
    batchNumber: 'DEF-BOY-' + (i % 15 + 1),
    colorName: fab.colorName,
    pantoneCode: fab.pantoneCode,
    initialKg: kg,
    currentKg: kg,
    grossKg: Number((kg + 0.5).toFixed(1)),
    tareKg: 0.5,
    netKg: kg,
    purchasePricePerKgUsd: 4.10,
    sellingPricePerKgUsd: 2.80,
    qualityGrade: '3-nav',
    status: 'in_stock',
    defectReason: reason,
    location: 'Brak Matolar Zonasi (Z-0' + (i % 3 + 1) + ')',
    receivedDate: dates[dIdx]
  });
  rollCounter++;
}

db.rolls = newRolls;

// Settings dagi ERP so'zlarini olib tashlash
if (db.settings) {
  db.settings.companyName = "Silk & Cotton Textile";
  db.settings.brandName = "TextilePro Uzbekistan";
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('--- YANGI RULONLAR HISOBOTI ---');
console.log('Jami rulonlar soni:', newRolls.length);
const totalWeightKg = newRolls.reduce((s, r) => s + r.currentKg, 0);
console.log('Jami ombor vazni (kg):', totalWeightKg.toLocaleString());
console.log('Jami ombor vazni (Tonna):', (totalWeightKg / 1000).toFixed(2) + ' tn');
console.log('O\'rtacha bitta rulon vazni (kg):', (totalWeightKg / newRolls.length).toFixed(2) + ' kg');
const minKg = Math.min(...newRolls.map(r => r.currentKg));
const maxKg = Math.max(...newRolls.map(r => r.currentKg));
console.log('Minimal rulon vazni:', minKg + ' kg');
console.log('Maksimal rulon vazni:', maxKg + ' kg');
console.log('Xom matolar:', newRolls.filter(r => r.fabricType === 'xom').length, 'ta rulon');
console.log('Bo\'yalgan matolar:', newRolls.filter(r => r.fabricType === 'boyalgan' && r.qualityGrade !== '3-nav').length, 'ta rulon');
console.log('Brak matolar:', newRolls.filter(r => r.qualityGrade === '3-nav').length, 'ta rulon');
