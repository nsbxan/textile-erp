import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatUsd, formatUzs } from '../utils/formatters';
import {
  Layers,
  PlusCircle,
  Search,
  Sparkles,
  Droplets,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Tag
} from 'lucide-react';

export default function FabricsList({ onOpenNewRoll }) {
  const { lang, loc, usdRate, notify, refreshSignal, triggerRefresh } = useApp();

  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'xom', 'boyalgan'

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'xom',
    composition: '100% Paxta',
    color: 'Tabiiy Xom',
    pantoneCode: '',
    width: 180,
    density: 180,
    purchasePricePerKgUsd: 3.50,
    sellingPricePerKgUsd: 5.00,
    category: 'Suprem',
    min_stock_alert_kg: 100,
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fabrics');
      if (res.success) setFabrics(res.data || []);
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
    setEditingFabric(null);
    setFormData({
      name: '',
      code: `FAB-${Date.now().toString().slice(-4)}`,
      type: 'xom',
      composition: '100% Paxta',
      color: 'Tabiiy Xom',
      pantoneCode: '',
      width: 180,
      density: 180,
      purchasePricePerKgUsd: 3.50,
      sellingPricePerKgUsd: 5.00,
      category: 'Suprem',
      min_stock_alert_kg: 100,
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (fab) => {
    setEditingFabric(fab);
    setFormData({
      name: fab.name || '',
      code: fab.code || '',
      type: fab.type || 'xom',
      composition: fab.composition || '100% Paxta',
      color: fab.color || '',
      pantoneCode: fab.pantoneCode || '',
      width: fab.width || 180,
      density: fab.density || 180,
      purchasePricePerKgUsd: fab.purchasePricePerKgUsd || 3.50,
      sellingPricePerKgUsd: fab.sellingPricePerKgUsd || 5.00,
      category: fab.category || 'Suprem',
      min_stock_alert_kg: fab.min_stock_alert_kg || 100,
      notes: fab.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFabric) {
        const res = await api.put(`/fabrics/${editingFabric.id}`, formData);
        if (res.success) {
          notify("Mato yangilandi", res.message, 'success');
        }
      } else {
        const res = await api.post('/fabrics', formData);
        if (res.success) {
          notify("Yangi mato qo'shildi", res.message, 'success');
        }
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const handleDelete = async (fabId) => {
    if (!window.confirm("Haqiqatan ham ushbu mato turini o'chirmoqchimisiz?")) return;
    try {
      const res = await api.delete(`/fabrics/${fabId}`);
      if (res.success) {
        notify("Mato o'chirildi", res.message, 'success');
        triggerRefresh();
      }
    } catch (err) {
      notify("O'chirib bo'lmadi", err.message, 'error');
    }
  };

  const filteredFabrics = fabrics.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.color && f.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || f.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Sarlavha va tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-500" />
            <span>{lang === 'cyr' ? "Матолар Каталоги (КГ & $ Нархлари)" : "Matolar Katalogi (KG & $ Narxlari)"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Барча тўқилган хом ва бўялган трикотаж матолар турлари, оғирликлари ва сотув нархлари."
              : "Barcha to'qilgan xom va bo'yalgan trikotaj matolar turlari, og'irliklari va sotuv narxlari."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Янги Мато Қўшиш" : "+ Yangi Mato Qo'shish"}</span>
          </button>
        </div>
      </div>

      {/* Filtr va Qidiruv */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'cyr' ? "Мато номи, артикул, тоифа бўйича қидириш..." : "Mato nomi, artikul, toifa bo'yicha qidirish..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedType === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'cyr' ? "Барчаси" : "Barchasi"}
          </button>
          <button
            onClick={() => setSelectedType('boyalgan')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedType === 'boyalgan'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'cyr' ? "Бўялган" : "Bo'yalgan"}
          </button>
          <button
            onClick={() => setSelectedType('xom')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedType === 'xom'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'cyr' ? "Хом мато" : "Xom mato"}
          </button>
        </div>
      </div>

      {/* Matolar Jadvali */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">{lang === 'cyr' ? "Артикул" : "Artikul"}</th>
                <th className="p-3">{lang === 'cyr' ? "Мато Номи & Таркиби" : "Mato Nomi & Tarkibi"}</th>
                <th className="p-3">{lang === 'cyr' ? "Тури & Ранги" : "Turi & Rangi"}</th>
                <th className="p-3">{lang === 'cyr' ? "Эни / Зичлиги" : "Eni / Zichligi"}</th>
                <th className="p-3">{lang === 'cyr' ? "Омбордаги Вазн (кг)" : "Ombordagi Vazn (kg)"}</th>
                <th className="p-3">{lang === 'cyr' ? "Сотув Нархи ($/кг)" : "Sotuv Narxi ($/kg)"}</th>
                <th className="p-3 text-right">{lang === 'cyr' ? "Амаллар" : "Amallar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredFabrics.map(fab => {
                const isRaw = fab.type === 'xom';
                return (
                  <tr key={fab.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {fab.code}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{loc(fab.name)}</div>
                      <div className="text-[11px] text-slate-500">{fab.composition}</div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isRaw
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}>
                        {isRaw ? (lang === 'cyr' ? "Хом мато" : "Xom mato") : (lang === 'cyr' ? "Бўялган" : "Bo'yalgan")}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{loc(fab.color)}</div>
                    </td>

                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {fab.width} sm / {fab.density} gr/m²
                    </td>

                    <td className="p-3">
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        {formatKg(fab.totalKg || 0, lang)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fab.totalRollsCount || 0} {lang === 'cyr' ? "та рулон" : "ta rulon"}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatUsd(fab.sellingPricePerKgUsd)}/kg
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ≈ {formatUzs(Number(fab.sellingPricePerKgUsd || 5) * usdRate, lang)}
                      </div>
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(fab)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        title="Tahrirlash"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fab.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mato Qo'shish / Tahrirlash Modali */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingFabric
                      ? (lang === 'cyr' ? "Матони Таҳрирлаш" : "Matoni Tahrirlash")
                      : (lang === 'cyr' ? "Янги Мато Қўшиш" : "Yangi Mato Qo'shish")}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Мато Номи" : "Mato Nomi"} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Suprem Penye 30/1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Артикул Коди" : "Artikul Kodi"} *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="SUP-100-RAW"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Мато Тури" : "Mato Turi"}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="xom">{lang === 'cyr' ? "Хом мато (Тўқилган)" : "Xom mato (To'qilgan)"}</option>
                    <option value="boyalgan">{lang === 'cyr' ? "Бўялган мато" : "Bo'yalgan mato"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Таркиби" : "Tarkibi"}
                  </label>
                  <input
                    type="text"
                    value={formData.composition}
                    onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                    placeholder="100% Paxta Penye"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Ранги / Пантон" : "Rangi / Panton"}
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Qora (TCX-19-4008)"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Сотув Нархи ($/кг)" : "Sotuv Narxi ($/kg)"} *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.sellingPricePerKgUsd}
                    onChange={(e) => setFormData({ ...formData, sellingPricePerKgUsd: e.target.value })}
                    required
                    placeholder="5.20"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Таннарх ($/кг)" : "Tannarx ($/kg)"}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.purchasePricePerKgUsd}
                    onChange={(e) => setFormData({ ...formData, purchasePricePerKgUsd: e.target.value })}
                    placeholder="3.80"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {lang === 'cyr' ? "Сақлаш" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
