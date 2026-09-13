import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatUsd, formatUzs, formatDualCurrency, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  PlusCircle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function Finance() {
  const { lang, loc, usdRate, notify, refreshSignal, triggerRefresh } = useApp();

  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Yangi tranzaksiya modali
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'chiqim', // 'kirim' yoki 'chiqim'
    category: 'kommunal_xarajatlar',
    account: 'dollar_kassa',
    amountUsd: '',
    amountUzs: '',
    currency: 'USD',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, txRes] = await Promise.all([
        api.get('/finance/stats'),
        api.get('/finance/transactions')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (txRes.success) setTransactions(txRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/finance/transactions', formData);
      if (res.success) {
        notify("Tranzaksiya qo'shildi", res.message, 'success');
        setModalOpen(false);
        setFormData({
          type: 'chiqim',
          category: 'kommunal_xarajatlar',
          account: 'dollar_kassa',
          amountUsd: '',
          amountUzs: '',
          currency: 'USD',
          description: ''
        });
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>{lang === 'cyr' ? "Касса & Молиявий Ҳисоб-Китоб" : "Kassa & Moliyaviy Hisob-Kitob"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Доллар ва сўм кассалари, мато савдоси тушумлари ва харажатлар баланси."
              : "Dollar va so'm kassalari, mato savdosi tushumlari va xarajatlar balansi."}
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Чиқим / Кирим Қўшиш" : "+ Chiqim / Kirim Qo'shish"}</span>
          </button>
        </div>
      </div>

      {/* Tranzaksiyalar Jadvali */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {lang === 'cyr' ? "Сўнгги Молиявий Тўловлар & Тразакциялар" : "So'nggi Moliyaviy To'lovlar & Tranzaksiyalar"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">{lang === 'cyr' ? "Сана & Вақт" : "Sana & Vaqt"}</th>
                <th className="p-3">{lang === 'cyr' ? "Тури" : "Turi"}</th>
                <th className="p-3">{lang === 'cyr' ? "Категория & Тавсиф" : "Kategoriya & Tavsif"}</th>
                <th className="p-3">{lang === 'cyr' ? "Касса / Ҳисоб" : "Kassa / Hisob"}</th>
                <th className="p-3 text-right">{lang === 'cyr' ? "Сумма ($ USD)" : "Summa ($ USD)"}</th>
                <th className="p-3 text-right">{lang === 'cyr' ? "Сумма (Сўм)" : "Summa (So'm)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {transactions.map((tx, idx) => {
                const isIncome = tx.type === 'kirim';
                const amtUsd = Number(tx.amountUsd || (tx.amount ? Number(tx.amount) / usdRate : 0));
                const amtUzs = Math.round(Number(tx.amountUzs || (tx.amount ? Number(tx.amount) : amtUsd * usdRate)));

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                      {formatDate(tx.createdAt, lang)}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isIncome
                          ? (lang === 'cyr' ? "Кирим" : "Kirim")
                          : (lang === 'cyr' ? "Чиқим" : "Chiqim")}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{loc(tx.description || tx.category)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.referenceType || tx.category}</div>
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {tx.account === 'dollar_kassa' ? '💵 Dollar Kassa' : '💳 So\'m Kassa / Bank'}
                    </td>

                    <td className={`p-3 text-right font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIncome ? '+' : '-'}{formatUsd(amtUsd)}
                    </td>

                    <td className="p-3 text-right font-semibold text-slate-500">
                      {formatUzs(amtUzs, lang)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yangi Tranzaksiya Modali */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Кассага Кирим / Чиқим Ёзиш" : "Kassaga Kirim / Chiqim Yozish"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'kirim' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.type === 'kirim'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📥 {lang === 'cyr' ? "Кирим (Тушум)" : "Kirim (Tushum)"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'chiqim' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.type === 'chiqim'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📤 {lang === 'cyr' ? "Чиқим (Харажат)" : "Chiqim (Xarajat)"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Сумма ($ USD)" : "Summa ($ USD)"} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amountUsd}
                  onChange={(e) => setFormData({ ...formData, amountUsd: e.target.value })}
                  required
                  placeholder="100.00"
                  className="w-full px-3 py-2 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Категория & Тавсиф" : "Kategoriya & Tavsif"}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Elektr energiyasi, dastgoh ehtiyot qismlari, ish haqi..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
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
