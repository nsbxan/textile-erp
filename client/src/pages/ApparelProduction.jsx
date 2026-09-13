import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatMoney,
  formatMeters,
  formatDate,
  getProductionStageInfo
} from '../utils/formatters';
import {
  Scissors,
  Plus,
  Play,
  ArrowRight,
  Shirt
} from 'lucide-react';

export default function ApparelProduction() {
  const { refreshSignal, triggerRefresh, notify } = useApp();

  const [models, setModels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModelModal, setShowModelModal] = useState(false);
  const [modelFormData, setModelFormData] = useState({
    name: '',
    sku: '',
    category: 'Erkaklar kiyimi',
    requiredFabricId: '',
    fabricConsumptionPerUnit: 1.65,
    accessoriesCost: 14000,
    laborCost: 28000,
    overheadCost: 9000,
    suggestedWholesalePrice: 145000,
    suggestedRetailPrice: 195000,
    sizes: ["S", "M", "L", "XL", "XXL"],
    notes: ''
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    modelId: '',
    plannedQuantity: 30,
    sizeS: 5,
    sizeM: 10,
    sizeL: 10,
    sizeXL: 5,
    responsibleWorker: 'Zuhra Alimova (Bosh usta)',
    notes: ''
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/production/models'),
      api.get('/production/orders'),
      api.get('/fabrics')
    ])
      .then(([modRes, ordRes, fabRes]) => {
        if (modRes.success) setModels(modRes.data);
        if (ordRes.success) setOrders(ordRes.data);
        if (fabRes.success) {
          setFabrics(fabRes.data);
          if (fabRes.data.length > 0 && !modelFormData.requiredFabricId) {
            setModelFormData(prev => ({ ...prev, requiredFabricId: fabRes.data[0].id }));
          }
        }
      })
      .catch(err => console.error("Ishlab chiqarish yuklash xatosi:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshSignal]);

  const handleCreateModel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/models', modelFormData);
      notify("Yangi kiyim modeli yaratildi", modelFormData.name);
      setShowModelModal(false);
      triggerRefresh();
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const qty = Number(orderFormData.plannedQuantity);
    const targetSizes = {
      "S": Number(orderFormData.sizeS) || 0,
      "M": Number(orderFormData.sizeM) || 0,
      "L": Number(orderFormData.sizeL) || 0,
      "XL": Number(orderFormData.sizeXL) || 0
    };

    try {
      const res = await api.post('/production/orders', {
        modelId: orderFormData.modelId,
        plannedQuantity: qty,
        targetSizes,
        responsibleWorker: orderFormData.responsibleWorker,
        notes: orderFormData.notes
      });

      if (res.success) {
        notify("Ishlab chiqarish buyurtmasi ochildi!", res.message, "success");
        setShowOrderModal(false);
        triggerRefresh();
      }
    } catch (err) {
      notify("Buyurtma ochib bo'lmadi", err.message, "error");
    }
  };

  const handleAdvanceStage = async (order, nextStage) => {
    try {
      const res = await api.put(`/production/orders/${order.id}/stage`, {
        stage: nextStage,
        completedQuantity: order.plannedQuantity
      });

      if (res.success) {
        if (nextStage === 'yakunlandi') {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
          notify("Ishlab chiqarish yakunlandi!", "Tayyor kiyimlar omborga kirim qilindi", "success");
        } else {
          notify("Bosqich yangilandi", `${order.orderNumber} -> ${nextStage}`);
        }
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Scissors className="w-5 h-5 text-purple-500" />
            Kiyim Ishlab Chiqarish va Tikuv Jarayoni (BOM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Retseptura (BOM), tannarx kalkulyatsiyasi, bichuv va tikuv buyurtmalari monitoringi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModelModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-purple-500/30 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-purple-500" />
            Yangi Model (BOM)
          </button>

          <button
            onClick={() => {
              if (models.length > 0 && !orderFormData.modelId) {
                setOrderFormData(prev => ({ ...prev, modelId: models[0].id }));
              }
              setShowOrderModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4" />
            Yangi Buyurtma Boshlash
          </button>
        </div>
      </div>

      {/* 1. Kiyim Modellari va Tannarx Kalkulyatori (BOM Cards) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Shirt className="w-4 h-4 text-teal-500" />
          Kiyim Retsepturalari va Jonli Tannarx (BOM)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map(model => (
            <div
              key={model.id}
              className="ios-glass-card p-6 rounded-3xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    {model.sku}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{model.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{model.category}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">1 dona tannarxi:</span>
                  <span className="text-base font-black text-teal-600 dark:text-teal-400">
                    {formatMoney(model.calculatedTotalCost)}
                  </span>
                </div>
              </div>

              {/* Tannarx Tarkibi */}
              <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-100/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                <div>
                  <span className="text-slate-400 block">Mato sarfi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{model.fabricConsumptionPerUnit} metr</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Furnitura:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(model.accessoriesCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ish haqi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(model.laborCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sotuv narxi:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(model.suggestedWholesalePrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Faol Ishlab Chiqarish Buyurtmalari */}
      <div className="ios-glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-500" />
          Ishlab Chiqarish Buyurtmalari va Jarayon Bosqichlari
        </h3>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Hozirda faol ishlab chiqarish buyurtmalari yo'q.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(ord => {
              const stageInfo = getProductionStageInfo(ord.stage);

              return (
                <div
                  key={ord.id}
                  className="p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-4 ios-glass"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{ord.orderNumber}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${stageInfo.color}`}>
                          {stageInfo.label}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{ord.modelName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Mas'ul usta: <strong className="text-slate-800 dark:text-slate-200">{ord.responsibleWorker}</strong> • Boshlangan sana: {formatDate(ord.startDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Rejalashtirilgan:</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{ord.plannedQuantity} dona</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Sarf mato:</span>
                        <span className="text-lg font-black text-teal-600 dark:text-teal-400">{formatMeters(ord.totalFabricMetersUsed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bosqichlar */}
                  <div className="grid grid-cols-5 gap-2 text-[11px] font-semibold text-center">
                    {[
                      { key: 'rejalashtirilgan', label: '1. Reja' },
                      { key: 'bichuvda', label: '2. Bichuv' },
                      { key: 'tikuvda', label: '3. Tikuv' },
                      { key: 'sifat_nazorati', label: '4. QC Nazorat' },
                      { key: 'yakunlandi', label: '5. Tayyor' },
                    ].map((st) => {
                      const stagesOrder = ['rejalashtirilgan', 'bichuvda', 'tikuvda', 'sifat_nazorati', 'yakunlandi'];
                      const currentIdx = stagesOrder.indexOf(ord.stage);
                      const thisIdx = stagesOrder.indexOf(st.key);
                      const isDone = thisIdx <= currentIdx;

                      return (
                        <div
                          key={st.key}
                          className={`p-2.5 rounded-2xl border ${
                            isDone
                              ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 font-bold'
                              : 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/5'
                          }`}
                        >
                          {st.label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Keyingi Bosqich Tugmasi */}
                  {stageInfo.next && (
                    <div className="flex justify-end pt-2 border-t border-slate-200/80 dark:border-white/10">
                      <button
                        onClick={() => handleAdvanceStage(ord, stageInfo.next)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-2xl text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all active:scale-95"
                      >
                        <span>{stageInfo.nextLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Yangi Kiyim Modeli Modali */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 ios-glass border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Yangi Kiyim Modeli va Retsepturasi (BOM)
              </h3>
              <button onClick={() => setShowModelModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateModel} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Model Nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Klassik Erkaklar Ko'ylagi"
                    value={modelFormData.name}
                    onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Model Kodi / SKU</label>
                  <input
                    type="text"
                    placeholder="MOD-SHIRT-01"
                    value={modelFormData.sku}
                    onChange={(e) => setModelFormData({ ...modelFormData, sku: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Kerakli Asosiy Mato Turi *</label>
                <select
                  value={modelFormData.requiredFabricId}
                  onChange={(e) => setModelFormData({ ...modelFormData, requiredFabricId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {fabrics.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mato Sarfi (metr) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={modelFormData.fabricConsumptionPerUnit}
                    onChange={(e) => setModelFormData({ ...modelFormData, fabricConsumptionPerUnit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Furnitura (so'm)</label>
                  <input
                    type="number"
                    value={modelFormData.accessoriesCost}
                    onChange={(e) => setModelFormData({ ...modelFormData, accessoriesCost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tikuvchi Haqi (so'm)</label>
                  <input
                    type="number"
                    value={modelFormData.laborCost}
                    onChange={(e) => setModelFormData({ ...modelFormData, laborCost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sotuv Narxi (so'm)</label>
                  <input
                    type="number"
                    value={modelFormData.suggestedWholesalePrice}
                    onChange={(e) => setModelFormData({ ...modelFormData, suggestedWholesalePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModelModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md"
                >
                  Modelni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yangi Buyurtma Modali */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 ios-glass border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Yangi Ishlab Chiqarish Topshirig'i (Bichuv)
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Modelni Tanlang *</label>
                <select
                  value={orderFormData.modelId}
                  onChange={(e) => setOrderFormData({ ...orderFormData, modelId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku}) • 1 donaga {m.fabricConsumptionPerUnit}m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Jami Miqdor (dona) *</label>
                <input
                  type="number"
                  min="1"
                  value={orderFormData.plannedQuantity}
                  onChange={(e) => setOrderFormData({ ...orderFormData, plannedQuantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-teal-600 dark:text-teal-400 font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">O'lchamlar bo'yicha taqsimot (dona)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['S', 'M', 'L', 'XL'].map((sz) => (
                    <div key={sz}>
                      <span className="text-[10px] text-slate-400 block text-center font-bold">{sz}</span>
                      <input
                        type="number"
                        value={orderFormData[`size${sz}`]}
                        onChange={(e) => setOrderFormData({ ...orderFormData, [`size${sz}`]: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-center text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mas'ul Usta</label>
                <input
                  type="text"
                  value={orderFormData.responsibleWorker}
                  onChange={(e) => setOrderFormData({ ...orderFormData, responsibleWorker: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-slate-950 bg-teal-500 hover:bg-teal-400 rounded-xl shadow-md"
                >
                  Buyurtmani Boshlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
