import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatUsd, formatUzs, formatDate, getDyeingStatusBadge } from '../utils/formatters';
import {
  Droplets,
  PlusCircle,
  CheckCircle2,
  Clock,
  QrCode,
  ArrowRight,
  TrendingDown,
  Building,
  RefreshCw,
  AlertTriangle,
  Palette,
  Trash2,
  Search,
  Truck,
  Check,
  Phone,
  MapPin,
  User,
  DollarSign,
  Tag,
  Sparkles,
  Printer,
  X
} from 'lucide-react';
import { PANTONE_PALETTE, getPantoneHex, getPantoneName } from '../utils/pantonePalette';

export default function DyeingProcess() {
  const { lang, loc, usdRate, setQrModalRoll, notify, refreshSignal, triggerRefresh, settings, setPrintDyeingOrderData } = useApp();

  const [dyeingOrders, setDyeingOrders] = useState([]);
  const [dyehouses, setDyehouses] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [rawRolls, setRawRolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter va qidiruv
  const [activeTab, setActiveTab] = useState('all'); // all, tayyor, boyalmoqda, yuborildi, qabul_qilindi
  const [searchQuery, setSearchQuery] = useState('');

  // Modallar
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [receiveModalOrder, setReceiveModalOrder] = useState(null);
  const [dyehouseModalOpen, setDyehouseModalOpen] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  // Yangi bo'yoqxona qo'shish formasi
  const [newDyehouse, setNewDyehouse] = useState({
    name: '',
    phone: '',
    address: '',
    contactPerson: '',
    standardPricePerKgUsd: '0.85'
  });

  // Yuborish forma holati
  const [dispatchForm, setDispatchForm] = useState({
    dyehouseName: "Andijon Tekstil Bo'yoqxona",
    fabricId: '',
    selectedRollIds: [],
    sentKg: '',
    colorName: 'Qora (Jet Black)',
    pantoneCode: 'TCX-19-4008',
    colorHex: '#101820',
    pricePerKgUsd: '0.85',
    responsiblePerson: 'Botir Rahimov',
    expectedReturnDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    notes: ''
  });

  // Qabul qilish forma holati
  const [receiveForm, setReceiveForm] = useState({
    receivedKg: '',
    numberOfRolls: '2',
    qualityGrade: '1-nav',
    sellingPriceUsd: '5.60',
    location: "Bo'yalgan Matolar Ombori (B-Sektor)",
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dyeRes, dyehouseRes, fabRes, rollRes] = await Promise.all([
        api.get('/dyeing'),
        api.get('/dyeing/dyehouses').catch(() => ({ success: false, data: [] })),
        api.get('/fabrics'),
        api.get('/rolls?fabricType=xom&status=in_stock')
      ]);

      if (dyeRes.success) setDyeingOrders(dyeRes.data || []);
      if (dyehouseRes.success && dyehouseRes.data) {
        setDyehouses(dyehouseRes.data);
      }
      if (fabRes.success) {
        setFabrics(fabRes.data || []);
        if (fabRes.data && fabRes.data.length > 0 && !dispatchForm.fabricId) {
          setDispatchForm(prev => ({ ...prev, fabricId: fabRes.data[0].id }));
        }
      }
      if (rollRes.success) setRawRolls(rollRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  // Bo'yoqxona tanlanganda uning standart narxini avtomatik to'ldirish
  const handleSelectDyehouseInDispatch = (dhName) => {
    const found = dyehouses.find(d => d.name === dhName);
    setDispatchForm(prev => ({
      ...prev,
      dyehouseName: dhName,
      pricePerKgUsd: found ? String(found.standardPricePerKgUsd || 0.85) : prev.pricePerKgUsd
    }));
  };

  // Pantone rang tanlanganda formaga kiritish
  const handleSelectPantoneColor = (color) => {
    const colName = lang === 'ru' ? color.nameRu : lang === 'cyr' ? color.nameCyr : color.nameUz;
    setDispatchForm(prev => ({
      ...prev,
      colorName: colName,
      pantoneCode: color.pantone,
      colorHex: color.hex
    }));
    setShowColorPalette(false);
  };

  // Yangi bo'yoqxona qo'shish
  const handleAddDyehouseSubmit = async (e) => {
    e.preventDefault();
    if (!newDyehouse.name || !newDyehouse.name.trim()) {
      notify(
        lang === 'cyr' ? "Хатолик" : "Xatolik",
        lang === 'cyr' ? "Бўёқхона номи киритилиши шарт" : "Bo'yoqxona nomi kiritilishi shart",
        "error"
      );
      return;
    }

    try {
      const res = await api.post('/dyeing/dyehouses', newDyehouse);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Бўёқхона қўшилди!" : "Bo'yoqxona qo'shildi!",
          res.message || `${newDyehouse.name} муваффақиятли сақланди`,
          "success"
        );
        setNewDyehouse({
          name: '',
          phone: '',
          address: '',
          contactPerson: '',
          standardPricePerKgUsd: '0.85'
        });
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Bo'yoqxona qo'shishda xatolik yuz berdi", "error");
    }
  };

  // Bo'yoqxonani o'chirish
  const handleDeleteDyehouse = async (dh) => {
    const confirmMsg = lang === 'cyr'
      ? `"${dh.name}" бўёқхонасини рўйхатдан ўчиришни тасдиқлайсизми?`
      : `"${dh.name}" bo'yoqxonasini ro'yxatdan o'chirishni tasdiqlaysizmi?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/dyeing/dyehouses/${dh.id || dh.name}`);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Ўчирилди" : "O'chirildi",
          lang === 'cyr' ? "Бўёқхона муваффақиятли ўчирилди" : "Bo'yoqxona muvaffaqiyatli o'chirildi",
          "success"
        );
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message || "O'chirishda xatolik", "error");
    }
  };

  const handleToggleRoll = (rollId) => {
    setDispatchForm(prev => {
      const exists = prev.selectedRollIds.includes(rollId);
      const nextIds = exists
        ? prev.selectedRollIds.filter(id => id !== rollId)
        : [...prev.selectedRollIds, rollId];

      const totalK = rawRolls
        .filter(r => nextIds.includes(r.id))
        .reduce((sum, r) => sum + Number(r.currentKg || 0), 0);

      return {
        ...prev,
        selectedRollIds: nextIds,
        sentKg: totalK > 0 ? String(totalK.toFixed(2)) : ''
      };
    });
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchForm.fabricId || !dispatchForm.sentKg || Number(dispatchForm.sentKg) <= 0) {
      notify("Xatolik", "Mato va yuboriladigan og'irlikni (kg) to'g'ri kiriting", "error");
      return;
    }

    try {
      const res = await api.post('/dyeing/dispatch', dispatchForm);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Бўёқхонага юборилди!" : "Bo'yoqxonaga yuborildi!",
          lang === 'cyr' ? `Партия ${res.data.orderNumber} (${res.data.sentKg} кг)` : `Partiya ${res.data.orderNumber} (${res.data.sentKg} kg)`,
          'success'
        );
        setDispatchModalOpen(false);
        triggerRefresh();
        if (setPrintDyeingOrderData && res.data) {
          setPrintDyeingOrderData(res.data);
        }
      }
    } catch (err) {
      notify("Xatolik", err.message || "Yuborishda xatolik yuz berdi", "error");
    }
  };

  const handleOpenReceive = (order) => {
    setReceiveModalOrder(order);
    const estRolls = Math.max(1, Math.round(order.sentKg / 25));
    setReceiveForm({
      receivedKg: String((order.sentKg * 0.95).toFixed(2)), // Taxminiy 5% uvalka
      numberOfRolls: String(estRolls),
      qualityGrade: '1-nav',
      sellingPriceUsd: '5.60',
      location: "Bo'yalgan Matolar Ombori (B-Sektor)",
      notes: ''
    });
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveModalOrder || !receiveForm.receivedKg || Number(receiveForm.receivedKg) <= 0) {
      notify("Xatolik", "Qabul qilingan og'irlikni (kg) to'g'ri kiriting", "error");
      return;
    }

    try {
      const res = await api.post(`/dyeing/receive/${receiveModalOrder.id}`, receiveForm);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Бўёқхонадан қабул қилинди!" : "Bo'yoqxonadan qabul qilindi!",
          lang === 'cyr'
            ? `${res.data.receivedKg} кг қабул қилинди (Увалка: ${res.data.shrinkagePercentage}%)`
            : `${res.data.receivedKg} kg qabul qilindi (Uvalka: ${res.data.shrinkagePercentage}%)`,
          'success'
        );
        setReceiveModalOrder(null);
        triggerRefresh();
        if (res.createdRolls && res.createdRolls.length > 0) {
          setQrModalRoll(res.createdRolls[0]);
        }
      }
    } catch (err) {
      notify("Xatolik", err.message || "Qabul qilishda xatolik", "error");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/dyeing/${orderId}/status`, { status: newStatus });
      if (res.success) {
        notify(
          lang === 'cyr' ? "Ҳолат янгиланди" : "Holat yangilandi",
          `Partiya holati: ${newStatus}`,
          "success"
        );
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  // Statistika
  const readyForPickupOrders = dyeingOrders.filter(d => d.status === 'tayyor' || d.status === 'qaytdi');
  const readyForPickupKg = readyForPickupOrders.reduce((sum, d) => sum + Number(d.sentKg || 0), 0);

  const totalInDyeingKg = dyeingOrders
    .filter(d => d.status === 'yuborildi' || d.status === 'boyalmoqda' || d.status === 'tayyor')
    .reduce((sum, d) => sum + Number(d.sentKg || 0), 0);

  const completedOrders = dyeingOrders.filter(d => d.status === 'qabul_qilindi');
  const avgShrinkage = completedOrders.length > 0
    ? (completedOrders.reduce((sum, d) => sum + Number(d.shrinkagePercentage || 0), 0) / completedOrders.length).toFixed(2)
    : '5.10';

  const dyehousesList = dyehouses.length > 0
    ? dyehouses
    : (settings.dyehouses || [
        "Andijon Tekstil Bo'yoqxona",
        "Toshkent Global Dyeing",
        "Namangan Rangli Mato MCHJ",
        "Samarqand To'qima Bo'yash"
      ]).map((name, i) => ({ id: `DYE-00${i+1}`, name, standardPricePerKgUsd: 0.85 }));

  // Filtrlangan partiyalar
  const filteredOrders = dyeingOrders.filter(order => {
    if (activeTab === 'tayyor' && order.status !== 'tayyor' && order.status !== 'qaytdi') return false;
    if (activeTab === 'boyalmoqda' && order.status !== 'boyalmoqda') return false;
    if (activeTab === 'yuborildi' && order.status !== 'yuborildi') return false;
    if (activeTab === 'qabul_qilindi' && order.status !== 'qabul_qilindi') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber?.toLowerCase().includes(q);
      const matchDh = order.dyehouseName?.toLowerCase().includes(q);
      const matchFab = order.fabricName?.toLowerCase().includes(q);
      const matchColor = order.colorName?.toLowerCase().includes(q);
      const matchPantone = order.pantoneCode?.toLowerCase().includes(q);
      return matchNumber || matchDh || matchFab || matchColor || matchPantone;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Sarlavha va tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-purple-600" />
            <span>{lang === 'cyr' ? "Бўёқхона & Мато Бўяш Жараёни" : "Bo'yoqxona & Mato Bo'yash Jarayoni"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Ҳамкор бўёқхоналар, Pantone TCX ранглар палитраси, тайёр бўялган матоларни олиб келиш ва увалка ҳисоби."
              : "Hamkor bo'yoqxonalar, Pantone TCX ranglar palitrasi, tayyor bo'yalgan matolarni olib kelish va uvalka hisobi."}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Bo'yoqxonalar boshqaruvi tugmasi */}
          <button
            onClick={() => setDyehouseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 dark:bg-purple-950/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Building className="w-4 h-4" />
            <span>{lang === 'cyr' ? "🏢 Бўёқхоналар" : "🏢 Bo'yoqxonalar"} ({dyehousesList.length})</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setDispatchForm(prev => ({
                ...prev,
                expectedReturnDate: prev.expectedReturnDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
              }));
              setDispatchModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Бўёқхонага Юбориш (КГ)" : "+ Bo'yoqxonaga Yuborish (KG)"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Kartochkalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Olib kelishga tayyor (Yangi va muhim KPI!) */}
        <div
          onClick={() => setActiveTab('tayyor')}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-2 border-emerald-500/40 shadow-xs cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'cyr' ? "Олиб Келишга Тайёр!" : "Olib Kelishga Tayyor!"}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
              {readyForPickupOrders.length} {lang === 'cyr' ? "партия" : "partiya"}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatKg(readyForPickupKg, lang)}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{lang === 'cyr' ? "Бўялган, транспорт кутилмоқда" : "Bo'yalgan, transport kutilmoqda"}</span>
          </p>
        </div>

        {/* Hozirda Bo'yoqxonadagi jami mato */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Бўёқхонадаги Жами Вазн" : "Bo'yoqxonadagi Jami Vazn"}</span>
            <Droplets className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatKg(totalInDyeingKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'cyr' ? "Барча фаол бўёқхона партиялари" : "Barcha faol bo'yoqxona partiyalari"}
          </p>
        </div>

        {/* O'rtacha uvalka */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Ўртача Увалка (Йўқотиш)" : "O'rtacha Uvalka (Yo'qotish)"}</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {avgShrinkage} %
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'cyr' ? "Бўяшдан кейинги ўртача киришиш фоизи" : "Bo'yashdan keyingi o'rtacha kirishish foizi"}
          </p>
        </div>

        {/* Hamkor Bo'yoqxonalar */}
        <div
          onClick={() => setDyehouseModalOpen(true)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-purple-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Ҳамкор Бўёқхоналар" : "Hamkor Bo'yoqxonalar"}</span>
            <Building className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {dyehousesList.length} {lang === 'cyr' ? "та завод" : "ta zavod"}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-bold">
            {lang === 'cyr' ? "⚙️ Қўшиш ва бошқариш →" : "⚙️ Qo'shish va boshqarish →"}
          </p>
        </div>
      </div>

      {/* 3. Filtrlash va Qidiruv Tablari */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'cyr' ? "Барчаси" : "Barchasi"} ({dyeingOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('tayyor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tayyor'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{lang === 'cyr' ? "🚚 Олиб келишга тайёр" : "🚚 Olib kelishga tayyor"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700 text-white font-black">
              {readyForPickupOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boyalmoqda')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'boyalmoqda'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100'
            }`}
          >
            {lang === 'cyr' ? "⚙️ Бўялмоқда" : "⚙️ Bo'yalmoqda"} ({dyeingOrders.filter(d => d.status === 'boyalmoqda').length})
          </button>

          <button
            onClick={() => setActiveTab('yuborildi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'yuborildi'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            {lang === 'cyr' ? "📤 Юборилди" : "📤 Yuborildi"} ({dyeingOrders.filter(d => d.status === 'yuborildi').length})
          </button>

          <button
            onClick={() => setActiveTab('qabul_qilindi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qabul_qilindi'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'cyr' ? "✅ Қабул қилинган" : "✅ Qabul qilingan"} ({completedOrders.length})
          </button>
        </div>

        {/* Qidiruv qutisi */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'cyr' ? "Партия, бўёқхона, пантон..." : "Partiya, bo'yoqxona, panton..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* 4. Partiyalar Jadvali */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>{lang === 'cyr' ? "Бўёқхона Партиялари Рўйхати" : "Bo'yoqxona Partiyalari Ro'yxati"}</span>
            <span className="text-xs font-bold text-slate-500">({filteredOrders.length} ta)</span>
          </h3>
          {activeTab === 'tayyor' && (
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>{lang === 'cyr' ? "Жами тайёр:" : "Jami tayyor:"} {formatKg(readyForPickupKg, lang)}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">{lang === 'cyr' ? "Партия №" : "Partiya №"}</th>
                <th className="p-3">{lang === 'cyr' ? "Бўёқхона" : "Bo'yoqxona"}</th>
                <th className="p-3">{lang === 'cyr' ? "Мато & Ранг (Pantone TCX)" : "Mato & Rang (Pantone TCX)"}</th>
                <th className="p-3">{lang === 'cyr' ? "Юборилган (кг)" : "Yuborilgan (kg)"}</th>
                <th className="p-3 text-center">{lang === 'cyr' ? "Муддати" : "Muddati"}</th>
                <th className="p-3">{lang === 'cyr' ? "Қабул қилинган (кг)" : "Qabul qilingan (kg)"}</th>
                <th className="p-3">{lang === 'cyr' ? "Увалка %" : "Uvalka %"}</th>
                <th className="p-3">{lang === 'cyr' ? "Ҳолати" : "Holati"}</th>
                <th className="p-3 text-right">{lang === 'cyr' ? "Амаллар" : "Amallar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    {lang === 'cyr' ? "Партиялар топилмади" : "Partiyalar topilmadi"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusBadge = getDyeingStatusBadge(order.status, lang);
                  const isCompleted = order.status === 'qabul_qilindi';
                  const isReady = order.status === 'tayyor' || order.status === 'qaytdi';
                  const colorHex = order.colorHex || getPantoneHex(order.pantoneCode);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isReady
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 font-medium'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      {/* Partiya № va sana */}
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          {isReady && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                          <span>{order.orderNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {formatDate(order.dispatchDate, lang)}
                        </div>
                      </td>

                      {/* Bo'yoqxona nomi */}
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{order.dyehouseName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {order.responsiblePerson || "Bo'yoqxona Ustasi"}
                        </div>
                      </td>

                      {/* Mato va Rang (Pantone bilan) */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{loc(order.fabricName)}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {/* Rang vizual doirasi */}
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs border border-slate-300 dark:border-slate-600"
                            style={{ backgroundColor: colorHex }}
                            title={order.colorName}
                          />
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {order.colorName}
                          </span>
                          {order.pantoneCode && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
                              {order.pantoneCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Yuborilgan og'irlik */}
                      <td className="p-3 font-black text-slate-900 dark:text-white">
                        {formatKg(order.sentKg, lang)}
                        <div className="text-[10px] text-slate-400 font-medium">
                          {formatUsd(order.dyeingPricePerKgUsd || 0.85)}/kg
                        </div>
                      </td>

                      {/* Qaytarish / Topshirish Muddati (Deadline) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {order.expectedReturnDate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-purple-50 text-purple-900 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 shadow-2xs">
                            <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>{order.expectedReturnDate}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">~5 {lang === 'cyr' ? "кун" : "kun"}</span>
                        )}
                      </td>

                      {/* Qabul qilingan */}
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                        {order.receivedKg > 0 ? formatKg(order.receivedKg, lang) : (
                          isReady ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{formatKg(order.sentKg, lang)} {lang === 'cyr' ? "(тайёр)" : "(tayyor)"}</span>
                            </span>
                          ) : "-"
                        )}
                      </td>

                      {/* Uvalka % */}
                      <td className="p-3">
                        {order.shrinkagePercentage > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                            {order.shrinkagePercentage}% ({formatKg(order.shrinkageKg, lang)})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">~5% me'yor</span>
                        )}
                      </td>

                      {/* Holati */}
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight inline-flex items-center gap-1 ${statusBadge.className}`}>
                          {isReady && <Check className="w-3 h-3" />}
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* Amallar */}
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* Chop etish (Print) */}
                        <button
                          onClick={() => setPrintDyeingOrderData(order)}
                          className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] inline-flex items-center gap-1 transition-all shadow-2xs"
                          title="Bo'yoqxona buyurtma blankasini chop etish (Print)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{lang === 'cyr' ? "Чоп этиш" : "Print"}</span>
                        </button>

                        {/* 1. Yuborilgan bo'lsa -> Bo'yalmoqda ga o'tkazish */}
                        {order.status === 'yuborildi' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'boyalmoqda')}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] border border-blue-200"
                            title="Bo'yoq reaktoriga tushdi"
                          >
                            {lang === 'cyr' ? "⚙️ Бўялмоқда" : "⚙️ Bo'yalmoqda"}
                          </button>
                        )}

                        {/* 2. Bo'yalayotgan bo'lsa -> Tayyor (Olib kelishga tayyor) ga o'tkazish */}
                        {order.status === 'boyalmoqda' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'tayyor')}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] border border-purple-200"
                            title="Bo'yoqxonada bo'yab bo'lindi"
                          >
                            {lang === 'cyr' ? "✓ Тайёр бўлди" : "✓ Tayyor bo'ldi"}
                          </button>
                        )}

                        {/* 3. Tayyor (Olib kelishga tayyor) yoki Bo'yalmoqda bo'lsa -> Omborga Qabul Qilish */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleOpenReceive(order)}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs cursor-pointer inline-flex items-center gap-1 transition-all ${
                              isReady
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40 animate-pulse-subtle'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                            title="Omborga qabul qilish va QR kodli rulonlar generatsiya qilish"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{lang === 'cyr' ? "Қабул Қилиш" : "Qabul Qilish"}</span>
                          </button>
                        )}

                        {/* 4. Qabul qilingan bo'lsa -> Omborda statusi */}
                        {isCompleted && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'cyr' ? "Омборда" : "Omborda"}</span>
                          </span>
                        )}
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
      {/* 5. MODAL: Hamkor Bo'yoqxonalarni Boshqarish (Qo'shish / O'chirish) */}
      {/* ======================================================== */}
      {dyehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Ҳамкор Бўёқхоналар Бошқаруви" : "Hamkor Bo'yoqxonalar Boshqaruvi"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'cyr'
                      ? "Янги тўқима бўяш заводларини қўшиш, нарх ва манзилларни кўриш, кераксизларини ўчириш."
                      : "Yangi to'qima bo'yash zavodlarini qo'shish, narx va manzillarni ko'rish, keraksizlarini o'chirish."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDyehouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Yangi Bo'yoqxona Qo'shish Formasi */}
            <form onSubmit={handleAddDyehouseSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-300 tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "+ Янги Бўёқхона Қўшиш" : "+ Yangi Bo'yoqxona Qo'shish"}</span>
                </h4>
                <span className="text-[10px] text-slate-400">{lang === 'cyr' ? "* билан белгиланганлар мажбурий" : "* bilan belgilanganlar majburiy"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nomi */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Бўёқхона Номи" : "Bo'yoqxona Nomi"} *
                  </label>
                  <input
                    type="text"
                    value={newDyehouse.name}
                    onChange={(e) => setNewDyehouse({ ...newDyehouse, name: e.target.value })}
                    placeholder="Masalan: Farg'ona Color Tekstil"
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Телефон Рақами" : "Telefon Raqami"}
                  </label>
                  <input
                    type="text"
                    value={newDyehouse.phone}
                    onChange={(e) => setNewDyehouse({ ...newDyehouse, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Standart bo'yash narxi ($/kg) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Бўяш Нархи ($/кг)" : "Bo'yash Narxi ($/kg)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDyehouse.standardPricePerKgUsd}
                    onChange={(e) => setNewDyehouse({ ...newDyehouse, standardPricePerKgUsd: e.target.value })}
                    placeholder="0.85"
                    className="w-full px-3 py-2 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Mas'ul shaxs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Масъул Шахс (Уста)" : "Mas'ul Shaxs (Usta)"}
                  </label>
                  <input
                    type="text"
                    value={newDyehouse.contactPerson}
                    onChange={(e) => setNewDyehouse({ ...newDyehouse, contactPerson: e.target.value })}
                    placeholder="Akmal Usta"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Manzil */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Манзили / Шаҳар" : "Manzili / Shahar"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDyehouse.address}
                      onChange={(e) => setNewDyehouse({ ...newDyehouse, address: e.target.value })}
                      placeholder="Farg'ona sh., Sanoat zonasi 12-bino"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'cyr' ? "Қўшиш" : "Qo'shish"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Mavjud Bo'yoqxonalar Ro'yxati */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                {lang === 'cyr' ? "Рўйхатдаги Бўёқхоналар" : "Ro'yxatdagi Bo'yoqxonalar"} ({dyehousesList.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dyehousesList.map(dh => {
                  const activeCount = dyeingOrders.filter(o => o.dyehouseName === dh.name && o.status !== 'qabul_qilindi').length;

                  return (
                    <div
                      key={dh.id || dh.name}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-purple-600" />
                              <span>{dh.name}</span>
                            </h5>
                            {dh.contactPerson && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" />
                                <span>{dh.contactPerson}</span>
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteDyehouse(dh)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={lang === 'cyr' ? "Бўёқхонани ўчириш" : "Bo'yoqxonani o'chirish"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {dh.address && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{dh.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatUsd(dh.standardPricePerKgUsd || 0.85)} / kg</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          activeCount > 0
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {activeCount} {lang === 'cyr' ? "фаол партия" : "faol partiya"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDyehouseModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                {lang === 'cyr' ? "Ёпиш" : "Yopish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: Bo'yoqxonaga Yuborish (Pantone Tanlash Bilan) */}
      {/* ======================================================== */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Хом Матони Бўёқхонага Юбориш" : "Xom Matoni Bo'yoqxonaga Yuborish"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'cyr'
                      ? "Партия очинг, бўёқхона ва Pantone TCX рангни танланг"
                      : "Partiya oching, bo'yoqxona va Pantone TCX rangni tanlang"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bo'yoqxona korxonasi */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'cyr' ? "Бўёқхона Корхонаси" : "Bo'yoqxona Korxonasi"} *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setDispatchModalOpen(false); setDyehouseModalOpen(true); }}
                      className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                    >
                      {lang === 'cyr' ? "+ Бошқариш" : "+ Boshqarish"}
                    </button>
                  </div>
                  <select
                    value={dispatchForm.dyehouseName}
                    onChange={(e) => handleSelectDyehouseInDispatch(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {dyehousesList.map((d, idx) => (
                      <option key={d.id || idx} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Mato turi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Мато Тури" : "Mato Turi"} *
                  </label>
                  <select
                    value={dispatchForm.fabricId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, fabricId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {fabrics.map(f => (
                      <option key={f.id} value={f.id}>{loc(f.name)} ({f.code})</option>
                    ))}
                  </select>
                </div>

                {/* Rang Nomi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Бўяладиган Ранг Номи" : "Bo'yaladigan Rang Nomi"} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dispatchForm.colorName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, colorName: e.target.value })}
                      placeholder="Qora (Jet Black)"
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    {/* Live Rang ko'rinishi */}
                    <input
                      type="color"
                      value={dispatchForm.colorHex}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, colorHex: e.target.value })}
                      className="w-10 h-8 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                      title="Rangni qo'lda tanlash"
                    />
                  </div>
                </div>

                {/* Pantone Kodi */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'cyr' ? "Pantone TCX Коди" : "Pantone TCX Kodi"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowColorPalette(!showColorPalette)}
                      className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{showColorPalette ? "Yashirish" : "Palitrani ko'rish"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={dispatchForm.pantoneCode}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, pantoneCode: e.target.value })}
                    placeholder="TCX-19-4008"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Yuboriladigan og'irlik (kg) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Жами Юбориладиган Вазн (кг)" : "Jami Yuboriladigan Vazn (kg)"} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dispatchForm.sentKg}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, sentKg: e.target.value })}
                    required
                    placeholder="250.0"
                    className="w-full px-3 py-2 text-sm font-black rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/30 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Bo'yash xizmati narxi ($/kg) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Бўяш Хизмати Нархи ($/кг)" : "Bo'yash Xizmati Narxi ($/kg)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dispatchForm.pricePerKgUsd}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, pricePerKgUsd: e.target.value })}
                    placeholder="0.85"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Bo'yoqxonadan Qaytarish / Topshirish Muddati (Deadline) */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{lang === 'cyr' ? "Бўёқхонадан Қайтариш Муддати (Муддати)" : "Bo'yoqxonadan Qaytarish Muddati (Muddati)"} *</span>
                    </label>

                    {/* Tezkor kun tugmalari */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1 font-semibold">{lang === 'cyr' ? "Муддат:" : "Muddat:"}</span>
                      {[3, 5, 7, 10, 14, 20].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + days);
                            setDispatchForm(prev => ({ ...prev, expectedReturnDate: d.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 cursor-pointer shadow-2xs transition-all active:scale-95"
                        >
                          +{days} {lang === 'cyr' ? "кун" : "kun"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={dispatchForm.expectedReturnDate}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, expectedReturnDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-black rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500"
                    />

                    <div className="flex items-center text-[11px] text-purple-800 dark:text-purple-200 font-semibold px-2.5 py-1.5 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-purple-100 dark:border-purple-900">
                      <span>
                        {dispatchForm.expectedReturnDate ? (
                          <>
                            ⏳ <strong>{dispatchForm.expectedReturnDate}</strong> {lang === 'cyr' ? "санасигача бўяб топширилиши шарт" : "sanasigacha bo'yab topshirilishi shart"}
                          </>
                        ) : (
                          lang === 'cyr' ? "Муддат санасини киритинг" : "Muddat sanasini kiriting"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standart Pantone Ranglar Palitrasi (1-click tanlash) */}
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-900 dark:text-purple-300">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>{lang === 'cyr' ? "Pantone FHI TCX Стандарт Ранглар" : "Pantone FHI TCX Standart Ranglar"} (1-click):</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dispatchForm.pantoneCode}
                  </span>
                </div>

                {/* Rang doirachalari gridi */}
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {PANTONE_PALETTE.map((item, idx) => {
                    const isSelected = dispatchForm.pantoneCode === item.pantone;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPantoneColor(item)}
                        className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-purple-600 ring-2 ring-purple-400 shadow-xs'
                            : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                        title={`${item.nameUz} (${item.pantone})`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shadow-xs border border-slate-300 dark:border-slate-600 flex items-center justify-center text-white text-[9px]"
                          style={{ backgroundColor: item.hex }}
                        >
                          {isSelected && <Check className="w-3 h-3 drop-shadow-sm" />}
                        </span>
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate w-full text-center">
                          {item.code.replace('CLR-', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ombordagi xom mato rulonlarini tanlash */}
              {rawRolls.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'cyr' ? "Омбордаги Хом Мато Рулонларидан Танлаш (Ихтиёрий)" : "Ombordagi Xom Mato Rulonlaridan Tanlash (Ixtiyoriy)"}:
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/40">
                    {rawRolls.map(r => {
                      const checked = dispatchForm.selectedRollIds.includes(r.id);
                      return (
                        <label key={r.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleRoll(r.id)}
                              className="rounded-sm text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-bold text-slate-900 dark:text-white">{r.id}</span>
                            <span className="text-slate-500">({loc(r.fabricName)})</span>
                          </div>
                          <span className="font-black text-purple-600 dark:text-purple-400">{formatKg(r.currentKg, lang)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Droplets className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "Бўёқхонага Жўнатиш" : "Bo'yoqxonaga Jo'natish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: Bo'yoqxonadan Qabul Qilish (Uvalka & QR Rulonlar) */}
      {/* ======================================================== */}
      {receiveModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Бўёқхонадан Қабул Қилиш & Омборга Кирим" : "Bo'yoqxonadan Qabul Qilish & Omborga Kirim"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {receiveModalOrder.orderNumber} ({receiveModalOrder.dyehouseName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiveModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'cyr' ? "Юборилган Хом Мато:" : "Yuborilgan Xom Mato:"}</span>
                  <strong className="text-slate-900 dark:text-white">{formatKg(receiveModalOrder.sentKg, lang)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{lang === 'cyr' ? "Ранг / Pantone:" : "Rang / Pantone:"}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300"
                      style={{ backgroundColor: receiveModalOrder.colorHex || getPantoneHex(receiveModalOrder.pantoneCode) }}
                    />
                    <strong className="text-purple-700 dark:text-purple-300">
                      {receiveModalOrder.colorName} ({receiveModalOrder.pantoneCode})
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Qabul qilingan og'irlik */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Қабул Қилинган Вазн (кг)" : "Qabul Qilingan Vazn (kg)"} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={receiveForm.receivedKg}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivedKg: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm font-black rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Rulonlar soni */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Нечта Рулонга Бўлиш (дона)" : "Nechta Rulonga Bo'lish (dona)"} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receiveForm.numberOfRolls}
                    onChange={(e) => setReceiveForm({ ...receiveForm, numberOfRolls: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Sotuv narxi ($/kg) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Сотув Нархи ($/кг)" : "Sotuv Narxi ($/kg)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={receiveForm.sellingPriceUsd}
                    onChange={(e) => setReceiveForm({ ...receiveForm, sellingPriceUsd: e.target.value })}
                    placeholder="5.60"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Sifat navi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Сифат Нави" : "Sifat Navi"}
                  </label>
                  <select
                    value={receiveForm.qualityGrade}
                    onChange={(e) => setReceiveForm({ ...receiveForm, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="1-nav">{lang === 'cyr' ? "1-нав (Олий)" : "1-nav (Oliy)"}</option>
                    <option value="2-nav">{lang === 'cyr' ? "2-нав (Нуқсонли)" : "2-nav (Nuqsonli)"}</option>
                  </select>
                </div>
              </div>

              {/* Uvalka hisobi jonli preview */}
              {Number(receiveForm.receivedKg) > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-800 dark:text-amber-300">
                      {lang === 'cyr' ? "Увалка (Йўқотиш):" : "Uvalka (Yo'qotish):"}
                    </span>
                    <span className="text-rose-600 font-black">
                      {Number((receiveModalOrder.sentKg - Number(receiveForm.receivedKg)).toFixed(2))} kg (
                      {Number((((receiveModalOrder.sentKg - Number(receiveForm.receivedKg)) / receiveModalOrder.sentKg) * 100).toFixed(2))}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'cyr'
                      ? "Тайёр бўялган рулонлар генерация қилиниб, омборга QR код билан кирим қилинади."
                      : "Tayyor bo'yalgan rulonlar generatsiya qilinib, omborga QR kod bilan kirim qilinadi."}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceiveModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "Қабул Қилиш & Рулонларга QR Код" : "Qabul Qilish & Rulonlarga QR Kod"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
