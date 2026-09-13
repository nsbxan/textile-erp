import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatDate, formatWeightTonnes, formatKg, getDefectTypeName, getQualityGradeBadge } from '../utils/formatters';
import { ShieldAlert, PlusCircle, AlertTriangle, CheckCircle2, Search, RefreshCw, Trash2, Layers, AlertOctagon } from 'lucide-react';

export default function QualityControl() {
  const { lang, loc, setDefectModalRoll, notify, refreshSignal, triggerRefresh } = useApp();

  const [defects, setDefects] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [defRes, rollRes] = await Promise.all([
        api.get('/defects'),
        api.get('/rolls')
      ]);

      if (defRes.success) setDefects(defRes.data || []);
      if (rollRes.success) setRolls(rollRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const handleDelete = async (defId) => {
    if (!window.confirm("Nuqson yozuvini o'chirmoqchimisiz?")) return;
    try {
      const res = await api.delete(`/defects/${defId}`);
      if (res.success) {
        notify("Nuqson o'chirildi", res.message, 'success');
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const filteredDefects = defects.filter(d =>
    d.rollId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.inspectorName && d.inspectorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.defectType && d.defectType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const brakRolls = rolls.filter(r => r.qualityGrade === '3-nav' || r.qualityGrade === 'brak');
  const grade2Rolls = rolls.filter(r => r.qualityGrade === '2-nav');
  const grade1Rolls = rolls.filter(r => r.qualityGrade === '1-nav');

  const brakWeightKg = brakRolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const grade2WeightKg = grade2Rolls.reduce((sum, r) => sum + Number(r.currentKg || 0), 0);
  const totalRollsCount = rolls.length || 1;
  const grade1Percent = Math.round((grade1Rolls.length / totalRollsCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>{lang === 'cyr' ? "Сифат Назорати (QC & Брак Сабаблари Журнали)" : lang === 'ru' ? "Контроль Качества (ОТК & Журнал Брака)" : "Sifat Nazorati (QC & Brak Sabablari Jurnali)"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Мато тўқилиши ва бўяшдаги нуқсонларни, брак сабабларини метрлар бўйича қайд этиш."
              : lang === 'ru'
              ? "Учет причин брака, дефектов ткачества и крашения по метрам, контроль сортности."
              : "Mato to'qilishi va bo'yashdagi nuqsonlarni, brak sabablarini metrlar bo'yicha qayd etish."}
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
        </div>
      </div>

      {/* QC KPI Ko'rsatkichlari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Жами Нуқсонлар" : lang === 'ru' ? "Всего Дефектов" : "Jami Nuqsonlar"}</span>
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {defects.length} {lang === 'cyr' ? "та қайд" : "ta qayd"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            {lang === 'cyr' ? "Журналдаги барча ёзувлар" : "Jurnaldagi barcha yozuvlar"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "Брак Матолар (3-нав)" : lang === 'ru' ? "Брак (3-сорт)" : "Brak Matolar (3-nav)"}</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {brakRolls.length} {lang === 'cyr' ? "та рулон" : "ta rulon"}
          </div>
          <p className="text-[11px] text-rose-500 mt-1 font-bold">
            {formatWeightTonnes(brakWeightKg, lang)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "2-нав (Нуқсонли)" : lang === 'ru' ? "2-сорт (С дефектом)" : "2-nav (Nuqsonli)"}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {grade2Rolls.length} {lang === 'cyr' ? "та рулон" : "ta rulon"}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
            {formatWeightTonnes(grade2WeightKg, lang)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
            <span>{lang === 'cyr' ? "1-нав Олий Сифат" : lang === 'ru' ? "1-сорт (Высший)" : "1-nav Oliy Sifat"}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {grade1Percent}%
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {grade1Rolls.length} {lang === 'cyr' ? "та олий рулон" : "ta oliy rulon"}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'cyr' ? "Рулон ID, назоратчи, нуқсон тури..." : "Rulon ID, nazoratchi, nuqson turi..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">{lang === 'cyr' ? "Рулон №" : "Rulon №"}</th>
                <th className="p-3">{lang === 'cyr' ? "Нуқсон Тури" : "Nuqson Turi"}</th>
                <th className="p-3">{lang === 'cyr' ? "Жойлашуви (Метр)" : "Joylashuvi (Metr)"}</th>
                <th className="p-3">{lang === 'cyr' ? "Даражаси & Чегирма %" : "Darajasi & Chegirma %"}</th>
                <th className="p-3">{lang === 'cyr' ? "Кўрилган Чора" : "Ko'rilgan Chora"}</th>
                <th className="p-3">{lang === 'cyr' ? "QC Назоратчи" : "QC Nazoratchi"}</th>
                <th className="p-3 text-right">{lang === 'cyr' ? "Амаллар" : "Amallar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredDefects.map(def => (
                <tr key={def.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {def.rollId}
                  </td>

                  <td className="p-3">
                    <div className="font-black text-rose-600 dark:text-rose-400">
                      {getDefectTypeName(def.defectType, lang)}
                    </div>
                    {def.notes && (
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-1 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
                        <span className="font-bold text-rose-700 dark:text-rose-400">
                          {lang === 'cyr' ? "Сабаби: " : lang === 'ru' ? "Причина: " : "Sababi: "}
                        </span>
                        {loc(def.notes)}
                      </div>
                    )}
                  </td>

                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                    {def.positionMeters || def.positionM || "0.0"} m
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {def.severity || "O'rta"} ({def.penaltyDiscountPercent || 10}%)
                    </span>
                  </td>

                  <td className="p-3 text-slate-800 dark:text-slate-200">
                    {def.actionTaken || "2-nav qilib belgilandi"}
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {def.inspectorName || "QC Nazoratchi"}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(def.id)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
