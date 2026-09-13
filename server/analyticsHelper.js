import { db } from './db.js';

export function getMultiPeriodAnalytics() {
  const rate = db.getSettings().usdExchangeRate || 12850;

  return {
    daily: {
      period: 'daily',
      labelLat: "Bugungi Kunlik",
      labelCyr: "Бугунги Кунлик",
      labelRu: "Сегодня (Дневной)",
      weavingKg: 4500,
      weavingTonnes: 4.50,
      weavingRolls: 180,
      salesKg: 3180,
      salesTonnes: 3.18,
      salesUsd: 17656.80,
      salesUzs: Math.round(17656.80 * rate),
      data: [
        { label: '08:00', weavingKg: 650, salesKg: 0, salesUsd: 0 },
        { label: '10:00', weavingKg: 800, salesKg: 180, salesUsd: 856.8 },
        { label: '12:00', weavingKg: 750, salesKg: 3000, salesUsd: 16800 },
        { label: '14:00', weavingKg: 850, salesKg: 0, salesUsd: 0 },
        { label: '16:00', weavingKg: 750, salesKg: 0, salesUsd: 0 },
        { label: '18:00', weavingKg: 700, salesKg: 0, salesUsd: 0 }
      ]
    },
    '7days': {
      period: '7days',
      labelLat: "7 Kunlik",
      labelCyr: "7 Кунлик",
      labelRu: "За 7 Дней",
      weavingKg: 31500,
      weavingTonnes: 31.50,
      weavingRolls: 1260,
      salesKg: 95180,
      salesTonnes: 95.18,
      salesUsd: 555656.80,
      salesUzs: Math.round(555656.80 * rate),
      data: [
        { date: '2026-09-07', label: '07-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-08', label: '08-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-09', label: '09-Sen', weavingKg: 4500, salesKg: 50000, salesUsd: 298000 },
        { date: '2026-09-10', label: '10-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-11', label: '11-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-12', label: '12-Sen', weavingKg: 4500, salesKg: 42000, salesUsd: 240000 },
        { date: '2026-09-13', label: '13-Sen', weavingKg: 4500, salesKg: 3180, salesUsd: 17656.8 }
      ]
    },
    '30days': {
      period: '30days',
      labelLat: "30 Kunlik",
      labelCyr: "30 Кунлик",
      labelRu: "За 30 Дней",
      weavingKg: 106000,
      weavingTonnes: 106.00,
      weavingRolls: 4240,
      salesKg: 179180,
      salesTonnes: 179.18,
      salesUsd: 991656.80,
      salesUzs: Math.round(991656.80 * rate),
      data: [
        { date: '2026-08-15', label: '15-Avg', weavingKg: 4200, salesKg: 14000, salesUsd: 81000 },
        { date: '2026-08-20', label: '20-Avg', weavingKg: 4350, salesKg: 0, salesUsd: 0 },
        { date: '2026-08-25', label: '25-Avg', weavingKg: 4400, salesKg: 0, salesUsd: 0 },
        { date: '2026-08-28', label: '28-Avg', weavingKg: 4300, salesKg: 27000, salesUsd: 166000 },
        { date: '2026-09-02', label: '02-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-04', label: '04-Sen', weavingKg: 4500, salesKg: 43000, salesUsd: 189000 },
        { date: '2026-09-06', label: '06-Sen', weavingKg: 4500, salesKg: 0, salesUsd: 0 },
        { date: '2026-09-09', label: '09-Sen', weavingKg: 4500, salesKg: 50000, salesUsd: 298000 },
        { date: '2026-09-12', label: '12-Sen', weavingKg: 4500, salesKg: 42000, salesUsd: 240000 },
        { date: '2026-09-13', label: '13-Sen', weavingKg: 4500, salesKg: 3180, salesUsd: 17656.8 }
      ]
    },
    yearly: {
      period: 'yearly',
      labelLat: "Yillik (2026)",
      labelCyr: "Йиллик (2026)",
      labelRu: "Годовой (2026)",
      weavingKg: 1128100,
      weavingTonnes: 1128.10,
      weavingRolls: 45124,
      salesKg: 1051180,
      salesTonnes: 1051.18,
      salesUsd: 5696656.80,
      salesUzs: Math.round(5696656.80 * rate),
      data: [
        { month: '2026-01', label: 'Yan', weavingKg: 112000, salesKg: 95000, salesUsd: 510000 },
        { month: '2026-02', label: 'Fev', weavingKg: 118500, salesKg: 102000, salesUsd: 550000 },
        { month: '2026-03', label: 'Mar', weavingKg: 125000, salesKg: 115000, salesUsd: 620000 },
        { month: '2026-04', label: 'Apr', weavingKg: 130200, salesKg: 120000, salesUsd: 650000 },
        { month: '2026-05', label: 'May', weavingKg: 142000, salesKg: 135000, salesUsd: 730000 },
        { month: '2026-06', label: 'Iyun', weavingKg: 138400, salesKg: 128000, salesUsd: 690000 },
        { month: '2026-07', label: 'Iyul', weavingKg: 145000, salesKg: 140000, salesUsd: 760000 },
        { month: '2026-08', label: 'Avg', weavingKg: 152000, salesKg: 148000, salesUsd: 810000 },
        { month: '2026-09', label: 'Sen', weavingKg: 65000, salesKg: 68180, salesUsd: 376656.8 }
      ]
    }
  };
}
