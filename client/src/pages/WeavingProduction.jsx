import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatWeightTonnes, formatUsd, formatDate } from '../utils/formatters';
import {
  Sparkles,
  PlusCircle,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  Layers,
  Search,
  RefreshCw,
  Trash2,
  TrendingUp,
  Calendar,
  BarChart3,
  Check,
  Wrench,
  User,
  Gauge,
  Printer,
  FileText,
  ClipboardList,
  Clock,
  Filter,
  Building2
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
  CartesianGrid
} from 'recharts';

export default function WeavingProduction() {
  const { lang, loc, setQrModalRoll, notify, refreshSignal, triggerRefresh, setPrintWeavingOrderData } = useApp();

  const [looms, setLooms] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [rawRolls, setRawRolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // To'quvga berilgan buyurtmalar holati
  const [weavingOrders, setWeavingOrders] = useState([]);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: 'Samarkand Apparel MCHJ',
    fabricId: '',
    orderedKg: '3500',
    deadline: '2026-09-25',
    loomId: '',
    operator: 'Rustam Karimov',
    yarnLot: 'LOT-Paxta-30/1',
    qualityGrade: '1-nav',
    notes: ''
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Yangi rulon to'qish modali
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoom, setSelectedLoom] = useState(null);
  const [formData, setFormData] = useState({
    fabricId: '',
    loomId: '',
    yarnLot: 'LOT-Paxta-30/1',
    weightKg: '',
    tareKg: '0.5',
    operator: 'Rustam Karimov',
    qualityGrade: '1-nav',
    location: "Xom Matolar Ombori (A-Sektor)",
    notes: ''
  });

  // Yangi dastgoh qo'shish modali
  const [newLoomModalOpen, setNewLoomModalOpen] = useState(false);
  const [loomForm, setLoomForm] = useState({
    name: '',
    model: 'Picanol 220cm Airjet',
    operator: 'Farrux Saidov',
    currentFabricId: '',
    rpm: 650,
    status: 'ishlamoqda'
  });

  // Diagramma davri: 'daily' | '7days' | '30days' | 'yearly'
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [productionAnalytics, setProductionAnalytics] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loomsRes, fabRes, rollsRes, analyticsRes, ordersRes] = await Promise.all([
        api.get('/production/looms'),
        api.get('/fabrics'),
        api.get('/rolls?fabricType=xom'),
        api.get('/production/analytics').catch(() => null),
        api.get('/production/orders').catch(() => ({ success: true, data: [] }))
      ]);

      if (loomsRes.success) setLooms(loomsRes.data || []);
      if (fabRes.success) {
        setFabrics(fabRes.data || []);
        if (fabRes.data && fabRes.data.length > 0) {
          if (!loomForm.currentFabricId) {
            setLoomForm(prev => ({ ...prev, currentFabricId: fabRes.data[0].id }));
          }
          if (!newOrderForm.fabricId) {
            setNewOrderForm(prev => ({ ...prev, fabricId: fabRes.data[0].id }));
          }
        }
      }
      if (rollsRes.success) setRawRolls(rollsRes.data || []);
      if (analyticsRes && analyticsRes.success && analyticsRes.data) {
        setProductionAnalytics(analyticsRes.data);
      }
      if (ordersRes && ordersRes.success) {
        setWeavingOrders(ordersRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  // TALAB: To'quvga yangi buyurtma berish
  const handleCreateWeavingOrder = async (e) => {
    e.preventDefault();
    if (!newOrderForm.fabricId || !newOrderForm.orderedKg || Number(newOrderForm.orderedKg) <= 0) {
      notify("Xatolik", "Mato turi va buyurtma vaznini (kg) to'g'ri kiriting", "error");
      return;
    }
    if (!newOrderForm.deadline) {
      notify("Xatolik", "Buyurtmani topshirish muddatini belgilang", "error");
      return;
    }

    try {
      const res = await api.post('/production/orders', newOrderForm);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Тўқувга буюртма берилди!" : "To'quvga buyurtma berildi!",
          lang === 'cyr'
            ? `${res.data.orderNumber} - ${res.data.orderedKg} кг (${res.data.deadline} гача)`
            : `${res.data.orderNumber} - ${res.data.orderedKg} kg (${res.data.deadline} gacha)`,
          'success'
        );
        setNewOrderModalOpen(false);
        fetchData();
        triggerRefresh();

        // Darhol buyurtma blankasini pechat qilish uchun modalni ochish
        if (setPrintWeavingOrderData && res.data) {
          setPrintWeavingOrderData(res.data);
        }
      }
    } catch (err) {
      notify("Xatolik", err.message || "Buyurtma berishda xatolik yuz berdi", "error");
    }
  };

  // Buyurtma holatini yangilash
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/production/orders/${orderId}`, { status: newStatus });
      if (res.success) {
        notify("Holat yangilandi", `Buyurtma: ${newStatus}`, "success");
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  // Buyurtmani o'chirish
  const handleDeleteOrder = async (order) => {
    const confirmMsg = lang === 'cyr'
      ? `"${order.orderNumber}" тўқув буюртмасини бекор қилишни тасдиқлайсизми?`
      : `"${order.orderNumber}" to'quv buyurtmasini bekor qilishni tasdiqlaysizmi?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/production/orders/${order.id}`);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Ўчирилди" : "O'chirildi",
          lang === 'cyr' ? "Буюртма муваффақиятли ўчирилди" : "Buyurtma muvaffaqiyatli o'chirildi",
          'success'
        );
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  // TALAB 1: Yangi Dastgoh Qo'shish
  const handleAddLoomSubmit = async (e) => {
    e.preventDefault();
    if (!loomForm.name || !loomForm.name.trim()) {
      notify("Xatolik", "Dastgoh nomi kiritilishi shart", "error");
      return;
    }

    try {
      const res = await api.post('/production/looms', loomForm);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Янги дастгоҳ қўшилди!" : "Yangi dastgoh qo'shildi!",
          res.data.name,
          'success'
        );
        setNewLoomModalOpen(false);
        setLoomForm({
          name: '',
          model: 'Picanol 220cm Airjet',
          operator: 'Farrux Saidov',
          currentFabricId: fabrics[0]?.id || '',
          rpm: 650,
          status: 'ishlamoqda'
        });
        fetchData();
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Dastgoh qo'shishda xatolik", "error");
    }
  };

  // TALAB 1: Dastgohni O'chirish
  const handleDeleteLoom = async (loom) => {
    const confirmMsg = lang === 'cyr'
      ? `"${loom.name}" дастгоҳини тизимдан ўчиришни тасдиқлайсизми?`
      : `"${loom.name}" dastgohini tizimdan o'chirishni tasdiqlaysizmi?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/production/looms/${loom.id}`);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Ўчирилди" : "O'chirildi",
          lang === 'cyr' ? "Дастгоҳ муваффақиятли ўчирилди" : "Dastgoh muvaffaqiyatli o'chirildi",
          'success'
        );
        fetchData();
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Dastgohni o'chirishda xatolik", "error");
    }
  };

  // Dastgoh holatini o'zgartirish (Ishlamoqda <-> Ta'mirlashda)
  const handleToggleLoomStatus = async (loom) => {
    const nextStatus = loom.status === 'ishlamoqda' ? 'tamirlashda' : 'ishlamoqda';
    try {
      const res = await api.put(`/production/looms/${loom.id}`, {
        status: nextStatus,
        rpm: nextStatus === 'ishlamoqda' ? 620 : 0
      });
      if (res.success) {
        notify("Holat yangilandi", `${loom.name}: ${nextStatus}`, "success");
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  // Rulon to'qish
  const handleOpenProduce = (loom = null) => {
    setSelectedLoom(loom);
    setFormData({
      fabricId: loom?.currentFabricId || (fabrics[0]?.id || ''),
      loomId: loom?.id || (looms[0]?.id || ''),
      yarnLot: 'LOT-Paxta-30/1',
      weightKg: '',
      tareKg: '0.5',
      operator: loom?.operator || "Usta to'quvchi",
      qualityGrade: '1-nav',
      location: "Xom Matolar Ombori (A-Sektor)",
      notes: ''
    });
    setModalOpen(true);
  };

  const handleProduceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fabricId || !formData.weightKg || Number(formData.weightKg) <= 0) {
      notify("Xatolik", "Mato va brutto vaznni (kg) to'g'ri kiriting", "error");
      return;
    }

    try {
      const res = await api.post('/production/produce-roll', formData);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Хом мато рулони тайёр!" : "Xom mato ruloni tayyor!",
          lang === 'cyr' ? `${res.data.id} омборга кирим қилинди (${res.data.netKg} кг)` : `${res.data.id} omborga kirim qilindi (${res.data.netKg} kg)`,
          'success'
        );
        setModalOpen(false);
        triggerRefresh();
        setQrModalRoll(res.data);
      }
    } catch (err) {
      notify("Xatolik", err.message || "Rulon yaratishda muammo yuz berdi", "error");
    }
  };

  // TALAB 2: Ko'p davrli ishlab chiqarish ma'lumotlari (Kunlik, 7 kunlik, 30 kunlik, Yillik KG)
  const fallbackAnalytics = {
    daily: {
      period: 'daily',
      labelLat: 'Bugungi Kunlik',
      labelCyr: 'Бугунги Кунлик',
      weavingKg: 4500,
      weavingTonnes: 4.5,
      weavingRolls: 180,
      data: [
        { label: '08:00', weavingKg: 650, rollsCount: 26, tonnes: 0.65 },
        { label: '10:00', weavingKg: 800, rollsCount: 32, tonnes: 0.80 },
        { label: '12:00', weavingKg: 750, rollsCount: 30, tonnes: 0.75 },
        { label: '14:00', weavingKg: 850, rollsCount: 34, tonnes: 0.85 },
        { label: '16:00', weavingKg: 750, rollsCount: 30, tonnes: 0.75 },
        { label: '18:00', weavingKg: 700, rollsCount: 28, tonnes: 0.70 }
      ]
    },
    '7days': {
      period: '7days',
      labelLat: '7 Kunlik',
      labelCyr: '7 Кунлик',
      weavingKg: 31500,
      weavingTonnes: 31.5,
      weavingRolls: 1260,
      data: [
        { date: '2026-09-07', label: '07-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-08', label: '08-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-09', label: '09-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-10', label: '10-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-11', label: '11-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-12', label: '12-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-13', label: '13-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 }
      ]
    },
    '30days': {
      period: '30days',
      labelLat: '30 Kunlik',
      labelCyr: '30 Кунлик',
      weavingKg: 106000,
      weavingTonnes: 106.0,
      weavingRolls: 4240,
      data: [
        { date: '2026-08-15', label: '15-Avg', weavingKg: 4200, rollsCount: 168, tonnes: 4.2 },
        { date: '2026-08-20', label: '20-Avg', weavingKg: 4350, rollsCount: 174, tonnes: 4.35 },
        { date: '2026-08-25', label: '25-Avg', weavingKg: 4400, rollsCount: 176, tonnes: 4.4 },
        { date: '2026-08-28', label: '28-Avg', weavingKg: 4300, rollsCount: 172, tonnes: 4.3 },
        { date: '2026-09-02', label: '02-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-04', label: '04-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-06', label: '06-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-09', label: '09-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-12', label: '12-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 },
        { date: '2026-09-13', label: '13-Sen', weavingKg: 4500, rollsCount: 180, tonnes: 4.5 }
      ]
    },
    yearly: {
      period: 'yearly',
      labelLat: 'Yillik (2026)',
      labelCyr: 'Йиллик (2026)',
      weavingKg: 1128100,
      weavingTonnes: 1128.1,
      weavingRolls: 45124,
      data: [
        { month: '2026-01', label: 'Yan', weavingKg: 112000, rollsCount: 4480, tonnes: 112.0 },
        { month: '2026-02', label: 'Fev', weavingKg: 118500, rollsCount: 4740, tonnes: 118.5 },
        { month: '2026-03', label: 'Mar', weavingKg: 125000, rollsCount: 5000, tonnes: 125.0 },
        { month: '2026-04', label: 'Apr', weavingKg: 130200, rollsCount: 5208, tonnes: 130.2 },
        { month: '2026-05', label: 'May', weavingKg: 142000, rollsCount: 5680, tonnes: 142.0 },
        { month: '2026-06', label: 'Iyun', weavingKg: 138400, rollsCount: 5536, tonnes: 138.4 },
        { month: '2026-07', label: 'Iyul', weavingKg: 145000, rollsCount: 5800, tonnes: 145.0 },
        { month: '2026-08', label: 'Avg', weavingKg: 152000, rollsCount: 6080, tonnes: 152.0 },
        { month: '2026-09', label: 'Sen', weavingKg: 65000, rollsCount: 2600, tonnes: 65.0 }
      ]
    }
  };

  const activeAnalytics = productionAnalytics || fallbackAnalytics;
  const currentChartPeriod = activeAnalytics[chartPeriod] || activeAnalytics['7days'];
  const chartData = (currentChartPeriod.data || []).map(d => ({
    ...d,
    displayDate: d.label,
    totalKg: d.weavingKg,
    tonnes: Number(((d.weavingKg || 0) / 1000).toFixed(2)),
    rollsCount: d.rollsCount || Math.round((d.weavingKg || 0) / 25)
  }));

  const periodsList = [
    { key: 'daily', lat: 'Kunlik', cyr: 'Кунлик' },
    { key: '7days', lat: '7 Kunlik', cyr: '7 Кунлик' },
    { key: '30days', lat: '30 Kunlik', cyr: '30 Кунлик' },
    { key: 'yearly', lat: 'Yillik (2026)', cyr: 'Йиллик (2026)' }
  ];

  const totalAllProductionKg = activeAnalytics.yearly?.weavingKg || 1128100;
  const totalLoomsKg = looms.reduce((sum, l) => sum + Number(l.todayKg || 0), 0);
  const activeLoomsCount = looms.filter(l => l.status === 'ishlamoqda').length;

  return (
    <div className="space-y-6">
      {/* 1. Sarlavha va tezkor tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500" />
            <span>{lang === 'cyr' ? "Тўқув Сехи & Дастгоҳлар Бошқаруви" : "To'quv Sexi & Dastgohlar Boshqaruvi"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'cyr'
              ? "Дастгоҳлар назорати, хом мато тўқиш ва QR кодли 1-nav/2-nav рулонларни омборга кирим қилиш"
              : "Dastgohlar nazorati, xom mato to'qish va QR kodli 1-nav/2-nav rulonlarni omborga kirim qilish"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{lang === 'cyr' ? "+ Тўқувга Буюртма" : "+ To'quvga Buyurtma"}</span>
          </button>

          <button
            onClick={() => setNewLoomModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-500" />
            <span>{lang === 'cyr' ? "+ Янги Дастгоҳ" : "+ Yangi Dastgoh"}</span>
          </button>

          <button
            onClick={() => handleOpenProduce()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Хом Мато Рулони Тўқиш" : "+ Xom Mato Ruloni To'qish"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Kartochkalar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Йиллик Тўқилган Хом Мато" : "Yillik To'qilgan Xom Mato"}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatWeightTonnes(totalAllProductionKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatKg(totalAllProductionKg, lang)} • {lang === 'cyr' ? "ўртача 25.0 кг (20-30 кг)" : "o'rtacha 25.0 kg (20-30 kg)"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Фаол Дастгоҳлар" : "Faol Dastgohlar"}</span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeLoomsCount} / {looms.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'cyr' ? "Тўлиқ иш режимидаги дастгоҳлар сони" : "To'liq ish rejimidagi dastgohlar soni"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Бугунги Чиқиш" : "Bugungi Chiqish"}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatKg(activeAnalytics.daily?.weavingKg || 4500, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeAnalytics.daily?.weavingRolls || 180} {lang === 'cyr' ? "та рулон тўқилди (4.50 тонна)" : "ta rulon to'qildi (4.50 tonna)"}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TALAB 2: KUNLIK, 7 KUNLIK, 30 KUNLIK, YILLIK DIAGRAMMA */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>{lang === 'cyr' ? "Хом Мато Тўқиш Графиги (КГ / Тонна)" : "Xom Mato To'qish Grafigi (KG / Tonna)"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'cyr'
                ? "Қайси даврда қанча мато тўқилганлиги: Кунлик, 7 кунлик, 30 кунлик ва Йиллик"
                : "Qaysi davrda qancha mato to'qilganligi: Kunlik, 7 kunlik, 30 kunlik va Yillik"}
            </p>
          </div>

          {/* 4 Period Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {periodsList.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setChartPeriod(p.key)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartPeriod === p.key
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lang === 'cyr' ? p.cyr : p.lat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Period Summary Cards: Kunlik KG, 7 kunlik KG, 30 kunlik KG, Yillik KG */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {periodsList.map(p => {
            const pData = activeAnalytics[p.key] || {};
            const isSelected = chartPeriod === p.key;

            return (
              <div
                key={p.key}
                onClick={() => setChartPeriod(p.key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 flex justify-between items-center">
                  <span>{lang === 'cyr' ? p.cyr : p.lat}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatKg(pData.weavingKg || 0, lang)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {pData.weavingTonnes} tn • {pData.weavingRolls?.toLocaleString()} {lang === 'cyr' ? 'та рулон' : 'ta rulon'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recharts Diagrammasi */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weavingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}t` : `${val}kg`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
                        <div className="font-extrabold text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{data.date || data.month || label} ({data.displayDate})</span>
                        </div>
                        <div className="text-sm font-black text-white">
                          {formatKg(data.totalKg, lang)} ({data.tonnes} {lang === 'cyr' ? 'тонна' : 'tonna'})
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {lang === 'cyr' ? "Рулонлар:" : "Rulonlar:"} <strong className="text-slate-200">{data.rollsCount?.toLocaleString()} {lang === 'cyr' ? 'та' : 'ta'} (ўртача 25 кг)</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalKg"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#weavingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tanlangan davr bo'yicha ishlab chiqarish jadval xulosasi */}
        <div className="overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-700/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">{lang === 'cyr' ? "Вақт / Сана" : "Vaqt / Sana"}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'cyr' ? "Тўқилган Вазн (КГ)" : "To'qilgan Vazn (KG)"}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'cyr' ? "Тоннада" : "Tonnada"}</th>
                <th className="py-2.5 px-3 text-center">{lang === 'cyr' ? "Рулонлар Сони" : "Rulonlar Soni"}</th>
                <th className="py-2.5 px-3">{lang === 'cyr' ? "Ўртача Рулон Вазни" : "O'rtacha Rulon Vazni"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {chartData.slice(-7).map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{d.date || d.month || d.label}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                    {formatKg(d.totalKg, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                    {d.tonnes} t
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                      {d.rollsCount} {lang === 'cyr' ? "дона" : "dona"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-bold">
                    25.0 kg (20-30 kg)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TALAB 1: DASTGOHLAR MONITORINGI VA QO'SHISH/O'CHIRISH */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'cyr' ? "Тўқув Дастгоҳлари Назорати" : "To'quv Dastgohlari Nazorati"} ({looms.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'cyr' ? "Дастгоҳни ўчириш, ҳолатини алмаштириш ёки янги қўшиш" : "Dastgohni o'chirish, holatini almashtirish yoki yangi qo'shish"}
            </p>
          </div>

          <button
            onClick={() => setNewLoomModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>{lang === 'cyr' ? "+ Дастгоҳ Қўшиш" : "+ Dastgoh Qo'shish"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {looms.map(loom => {
            const isWorking = loom.status === 'ishlamoqda';
            return (
              <div
                key={loom.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isWorking
                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-rose-200 dark:border-rose-800/50 bg-rose-50/20 dark:bg-rose-950/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-amber-500" />
                        <span>{loom.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{loom.model}</div>
                    </div>

                    {/* Dastgohni o'chirish tugmasi */}
                    <button
                      onClick={() => handleDeleteLoom(loom)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title={lang === 'cyr' ? "Дастгоҳни ўчириш" : "Dastgohni o'chirish"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Holat tugmasi (Ishlamoqda / Ta'mirlashda) */}
                  <div className="mb-2">
                    <button
                      onClick={() => handleToggleLoomStatus(loom)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                        isWorking
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                      title="Holatni almashtirish uchun bosing"
                    >
                      {isWorking
                        ? (lang === 'cyr' ? "● Ишламоқда" : "● Ishlamoqda")
                        : (lang === 'cyr' ? "■ Таъмирлашда" : "■ Ta'mirlashda")}
                    </button>
                  </div>

                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">
                    {loc(loom.fabricName)}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{loom.operator}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-slate-400" />
                      <span>{loom.rpm} RPM ({loom.efficiency || 92}%)</span>
                    </div>
                    <div>
                      {lang === 'cyr' ? "Бугун:" : "Bugun:"} <strong className="text-amber-600 dark:text-amber-400 font-black">{formatKg(loom.todayKg, lang)}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenProduce(loom)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'cyr' ? "Рулон Қабул Қилиш" : "Rulon Qabul Qilish"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. TALAB: TO'QUVGA BERILGAN BUYURTMALAR & TOPSHIRIQLAR */}
      {/* ======================================================== */}
      {(() => {
        const totalOrdersCount = weavingOrders.length;
        const newOrdersCount = weavingOrders.filter(o => o.status === 'yangi').length;
        const inProgressOrdersCount = weavingOrders.filter(o => o.status === 'toqilmoqda').length;
        const completedOrdersCount = weavingOrders.filter(o => o.status === 'bajarildi').length;
        const totalOrderedKg = weavingOrders.reduce((sum, o) => sum + (Number(o.orderedKg) || 0), 0);

        const filteredWeavingOrders = weavingOrders.filter(ord => {
          if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) return false;
          if (orderSearchQuery.trim()) {
            const q = orderSearchQuery.toLowerCase();
            const matchCustomer = ord.customerName?.toLowerCase().includes(q);
            const matchFabric = (loc(ord.fabricName) || '').toLowerCase().includes(q) || (ord.fabricCode || '').toLowerCase().includes(q);
            const matchOrderNum = (ord.orderNumber || '').toLowerCase().includes(q);
            if (!matchCustomer && !matchFabric && !matchOrderNum) return false;
          }
          return true;
        });

        const getDeadlineInfo = (deadlineStr) => {
          if (!deadlineStr) return null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const target = new Date(deadlineStr);
          target.setHours(0, 0, 0, 0);
          const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays;
        };

        return (
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-700/40">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span>{lang === 'cyr' ? "Тўқув Ишлаб Чиқариш Буюртмалари" : "To'quv Ishlab Chiqarish Buyurtmalari"}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                        {totalOrdersCount} {lang === 'cyr' ? "та буюртма" : "ta buyurtma"}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'cyr'
                        ? "Мато тури, буюртма вазни (кг / т), топшириш муддати ва расмий бланкани чоп этиш (print)"
                        : "Mato turi, buyurtma vazni (kg / t), topshirish muddati va rasmiy blankani chop etish (print)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto">
                <button
                  onClick={() => setNewOrderModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "+ Тўқувга Буюртма Бериш" : "+ To'quvga Buyurtma Berish"}</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                  {lang === 'cyr' ? "Жами Буюртма Ҳажми" : "Jami Buyurtma Hajmi"}
                </span>
                <div className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                  {formatKg(totalOrderedKg, lang)}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {(totalOrderedKg / 1000).toFixed(2)} t • ~{Math.round(totalOrderedKg / 25)} {lang === 'cyr' ? "рулон" : "rulon"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  {lang === 'cyr' ? "● Янги Қабул" : "● Yangi Qabul"}
                </span>
                <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {newOrdersCount} <span className="text-xs font-medium text-slate-400">{lang === 'cyr' ? "та" : "ta"}</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  {lang === 'cyr' ? "Навбатдаги буюртмалар" : "Navbatdagi buyurtmalar"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
                  {lang === 'cyr' ? "⚙️ Тўқилмоқда" : "⚙️ To'qilmoqda"}
                </span>
                <div className="text-base sm:text-lg font-black text-blue-950 dark:text-blue-200 mt-0.5">
                  {inProgressOrdersCount} <span className="text-xs font-medium text-slate-400">{lang === 'cyr' ? "та" : "ta"}</span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  {lang === 'cyr' ? "Дастгоҳларда ишланяпти" : "Dastgohlarda ishlanyapti"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                  {lang === 'cyr' ? "✓ Бажарилди" : "✓ Bajarildi"}
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200 mt-0.5">
                  {completedOrdersCount} <span className="text-xs font-medium text-slate-400">{lang === 'cyr' ? "та" : "ta"}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {lang === 'cyr' ? "Тайёр бўлган буюртмалар" : "Tayyor bo'lgan buyurtmalar"}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { key: 'all', label: lang === 'cyr' ? "Барчаси" : "Barchasi", count: totalOrdersCount },
                  { key: 'yangi', label: lang === 'cyr' ? "Янги" : "Yangi", count: newOrdersCount, color: 'amber' },
                  { key: 'toqilmoqda', label: lang === 'cyr' ? "Тўқилмоқда" : "To'qilmoqda", count: inProgressOrdersCount, color: 'blue' },
                  { key: 'bajarildi', label: lang === 'cyr' ? "Бажарилди" : "Bajarildi", count: completedOrdersCount, color: 'emerald' }
                ].map(tab => {
                  const isActive = orderStatusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setOrderStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab.label} <span className="opacity-75 text-[10px]">({tab.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder={lang === 'cyr' ? "Буюртмачи ёки мато бўйича қидириш..." : "Buyurtmachi yoki mato bo'yicha qidirish..."}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Buyurtmalar Jadvali */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3.5">{lang === 'cyr' ? "Буюртма № / Сана" : "Buyurtma № / Sana"}</th>
                    <th className="py-2.5 px-3.5">{lang === 'cyr' ? "Буюртмачи" : "Buyurtmachi"}</th>
                    <th className="py-2.5 px-3.5">{lang === 'cyr' ? "Мато Тури & Параметрлари" : "Mato Turi & Parametrlari"}</th>
                    <th className="py-2.5 px-3.5 text-right">{lang === 'cyr' ? "Буюртма Ҳажми" : "Buyurtma Hajmi"}</th>
                    <th className="py-2.5 px-3.5 text-center">{lang === 'cyr' ? "Топшириш Муддати" : "Topshirish Muddati"}</th>
                    <th className="py-2.5 px-3.5">{lang === 'cyr' ? "Дастгоҳ & Уста" : "Dastgoh & Usta"}</th>
                    <th className="py-2.5 px-3.5 text-center">{lang === 'cyr' ? "Ҳолати" : "Holati"}</th>
                    <th className="py-2.5 px-3.5 text-right">{lang === 'cyr' ? "Амаллар" : "Amallar"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium bg-white dark:bg-slate-900/40">
                  {filteredWeavingOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                          <p className="font-bold">
                            {orderSearchQuery || orderStatusFilter !== 'all'
                              ? (lang === 'cyr' ? "Қидирув бўйича буюртма топилмади" : "Qidiruv bo'yicha buyurtma topilmadi")
                              : (lang === 'cyr' ? "Ҳозирча фаол буюртмалар йўқ" : "Hozircha faol buyurtmalar yo'q")}
                          </p>
                          <button
                            onClick={() => setNewOrderModalOpen(true)}
                            className="mt-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-all"
                          >
                            {lang === 'cyr' ? "+ Биринчи буюртмани бериш" : "+ Birinchi buyurtmani berish"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWeavingOrders.map((ord) => {
                      const estRolls = Math.round((ord.orderedKg || 0) / 25);
                      const isDone = ord.status === 'bajarildi';
                      const isInProgress = ord.status === 'toqilmoqda';
                      const isNew = ord.status === 'yangi';
                      const diffDays = getDeadlineInfo(ord.deadline);

                      return (
                        <tr key={ord.id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Buyurtma № */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{ord.orderNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {formatDate(ord.dispatchDate || ord.createdAt || new Date().toISOString(), lang)}
                            </div>
                          </td>

                          {/* Buyurtmachi */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{ord.customerName}</span>
                            </div>
                          </td>

                          {/* Mato Turi & Parametrlari */}
                          <td className="py-3 px-3.5">
                            <div className="font-black text-slate-900 dark:text-slate-100">
                              {loc(ord.fabricName)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {ord.widthCm} sm • {ord.densityGsm} g/m² • {ord.yarnCount || 'Ne 30/1'}
                            </div>
                          </td>

                          {/* Buyurtma Hajmi */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="font-black text-amber-600 dark:text-amber-400 text-xs">
                              {formatKg(ord.orderedKg, lang)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              {(ord.orderedKg / 1000).toFixed(2)} t • ~{estRolls} {lang === 'cyr' ? "рулон" : "rulon"}
                            </div>
                          </td>

                          {/* Topshirish Muddati */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{ord.deadline}</span>
                              </span>
                              {diffDays !== null && !isDone && (
                                <span className={`text-[10px] font-bold mt-0.5 ${
                                  diffDays < 0
                                    ? 'text-rose-600 dark:text-rose-400 font-black'
                                    : diffDays <= 2
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-400'
                                }`}>
                                  {diffDays < 0
                                    ? (lang === 'cyr' ? `🚨 ${Math.abs(diffDays)} кун ўтди` : `🚨 ${Math.abs(diffDays)} kun o'tdi`)
                                    : diffDays === 0
                                    ? (lang === 'cyr' ? `⚠️ Бугун!` : `⚠️ Bugun!`)
                                    : (lang === 'cyr' ? `⏳ ${diffDays} кун қолди` : `⏳ ${diffDays} kun qoldi`)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Dastgoh & Usta */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {ord.loomName || "Dastgoh №1"}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{ord.operator || "Usta to'quvchi"}</span>
                            </div>
                          </td>

                          {/* Holati */}
                          <td className="py-3 px-3.5 text-center">
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✓ {lang === 'cyr' ? "Бажарилди" : "Bajarildi"}
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse-subtle">
                                ⚙️ {lang === 'cyr' ? "Тўқилмоқда" : "To'qilmoqda"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                ● {lang === 'cyr' ? "Янги қабул" : "Yangi qabul"}
                              </span>
                            )}
                          </td>

                          {/* Amallar */}
                          <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {/* Chop etish (Print) */}
                            <button
                              onClick={() => setPrintWeavingOrderData(ord)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="To'quv buyurtma blankasini chop etish (Print)"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>{lang === 'cyr' ? "Чоп этиш" : "Print"}</span>
                            </button>

                            {/* Holatni o'zgartirish */}
                            {isNew && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'toqilmoqda')}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 cursor-pointer transition-all"
                                title="To'qishni boshlash"
                              >
                                {lang === 'cyr' ? "Тўқиш" : "To'qish"}
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'bajarildi')}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-pointer transition-all"
                                title="Bajarildi deb belgilash"
                              >
                                {lang === 'cyr' ? "✓ Тугатиш" : "✓ Tugatish"}
                              </button>
                            )}

                            {/* O'chirish */}
                            <button
                              onClick={() => handleDeleteOrder(ord)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Buyurtmani o'chirish"
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
        );
      })()}

      {/* ======================================================== */}
      {/* 6. MODAL: Yangi Dastgoh Qo'shish */}
      {/* ======================================================== */}
      {newLoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Янги Тўқув Дастгоҳини Қўшиш" : "Yangi To'quv Dastgohini Qo'shish"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'cyr' ? "Дастгоҳ модели, тезлиги ва оператори" : "Dastgoh modeli, tezligi va operatori"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewLoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLoomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Дастгоҳ Номи (Коди)" : "Dastgoh Nomi (Kodi)"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Picanol OmniPlus-5"
                  value={loomForm.name}
                  onChange={(e) => setLoomForm({ ...loomForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Модели / Ишчи Кенглиги" : "Modeli / Ishchi Kengligi"}
                </label>
                <input
                  type="text"
                  placeholder="Picanol 220cm Airjet"
                  value={loomForm.model}
                  onChange={(e) => setLoomForm({ ...loomForm, model: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Масъул Оператор" : "Mas'ul Operator"}
                </label>
                <input
                  type="text"
                  placeholder="Rustam Karimov"
                  value={loomForm.operator}
                  onChange={(e) => setLoomForm({ ...loomForm, operator: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Тезлиги (RPM)" : "Tezligi (RPM)"}
                  </label>
                  <input
                    type="number"
                    placeholder="650"
                    value={loomForm.rpm}
                    onChange={(e) => setLoomForm({ ...loomForm, rpm: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Ҳолати" : "Holati"}
                  </label>
                  <select
                    value={loomForm.status}
                    onChange={(e) => setLoomForm({ ...loomForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ishlamoqda">{lang === 'cyr' ? "Ишламоқда" : "Ishlamoqda"}</option>
                    <option value="tamirlashda">{lang === 'cyr' ? "Таъмирлашда" : "Ta'mirlashda"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Тўқилаётган Мато Тури" : "To'qilayotgan Mato Turi"}
                </label>
                <select
                  value={loomForm.currentFabricId}
                  onChange={(e) => setLoomForm({ ...loomForm, currentFabricId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Tanlang --</option>
                  {fabrics.map(f => (
                    <option key={f.id} value={f.id}>{loc(f.name)} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewLoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{lang === 'cyr' ? "Сақлаш" : "Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: Dastgohdan Rulon Qabul Qilish */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Дастгоҳдан Хом Мато Рулонини Қабул Қилиш" : "Dastgohdan Xom Mato Rulonini Qabul Qilish"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'cyr' ? "Оғирликни (КГ) киритинг ва QR кодли ёрлиқ олинг" : "Og'irlikni (KG) kiriting va QR kodli yorliq oling"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProduceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Тўқилган Хом Мато Тури" : "To'qilgan Xom Mato Turi"} *
                  </label>
                  <select
                    value={formData.fabricId}
                    onChange={(e) => setFormData({ ...formData, fabricId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- {lang === 'cyr' ? "Матони танланг" : "Matoni tanlang"} --</option>
                    {fabrics.map(f => (
                      <option key={f.id} value={f.id}>
                        {loc(f.name)} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Дастгоҳ" : "Dastgoh"}
                  </label>
                  <select
                    value={formData.loomId}
                    onChange={(e) => setFormData({ ...formData, loomId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {looms.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.model})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Ип Партияси (Lot)" : "Ip Partiyasi (Lot)"}
                  </label>
                  <input
                    type="text"
                    value={formData.yarnLot}
                    onChange={(e) => setFormData({ ...formData, yarnLot: e.target.value })}
                    placeholder="LOT-Paxta-30/1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Брутто Оғирлик (кг)" : "Brutto Og'irlik (kg)"} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    required
                    placeholder="25.0"
                    className="w-full px-3 py-2 text-sm font-black rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    {lang === 'cyr' ? "💡 1 рулоннинг оғирлиги 20 кг дан 30 кг гача бўлади" : "💡 1 rulonning og'irligi 20 kg dan 30 kg gacha bo'ladi"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Тара (Шпуля) кг" : "Tara (Shpulya) kg"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tareKg}
                    onChange={(e) => setFormData({ ...formData, tareKg: e.target.value })}
                    placeholder="0.5"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Тўқувчи Уста" : "To'quvchi Usta"}
                  </label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    placeholder="Rustam Karimov"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Сифат Нави" : "Sifat Navi"}
                  </label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="1-nav">{lang === 'cyr' ? "1-нав (Олий)" : "1-nav (Oliy)"}</option>
                    <option value="2-nav">{lang === 'cyr' ? "2-нав (Нуқсонли)" : "2-nav (Nuqsonli)"}</option>
                    <option value="3-nav">{lang === 'cyr' ? "3-нав (Брак)" : "3-nav (Brak)"}</option>
                  </select>
                </div>
              </div>

              {Number(formData.weightKg) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-bold">
                    {lang === 'cyr' ? "Соф Нетто Оғирлик:" : "Sof Netto Og'irlik:"}
                  </span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200">
                    {formatKg(Math.max(0.1, Number(formData.weightKg) - Number(formData.tareKg || 0.5)), lang)}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "Рулонни Кирим Қилиш & QR Код" : "Rulonni Kirim Qilish & QR Kod"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: To'quvga Yangi Buyurtma Berish */}
      {/* ======================================================== */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-700/40 shadow-xs">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {lang === 'cyr' ? "Тўқувга Янги Буюртма Бериш" : "To'quvga Yangi Buyurtma Berish"}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50">
                      {lang === 'cyr' ? "Ишлаб чиқариш наряди" : "Ishlab chiqarish naryadi"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'cyr'
                      ? "Мато тури, вазн (кг/тонна), топшириш муддати ва наряд бланкасини чоп этиш"
                      : "Mato turi, vazn (kg/tonna), topshirish muddati va naryad blankasini chop etish"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateWeavingOrder} className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* ----------------- LEFT COLUMN: Mato & Buyurtma ----------------- */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {lang === 'cyr' ? "Буюртмачи & Мато Параметрлари" : "Buyurtmachi & Mato Parametrlari"}
                      </h4>
                    </div>

                    {/* Buyurtmachi nomi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'cyr' ? "Буюртмачи (Мижоз / Ташкилот номи)" : "Buyurtmachi (Mijoz / Korxona nomi)"} *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={newOrderForm.customerName}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                          placeholder="Masalan: Samarkand Apparel MCHJ"
                          className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {/* Mato turi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'cyr' ? "Қандай Мато Тўқилади (Мато тури)" : "Qanday Mato To'qiladi (Mato turi)"} *
                      </label>
                      <select
                        value={newOrderForm.fabricId}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, fabricId: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- {lang === 'cyr' ? "Матони танланг" : "Matoni tanlang"} --</option>
                        {fabrics.map(f => (
                          <option key={f.id} value={f.id}>
                            {loc(f.name)} ({f.code}) • {f.densityGsm} g/m² • {f.widthCm} sm
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Buyurtma Vazni KG + Quick buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'cyr' ? "Буюртма Вазни (КГ)" : "Buyurtma Vazni (KG)"} *
                        </label>
                        <div className="flex items-center gap-1">
                          {[500, 1000, 2500, 5000].map(addKg => (
                            <button
                              key={addKg}
                              type="button"
                              onClick={() => {
                                const current = Number(newOrderForm.orderedKg) || 0;
                                setNewOrderForm(prev => ({ ...prev, orderedKg: String(current + addKg) }));
                              }}
                              className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 cursor-pointer transition-all active:scale-95"
                            >
                              +{addKg >= 1000 ? `${addKg / 1000}t` : `${addKg}kg`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          required
                          min="1"
                          value={newOrderForm.orderedKg}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, orderedKg: e.target.value })}
                          placeholder="3500"
                          className="w-full px-3 py-2 text-sm font-black rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-black text-amber-600 dark:text-amber-400">
                          KG
                        </span>
                      </div>
                    </div>

                    {/* Real-time live calculator card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-slate-800/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-amber-500" />
                          {lang === 'cyr' ? "Ҳисобланган Ҳажм:" : "Hisoblangan Hajm:"}
                        </span>
                        <span className="text-sm font-black text-amber-950 dark:text-amber-200">
                          {formatKg(newOrderForm.orderedKg || 0, lang)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-amber-200/50 dark:border-amber-800/50">
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
                          <span className="text-[10px] text-slate-500 block font-semibold">{lang === 'cyr' ? "Тоннада:" : "Tonnada:"}</span>
                          <span className="font-black text-slate-800 dark:text-slate-100 text-xs">
                            {((Number(newOrderForm.orderedKg) || 0) / 1000).toFixed(3)} {lang === 'cyr' ? "тонна" : "tonna"}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
                          <span className="text-[10px] text-slate-500 block font-semibold">{lang === 'cyr' ? "Тахминий рулонлар:" : "Taxminiy rulonlar:"}</span>
                          <span className="font-black text-amber-700 dark:text-amber-300 text-xs">
                            ~{Math.round((Number(newOrderForm.orderedKg) || 0) / 25)} {lang === 'cyr' ? "та рулон (~25kg)" : "ta rulon (~25kg)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ----------------- RIGHT COLUMN: Muddat & Ishlab Chiqarish ----------------- */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {lang === 'cyr' ? "Муддат, Дастгоҳ & Масъуллар" : "Muddat, Dastgoh & Mas'ullar"}
                      </h4>
                    </div>

                    {/* Topshirish Muddati (Deadline) */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>{lang === 'cyr' ? "Топшириш Муддати" : "Topshirish Muddati"} *</span>
                        </label>
                        {/* Countdown badge */}
                        {(() => {
                          if (!newOrderForm.deadline) return null;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const target = new Date(newOrderForm.deadline);
                          target.setHours(0, 0, 0, 0);
                          const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              diffDays < 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : diffDays <= 2
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              {diffDays < 0
                                ? `${Math.abs(diffDays)} kun kechikmoqda`
                                : diffDays === 0
                                ? 'Bugun!'
                                : `⏳ ${diffDays} kun qoldi`}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Quick preset buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {[3, 5, 7, 10, 14, 21, 30].map(days => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + days);
                              setNewOrderForm(prev => ({ ...prev, deadline: d.toISOString().split('T')[0] }));
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 cursor-pointer shadow-2xs transition-all active:scale-95"
                          >
                            +{days} {lang === 'cyr' ? "к" : "k"}
                          </button>
                        ))}
                      </div>

                      <input
                        type="date"
                        required
                        value={newOrderForm.deadline}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, deadline: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-black rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Dastgoh & Usta (2-col grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'cyr' ? "Бириктирилган Дастгоҳ" : "Biriktirilgan Dastgoh"}
                        </label>
                        <select
                          value={newOrderForm.loomId}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, loomId: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="">-- {lang === 'cyr' ? "Дастгоҳни танланг" : "Dastgohni tanlang"} --</option>
                          {looms.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.model})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'cyr' ? "Масъул Тўқувчи Уста" : "Mas'ul To'quvchi Usta"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newOrderForm.operator}
                            onChange={(e) => setNewOrderForm({ ...newOrderForm, operator: e.target.value })}
                            placeholder="Rustam Karimov"
                            className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>
                    </div>

                    {/* Ip partiyasi & Sifat navi (2-col grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'cyr' ? "Ип Партияси (Lot)" : "Ip Partiyasi (Lot)"}
                        </label>
                        <input
                          type="text"
                          value={newOrderForm.yarnLot}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, yarnLot: e.target.value })}
                          placeholder="LOT-Paxta-30/1"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'cyr' ? "Сифат Нави" : "Sifat Navi"}
                        </label>
                        <select
                          value={newOrderForm.qualityGrade || '1-nav'}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, qualityGrade: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="1-nav">1-nav (Oliy sifat)</option>
                          <option value="2-nav">2-nav</option>
                          <option value="eksport">Eksport standart</option>
                        </select>
                      </div>
                    </div>

                    {/* Izoh */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'cyr' ? "Қўшимча Кўрсатмалар / Изоҳ" : "Qo'shimcha Ko'rsatmalar / Izoh"}
                      </label>
                      <textarea
                        rows={2}
                        value={newOrderForm.notes}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                        placeholder="Masalan: 1-nav sifat talabi, chetlari tekis o'ralishi shart..."
                        className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span>
                    {newOrderForm.customerName ? <strong>{newOrderForm.customerName}</strong> : "Buyurtmachi"} • {formatKg(newOrderForm.orderedKg || 0, lang)}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setNewOrderModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'cyr' ? "Буюртмани Расмийлаштириш & Чоп Этиш" : "Buyurtmani Rasmiylashtirish & Chop Etish"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
