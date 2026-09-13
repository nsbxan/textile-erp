import express from 'express';
import { db } from '../db.js';
import { getMultiPeriodAnalytics } from '../analyticsHelper.js';

const router = express.Router();

const getDashboardData = (req, res) => {
  const fabrics = db.get('fabrics');
  const rolls = db.get('rolls');
  const defects = db.get('defects');
  const sales = db.get('sales');
  const customers = db.get('customers');
  const dyeingOrders = db.get('dyeing_orders');
  const looms = db.get('looms');
  const settings = db.getSettings();
  const rate = settings.usdExchangeRate || 12850;

  // Ombordagi mavjud rulonlar
  const activeRolls = rolls.filter(r => r.status === 'in_stock' || r.status === 'partially_sold');
  const totalStockKg = activeRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const totalRollsCount = activeRolls.length;

  const rawRolls = activeRolls.filter(r => r.fabricType === 'xom');
  const rawStockKg = rawRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);

  const dyedRolls = activeRolls.filter(r => r.fabricType === 'boyalgan');
  const dyedStockKg = dyedRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);

  // Bo'yoqxonadagi matolar
  const activeDyeingBatches = dyeingOrders.filter(d => d.status === 'yuborildi' || d.status === 'boyalmoqda');
  const dyeingKg = activeDyeingBatches.reduce((sum, d) => sum + Number(d.sentKg || 0), 0);

  // Sotuvlar statistikasi
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => (s.createdAt || '').startsWith(todayStr));
  const todaySalesUsd = todaySalesList.reduce((sum, s) => sum + Number(s.totalAmountUsd || 0), 0);
  const todaySalesUzs = Math.round(todaySalesUsd * rate);
  const todaySoldKg = todaySalesList.reduce((sum, s) => {
    return sum + (s.items || []).reduce((iSum, item) => iSum + Number(item.kg || 0), 0);
  }, 0);

  const totalRevenueUsd = sales.reduce((sum, s) => sum + Number(s.totalAmountUsd || 0), 0);
  const totalRevenueUzs = Math.round(totalRevenueUsd * rate);

  // Mijozlar umumiy qarzdorligi
  const totalCustomerDebtUsd = customers.reduce((sum, c) => sum + Number(c.debtUsd || 0), 0);
  const totalCustomerDebtUzs = Math.round(totalCustomerDebtUsd * rate);

  // Sifat navlari
  const grade1Rolls = activeRolls.filter(r => r.qualityGrade === '1-nav').length;
  const grade2Rolls = activeRolls.filter(r => r.qualityGrade === '2-nav').length;
  const defectRolls = activeRolls.filter(r => r.qualityGrade === '3-nav' || r.qualityGrade === 'brak').length;

  // Dastgohlar
  const activeLoomsCount = looms.filter(l => l.status === 'ishlamoqda').length;
  const todayWeavingOutputKg = looms.reduce((sum, l) => sum + Number(l.todayKg || 0), 0);

  // Oxirgi operatsiyalar
  const recentSales = sales.slice(0, 5);
  const recentDyeing = dyeingOrders.slice(0, 5);
  const recentDefects = defects.slice(0, 5);

  // MATOLAR KATEGORIYALARI BO'YICHA TAQSIMOT (KG)
  const categoryMap = {};
  const catColors = {
    'Suprem': '#3b82f6',
    'Futyer': '#8b5cf6',
    'Ribana': '#10b981',
    'Pikye': '#f59e0b',
    'Interlok': '#06b6d4',
    'Kashkorse': '#ec4899',
    'Boshqa': '#64748b'
  };

  activeRolls.forEach(r => {
    const fab = fabrics.find(f => f.id === r.fabricId) || {};
    const cat = fab.category || (r.fabricType === 'xom' ? 'Xom Mato' : 'Boshqa');
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        name: cat,
        kg: 0,
        rollsCount: 0,
        color: catColors[cat] || '#64748b'
      };
    }
    categoryMap[cat].kg += Number(r.currentKg || 0);
    categoryMap[cat].rollsCount += 1;
  });

  const categoryDistribution = Object.values(categoryMap).map(c => ({
    ...c,
    kg: Math.round(c.kg),
    tonnes: Number((c.kg / 1000).toFixed(2)),
    percent: totalStockKg > 0 ? Number(((c.kg / totalStockKg) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.kg - a.kg);

  // KUNLIK, 7 KUNLIK, 30 KUNLIK VA YILLIK ANALITIKA (KG VA $)
  const analytics = getMultiPeriodAnalytics();

  res.json({
    success: true,
    data: {
      stock: {
        totalKg: Number(totalStockKg.toFixed(2)),
        totalRollsCount,
        rawStockKg: Number(rawStockKg.toFixed(2)),
        rawRollsCount: rawRolls.length,
        dyedStockKg: Number(dyedStockKg.toFixed(2)),
        dyedRollsCount: dyedRolls.length,
        dyeingKg: Number(dyeingKg.toFixed(2)),
        dyeingBatchesCount: activeDyeingBatches.length
      },
      sales: {
        todaySalesUsd: Number(todaySalesUsd.toFixed(2)),
        todaySalesUzs,
        todaySoldKg: Number(todaySoldKg.toFixed(2)),
        totalRevenueUsd: Number(totalRevenueUsd.toFixed(2)),
        totalRevenueUzs,
        totalSalesCount: sales.length,
        totalCustomerDebtUsd: Number(totalCustomerDebtUsd.toFixed(2)),
        totalCustomerDebtUzs
      },
      production: {
        activeLoomsCount,
        totalLoomsCount: looms.length,
        todayWeavingOutputKg: Number(todayWeavingOutputKg.toFixed(2))
      },
      quality: {
        grade1Rolls,
        grade2Rolls,
        defectRolls,
        totalDefectsRecorded: defects.length
      },
      analytics,
      categoryDistribution,
      settings: {
        usdExchangeRate: rate,
        currency: "USD"
      },
      recentSales,
      recentDyeing,
      recentDefects
    }
  });
};

router.get('/', getDashboardData);
router.get('/stats', getDashboardData);

export default router;
