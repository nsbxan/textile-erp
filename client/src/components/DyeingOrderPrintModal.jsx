import React from 'react';
import { useApp } from '../context/AppContext';
import { formatKg, formatUsd, formatUzs, formatDate } from '../utils/formatters';
import { Printer, X, Droplets, Calendar, Building, Palette, Phone, User, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getPantoneHex } from '../utils/pantonePalette';

export default function DyeingOrderPrintModal() {
  const { lang, loc, usdRate, printDyeingOrderData, setPrintDyeingOrderData, settings } = useApp();

  if (!printDyeingOrderData) return null;

  const order = printDyeingOrderData;
  const company = settings || {};
  const rate = usdRate || 12850;
  const colorHex = order.colorHex || getPantoneHex(order.pantoneCode) || '#101820';

  const handlePrint = () => {
    window.print();
  };

  const statusLabel = {
    yuborildi: lang === 'cyr' ? 'ЮБОРИЛДИ (ЙЎЛДА)' : "YUBORILDI (YO'LDA)",
    boyalmoqda: lang === 'cyr' ? 'БЎЯЛМОҚДА' : "BO'YALMOQDA",
    tayyor: lang === 'cyr' ? 'ТАЙЁР (ОЛИБ КЕЛИШ)' : "TAYYOR (OLIB KELISH)",
    qaytdi: lang === 'cyr' ? 'ТАЙЁР (ОЛИБ КЕЛИШ)' : "TAYYOR (OLIB KELISH)",
    qabul_qilindi: lang === 'cyr' ? 'ОМБОРГА ҚАБУЛ ҚИЛИНГАН' : "OMBORGA QABUL QILINGAN"
  }[order.status] || order.status?.toUpperCase();

  const totalCostUsd = Number(order.totalDyeingCostUsd || (Number(order.sentKg || 0) * Number(order.dyeingPricePerKgUsd || 0.85)).toFixed(2));
  const totalCostUzs = Math.round(totalCostUsd * rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Yuqori boshqaruv paneli (faqat ekranda ko'rinadi) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Бўёқхона Буюртмаси & Жўнатма Ҳужжати" : "Bo'yoqxona Buyurtmasi & Jo'natma Hujjati"}
              </h3>
              <p className="text-xs text-slate-500">{order.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'cyr' ? "Чоп Этиш (Print)" : "Chop Etish (Print)"}</span>
            </button>
            <button
              onClick={() => setPrintDyeingOrderData(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHOP ETILADIGAN BLANKA (A4 standarti) */}
        <div className="printable-area bg-white text-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* 1. Header (Kompaniya rekvizitlari & Hujjat nomi) */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-bold text-purple-700 tracking-wider uppercase">
                {loc(company.brandName || "TextilePro Uzbekistan")}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                {loc(company.companyName || "Silk & Cotton Textile MCHJ")}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {company.phone || "+998 71 200 45 60"} • {loc(company.address || "Toshkent sh., To'qimachilar sanoat zonasi")}
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === 'cyr' ? "Мато Бўяш ва Қайта Ишлаш Департаменти" : "Mato Bo'yash va Qayta Ishlash Departamenti"}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg bg-purple-100 text-purple-900 font-mono font-black text-xs border border-purple-300">
                {statusLabel}
              </span>
              <div className="font-mono text-base font-black text-slate-900 mt-1.5">
                № {order.orderNumber}
              </div>
              <div className="text-xs text-slate-600">
                {lang === 'cyr' ? "Жўнатма санаси:" : "Jo'natma sanasi:"} <strong>{formatDate(order.dispatchDate || order.createdAt, lang)}</strong>
              </div>
            </div>
          </div>

          {/* 2. HAMKOR BO'YOQXONA VA MUDDATI BANNERI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-purple-50 border-2 border-purple-300">
            <div className="space-y-1">
              <span className="text-[10px] text-purple-800 uppercase font-black tracking-wider block flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-purple-700" />
                <span>{lang === 'cyr' ? "Қабул қилувчи бўёқхона (Ижрочи):" : "Qabul qiluvchi bo'yoqxona (Ijrochi):"}</span>
              </span>
              <div className="text-base font-black text-slate-950">
                {order.dyehouseName}
              </div>
              <div className="text-xs text-slate-600">
                {lang === 'cyr' ? "Масъул шахс:" : "Mas'ul shaxs:"} <strong>{order.responsiblePerson || "Bo'yoqxona Ustasi"}</strong>
              </div>
            </div>

            {/* MUDDATI (DEADLINE) - Ajralib turadigan kutilayotgan qaytish sanasi */}
            <div className="space-y-1 md:text-right border-t md:border-t-0 md:border-l border-purple-200 pt-2 md:pt-0 md:pl-4">
              <span className="text-[10px] text-purple-800 uppercase font-black tracking-wider block flex md:justify-end items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>{lang === 'cyr' ? "ТАЙЁР БЎЛИШ МУДДАТИ (DEADLINE):" : "TAYYOR BO'LISH MUDDATI (DEADLINE):"}</span>
              </span>
              <div className="text-xl md:text-2xl font-black text-rose-700 font-mono">
                📅 {order.expectedReturnDate || "Belgilanmagan (3-5 kun)"}
              </div>
              <div className="text-[11px] font-bold text-slate-700">
                {lang === 'cyr' ? "Бўяб фабрикага қайтариш санаси" : "Bo'yab fabrikaga qaytarish sanasi"}
              </div>
            </div>
          </div>

          {/* 3. MATO TURI VA RANG (PANTONE TCX) PARAMETRLARI */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>{lang === 'cyr' ? "1. Мато ва Бўяш Ранги (Pantone TCX)" : "1. Mato va Bo'yash Rangi (Pantone TCX)"}</span>
              <span className="text-[11px] font-bold text-purple-700">🎨 Standart Pantone Formula</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Юборилган Хом Мато:" : "Yuborilgan Xom Mato:"}</span>
                <strong className="text-sm font-black text-slate-900 block mt-0.5">{loc(order.fabricName)}</strong>
                <span className="text-[11px] text-slate-500">{order.fabricId ? `Kod: ${order.fabricId}` : ''}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {/* Rang vizual swatch belgisi */}
                <div
                  className="w-12 h-12 rounded-xl border-2 border-slate-400 shrink-0 shadow-sm flex items-center justify-center text-[10px] font-mono font-black"
                  style={{ backgroundColor: colorHex }}
                />
                <div className="min-w-0">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Бўяладиган Ранг:" : "Bo'yaladigan Rang:"}</span>
                  <div className="text-sm font-black text-slate-900">{order.colorName}</div>
                  <div className="font-mono text-xs font-bold text-purple-700 mt-0.5">
                    {order.pantoneCode || "STANDART"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. YUBORILGAN VAZN (KG) VA XIZMAT SUMMASI */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200">
              {lang === 'cyr' ? "2. Вазн ва Ҳисоб-Китоб Маълумотлари" : "2. Vazn va Hisob-Kitob Ma'lumotlari"}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Юборилган Вазн (КГ):" : "Yuborilgan Vazn (KG):"}
                </span>
                <div className="text-2xl font-black text-purple-900 mt-1">
                  {formatKg(order.sentKg, lang)}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                  {((order.sentKg || 0) / 1000).toFixed(2)} {lang === 'cyr' ? 'тонна хом мато' : 'tonna xom mato'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Бўяш Хизмати Қиймати:" : "Bo'yash Xizmati Qiymati:"}
                </span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {formatUsd(totalCostUsd)}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {formatUzs(totalCostUzs, lang)} ({formatUsd(order.dyeingPricePerKgUsd || 0.85)}/kg)
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Увалка (Киришиш) Меъёри:" : "Uvalka (Kirishish) Me'yori:"}
                </span>
                <div className="text-base font-black text-rose-700 mt-1">
                  ~ 5.0 % (Maksimal)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'cyr' ? "Кутилаётган соф чиқиш:" : "Kutilayotgan sof chiqish:"} ~{((order.sentKg || 0) * 0.95).toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>

          {/* 5. Maxsus ko'rsatmalar & Izoh */}
          {order.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 uppercase font-bold text-[10px] block mb-0.5">
                {lang === 'cyr' ? "Бўёқхона Учун Махсус Кўрсатмалар:" : "Bo'yoqxona Uchun Maxsus Ko'rsatmalar:"}
              </span>
              <p className="text-slate-800 italic">{order.notes}</p>
            </div>
          )}

          {/* 6. QR Kod & Traceability */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-900">
                {lang === 'cyr' ? "Рақамли Кузатув ва Текширув (Dyeing Tracking):" : "Raqamli Kuzatuv va Tekshiruv (Dyeing Tracking):"}
              </div>
              <div className="font-mono text-slate-600 text-[10px]">
                ERP-BATCH: {order.orderNumber} • PANTONE: {order.pantoneCode}
              </div>
              <div className="text-[10px] text-slate-500">
                {lang === 'cyr' ? "Қабул қилишда QR кодни сканерлаш орқали увалка ва соф вазн ҳисобланади" : "Qabul qilishda QR kodni skanerlash orqali uvalka va sof vazn hisoblanadi"}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              <QRCodeSVG
                value={`TEXTILEPRO-DYEING:${order.orderNumber}|KG:${order.sentKg}|COLOR:${order.colorName}|PANTONE:${order.pantoneCode}`}
                size={64}
                level="M"
              />
            </div>
          </div>

          {/* 7. Rasmiy Tasdiq & Imzolar */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Жўнатди (Фабрика Масъули):" : "Jo'natdi (Fabrika Mas'uli):"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-900 font-bold text-xs">
                {order.responsiblePerson || "Botir Rahimov"}
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Ҳайдовчи / Экспедитор:" : "Haydovchi / Ekspeditor:"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                (Imzo / Avtomobil raqami)
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Қабул қилди (Бўёқхона):" : "Qabul qildi (Bo'yoqxona):"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                (Muhr / Imzo)
              </div>
            </div>
          </div>
        </div>

        {/* Tugmalar (no-print) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 no-print">
          <button
            onClick={() => setPrintDyeingOrderData(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {lang === 'cyr' ? "Ёпиш" : "Yopish"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'cyr' ? "Чоп Этиш (Print)" : "Chop Etish (Print)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
