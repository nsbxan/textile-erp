import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatKg, formatUsd, formatDualCurrency, getQualityGradeBadge } from '../utils/formatters';
import {
  X,
  Scan,
  Scissors,
  ShoppingCart,
  ShieldAlert,
  Camera,
  CameraOff,
  AlertTriangle,
  QrCode
} from 'lucide-react';

export default function QRScannerModal() {
  const {
    lang,
    loc,
    usdRate,
    qrScannerOpen,
    setQrScannerOpen,
    setCutModalRoll,
    setDefectModalRoll,
    setActiveTab,
    notify
  } = useApp();

  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);

  const startCamera = async () => {
    setError(null);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          handleLookup(decodedText);
          stopCamera();
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      setError(lang === 'cyr' ? "Камерага уланиб бўлмади. Кодни қўлда киритинг." : "Kameraga ulanib bo'lmadi. Kodni qo'lda kiriting.");
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (!qrScannerOpen) {
      stopCamera();
      setScanResult(null);
      setError(null);
      setManualCode('');
    }
  }, [qrScannerOpen]);

  const handleLookup = async (codeToSearch) => {
    const code = (codeToSearch || manualCode).trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await api.get(`/qr/lookup/${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        setScanResult(res);
        notify(
          lang === 'cyr' ? "Рулон топилди!" : "Rulon topildi!",
          `${res.data.roll?.id || code}`,
          'success'
        );
      }
    } catch (err) {
      setError(err.message || (lang === 'cyr' ? "Ушбу код бўйича рулон топилмади" : "Ushbu kod bo'yicha rulon topilmadi"));
    } finally {
      setLoading(false);
    }
  };

  if (!qrScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "QR Код Сканери & Тезкор Қидирув" : "QR Kod Skaneri & Tezkor Qidiruv"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'cyr' ? "Мато рулони ёрлиғидаги QR кодни сканерланг" : "Mato ruloni yorlig'idagi QR kodni skanerlang"}
              </p>
            </div>
          </div>
          <button onClick={() => setQrScannerOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kamera */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'cyr' ? "1. Камера орқали сканерлаш:" : "1. Kamera orqali skanerlash:"}
            </span>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Камерани Ёқиш" : "Kamerani Yoqish"}</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Камерани Ўчириш" : "Kamerani O'chirish"}</span>
              </button>
            )}
          </div>

          <div
            id="qr-reader"
            className={`w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 text-xs ${
              cameraActive ? 'min-h-[220px]' : 'h-14'
            }`}
          >
            {!cameraActive && (
              <span>{lang === 'cyr' ? "Камерани ёқиш тугмасини босинг" : "Kamerani yoqish tugmasini bosing"}</span>
            )}
          </div>
        </div>

        {/* Qo'lda kod kiritish */}
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {lang === 'cyr' ? "2. Ёки рулон кодини қўлда киритинг:" : "2. Yoki rulon kodini qo'lda kiriting:"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masalan: ROL-2026-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              {loading ? "..." : (lang === 'cyr' ? "Қидириш" : "Qidirish")}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Topilgan Rulon Ma'lumoti */}
        {scanResult && scanResult.data && (
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {scanResult.data.roll?.id}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm mt-1">
                  {loc(scanResult.data.fabric?.name)}
                </h4>
                <div className="text-xs text-purple-700 dark:text-purple-300 font-bold">
                  🎨 {loc(scanResult.data.roll?.colorName)} {scanResult.data.roll?.pantoneCode && `(${scanResult.data.roll?.pantoneCode})`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold">{lang === 'cyr' ? "Вазн:" : "Vazn:"}</div>
                <div className="text-lg font-black text-teal-700 dark:text-teal-300">
                  {formatKg(scanResult.data.roll?.currentKg, lang)}
                </div>
                <div className="text-[11px] font-bold text-emerald-600">
                  {formatUsd(scanResult.data.roll?.sellingPricePerKgUsd)}/kg
                </div>
              </div>
            </div>

            {/* Tezkor amallar */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-200 dark:border-teal-800">
              <button
                onClick={() => {
                  setCutModalRoll(scanResult.data.roll);
                  setQrScannerOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Кесиш" : "Kesish"}</span>
              </button>

              <button
                onClick={() => {
                  setDefectModalRoll(scanResult.data.roll);
                  setQrScannerOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Нуқсон" : "Nuqson"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sales');
                  setQrScannerOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Савдо" : "Savdo"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
