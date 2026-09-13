import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatUsd,
  formatUzs,
  formatDualCurrency,
  formatDate,
  formatDateTime,
  formatKg,
  formatWeightTonnes
} from '../utils/formatters';
import {
  Users,
  PlusCircle,
  Search,
  DollarSign,
  CreditCard,
  Trash2,
  Edit,
  Phone,
  Building,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  History,
  Star,
  Award,
  TrendingUp,
  BarChart3,
  Package,
  Clock,
  Calendar,
  FileText,
  ChevronRight,
  ShieldCheck,
  X,
  Printer,
  SlidersHorizontal,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';

export default function Customers() {
  const { lang, loc, usdRate, notify, refreshSignal, triggerRefresh } = useApp();

  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState('all'); // 'all' | 'debtors' | 'no_debt'

  // Reyting diagrammasi ko'rsatkichi: 'kg' | 'spent' | 'score'
  const [chartMetric, setChartMetric] = useState('kg');

  // Mijoz tarixi modali
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState('purchases'); // 'purchases' | 'debt_payments'

  // Qo'shish / Tahrirlash / Qarz to'lash modallari
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [payModalCustomer, setPayModalCustomer] = useState(null);
  const [deleteModalCustomer, setDeleteModalCustomer] = useState(null);

  // Form holatlari
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    initialDebtUsd: ''
  });

  const [payForm, setPayForm] = useState({
    amountUsd: '',
    amountUzs: '',
    currency: 'SPLIT', // 'SPLIT' (aralash: dollar + som) | 'USD' | 'UZS'
    paymentAccountUsd: 'dollar_kassa',
    paymentAccountUzs: 'som_kassa',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, salesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/sales')
      ]);

      if (custRes.success) setCustomers(custRes.data || []);
      if (salesRes.success) setSales(salesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      initialDebtUsd: ''
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      company: cust.company || '',
      address: cust.address || '',
      notes: cust.notes || '',
      initialDebtUsd: ''
    });
    setAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, formData);
        if (res.success) {
          notify(
            lang === 'cyr' ? "Мижоз янгиланди" : "Mijoz yangilandi",
            res.message,
            'success'
          );
        }
      } else {
        const res = await api.post('/customers', formData);
        if (res.success) {
          notify(
            lang === 'cyr' ? "Янги мижоз қўшилди" : "Yangi mijoz qo'shildi",
            res.message,
            'success'
          );
        }
      }
      setAddModalOpen(false);
      triggerRefresh();
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const handleOpenPay = (cust) => {
    setPayModalCustomer(cust);
    setPayForm({
      amountUsd: '',
      amountUzs: '',
      currency: 'SPLIT',
      paymentAccountUsd: 'dollar_kassa',
      paymentAccountUzs: 'som_kassa',
      notes: ''
    });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalCustomer) return;

    try {
      const valUsd = payForm.currency === 'UZS' ? 0 : (Number(payForm.amountUsd) || 0);
      const valUzs = payForm.currency === 'USD' ? 0 : (Number(payForm.amountUzs) || 0);

      if (valUsd <= 0 && valUzs <= 0) {
        notify(
          "Xatolik",
          lang === 'cyr'
            ? "Илтимос, тўлов суммасини (доллар ёки сўмда) тўғри киритинг"
            : "Iltimos, to'lov summasini (dollar yoki so'mda) to'g'ri kiriting",
          'error'
        );
        return;
      }

      const payload = {
        amountUsd: valUsd,
        amountUzs: valUzs,
        currency: payForm.currency,
        paymentAccountUsd: payForm.paymentAccountUsd || 'dollar_kassa',
        paymentAccountUzs: payForm.paymentAccountUzs || 'som_kassa',
        notes: payForm.notes
      };

      const res = await api.post(`/customers/${payModalCustomer.id}/pay-debt`, payload);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Қарз тўланди" : "Qarz to'landi",
          res.message,
          'success'
        );
        setPayModalCustomer(null);
        // Agar tarix modali ochilgan bo'lsa, uni ham yangilash
        if (selectedCustomerHistory && selectedCustomerHistory.customer?.id === payModalCustomer.id) {
          handleOpenHistory(payModalCustomer);
        }
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteModalCustomer) return;

    try {
      const res = await api.delete(`/customers/${deleteModalCustomer.id}`);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Мижоз ўчирилди" : "Mijoz o'chirildi",
          res.message,
          'success'
        );
        setDeleteModalCustomer(null);
        triggerRefresh();
      }
    } catch (err) {
      notify("O'chirib bo'lmadi", err.message, 'error');
    }
  };

  // TALAB: Mijozning xarid va to'lovlar tarixini vaqti-soati bilan ochish
  const handleOpenHistory = async (cust) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      setHistoryActiveTab('purchases');
      const res = await api.get(`/customers/${cust.id}/history`);
      if (res.success && res.data) {
        setSelectedCustomerHistory(res.data);
      } else {
        notify("Xatolik", "Tarix ma'lumotlarini yuklab bo'lmadi", 'error');
      }
    } catch (err) {
      notify("Xatolik", err.message || "Tarixni yuklashda xatolik", 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filtrlangan mijozlar ro'yxati
  const filteredCustomers = customers.filter(c => {
    if (debtFilter === 'debtors' && !c.hasDebt) return false;
    if (debtFilter === 'no_debt' && c.hasDebt) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mName = c.name?.toLowerCase().includes(q);
      const mPhone = c.phone?.toLowerCase().includes(q);
      const mComp = c.company?.toLowerCase().includes(q);
      if (!mName && !mPhone && !mComp) return false;
    }
    return true;
  });

  const totalDebtsUsd = customers.reduce((sum, c) => sum + Number(c.debtUsd || 0), 0);
  const totalDebtsUzs = Math.round(totalDebtsUsd * usdRate);
  const totalPurchasedAllKg = customers.reduce((sum, c) => sum + Number(c.totalPurchasedKg || 0), 0);
  const totalSpentAllUsd = customers.reduce((sum, c) => sum + Number(c.totalSpentUsd || 0), 0);

  // Reyting diagrammasi ma'lumotlari (TOP 8 mijozlar)
  const chartData = [...customers]
    .sort((a, b) => {
      if (chartMetric === 'kg') return (b.totalPurchasedKg || 0) - (a.totalPurchasedKg || 0);
      if (chartMetric === 'score') return (b.ratingScore || 0) - (a.ratingScore || 0);
      return (b.totalSpentUsd || 0) - (a.totalSpentUsd || 0);
    })
    .slice(0, 8)
    .map((c, idx) => ({
      name: c.name.length > 15 ? c.name.substring(0, 13) + '..' : c.name,
      fullName: c.name,
      company: c.company || '',
      rank: idx + 1,
      totalSpentUsd: Number(c.totalSpentUsd || 0),
      totalPaidUsd: Number(c.totalPaidUsd || 0),
      debtUsd: Number(c.debtUsd || 0),
      totalKg: Number(c.totalPurchasedKg || 0),
      totalTonnes: Number(((c.totalPurchasedKg || 0) / 1000).toFixed(2)),
      fabricTier: c.fabricTier || 'Kichik Ishlab Chiqaruvchi',
      fabricRank: c.fabricRank || (idx + 1),
      fabricMarketSharePercent: c.fabricMarketSharePercent || 0,
      ratingScore: Number(c.ratingScore || 3.5),
      tier: c.tier || 'Bronza',
      hasDebt: c.hasDebt,
      custRef: c
    }));

  // TOP 3 Yetakchi Mijozlar (tanlangan ko'rsatkich bo'yicha)
  const topRanked = [...customers]
    .sort((a, b) => {
      if (chartMetric === 'kg') return (b.totalPurchasedKg || 0) - (a.totalPurchasedKg || 0);
      if (chartMetric === 'score') return (b.ratingScore || 0) - (a.ratingScore || 0);
      return (b.totalSpentUsd || 0) - (a.totalSpentUsd || 0);
    })
    .slice(0, 3);

  // Reyting yulduzlari helper
  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalf = score % 1 >= 0.4;
    return (
      <div className="flex items-center text-amber-400 gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
        {hasHalf && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-300/30">
              <Users className="w-6 h-6" />
            </div>
            <span>{lang === 'cyr' ? "Мижозлар, Савдо Тарихи & Рейтинг" : "Mijozlar, Savdo Tarixi & Reyting"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'cyr'
              ? "Мижозларнинг қачон қандай мато олгани, тўлаган пуллари, қолган қарзи ва рейтинг диаграммаси"
              : "Mijozlarning qachon qanday mato olgani, to'lagan pullari, qolgan qarzi va reyting diagrammasi"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all shadow-xs"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 cursor-pointer transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Янги Мижоз Қўшиш" : "+ Yangi Mijoz Qo'shish"}</span>
          </button>
        </div>
      </div>

      {/* KPI Qarzdorlik & Xaridlar kartochkalari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Jami Qarz */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Жами Насия Қарзлар" : "Jami Nasiya Qarzlar"}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              {customers.filter(c => c.hasDebt).length} {lang === 'cyr' ? "мижоз" : "mijoz"}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatUsd(totalDebtsUsd)}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            ≈ {formatUzs(totalDebtsUzs, lang)}
          </p>
        </div>

        {/* 2. Jami Sotilgan Mato */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Жами Олинган Мато" : "Jami Olingan Mato"}</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatKg(totalPurchasedAllKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            {(totalPurchasedAllKg / 1000).toFixed(2)} {lang === 'cyr' ? "тонна мато" : "tonna mato"}
          </p>
        </div>

        {/* 3. Jami Xarid Qiymati */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Жами Савдо Ҳажми" : "Jami Savdo Hajmi"}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatUsd(totalSpentAllUsd)}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            {customers.length} {lang === 'cyr' ? "та улгуржи харидор" : "ta ulgurji xaridor"}
          </p>
        </div>

        {/* 4. Valyuta kursi */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Ҳисоб-Китоб Курси" : "Hisob-Kitob Kursi"}</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            1$ = {Number(usdRate).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            {lang === 'cyr' ? "Сўм ва доллар синхрон" : "So'm va dollar sinxron"}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TALAB 2: MIJOZLAR REYTINGI DIAGRAMMASI */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{lang === 'cyr' ? "Мижозлар Рейтинги & Савдо Диаграммаси" : "Mijozlar Reytingi & Savdo Diagrammasi"}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                    TOP {chartData.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'cyr'
                    ? "Улгуржи харидорларнинг савдо ҳажми, тўлов интизоми ва мижозлик даражаси (VIP/Олтин)"
                    : "Ulgurji xaridorlarning savdo hajmi, to'lov intizomi va mijozlik darajasi (VIP/Oltin)"}
                </p>
              </div>
            </div>
          </div>

          {/* Diagramma ko'rsatkichini tanlash tugmalari */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setChartMetric('kg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'kg'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ⚖️ {lang === 'cyr' ? "Мато Ҳажми (КГ / Тонна)" : "Mato Hajmi (KG / Tonna)"}
            </button>
            <button
              onClick={() => setChartMetric('spent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'spent'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              💵 {lang === 'cyr' ? "Харид ($)" : "Xarid ($)"}
            </button>
            <button
              onClick={() => setChartMetric('score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'score'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ⭐ {lang === 'cyr' ? "Рейтинг Балли" : "Reyting Balli"}
            </button>
          </div>
        </div>

        {/* Diagramma va TOP 3 kartalari */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Recharts Bar Diagrammasi */}
          <div className="lg:col-span-2 h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="#94a3b8"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="#94a3b8"
                  tickFormatter={(val) => {
                    if (chartMetric === 'spent') return `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`;
                    if (chartMetric === 'kg') return `${val >= 1000 ? `${(val / 1000).toFixed(0)}t` : val}`;
                    return val;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px]">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-black text-amber-400">#{d.rank} {d.fullName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              {d.fabricTier || d.tier}
                            </span>
                          </div>
                          {d.company && <div className="text-[11px] text-slate-400">{d.company}</div>}
                          
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400">{lang === 'cyr' ? "Олинган мато:" : "Olingan mato:"}</span>
                            <span className="font-black text-amber-400 text-sm">
                              {formatKg(d.totalKg, lang)} ({d.totalTonnes} t)
                            </span>
                          </div>

                          {d.fabricMarketSharePercent > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">{lang === 'cyr' ? "Умумий улуши:" : "Umumiy ulushi:"}</span>
                              <span className="font-bold text-sky-400">{d.fabricMarketSharePercent}%</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{lang === 'cyr' ? "Жами савдо ($):" : "Jami savdo ($):"}</span>
                            <span className="font-bold text-white">{formatUsd(d.totalSpentUsd)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{lang === 'cyr' ? "Тўланган пул:" : "To'langan pul:"}</span>
                            <span className="font-bold text-emerald-400">{formatUsd(d.totalPaidUsd)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{lang === 'cyr' ? "Рейтинг балли:" : "Reyting balli:"}</span>
                            <span className="font-bold text-amber-400">⭐ {d.ratingScore} / 5.0</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400">{lang === 'cyr' ? "Қарз ҳолати:" : "Qarz holati:"}</span>
                            <span className={`font-black ${d.hasDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {d.hasDebt ? formatUsd(d.debtUsd) : (lang === 'cyr' ? "Қарзи йўқ ✓" : "Qarzi yo'q ✓")}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={30}
                  wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                />
                {chartMetric === 'spent' && (
                  <>
                    <Bar dataKey="totalSpentUsd" name={lang === 'cyr' ? "Жами Харид ($)" : "Jami Xarid ($)"} fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="totalPaidUsd" name={lang === 'cyr' ? "Тўланган Пули ($)" : "To'langan Puli ($)"} fill="#10b981" radius={[8, 8, 0, 0]} />
                  </>
                )}
                {chartMetric === 'kg' && (
                  <Bar dataKey="totalKg" name={lang === 'cyr' ? "Мато Ҳажми (КГ)" : "Mato Hajmi (KG)"} radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-kg-${index}`}
                        fill={
                          index === 0
                            ? '#f59e0b'
                            : index === 1
                            ? '#38bdf8'
                            : index === 2
                            ? '#a855f7'
                            : index === 3
                            ? '#10b981'
                            : index === 4
                            ? '#6366f1'
                            : '#64748b'
                        }
                      />
                    ))}
                  </Bar>
                )}
                {chartMetric === 'score' && (
                  <Bar dataKey="ratingScore" name={lang === 'cyr' ? "Рейтинг Балли (1-5)" : "Reyting Balli (1-5)"} fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-score-${index}`} fill={entry.ratingScore >= 4.7 ? '#8b5cf6' : entry.ratingScore >= 4.0 ? '#f59e0b' : '#0ea5e9'} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 3 VIP / Yetakchi Mijozlar Kartochkalari */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>
                  {chartMetric === 'kg'
                    ? (lang === 'cyr' ? "ТОП-3 Энг Кўп Мато Олганлар" : "TOP-3 Eng Ko'p Mato Olganlar")
                    : (lang === 'cyr' ? "ТОП-3 Фаол Ҳамкорлар" : "TOP-3 Faol Hamkorlar")}
                </span>
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {chartMetric === 'kg' ? "Mato bo'yicha" : "Moliyaviy"}
              </span>
            </h4>

            {topRanked.map((c, i) => (
              <div
                key={c.id}
                onClick={() => handleOpenHistory(c)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                      i === 0
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : i === 1
                        ? 'bg-sky-400 text-slate-950 shadow-xs'
                        : 'bg-amber-700 text-white'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.company || c.phone}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    {chartMetric === 'kg' ? (
                      <>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {formatKg(c.totalPurchasedKg || 0, lang)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          {((c.totalPurchasedKg || 0) / 1000).toFixed(1)} t • {c.fabricMarketSharePercent || 0}%
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {formatUsd(c.totalSpentUsd)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          {formatKg(c.totalPurchasedKg || 0, lang)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {renderStars(c.ratingScore || 4.5)}
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-[10px]">
                      {c.ratingScore}
                    </span>
                    {c.fabricTier && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                        {c.fabricTier}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{lang === 'cyr' ? "Тарих" : "Tarix"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QIDIRUV VA FILTRLASH */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Qidiruv */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'cyr' ? "Мижоз исми, телефон ёки корхона бўйича қидириш..." : "Mijoz ismi, telefon yoki korxona bo'yicha qidirish..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Qarz holati bo'yicha tezkor filterlar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setDebtFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              debtFilter === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'cyr' ? "Барчаси" : "Barchasi"} ({customers.length})
          </button>
          <button
            onClick={() => setDebtFilter('debtors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              debtFilter === 'debtors'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            🔴 {lang === 'cyr' ? "Қарздорлар" : "Qarzdorlar"} ({customers.filter(c => c.hasDebt).length})
          </button>
          <button
            onClick={() => setDebtFilter('no_debt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              debtFilter === 'no_debt'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            🟢 {lang === 'cyr' ? "Қарзи йўқлар" : "Qarzi yo'qlar"} ({customers.filter(c => !c.hasDebt).length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MIJOZLAR JADVALI */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">{lang === 'cyr' ? "Мижоз & Рейтинг" : "Mijoz & Reyting"}</th>
                <th className="py-3 px-3.5">{lang === 'cyr' ? "Телефон & Манзил" : "Telefon & Manzil"}</th>
                <th className="py-3 px-3.5 text-right">{lang === 'cyr' ? "Олинган Мато" : "Olingan Mato"}</th>
                <th className="py-3 px-3.5 text-right">{lang === 'cyr' ? "Жами Савдо ($)" : "Jami Savdo ($)"}</th>
                <th className="py-3 px-3.5 text-right">{lang === 'cyr' ? "Тўлаган Пули" : "To'lagan Puli"}</th>
                <th className="py-3 px-3.5 text-center">{lang === 'cyr' ? "Қарз Ҳолати (Қолдиқ)" : "Qarz Holati (Qoldiq)"}</th>
                <th className="py-3 px-3.5">{lang === 'cyr' ? "Охирги Харид Вақти" : "Oxirgi Xarid Vaqti"}</th>
                <th className="py-3 px-3.5 text-right">{lang === 'cyr' ? "Амаллар" : "Amallar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="font-bold">
                        {lang === 'cyr' ? "Мижозлар топилмади" : "Mijozlar topilmadi"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const debt = Number(cust.debtUsd || 0);
                  const hasDebt = cust.hasDebt;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-amber-50/20 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Mijoz & Reyting */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          {cust.fabricRank && (
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                                cust.fabricRank === 1
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : cust.fabricRank === 2
                                  ? 'bg-sky-400 text-slate-950 shadow-xs'
                                  : cust.fabricRank === 3
                                  ? 'bg-purple-500 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                              title={`Mato xaridi bo'yicha #${cust.fabricRank}-o'rinda`}
                            >
                              #{cust.fabricRank}
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{cust.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                ⭐ {cust.ratingScore || '4.0'}
                              </span>
                              {cust.fabricTier ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  {cust.fabricTier}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {cust.tier || 'Bronza'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Telefon & Manzil */}
                      <td className="py-3.5 px-3.5 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold">{cust.phone || "-"}</div>
                        {cust.company && <div className="text-[10px] text-slate-400">{cust.company}</div>}
                      </td>

                      {/* Olingan Mato */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="font-black text-amber-600 dark:text-amber-400">
                          {formatKg(cust.totalPurchasedKg || 0, lang)}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {cust.totalPurchasedTonnes ? `${cust.totalPurchasedTonnes} t` : `${((cust.totalPurchasedKg || 0) / 1000).toFixed(2)} t`}
                          {cust.fabricMarketSharePercent ? ` • ${cust.fabricMarketSharePercent}%` : ''}
                        </div>
                      </td>

                      {/* Jami Xarid */}
                      <td className="py-3.5 px-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatUsd(cust.totalSpentUsd || 0)}
                      </td>

                      {/* To'lagan puli */}
                      <td className="py-3.5 px-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatUsd(cust.totalPaidUsd || 0)}
                      </td>

                      {/* Qarz holati */}
                      <td className="py-3.5 px-3.5 text-center">
                        {hasDebt ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-black text-xs border border-rose-200 dark:border-rose-800">
                              {formatUsd(debt)}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {formatUzs(cust.debtUzs, lang)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                            ✓ {lang === 'cyr' ? "Қарзи йўқ" : "Qarzi yo'q"}
                          </span>
                        )}
                      </td>

                      {/* Oxirgi xarid vaqti */}
                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {cust.lastPurchaseDate ? (
                          <div className="font-semibold">
                            {formatDateTime(cust.lastPurchaseDate, lang)}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="py-3.5 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Tarixni ko'rish (Asosiy talab) */}
                        <button
                          onClick={() => handleOpenHistory(cust)}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-black text-[11px] inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Qachon, qanday mato olgani va qancha pul bergani tarixi"
                        >
                          <History className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>{lang === 'cyr' ? "Тарих" : "Tarix"}</span>
                        </button>

                        {/* Qarz to'lash */}
                        {hasDebt && (
                          <button
                            onClick={() => handleOpenPay(cust)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1 transition-all active:scale-95"
                            title="Qarz to'lovini qabul qilish"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{lang === 'cyr' ? "Тўлаш" : "To'lash"}</span>
                          </button>
                        )}

                        {/* Tahrirlash */}
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* O'chirish */}
                        <button
                          onClick={() => setDeleteModalCustomer(cust)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TALAB 1: MIJOZNING BATAFSIL XARID VA TO'LOVLAR TARIXI MODALI */}
      {/* ======================================================== */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-300/40 shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedCustomerHistory?.customer?.name || (lang === 'cyr' ? "Мижоз Тарихи" : "Mijoz Tarixi")}
                    </h3>
                    {selectedCustomerHistory?.customer && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {selectedCustomerHistory.customer.ratingScore || '5.0'} ({selectedCustomerHistory.customer.tier || 'VIP'})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedCustomerHistory?.customer?.company || selectedCustomerHistory?.customer?.phone || ""}
                    {selectedCustomerHistory?.customer?.address ? ` • ${selectedCustomerHistory.customer.address}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {historyLoading ? (
                <div className="py-16 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                  <RefreshCw className="w-7 h-7 animate-spin text-sky-500" />
                  <span>{lang === 'cyr' ? "Тарих юкланмоқда..." : "Tarix yuklanmoqda..."}</span>
                </div>
              ) : selectedCustomerHistory ? (
                <>
                  {/* 4 ta Hisobot kartochkalari */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Jami olingan mato */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                      <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                        {lang === 'cyr' ? "Олинган Мато (Жами)" : "Olingan Mato (Jami)"}
                      </span>
                      <div className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                        {formatKg(selectedCustomerHistory.customer.totalPurchasedKg || 0, lang)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        ~{Math.round((selectedCustomerHistory.customer.totalPurchasedKg || 0) / 25)} {lang === 'cyr' ? "рулон" : "rulon"}
                      </span>
                    </div>

                    {/* Jami Xarid Qiymati */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {lang === 'cyr' ? "Жами Савдо Қиймати" : "Jami Savdo Qiymati"}
                      </span>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {formatUsd(selectedCustomerHistory.customer.totalSalesUsd || 0)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {selectedCustomerHistory.purchases?.length || 0} {lang === 'cyr' ? "та инвойс" : "ta invoys"}
                      </span>
                    </div>

                    {/* Jami To'lagan Puli */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                        {lang === 'cyr' ? "Жами Берган Пули" : "Jami Bergan Puli"}
                      </span>
                      <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                        {formatUsd(selectedCustomerHistory.customer.totalPaidUsd || 0)}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        ✓ {lang === 'cyr' ? "Тўловлар қабул қилинган" : "To'lovlar qabul qilingan"}
                      </span>
                    </div>

                    {/* Qancha Qarzi Qolgani yoki Qolmagani */}
                    <div className={`p-3.5 rounded-2xl border ${
                      selectedCustomerHistory.customer.hasDebt
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${
                        selectedCustomerHistory.customer.hasDebt ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {lang === 'cyr' ? "Қолган Қарзи" : "Qolgan Qarzi"}
                      </span>
                      <div className={`text-base sm:text-lg font-black mt-0.5 ${
                        selectedCustomerHistory.customer.hasDebt ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {selectedCustomerHistory.customer.hasDebt
                          ? formatUsd(selectedCustomerHistory.customer.debtUsd)
                          : (lang === 'cyr' ? "Қарзи Қолмаган ✓" : "Qarzi Qolmagan ✓")}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        {selectedCustomerHistory.customer.hasDebt
                          ? formatUzs(selectedCustomerHistory.customer.debtUzs, lang)
                          : (lang === 'cyr' ? "Тўлиқ ҳисоб-китоб қилинган" : "To'liq hisob-kitob qilingan")}
                      </span>
                    </div>
                  </div>

                  {/* Tarix Tablari */}
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button
                      onClick={() => setHistoryActiveTab('purchases')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        historyActiveTab === 'purchases'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{lang === 'cyr' ? "Олинган Матолар Тарихи" : "Olingan Matolar Tarixi"} ({selectedCustomerHistory.purchases?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setHistoryActiveTab('debt_payments')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        historyActiveTab === 'debt_payments'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{lang === 'cyr' ? "Қарз Тўловлари Тарихи" : "Qarz To'lovlari Tarixi"} ({selectedCustomerHistory.debtPayments?.length || 0})</span>
                    </button>
                  </div>

                  {/* 1. XARID QILINGAN MATOLAR JADVALI (VAQTI-SOATI BILAN) */}
                  {historyActiveTab === 'purchases' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Сана & Аниқ Вақти (Соати)" : "Sana & Aniq Vaqti (Soati)"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Инвойс №" : "Invoys №"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Қандай Мато Олган" : "Qanday Mato Olgan"}</th>
                            <th className="py-2.5 px-3 text-right">{lang === 'cyr' ? "Мато Вазни" : "Mato Vazni"}</th>
                            <th className="py-2.5 px-3 text-right">{lang === 'cyr' ? "Умумий Сумма" : "Umumiy Summa"}</th>
                            <th className="py-2.5 px-3 text-right">{lang === 'cyr' ? "Қанча Пул Берган" : "Qancha Pul Bergan"}</th>
                            <th className="py-2.5 px-3 text-center">{lang === 'cyr' ? "Қарзи Қолгани / Қолмагани" : "Qarzi Qolgani / Qolmagani"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {selectedCustomerHistory.purchases?.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="py-8 text-center text-slate-400">
                                {lang === 'cyr' ? "Ҳозирча савдолар қайд этилмаган" : "Hozircha savdolar qayd etilmagan"}
                              </td>
                            </tr>
                          ) : (
                            selectedCustomerHistory.purchases.map(pur => (
                              <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                {/* Sana va aniq vaqti-soati */}
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                    <span>{formatDateTime(pur.createdAt, lang)}</span>
                                  </div>
                                </td>

                                {/* Invoys № */}
                                <td className="py-3 px-3">
                                  <span className="font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                                    {pur.invoiceNumber}
                                  </span>
                                </td>

                                {/* Qanday mato olgani */}
                                <td className="py-3 px-3">
                                  {pur.items && pur.items.length > 0 ? (
                                    <div className="space-y-1">
                                      {pur.items.map((it, idx) => (
                                        <div key={idx} className="text-xs">
                                          <div className="font-black text-slate-800 dark:text-slate-100">
                                            {it.fabricName}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {it.colorName} {it.pantoneCode ? `(${it.pantoneCode})` : ""} • {it.qualityGrade} • ${it.unitPriceUsd}/kg
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Bo'yalgan matolar</span>
                                  )}
                                </td>

                                {/* Mato vazni */}
                                <td className="py-3 px-3 text-right">
                                  <div className="font-black text-amber-600 dark:text-amber-400">
                                    {formatKg(pur.totalKg, lang)}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    ~{Math.round(pur.totalKg / 25)} {lang === 'cyr' ? "рулон" : "rulon"}
                                  </span>
                                </td>

                                {/* Umumiy summa */}
                                <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                                  <div>{formatUsd(pur.totalAmountUsd)}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold">{formatUzs(pur.totalAmountUzs, lang)}</div>
                                </td>

                                {/* Qancha pul bergan */}
                                <td className="py-3 px-3 text-right">
                                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                                    {formatUsd(pur.totalPaidInUsdTerms)}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {pur.paymentType === 'dollar_naqd' ? '$ Naqd' : pur.paymentType === 'som_naqd' ? "So'm naqd" : pur.paymentType}
                                  </span>
                                </td>

                                {/* Qancha qarzi qolgani yoki qolmagani */}
                                <td className="py-3 px-3 text-center">
                                  {pur.hasRemainingDebt ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-black text-[11px] border border-rose-200">
                                      {formatUsd(pur.remainingDebtUsd)} {lang === 'cyr' ? "қарз" : "qarz"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                                      ✓ {lang === 'cyr' ? "Қарзи қолмаган" : "Qarzi qolmagan"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 2. QARZ SO'NDIRISH TO'LOVLARI JADVALI */}
                  {historyActiveTab === 'debt_payments' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Тўлов Вақти (Соати билан)" : "To'lov Vaqti (Soati bilan)"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Тўланган Сумма ($)" : "To'langan Summa ($)"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Сўмда" : "So'mda"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Қабул Қилинган Касса" : "Qabul Qilingan Kassa"}</th>
                            <th className="py-2.5 px-3">{lang === 'cyr' ? "Тавсиф / Изоҳ" : "Tavsif / Izoh"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {selectedCustomerHistory.debtPayments?.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-slate-400">
                                {lang === 'cyr' ? "Қарз сўндириш тўловлари йўқ" : "Qarz so'ndirish to'lovlari yo'q"}
                              </td>
                            </tr>
                          ) : (
                            selectedCustomerHistory.debtPayments.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{formatDateTime(p.createdAt, lang)}</span>
                                </td>
                                <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                  {formatUsd(p.amountUsd)}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                                  {formatUzs(p.amountUzs, lang)}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                    {p.account === 'dollar_kassa' ? '💵 Dollar Kassa' : '💳 So\'m Kassa'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-500 text-xs">
                                  {p.description || "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Sticky Footer */}
            <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {selectedCustomerHistory?.customer?.hasDebt ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {lang === 'cyr' ? "Жорий қолдиқ қарз:" : "Joriy qoldiq qarz:"} {formatDualCurrency(selectedCustomerHistory.customer.debtUsd, usdRate, lang)}
                    </span>
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>{lang === 'cyr' ? "Мижознинг қарздорлиги йўқ (0.00)" : "Mijozning qarzdorligi yo'q (0.00)"}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedCustomerHistory?.customer?.hasDebt && (
                  <button
                    onClick={() => {
                      handleOpenPay(selectedCustomerHistory.customer);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-98 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{lang === 'cyr' ? "Қарзни Тўлаш" : "Qarzni To'lash"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'cyr' ? "Ёпиш" : "Yopish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. YANGI MIJOZ QO'SHISH / TAHRIRLASH MODALI */}
      {/* ======================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingCustomer
                  ? (lang === 'cyr' ? "Мижозни Таҳрирлаш" : "Mijozni Tahrirlash")
                  : (lang === 'cyr' ? "Янги Мижоз Қўшиш" : "Yangi Mijoz Qo'shish")}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Мижоз Исми / Корхона Номи" : "Mijoz Ismi / Korxona Nomi"} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Samarqand Fashion Style MCHJ"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Телефон Рақами" : "Telefon Raqami"}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Манзил" : "Manzil"}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Toshkent sh., Chilonzor"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Корхона / Бренд Номи" : "Korxona / Brend Nomi"}
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ergash Brend"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Бошланғич Қарз ($ USD, ихтиёрий)" : "Boshlang'ich Qarz ($ USD, ixtiyoriy)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initialDebtUsd}
                    onChange={(e) => setFormData({ ...formData, initialDebtUsd: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm cursor-pointer active:scale-98"
                >
                  {lang === 'cyr' ? "Сақлаш" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. QARZ TO'LASH MODALI ($ VA SO'MDA - ARALASH TO'LOV) */}
      {/* ======================================================== */}
      {payModalCustomer && (() => {
        const debtUsd = Number(payModalCustomer.debtUsd || 0);
        const debtUzs = Math.round(debtUsd * usdRate);

        const inputUsd = Number(payForm.amountUsd) || 0;
        const inputUzs = Number(payForm.amountUzs) || 0;

        let totalEquivalentUsd = 0;
        if (payForm.currency === 'SPLIT') {
          totalEquivalentUsd = Number((inputUsd + (inputUzs / usdRate)).toFixed(2));
        } else if (payForm.currency === 'USD') {
          totalEquivalentUsd = inputUsd;
        } else {
          totalEquivalentUsd = Number((inputUzs / usdRate).toFixed(2));
        }

        const totalEquivalentUzs = Math.round(totalEquivalentUsd * usdRate);
        const remainingDebtUsd = Math.max(0, Number((debtUsd - totalEquivalentUsd).toFixed(2)));
        const remainingDebtUzs = Math.round(remainingDebtUsd * usdRate);
        const isFullyPaid = totalEquivalentUsd >= debtUsd - 0.05 && debtUsd > 0;
        const isOverpaid = totalEquivalentUsd > debtUsd + 0.05;
        const overpaidUsd = isOverpaid ? Number((totalEquivalentUsd - debtUsd).toFixed(2)) : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {lang === 'cyr' ? "Қарз Тўловини Қабул Қилиш" : "Qarz To'lovini Qabul Qilish"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {lang === 'cyr' ? "Доллар ва сўмда бўлиб тўлаш имконияти билан" : "Dollar va so'mda bo'lib to'lash imkoniyati bilan"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 text-base font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mijoz va qarz ma'lumoti */}
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-300 font-black">{payModalCustomer.name}</span>
                  <span className="text-[11px] text-slate-500">{payModalCustomer.company || payModalCustomer.phone}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                  <span className="text-rose-700 dark:text-rose-300 font-bold">
                    {lang === 'cyr' ? "Жорий Қарз:" : "Joriy Qarz:"}
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-black text-rose-800 dark:text-rose-200">
                      {formatDualCurrency(debtUsd, usdRate, lang)}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                {/* To'lov rejimi (3 ta variant) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'cyr' ? "Тўлов Усули & Валютаси" : "To'lov Usuli & Valyutasi"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayForm({ ...payForm, currency: 'SPLIT' })}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                        payForm.currency === 'SPLIT'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🔀 {lang === 'cyr' ? "Аралаш ($ + Сўм)" : "Aralash ($ + So'm)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayForm({ ...payForm, currency: 'USD', amountUsd: String(debtUsd), amountUzs: '' })}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                        payForm.currency === 'USD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      💵 $ USD {lang === 'cyr' ? "(Доллар)" : "(Dollar)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayForm({ ...payForm, currency: 'UZS', amountUzs: String(debtUzs), amountUsd: '' })}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                        payForm.currency === 'UZS'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      💳 UZS {lang === 'cyr' ? "(Сўм)" : "(So'm)"}
                    </button>
                  </div>
                </div>

                {/* 1. ARALASH REJIM (DOLAR VA SO'MDA BIRGALIKDA) */}
                {payForm.currency === 'SPLIT' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/60">
                    <div className="text-[11px] font-black text-sky-800 dark:text-sky-300 flex items-center justify-between">
                      <span>{lang === 'cyr' ? "Қарзни қанчасини долларда, қанчасини сўмда беради:" : "Qarzni qanchasini dollarda, qanchasini so'mda beradi:"}</span>
                      <span className="text-[10px] text-slate-400 font-mono">1$ = {Number(usdRate).toLocaleString()} so'm</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* USD qismi */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            💵 {lang === 'cyr' ? "Доллардаги қисми ($)" : "Dollardagi qismi ($)"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const half = Number((debtUsd / 2).toFixed(2));
                              setPayForm({ ...payForm, amountUsd: String(half) });
                            }}
                            className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                          >
                            50% (${(debtUsd / 2).toFixed(1)})
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00 $"
                          value={payForm.amountUsd}
                          onChange={(e) => setPayForm({ ...payForm, amountUsd: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-black rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* UZS qismi */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            💳 {lang === 'cyr' ? "Сўмдаги қисми (UZS)" : "So'mdagi qismi (UZS)"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const remainingUsd = Math.max(0, debtUsd - (Number(payForm.amountUsd) || 0));
                              const neededUzs = Math.round(remainingUsd * usdRate);
                              setPayForm({ ...payForm, amountUzs: String(neededUzs) });
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                            title="Dollardan ortgan barcha qarzni so'mda to'lash"
                          >
                            {lang === 'cyr' ? "Қолганини сўмда" : "Qolganini so'mda"}
                          </button>
                        </div>
                        <input
                          type="number"
                          step="1000"
                          placeholder="0 so'm"
                          value={payForm.amountUzs}
                          onChange={(e) => setPayForm({ ...payForm, amountUzs: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-black rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Tezkor avto-to'ldirish tugmalari */}
                    <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                      <span className="text-slate-400 font-bold">{lang === 'cyr' ? "Тезкор:" : "Tezkor:"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const halfUsd = Number((debtUsd / 2).toFixed(2));
                          const halfUzs = Math.round(halfUsd * usdRate);
                          setPayForm({ ...payForm, amountUsd: String(halfUsd), amountUzs: String(halfUzs) });
                        }}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 cursor-pointer"
                      >
                        ⚖️ {lang === 'cyr' ? "50% Доллар + 50% Сўм" : "50% Dollar + 50% So'm"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. FAQAT DOLLAR REJIMI */}
                {payForm.currency === 'USD' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'cyr' ? "Тўланадиган Сумма ($ USD)" : "To'lanadigan Summa ($ USD)"} *
                      </label>
                      <button
                        type="button"
                        onClick={() => setPayForm({ ...payForm, amountUsd: String(debtUsd) })}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {lang === 'cyr' ? "Тўлиқ қисми:" : "To'liq qismi:"} ${debtUsd}
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={payForm.amountUsd}
                      onChange={(e) => setPayForm({ ...payForm, amountUsd: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-base font-black rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* 3. FAQAT SO'M REJIMI */}
                {payForm.currency === 'UZS' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'cyr' ? "Тўланадиган Сумма (Сўм UZS)" : "To'lanadigan Summa (So'm UZS)"} *
                      </label>
                      <button
                        type="button"
                        onClick={() => setPayForm({ ...payForm, amountUzs: String(debtUzs) })}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {lang === 'cyr' ? "Тўлиқ қисми:" : "To'liq qismi:"} {debtUzs.toLocaleString()} so'm
                      </button>
                    </div>
                    <input
                      type="number"
                      step="1000"
                      value={payForm.amountUzs}
                      onChange={(e) => setPayForm({ ...payForm, amountUzs: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-base font-black rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Jonli hisob-kitob va qarz qoldig'i kartochkasi */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>{lang === 'cyr' ? "Киритилган умумий тўлов:" : "Kiritilgan umumiy to'lov:"}</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      ${totalEquivalentUsd.toFixed(2)} ≈ {totalEquivalentUzs.toLocaleString()} so'm
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'cyr' ? "Тўловдан кейинги қарз қолдиғи:" : "To'lovdan keyingi qarz qoldig'i:"}
                    </span>
                    {isFullyPaid ? (
                      <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'cyr' ? "Қарз тўлиқ ёпилади" : "Qarz to'liq yopiladi"}</span>
                      </span>
                    ) : (
                      <span className="font-black text-rose-600 dark:text-rose-400">
                        ${remainingDebtUsd.toFixed(2)} ({remainingDebtUzs.toLocaleString()} so'm)
                      </span>
                    )}
                  </div>

                  {isOverpaid && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold pt-1">
                      ⚠️ {lang === 'cyr' ? "Ортиқча тўлов миқдори:" : "Ortiqcha to'lov miqdori:"} +${overpaidUsd.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* To'lov izohi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'cyr' ? "Изоҳ (ихтиёрий)" : "Izoh (ixtiyoriy)"}
                  </label>
                  <input
                    type="text"
                    value={payForm.notes}
                    onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                    placeholder="Qarz so'ndirish bo'yicha qo'shimcha eslatma..."
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPayModalCustomer(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm cursor-pointer active:scale-98 flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{lang === 'cyr' ? "Тўловни Қабул Қилиш" : "To'lovni Qabul Qilish"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 4. O'CHIRISHNI TASDIQLASH MODALI */}
      {/* ======================================================== */}
      {deleteModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Мижозни Ўчиришни Тасдиқланг" : "Mijozni O'chirishni Tasdiqlang"}
              </h3>
              <p className="text-xs text-slate-500">
                {deleteModalCustomer.name} {lang === 'cyr' ? "тизимдан бутунлай ўчирилади." : "tizimdan butunlay o'chiriladi."}
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer active:scale-98"
              >
                {lang === 'cyr' ? "Ҳа, Ўчириш" : "Ha, O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
