import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatUsd } from '../utils/formatters';
import { PlusCircle, QrCode, X, Layers, Building, Scale, Sparkles } from 'lucide-react';

export default function NewRollModal({ isOpen, onClose }) {
  const { lang, loc, usdRate, setQrModalRoll, notify, triggerRefresh } = useApp();

  const [fabrics, setFabrics] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [looms, setLooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fabricId: '',
    fabricType: 'xom',
    supplierId: '',
    batchNumber: '',
    loomNumber: '',
    yarnLot: '',
    colorName: '',
    pantoneCode: '',
    initialKg: '',
    tareKg: '0.5',
    purchasePricePerKgUsd: '',
    sellingPricePerKgUsd: '',
    qualityGrade: '1-nav',
    location: "Xom Matolar Ombori (A-Sektor)",
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/fabrics').then(res => {
        if (res.success && res.data) {
          setFabrics(res.data);
          if (res.data.length > 0) {
            const first = res.data[0];
            setFormData(prev => ({
              ...prev,
              fabricId: first.id,
              fabricType: first.type || 'xom',
              colorName: first.color || '',
              pantoneCode: first.pantoneCode || '',
              purchasePricePerKgUsd: String(first.purchasePricePerKgUsd || 3.5),
              sellingPricePerKgUsd: String(first.sellingPricePerKgUsd || 5.0),
              batchNumber: `ROL-${Date.now().toString().slice(-4)}`
            }));
          }
        }
      });

      api.get('/suppliers').then(res => {
        if (res.success) setSuppliers(res.data || []);
      });

      api.get('/production/looms').then(res => {
        if (res.success) setLooms(res.data || []);
      });
    }
  }, [isOpen]);

  const handleFabricChange = (fabId) => {
    const fab = fabrics.find(f => f.id === fabId);
    if (fab) {
      setFormData(prev => ({
        ...prev,
        fabricId: fabId,
        fabricType: fab.type || 'xom',
        colorName: fab.color || '',
        pantoneCode: fab.pantoneCode || '',
        purchasePricePerKgUsd: String(fab.purchasePricePerKgUsd || 3.5),
        sellingPricePerKgUsd: String(fab.sellingPricePerKgUsd || 5.0),
        location: fab.type === 'boyalgan' ? "Bo'yalgan Matolar Ombori (B-Sektor)" : "Xom Matolar Ombori (A-Sektor)"
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fabricId || !formData.initialKg || Number(formData.initialKg) <= 0) {
      notify("Xatolik", "Mato va og'irlik (kg) kiritilishi shart", 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/rolls', formData);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Рулон омборга қабул қилинди!" : "Rulon omborga qabul qilindi!",
          `${res.data.id} (${res.data.netKg} kg)`,
          'success'
        );
        onClose();
        triggerRefresh();
        // QR kod modalini darhol ochish
        setQrModalRoll(res.data);
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const brutto = Number(formData.initialKg || 0);
  const tare = Number(formData.tareKg || 0.5);
  const net = Math.max(0, Number((brutto - tare).toFixed(2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Янги Мато Рулонини Қабул Қилиш (КГ)" : "Yangi Mato Rulonini Qabul Qilish (KG)"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'cyr' ? "Оғирлик ва нархни киритинг, QR кодли ёрлиқ автоматик чиқарилади" : "Og'irlik va narxni kiriting, QR kodli yorliq avtomatik chiqariladi"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mato turi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Мато Каталогидан Танланг" : "Mato Katalogidan Tanlang"} *
              </label>
              <select
                value={formData.fabricId}
                onChange={(e) => handleFabricChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                {fabrics.map(f => (
                  <option key={f.id} value={f.id}>
                    {loc(f.name)} ({f.code}) - {f.type === 'boyalgan' ? 'Bo\'yalgan' : 'Xom'}
                  </option>
                ))}
              </select>
            </div>

            {/* Mato toifasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Мато Тоифаси" : "Mato Toifasi"}
              </label>
              <select
                value={formData.fabricType}
                onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="xom">{lang === 'cyr' ? "Хом мато (Тўқилган)" : "Xom mato (To'qilgan)"}</option>
                <option value="boyalgan">{lang === 'cyr' ? "Бўялган мато" : "Bo'yalgan mato"}</option>
              </select>
            </div>

            {/* Partiya raqami */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Партия / Lot Рақами" : "Partiya / Lot Raqami"}
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Rang nomi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Ранги" : "Rangi"}
              </label>
              <input
                type="text"
                value={formData.colorName}
                onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                placeholder="Qora (Jet Black)"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Panton kodi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Pantone Коди" : "Pantone Kodi"}
              </label>
              <input
                type="text"
                value={formData.pantoneCode}
                onChange={(e) => setFormData({ ...formData, pantoneCode: e.target.value })}
                placeholder="TCX-19-4008"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Brutto vazn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Брутто Оғирлик (кг)" : "Brutto Og'irlik (kg)"} *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.initialKg}
                onChange={(e) => setFormData({ ...formData, initialKg: e.target.value })}
                required
                placeholder="25.4"
                className="w-full px-3 py-2 text-sm font-black rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Tara vazn */}
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

            {/* Sotuv narxi $/kg */}
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

            {/* Sifat navi */}
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

            {/* Ombor joylashuvi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Омбор Жойлашуви" : "Ombor Joylashuvi"}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Xom Matolar Ombori (A-Sektor)"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Netto preview */}
          {brutto > 0 && (
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs">
              <span className="text-teal-800 dark:text-teal-300 font-bold">
                {lang === 'cyr' ? "Ҳисобланган Соф Нетто Оғирлик:" : "Hisoblangan Sof Netto Og'irlik:"}
              </span>
              <span className="text-base font-black text-teal-900 dark:text-teal-200">
                {formatKg(net, lang)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{lang === 'cyr' ? "Кирим Қилиш & QR Код" : "Kirim Qilish & QR Kod"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
