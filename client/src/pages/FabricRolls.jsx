import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatKg,
  formatWeightTonnes,
  formatUsd,
  formatUzs,
  formatDualCurrency,
  formatDate,
  getRollStatusBadge,
  getQualityGradeBadge
} from '../utils/formatters';
import {
  PackageCheck,
  PlusCircle,
  QrCode,
  Scissors,
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Sparkles,
  Droplets,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function FabricRolls({ onOpenNewRoll }) {
  const {
    lang,
    loc,
    usdRate,
    setQrModalRoll,
    setCutModalRoll,
    setDefectModalRoll,
    notify,
    refreshSignal,
    triggerRefresh
  } = useApp();

  const [rolls, setRolls] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFabricType, setSelectedFabricType] = useState('all'); // 'all', 'xom', 'boyalgan', 'dyeing'
  const [selectedQualityGrade, setSelectedQualityGrade] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rollsRes, fabRes] = await Promise.all([
        api.get('/rolls'),
        api.get('/fabrics')
      ]);

      if (rollsRes.success) setRolls(rollsRes.data || []);
      if (fabRes.success) setFabrics(fabRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const handleDeleteRoll = async (rollId) => {
    if (!window.confirm(lang === 'cyr' ? `Haqiqatan ham ${rollId} rulonini o'chirmoqchimisiz?` : `Haqiqatan ham ${rollId} rulonini o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await api.delete(`/rolls/${rollId}`);
      if (res.success) {
        notify("Rulon o'chirildi", `${rollId} bazadan olib tashlandi`, 'success');
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  // Filtrlar
  const filteredRolls = rolls.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.fabricName && r.fabricName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.colorName && r.colorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.batchNumber && r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.loomNumber && r.loomNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedFabricType === 'all'
        ? true
        : selectedFabricType === 'dyeing'
        ? r.status === 'dyeing'
        : r.fabricType === selectedFabricType;

    const matchesGrade = selectedQualityGrade === 'all' || r.qualityGrade === selectedQualityGrade;

    return matchesSearch && matchesType && matchesGrade;
  });

  // KPI hisoblash
  const activeRolls = rolls.filter(r => r.status === 'in_stock' || r.status === 'partially_sold');
  const totalStockKg = activeRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const avgRollWeightKg = activeRolls.length ? (totalStockKg / activeRolls.length).toFixed(1) : '25.0';
  const rawStockKg = activeRolls.filter(r => r.fabricType === 'xom').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const dyedStockKg = activeRolls.filter(r => r.fabricType === 'boyalgan').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const brakStockKg = activeRolls.filter(r => r.qualityGrade === '3-nav' || r.qualityGrade === 'brak').reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const totalValueUsd = activeRolls.reduce((sum, r) => sum + (Number(r.currentKg || 0) * Number(r.sellingPricePerKgUsd || 5)), 0);

  // Sahifalash (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFabricType, selectedQualityGrade]);

  const totalPages = Math.ceil(filteredRolls.length / pageSize) || 1;
  const paginatedRolls = filteredRolls.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Sarlavha va tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-indigo-500" />
            <span>{lang === 'cyr' ? "Матолар Омбори & Рулонлар Назорати (КГ)" : lang === 'ru' ? "Склад Тканей & Рулонов (КГ)" : "Matolar Ombori & Rulonlar Nazorati (KG)"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Омбордаги барча хом ва бўялган мато рулонлари (100+ тонна), оғирлик (кг), QR кодлар ва брак сабаблари."
              : lang === 'ru'
              ? "Все рулоны сурового и крашеного полотна (более 100 тонн), вес в КГ, QR коды и учет причин брака."
              : "Ombordagi barcha xom va bo'yalgan mato rulonlari (100+ tonna), og'irlik (kg), QR kodlar va brak sabablari."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewRoll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Янги Рулон Кирим Қилиш (КГ)" : lang === 'ru' ? "+ Принять Рулон (КГ)" : "+ Yangi Rulon Kirim Qilish (KG)"}</span>
          </button>
        </div>
      </div>

      {/* KPI Kartochkalar (Tonna va KG) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Жами Омбор" : lang === 'ru' ? "Весь Склад" : "Jami Ombor"}</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {formatWeightTonnes(totalStockKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            {activeRolls.length.toLocaleString()} {lang === 'cyr' ? "та рулон" : lang === 'ru' ? "рулонов" : "ta rulon"} • o'rtacha {avgRollWeightKg} kg (20-30 kg)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Хом Матолар" : lang === 'ru' ? "Суровое полотно" : "Xom Matolar"}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {formatWeightTonnes(rawStockKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            {activeRolls.filter(r => r.fabricType === 'xom').length} {lang === 'cyr' ? "та тўқилган" : lang === 'ru' ? "суровых" : "ta to'qilgan"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Бўялган Матолар" : lang === 'ru' ? "Крашеная ткань" : "Bo'yalgan Matolar"}</span>
            <Droplets className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400">
            {formatWeightTonnes(dyedStockKg, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            {activeRolls.filter(r => r.fabricType === 'boyalgan').length} {lang === 'cyr' ? "та тайёр" : lang === 'ru' ? "крашеных" : "ta tayyor"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-rose-200 dark:border-rose-900/60 shadow-xs bg-rose-50/20 dark:bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Брак Матолар (3-нав)" : lang === 'ru' ? "Брак (3-сорт)" : "Brak Matolar (3-nav)"}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {formatWeightTonnes(brakStockKg, lang)}
          </div>
          <p className="text-[11px] text-rose-500 mt-1 font-semibold">
            {activeRolls.filter(r => r.qualityGrade === '3-nav' || r.qualityGrade === 'brak').length} {lang === 'cyr' ? "та брак рулон" : "ta brak rulon"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Омбор Қиймати" : lang === 'ru' ? "Стоимость Склада" : "Ombor Qiymati"}</span>
            <span className="text-[10px] font-bold text-emerald-600">$ USD</span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatUsd(totalValueUsd)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            ≈ {formatUzs(totalValueUsd * usdRate, lang)}
          </p>
        </div>
      </div>

      {/* Filtrlar va Qidiruv */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'cyr' ? "Рулон ID, мато, ранг, партия..." : "Rulon ID, mato, rang, partiya..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Toifa bo'yicha filter */}
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSelectedFabricType('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedFabricType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'cyr' ? "Барчаси" : "Barchasi"}
            </button>
            <button
              onClick={() => setSelectedFabricType('boyalgan')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedFabricType === 'boyalgan'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'cyr' ? "Бўялган" : "Bo'yalgan"}
            </button>
            <button
              onClick={() => setSelectedFabricType('xom')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedFabricType === 'xom'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'cyr' ? "Хом мато" : "Xom mato"}
            </button>
            <button
              onClick={() => setSelectedFabricType('dyeing')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedFabricType === 'dyeing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'cyr' ? "Бўёқхонада" : "Bo'yoqxonada"}
            </button>
          </div>

          {/* Sifat navi */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedQualityGrade}
              onChange={(e) => setSelectedQualityGrade(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">{lang === 'cyr' ? "Барча навлар" : lang === 'ru' ? "Все сорта" : "Barcha navlar"}</option>
              <option value="1-nav">{lang === 'cyr' ? "1-нав (Олий)" : lang === 'ru' ? "1-сорт" : "1-nav (Oliy)"}</option>
              <option value="2-nav">{lang === 'cyr' ? "2-нав (Нуқсонли)" : lang === 'ru' ? "2-сорт" : "2-nav (Nuqsonli)"}</option>
              <option value="3-nav">{lang === 'cyr' ? "3-нав (Брак)" : lang === 'ru' ? "3-сорт (Брак)" : "3-nav (Brak)"}</option>
            </select>

            <button
              onClick={() => setSelectedQualityGrade(selectedQualityGrade === '3-nav' ? 'all' : '3-nav')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedQualityGrade === '3-nav'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'cyr' ? "Брак" : lang === 'ru' ? "Брак" : "Brak"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rulonlar kartochkalari tarmog'i */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRolls.map(roll => {
          const statusBadge = getRollStatusBadge(roll.status, lang);
          const gradeBadge = getQualityGradeBadge(roll.qualityGrade, lang);

          return (
            <div
              key={roll.id}
              className={`bg-white dark:bg-slate-800/90 border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                roll.qualityGrade === '3-nav' || roll.qualityGrade === 'brak'
                  ? 'border-rose-300 dark:border-rose-800/80 hover:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-teal-500/50'
              }`}
            >
              {/* Yuqori qism: Kod va Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                      {roll.id}
                    </span>
                    {roll.batchNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {roll.batchNumber}
                      </span>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 mb-1">
                  {loc(roll.fabricName)}
                </h4>

                <div className="text-xs text-purple-700 dark:text-purple-300 font-bold mb-2">
                  🎨 {loc(roll.colorName)} {roll.pantoneCode && `(${roll.pantoneCode})`}
                </div>

                {/* BRAK YOKI NUQSON SABABI KO'RSATKICHI */}
                {roll.defectReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1 mb-2">
                    <div className="flex items-center gap-1 font-black text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'cyr' ? "Аниқланган Брак Сабаби:" : "Aniqlangan Brak Sababi:"}</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      {roll.defectReason}
                    </p>
                  </div>
                )}

                {/* Og'irlik (KG) va Narx */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold">{lang === 'cyr' ? "Соф оғирлик:" : "Sof og'irlik:"}</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {formatKg(roll.currentKg, lang)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-semibold">{lang === 'cyr' ? "Нархи (1 кг):" : "Narxi (1 kg):"}</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatUsd(roll.sellingPricePerKgUsd || 5.20)}
                    </div>
                  </div>
                </div>

                {roll.loomNumber && (
                  <div className="text-[10px] text-slate-400">
                    ⚙️ {roll.loomNumber} • {roll.operator || "Usta"}
                  </div>
                )}
              </div>

              {/* Pastki qism: Sifat navi va Amallar tugmalari */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${gradeBadge.className}`}>
                    {gradeBadge.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(roll.receivedDate, lang)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {/* QR Kod modal */}
                  <button
                    onClick={() => setQrModalRoll(roll)}
                    title={lang === 'cyr' ? "QR Кодни кўриш ва чоп этиш" : "QR Kodni ko'rish va chop etish"}
                    className="p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>

                  {/* Rulondan KG kesish */}
                  <button
                    onClick={() => setCutModalRoll(roll)}
                    title={lang === 'cyr' ? "Рулондан КГ кесиш" : "Rulondan KG kesish"}
                    className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>{lang === 'cyr' ? "Кесиш" : "Kesish"}</span>
                  </button>

                  {/* Nuqson yozish (QC) */}
                  <button
                    onClick={() => setDefectModalRoll(roll)}
                    title={lang === 'cyr' ? "Нуқсон қайд этиш" : "Nuqson qayd etish"}
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>QC</span>
                  </button>

                  {/* O'chirish */}
                  <button
                    onClick={() => handleDeleteRoll(roll.id)}
                    title={lang === 'cyr' ? "Рулонни ўчириш" : "Rulonni o'chirish"}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sahifalash (Pagination) Kontrollari */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>
              {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRolls.length)} / {filteredRolls.length.toLocaleString()} {lang === 'cyr' ? "та рулон" : "ta rulon"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3 && currentPage < totalPages - 2) {
                    p = currentPage - 2 + i;
                  } else if (currentPage >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value={24}>24 ta / bet</option>
              <option value={48}>48 ta / bet</option>
              <option value={96}>96 ta / bet</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
