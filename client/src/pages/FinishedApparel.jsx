import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatMoney } from '../utils/formatters';
import {
  Shirt,
  Search,
  Plus,
  Edit2,
  ShoppingCart
} from 'lucide-react';

export default function FinishedApparel() {
  const { refreshSignal, triggerRefresh, notify, setActiveTab } = useApp();
  const [apparel, setApparel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    size: 'M',
    quantity: 1,
    unitCost: 0,
    sellingPrice: 0,
    color: 'Standart'
  });

  const loadApparel = () => {
    setLoading(true);
    api.get('/apparel')
      .then(res => {
        if (res.success) setApparel(res.data);
      })
      .catch(err => console.error("Kiyimlarni yuklash xatosi:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApparel();
  }, [refreshSignal]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      color: item.color || 'Standart'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/apparel/${editingItem.id}`, formData);
        notify("Mahsulot yangilandi", formData.name);
      } else {
        await api.post('/apparel', formData);
        notify("Yangi mahsulot kirim qilindi", formData.name);
      }
      setEditingItem(null);
      triggerRefresh();
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  const filtered = apparel.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.size && a.size.toLowerCase().includes(search.toLowerCase())) ||
    (a.color && a.color.toLowerCase().includes(search.toLowerCase()))
  );

  const totalApparelCount = apparel.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const totalStockValue = apparel.reduce((sum, a) => sum + (Number(a.quantity) * Number(a.sellingPrice || 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shirt className="w-5 h-5 text-pink-500" />
            Tayyor Kiyim-Kechaklar Ombori
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bichilgan va tikilgan tayyor mahsulotlar qoldig'i, o'lchamlari va sotuv narxlari
          </p>
        </div>

        <button
          onClick={() => setActiveTab('production')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ishlab Chiqarishga Buyurtma Berish
        </button>
      </div>

      {/* KPI Kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="ios-glass-card p-5 rounded-3xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Jami Tayyor Mahsulotlar</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalApparelCount} dona</div>
        </div>

        <div className="ios-glass-card p-5 rounded-3xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Omborning Sotuv Qiymati</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(totalStockValue)}</div>
        </div>

        <div className="ios-glass-card p-5 rounded-3xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Kiyim Modellari Turlari</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{apparel.length} xil o'lcham</div>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Model nomi, o'lcham (S, M, L, XL), rang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-full text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 ios-glass"
        />
      </div>

      {/* Kiyimlar Jadvali */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Tayyor mahsulotlar yuklanmoqda...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-3xl ios-glass-panel text-center text-slate-500 text-xs">
          Omborda tayyor mahsulotlar mavjud emas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="ios-glass-card p-6 rounded-3xl flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    O'lcham: {item.size}
                  </span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    {item.quantity > 0 ? `${item.quantity} dona mavjud` : 'Tugagan'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.color || 'Standart'}</p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Tannarxi:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMoney(item.unitCost)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sotuv Narxi:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatMoney(item.sellingPrice)}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="flex-1 py-2 px-3 bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Sotuvga O'tish
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all border border-slate-200 dark:border-white/5"
                    title="Narx va qoldiqni tahrirlash"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Tahrirlash Modali */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 ios-glass border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Mahsulot Narxi va Qoldig'ini Tahrirlash
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mahsulot Nomi</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mavjud Soni (dona)</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-teal-600 dark:text-teal-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sotuv Narxi (so'm)</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-slate-950 bg-teal-500 hover:bg-teal-400 rounded-xl shadow-md"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
