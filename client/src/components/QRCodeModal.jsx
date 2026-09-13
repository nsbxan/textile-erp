import React from 'react';
import { useApp } from '../context/AppContext';
import { formatKg, formatUsd, formatDate, getQualityGradeBadge } from '../utils/formatters';
import { QrCode, Printer, X, Download, Sparkles } from 'lucide-react';

export default function QRCodeModal() {
  const { lang, loc, qrModalRoll, setQrModalRoll, settings } = useApp();

  if (!qrModalRoll) return null;

  const roll = qrModalRoll;
  const gradeBadge = getQualityGradeBadge(roll.qualityGrade, lang);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roll.qrCode || `ERP-${roll.id}`)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'cyr' ? "Мато Рулони QR Ёрлиғи" : "Mato Ruloni QR Yorlig'i"}
            </h3>
          </div>
          <button
            onClick={() => setQrModalRoll(null)}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chop etiladigan yorliq kartasi (58mm / 80mm mos) */}
        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center space-y-3 print:m-0 print:border-solid print:p-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {loc(settings.brandName || "TextilePro Uzbekistan")}
          </div>

          <div className="font-mono text-base font-black text-slate-950 dark:text-white bg-slate-200 dark:bg-slate-800 py-1 px-3 rounded-lg inline-block">
            {roll.id}
          </div>

          {/* QR kod tasviri */}
          <div className="flex justify-center py-1">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-36 h-36 border-4 border-white dark:border-slate-800 rounded-xl shadow-xs"
            />
          </div>

          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              {loc(roll.fabricName)}
            </div>
            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
              🎨 {loc(roll.colorName || "Standart")} {roll.pantoneCode && `(${roll.pantoneCode})`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">
                {lang === 'cyr' ? "Соф Вазн (Нетто):" : "Sof Vazn (Netto):"}
              </span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                {formatKg(roll.currentKg || roll.netKg, lang)}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">
                {lang === 'cyr' ? "Сифат Нави:" : "Sifat Navi:"}
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {gradeBadge.label}
              </strong>
            </div>

            {roll.loomNumber && (
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  {lang === 'cyr' ? "Дастгоҳ:" : "Dastgoh:"}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{roll.loomNumber}</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">
                {lang === 'cyr' ? "Нархи ($/кг):" : "Narxi ($/kg):"}
              </span>
              <span className="font-black text-slate-900 dark:text-white">{formatUsd(roll.sellingPricePerKgUsd)}/kg</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            {formatDate(roll.receivedDate || new Date().toISOString(), lang)}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1 no-print">
          <button
            onClick={() => setQrModalRoll(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            {lang === 'cyr' ? "Ёпиш" : "Yopish"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'cyr' ? "Ёрлиқни Чоп Этиш" : "Yorliqni Chop Etish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
