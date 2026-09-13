import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DefectModal() {
  const { lang, loc, defectModalRoll, setDefectModalRoll, notify, triggerRefresh } = useApp();

  const [positionMeters, setPositionMeters] = useState('');
  const [defectType, setDefectType] = useState('ip_uzilishi');
  const [severity, setSeverity] = useState('orta');
  const [actionTaken, setActionTaken] = useState('2-nav qilib belgilandi');
  const [penaltyDiscountPercent, setPenaltyDiscountPercent] = useState('10');
  const [inspectorName, setInspectorName] = useState('Nodira Qodirova');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!defectModalRoll) return null;

  const roll = defectModalRoll;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const res = await api.post('/defects', {
        rollId: roll.id,
        fabricId: roll.fabricId,
        positionMeters: Number(positionMeters) || 0,
        defectType,
        severity,
        actionTaken,
        penaltyDiscountPercent: Number(penaltyDiscountPercent) || 10,
        inspectorName,
        notes,
        updateQualityGrade: true
      });

      if (res.success) {
        notify(
          lang === 'cyr' ? "Нуқсон қайд этилди!" : "Nuqson qayd etildi!",
          `${roll.id} - ${res.message}`,
          "success"
        );
        triggerRefresh();
        setDefectModalRoll(null);
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Мато Нуқсонини Қайд Этиш (QC)" : "Mato Nuqsonini Qayd Etish (QC)"}
              </h3>
              <p className="text-xs text-slate-500">
                {roll.id} ({loc(roll.fabricName || "")})
              </p>
            </div>
          </div>
          <button onClick={() => setDefectModalRoll(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Нуқсон Тури" : "Nuqson Turi"} *
              </label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ip_uzilishi">{lang === 'cyr' ? "Ип узилиши / Қайта уланиш" : "Ip uzilishi / Qayta ulanish"}</option>
                <option value="dog_rang_farqi">{lang === 'cyr' ? "Доғ / Ранг тафовути" : "Dog' / Rang tafovuti"}</option>
                <option value="teshik">{lang === 'cyr' ? "Тешик / Йиртиқ" : "Teshik / Yirtiq"}</option>
                <option value="toqilish_xatosi">{lang === 'cyr' ? "Тўқилиш хатоси / Қалин ип" : "To'qilish xatosi / Qalin ip"}</option>
                <option value="ulanish_choki">{lang === 'cyr' ? "Мато уланиш чоки" : "Mato ulanish choki"}</option>
                <option value="boshqa">{lang === 'cyr' ? "Бошқа нуқсон" : "Boshqa nuqson"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Жойлашуви (Метр)" : "Joylashuvi (Metr)"}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="2.5"
                value={positionMeters}
                onChange={(e) => setPositionMeters(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Даражаси" : "Darajasi"}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="past">{lang === 'cyr' ? "Кичик (1-нав сақланади)" : "Kichik (1-nav saqlanadi)"}</option>
                <option value="orta">{lang === 'cyr' ? "Ўртача (2-нав қилинади)" : "O'rtacha (2-nav qilinadi)"}</option>
                <option value="yuqori">{lang === 'cyr' ? "Жиддий (3-нав / Брак)" : "Jiddiy (3-nav / Brak)"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Чегирма % (2-нав учун)" : "Chegirma % (2-nav uchun)"}
              </label>
              <input
                type="number"
                value={penaltyDiscountPercent}
                onChange={(e) => setPenaltyDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'cyr' ? "QC Назоратчи Уста" : "QC Nazoratchi Usta"}
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'cyr' ? "Изоҳ ва Тавсиф" : "Izoh va Tavsif"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nuqson haqida qo'shimcha ma'lumot..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDefectModalRoll(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
            >
              {lang === 'cyr' ? "Нуқсонни Сақлаш" : "Nuqsonni Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
