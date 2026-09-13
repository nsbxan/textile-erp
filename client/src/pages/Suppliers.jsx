import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { Building2, PlusCircle, Search, Phone, User, Trash2, Edit, RefreshCw } from 'lucide-react';

export default function Suppliers() {
  const { lang, loc, notify, refreshSignal, triggerRefresh } = useApp();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    contactPerson: '',
    address: '',
    category: 'Paxta Ipi',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      if (res.success) setSuppliers(res.data || []);
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
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      contactPerson: '',
      address: '',
      category: 'Paxta Ipi (Ne 30/1, 20/1)',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name || '',
      phone: sup.phone || '',
      contactPerson: sup.contactPerson || '',
      address: sup.address || '',
      category: sup.category || 'Paxta Ipi',
      notes: sup.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier.id}`, formData);
        if (res.success) notify("Ta'minotchi yangilandi", res.message, 'success');
      } else {
        const res = await api.post('/suppliers', formData);
        if (res.success) notify("Yangi ta'minotchi qo'shildi", res.message, 'success');
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const handleDelete = async (supId) => {
    if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    try {
      const res = await api.delete(`/suppliers/${supId}`);
      if (res.success) {
        notify("O'chirildi", res.message, 'success');
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" />
            <span>{lang === 'cyr' ? "Ип & Хомашё Таъминотчилари" : "Ip & Xomashyo Ta'minotchilari"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Пахта ипи йигирув кластерлари, кимёвий бўёқ ва хомашё етказиб берувчилар."
              : "Paxta ipi yigiruv klasterlari, kimyoviy bo'yoq va xomashyo yetkazib beruvchilar."}
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Янги Таъминотчи Қўшиш" : "+ Yangi Ta'minotchi Qo'shish"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'cyr' ? "Таъминотчи номи, ип тури..." : "Ta'minotchi nomi, ip turi..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => (
          <div key={sup.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{sup.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                  {loc(sup.category || "Ip yetkazib beruvchi")}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>👤 {sup.contactPerson || "Mas'ul xodim"}</div>
                <div>📞 {sup.phone || "-"}</div>
                <div>📍 {loc(sup.address || "Manzil")}</div>
              </div>
            </div>

            <div className="flex justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => handleOpenEdit(sup)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(sup.id)}
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingSupplier
                  ? (lang === 'cyr' ? "Таъминотчини Таҳрирлаш" : "Ta'minotchini Tahrirlash")
                  : (lang === 'cyr' ? "Янги Таъминотчи Қўшиш" : "Yangi Ta'minotchi Qo'shish")}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Корхона / Кластер Номи" : "Korxona / Klaster Nomi"} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="UzTex Group Yigiruv Klasteri"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Масъул Шахс" : "Mas'ul Shaxs"}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Rustam Akromov"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Телефон" : "Telefon"}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 71 200 11 22"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Хомашё Тоифаси" : "Xomashyo Toifasi"}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Paxta Ipi Ne 30/1, Kompakt Penye"
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
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm"
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
