import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatWeightTonnes, formatUsd, formatUzs, formatDualCurrency, formatDate } from '../utils/formatters';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Droplets,
  PackageCheck,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  QrCode,
  Building,
  PlusCircle,
  Activity,
  BarChart3,
  Calendar,
  PieChart,
  DollarSign,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';

export default function Dashboard({ onOpenNewRoll }) {
  const { lang, loc, usdRate, setActiveTab, setQrScannerOpen, refreshSignal } = useApp();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7days'); // 'daily' | '7days' | '30days' | 'yearly'

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshSignal]);

  const stock = stats?.stock || { totalKg: 0, totalRollsCount: 0, rawStockKg: 0, dyedStockKg: 0, dyeingKg: 0 };
  const sales = stats?.sales || { todaySalesUsd: 0, todaySalesUzs: 0, todaySoldKg: 0, totalRevenueUsd: 0, totalCustomerDebtUsd: 0 };
  const prod = stats?.production || { activeLoomsCount: 4, totalLoomsCount: 4, todayWeavingOutputKg: 0 };
  const qual = stats?.quality || { grade1Rolls: 0, grade2Rolls: 0, defectRolls: 0 };

  const analytics = stats?.analytics || {
    daily: { period: 'daily', weavingKg: 4500, weavingTonnes: 4.5, salesKg: 3180, salesTonnes: 3.18, salesUsd: 17656.8, data: [] },
    '7days': { period: '7days', weavingKg: 31500, weavingTonnes: 31.5, salesKg: 95180, salesTonnes: 95.18, salesUsd: 555656.8, data: [] },
    '30days': { period: '30days', weavingKg: 106000, weavingTonnes: 106.0, salesKg: 179180, salesTonnes: 179.18, salesUsd: 991656.8, data: [] },
    yearly: { period: 'yearly', weavingKg: 1128100, weavingTonnes: 1128.1, salesKg: 1051180, salesTonnes: 1051.18, salesUsd: 5696656.8, data: [] }
  };

  const currentPeriodData = analytics[analyticsPeriod] || analytics['7days'];
  const categoryDistribution = stats?.categoryDistribution || [];

  const periodsList = [
    { key: 'daily', lat: 'Kunlik', cyr: 'Кунлик', ru: 'Дневной' },
    { key: '7days', lat: '7 Kunlik', cyr: '7 Кунлик', ru: 'За 7 дней' },
    { key: '30days', lat: '30 Kunlik', cyr: '30 Кунлик', ru: 'За 30 дней' },
    { key: 'yearly', lat: 'Yillik (2026)', cyr: 'Йиллик (2026)', ru: 'Годовой' }
  ];

  return (
    <div className="space-y-6">
      {/* Yuqori Banner */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'cyr' ? "Тўқимачилик Фабрикаси БОШҚАРУВ ПАНЕЛИ" : "To'qimachilik Fabrikasi BOSHQARUV PANELI"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {lang === 'cyr' ? "Мато Ишлаб Чиқариш, Бўёқхона & Савдо Назорати" : "Mato Ishlab Chiqarish, Bo'yoqxona & Savdo Nazorati"}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {lang === 'cyr'
                ? `Омбордаги барча матолар фақат КГ ҳисобида юритилади. Жорий курс: 1$ = ${Number(usdRate).toLocaleString()} сўм.`
                : `Ombordagi barcha matolar faqat KG hisobida yuritiladi. Joriy kurs: 1$ = ${Number(usdRate).toLocaleString()} so'm.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenNewRoll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'cyr' ? "+ Рулон Кирим" : "+ Rulon Kirim"}</span>
            </button>
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{lang === 'cyr' ? "QR Сканерлаш" : "QR Skanerlash"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asosiy KPI Kartochkalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ombordagi Jami Mato */}
        <div
          onClick={() => setActiveTab('rolls')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{lang === 'cyr' ? "Омбордаги Жами Мато" : "Ombordagi Jami Mato"}</span>
            <PackageCheck className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {formatWeightTonnes(stock.totalKg, lang)}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>{stock.totalRollsCount?.toLocaleString()} {lang === 'cyr' ? "та фаол рулон" : "ta faol rulon"}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
              {lang === 'cyr' ? "Кўриш" : "Ko'rish"} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 2. Xom va Bo'yalgan matolar nisbati */}
        <div
          onClick={() => setActiveTab('dyeing')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{lang === 'cyr' ? "Бўёқхона & Бўяшда" : "Bo'yoqxona & Bo'yashda"}</span>
            <Droplets className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400">
            {formatKg(stock.dyeingKg, lang)}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>{stock.dyeingBatchesCount || 0} {lang === 'cyr' ? "та бўяш партияси" : "ta bo'yash partiyasi"}</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
              {lang === 'cyr' ? "Бўёқхона" : "Bo'yoqxona"} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 3. Bugungi Sotuv ($ va So'm) */}
        <div
          onClick={() => setActiveTab('sales')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{lang === 'cyr' ? "Бугунги Мато Савдоси" : "Bugungi Mato Savdosi"}</span>
            <ShoppingCart className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatUsd(sales.todaySalesUsd)}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>{formatUzs(sales.todaySalesUzs, lang)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formatKg(sales.todaySoldKg || 0, lang)}
            </span>
          </div>
        </div>

        {/* 4. Mijozlar Umumiy Qarzdorligi */}
        <div
          onClick={() => setActiveTab('customers')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{lang === 'cyr' ? "Мижозлар Қарзи (Насия)" : "Mijozlar Qarzi (Nasiya)"}</span>
            <Users className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400">
            {formatUsd(sales.totalCustomerDebtUsd)}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>{formatUzs(sales.totalCustomerDebtUzs, lang)}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
              {lang === 'cyr' ? "Мижозлар" : "Mijozlar"} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* YANGI DIAGRAMMA BLOKI: KUNLIK, 7 KUNLIK, 30 KUNLIK VA YILLIK KG GRAFIGI */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 md:p-6 shadow-xs space-y-6">
        {/* Diagramma Sarlavhasi va Davr Tugmalari */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'cyr' ? "Ишлаб Чиқариш & Сотув Динамикаси (КГ / Тонна)" : "Ishlab Chiqarish & Sotuv Dinamikasi (KG / Tonna)"}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'cyr'
                ? "Барча кўрсаткичлар: Кунлик, 7 кунлик, 30 кунлик ва Йиллик КГ ҳажми"
                : "Barcha ko'rsatkichlar: Kunlik, 7 kunlik, 30 kunlik va Yillik KG hajmi"}
            </p>
          </div>

          {/* 4 Period Switcher: Kunlik | 7 kunlik | 30 kunlik | Yillik */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {periodsList.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setAnalyticsPeriod(p.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  analyticsPeriod === p.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'cyr' ? p.cyr : p.lat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Davr Bo'yicha Solishtirma KPI Kartochkalari (Har bir davrning KG va $ ko'rsatkichi) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {periodsList.map(p => {
            const pData = analytics[p.key] || {};
            const isSelected = analyticsPeriod === p.key;

            return (
              <div
                key={p.key}
                onClick={() => setAnalyticsPeriod(p.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className={isSelected ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'}>
                    {lang === 'cyr' ? p.cyr : p.lat}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>

                {/* To'quv KG */}
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500 text-[11px]">{lang === 'cyr' ? "Тўқув:" : "To'quv:"}</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {formatKg(pData.weavingKg || 0, lang)}
                  </span>
                </div>

                {/* Sotuv KG */}
                <div className="flex justify-between items-baseline text-xs mt-1">
                  <span className="text-slate-500 text-[11px]">{lang === 'cyr' ? "Сотув:" : "Sotuv:"}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatKg(pData.salesKg || 0, lang)}
                  </span>
                </div>

                {/* Sotuv Tushumi $ */}
                <div className="flex justify-between items-baseline text-xs mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">{lang === 'cyr' ? "Тушум:" : "Tushum:"}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">
                    {formatUsd(pData.salesUsd || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Asosiy AreaChart: To'quv KG (Amber) vs Sotuv KG (Emerald) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'cyr' ? "Тўқув Ишлаб Чиқариш (КГ)" : "To'quv Ishlab Chiqarish (KG)"}:
                </span>
                <strong className="text-amber-600 dark:text-amber-400 font-black">
                  {formatKg(currentPeriodData.weavingKg, lang)} ({currentPeriodData.weavingTonnes} tn)
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'cyr' ? "Сотилган Мато (КГ)" : "Sotilgan Mato (KG)"}:
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                  {formatKg(currentPeriodData.salesKg, lang)} ({currentPeriodData.salesTonnes} tn)
                </strong>
              </div>
            </div>

            <div className="text-slate-500 text-[11px]">
              {lang === 'cyr'
                ? `Сотув тушуми: ${formatUsd(currentPeriodData.salesUsd)}`
                : `Sotuv tushumi: ${formatUsd(currentPeriodData.salesUsd)}`}
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentPeriodData.data || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashWeavingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}t` : `${val}kg`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[200px] space-y-1.5">
                          <div className="font-mono font-black text-amber-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                            <span>📅 {label}</span>
                            <span className="text-[10px] text-slate-400">{d.date || d.month || ''}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">{lang === 'cyr' ? "Тўқув (КГ):" : "To'quv (KG):"}</span>
                            <span className="font-black text-amber-400">{formatKg(d.weavingKg || 0, lang)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">{lang === 'cyr' ? "Сотув (КГ):" : "Sotuv (KG):"}</span>
                            <span className="font-black text-emerald-400">{formatKg(d.salesKg || 0, lang)}</span>
                          </div>
                          {d.salesUsd > 0 && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-emerald-300">
                              <span>{lang === 'cyr' ? "Савдо тушуми:" : "Savdo tushumi:"}</span>
                              <span className="font-extrabold">{formatUsd(d.salesUsd)}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weavingKg"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashWeavingGrad)"
                  name="To'quv Chiqishi (KG)"
                />
                <Area
                  type="monotone"
                  dataKey="salesKg"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashSalesGrad)"
                  name="Sotilgan Mato (KG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OMBORDAGI MATOLAR TURLARI BO'YICHA TAQSIMOT DIAGRAMMASI (BAR CHART & KG) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'cyr' ? "Омбордаги Матолар Турлари Тақсимоти (КГ / Тонна)" : "Ombordagi Matolar Turlari Taqsimoti (KG / Tonna)"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'cyr'
                  ? `Жами фаол захира: ${formatWeightTonnes(stock.totalKg, lang)} (${stock.totalRollsCount?.toLocaleString()} та рулон, ўртача 25 кг)`
                  : `Jami faol zaxira: ${formatWeightTonnes(stock.totalKg, lang)} (${stock.totalRollsCount?.toLocaleString()} ta rulon, o'rtacha 25 kg)`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rolls')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === 'cyr' ? "Барча рулонлар омбори" : "Barcha rulonlar ombori"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual BarChart & Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* BarChart ustunlari */}
          <div className="lg:col-span-7" style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}t`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1">
                          <div className="font-extrabold text-indigo-400">{d.name}</div>
                          <div className="text-sm font-black text-white">
                            {formatKg(d.kg, lang)} ({d.tonnes} tn)
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {d.rollsCount?.toLocaleString()} {lang === 'cyr' ? 'та рулон' : 'ta rulon'} • {d.percent}% {lang === 'cyr' ? 'улуш' : 'ulush'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kg" radius={[8, 8, 0, 0]}>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* O'ng tomonda har bir kategoriya bo'yicha progress va foiz */}
          <div className="lg:col-span-5 space-y-2.5">
            {categoryDistribution.map(cat => (
              <div
                key={cat.name}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({cat.rollsCount?.toLocaleString()} rulon)</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900 dark:text-white">
                    {formatKg(cat.kg, lang)}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {cat.tonnes} tn • {cat.percent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2 Bo'limli Batafsil Panellar: To'quv & Bo'yoqxona vs Oxirgi Savdolar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* To'quv & Sex Nazorati */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'cyr' ? "Тўқув Сехи & Хом Мато Чиқиши" : "To'quv Sexi & Xom Mato Chiqishi"}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('weaving')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'cyr' ? "Дастгоҳларга ўтиш" : "Dastgohlarga o'tish"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                {lang === 'cyr' ? "Хом Мато Захираси:" : "Xom Mato Zaxirasi:"}
              </div>
              <div className="text-lg font-black text-amber-950 dark:text-amber-100 mt-0.5">
                {formatKg(stock.rawStockKg, lang)}
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">
                {stock.rawRollsCount || 0} {lang === 'cyr' ? "та тўқилган рулон" : "ta to'qilgan rulon"}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
              <div className="text-[11px] text-purple-800 dark:text-purple-300 font-bold">
                {lang === 'cyr' ? "Бўялган Мато Захираси:" : "Bo'yalgan Mato Zaxirasi:"}
              </div>
              <div className="text-lg font-black text-purple-950 dark:text-purple-100 mt-0.5">
                {formatKg(stock.dyedStockKg, lang)}
              </div>
              <div className="text-[10px] text-purple-700/80 mt-0.5">
                {stock.dyedRollsCount || 0} {lang === 'cyr' ? "та сотувга тайёр рулон" : "ta sotuvga tayyor rulon"}
              </div>
            </div>
          </div>

          {/* Sifat navlari */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'cyr' ? "Сифат Нави Тақсимоти (QC):" : "Sifat Navi Taqsimoti (QC):"}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                <div>1-nav</div>
                <div className="text-base font-black">{qual.grade1Rolls}</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold">
                <div>2-nav</div>
                <div className="text-base font-black">{qual.grade2Rolls}</div>
              </div>
              <div className="p-2 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold">
                <div>3-nav (Brak)</div>
                <div className="text-base font-black">{qual.defectRolls}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Oxirgi Savdolar */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'cyr' ? "Сўнгги Мато Сотувлари" : "So'nggi Mato Sotuvlari"}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'cyr' ? "Кассага ўтиш" : "Kassaga o'tish"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(stats?.recentSales || []).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {lang === 'cyr' ? "Ҳозирча савдолар йўқ" : "Hozircha savdolar yo'q"}
              </div>
            ) : (
              (stats?.recentSales || []).map(sale => (
                <div
                  key={sale.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{sale.customerName}</div>
                    <div className="text-[10px] text-slate-400">{sale.invoiceNumber} • {formatDate(sale.createdAt, lang)}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatUsd(sale.totalAmountUsd)}
                    </div>
                    <div className="text-[10px] text-slate-500">{formatUzs(sale.totalAmountUzs, lang)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
