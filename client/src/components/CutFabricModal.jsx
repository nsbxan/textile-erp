import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatUsd } from '../utils/formatters';
import { Scissors, X, AlertCircle } from 'lucide-react';

export default function CutFabricModal() {
  const { lang, loc, cutModalRoll, setCutModalRoll, notify, triggerRefresh } = useApp();
  const [cutKg, setCutKg] = useState('');
  const [reason, setReason] = useState('Savdo / Namunaga kesish');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!cutModalRoll) return null;

  const roll = cutModalRoll;
  const maxKg = Number(roll.currentKg || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const kg = Number(cutKg);
    if (!kg || kg <= 0 || kg > maxKg) {
      notify("Xatolik", `Mavjud vazn oralig'ida (0 - ${maxKg} kg) qiymat kiriting`, 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/rolls/${roll.id}/cut`, {
        cutKg: kg,
        reason,
        customerName
      });

      if (res.success) {
        notify(
          lang === 'cyr' ? "Мато кесилди!" : "Mato kesildi!",
          `${roll.id} - ${formatKg(kg, lang)} ${lang === 'cyr' ? 'кесилди. Қолдиқ:' : 'kesildi. Qoldiq:'} ${formatKg(res.data.currentKg, lang)}`,
          'success'
        );
        setCutModalRoll(null);
        setCutKg('');
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const remainingKg = Math.max(0, Number((maxKg - Number(cutKg || 0)).toFixed(2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Рулондан Мато Кесиш (КГ)" : "Rulondan Mato Kesish (KG)"}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {roll.id} ({loc(roll.fabricName)})
              </p>
            </div>
          </div>
          <button onClick={() => setCutModalRoll(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{lang === 'cyr' ? "Рулондаги Мавжуд Вазн:" : "Rulondagi Mavjud Vazn:"}</span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">{formatKg(maxKg, lang)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{lang === 'cyr' ? "Ранги:" : "Rangi:"}</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">{loc(roll.colorName)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'cyr' ? "Кесиладиган Вазн (кг)" : "Kesiladigan Vazn (kg)"} *
            </label>
            <input
              type="number"
              step="0.1"
              max={maxKg}
              min="0.1"
              value={cutKg}
              onChange={(e) => setCutKg(e.target.value)}
              required
              placeholder="5.0"
              className="w-full px-3 py-2 text-sm font-black rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'cyr' ? "Сабаби / Изоҳ" : "Sababi / Izoh"}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Chakana savdo, namunaga kesish"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {Number(cutKg) > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between text-xs font-bold">
              <span className="text-slate-500">{lang === 'cyr' ? "Кесилгандан кейинги қолдиқ:" : "Kesilgandan keyingi qoldiq:"}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatKg(remainingKg, lang)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCutModalRoll(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {lang === 'cyr' ? "Кесишни Тасдиқлаш" : "Kesishni Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
