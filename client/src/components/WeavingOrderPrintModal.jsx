import React from 'react';
import { useApp } from '../context/AppContext';
import { formatKg, formatWeightTonnes, formatDate } from '../utils/formatters';
import { Printer, X, Cpu, Calendar, User, Clock, Layers, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function WeavingOrderPrintModal() {
  const { lang, loc, printWeavingOrderData, setPrintWeavingOrderData, settings } = useApp();

  if (!printWeavingOrderData) return null;

  const order = printWeavingOrderData;
  const company = settings || {};

  const handlePrint = () => {
    window.print();
  };

  const statusLabel = {
    yangi: lang === 'cyr' ? 'ЯНГИ БУЮРТМА' : 'YANGI BUYURTMA',
    toqilmoqda: lang === 'cyr' ? 'ТЎҚИЛМОҚДА' : "TO'QILMOQDA",
    bajarildi: lang === 'cyr' ? 'БАЖАРИЛДИ' : 'BAJARILDI'
  }[order.status] || order.status?.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Yuqori boshqaruv paneli (faqat ekranda ko'rinadi) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'cyr' ? "Тўқув Буюртмаси & Технологик Топшириқ" : "To'quv Buyurtmasi & Texnologik Topshiriq"}
              </h3>
              <p className="text-xs text-slate-500">{order.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'cyr' ? "Чоп Этиш (Print)" : "Chop Etish (Print)"}</span>
            </button>
            <button
              onClick={() => setPrintWeavingOrderData(null)}
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
              <div className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                {loc(company.brandName || "TextilePro Uzbekistan")}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                {loc(company.companyName || "Silk & Cotton Textile MCHJ")}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {company.phone || "+998 71 200 45 60"} • {loc(company.address || "Toshkent sh., To'qimachilar sanoat zonasi")}
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === 'cyr' ? "Тўқув Ишлаб Чиқариш Департаменти" : "To'quv Ishlab Chiqarish Departamenti"}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-black text-xs border border-amber-300">
                {statusLabel}
              </span>
              <div className="font-mono text-base font-black text-slate-900 mt-1.5">
                № {order.orderNumber}
              </div>
              <div className="text-xs text-slate-600">
                {lang === 'cyr' ? "Берилган сана:" : "Berilgan sana:"} <strong>{formatDate(order.dispatchDate || order.createdAt, lang)}</strong>
              </div>
            </div>
          </div>

          {/* 2. MUHIM: MUDDATI & BUYURTMACHI BANNERI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 uppercase font-black tracking-wider block">
                {lang === 'cyr' ? "Буюртмачи / Мижоз:" : "Buyurtmachi / Mijoz:"}
              </span>
              <div className="text-base font-black text-slate-950">
                {order.customerName || "Ichki Ishlab Chiqarish"}
              </div>
              <div className="text-xs text-slate-600">
                {lang === 'cyr' ? "Мақсад: Тўқув цехида хом мато тўқиб чиқариш" : "Maqsad: To'quv sexida xom mato to'qib chiqarish"}
              </div>
            </div>

            {/* MUDDATI (DEADLINE) - Eng asosiy ajralib turadigan blok */}
            <div className="space-y-1 md:text-right border-t md:border-t-0 md:border-l border-amber-200 pt-2 md:pt-0 md:pl-4">
              <span className="text-[10px] text-amber-800 uppercase font-black tracking-wider block flex md:justify-end items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'cyr' ? "ТОПШИРИШ МУДДАТИ (DEADLINE):" : "TOPSHIRISH MUDDATI (DEADLINE):"}</span>
              </span>
              <div className="text-xl md:text-2xl font-black text-rose-700 font-mono">
                📅 {order.deadline || "Belgilanmagan"}
              </div>
              <div className="text-[11px] font-bold text-slate-700">
                {lang === 'cyr' ? "Тўлиқ тўқиб омборга топшириш санаси" : "To'liq to'qib omborga topshirish sanasi"}
              </div>
            </div>
          </div>

          {/* 3. MATO TURI VA ASOSIY PARAMETRLARI */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200">
              {lang === 'cyr' ? "1. Мато ва Технологик Параметрлар" : "1. Mato va Texnologik Parametrlar"}
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Мато Номи:" : "Mato Nomi:"}</span>
                <strong className="text-sm font-black text-slate-900 block mt-0.5">{loc(order.fabricName)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Ип Партияси (Lot):" : "Ip Partiyasi (Lot):"}</span>
                <strong className="font-mono font-bold text-slate-900 block mt-0.5">{order.yarnLot || "LOT-Paxta-30/1"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Ип Таркиби / Ne:" : "Ip Tarkibi / Ne:"}</span>
                <strong className="text-slate-900 block mt-0.5">{order.yarnCount || "Ne 30/1 Paxta 100%"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'cyr' ? "Эни & Зичлиги:" : "Eni & Zichligi:"}</span>
                <strong className="text-slate-900 block mt-0.5">{order.widthCm || 180} sm • {order.densityGsm || 160} g/m²</strong>
              </div>
            </div>
          </div>

          {/* 4. BUYURTMA QILINGAN KG VA DASTGOH */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200">
              {lang === 'cyr' ? "2. Ишлаб Чиқариш Ҳажми ва Дастгоҳ Тақсимоти" : "2. Ishlab Chiqarish Hajmi va Dastgoh Taqsimoti"}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Буюртма Ҳажми (КГ):" : "Buyurtma Hajmi (KG):"}
                </span>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {formatKg(order.orderedKg, lang)}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                  {((order.orderedKg || 0) / 1000).toFixed(2)} {lang === 'cyr' ? 'тонна' : 'tonna'} • ~{Math.round((order.orderedKg || 0) / 25)} {lang === 'cyr' ? 'та рулон' : 'ta rulon'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Бириктирилган Дастгоҳ:" : "Biriktirilgan Dastgoh:"}
                </span>
                <div className="text-base font-black text-slate-900 mt-1 flex items-center gap-1">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  <span>{order.loomName || "Picanol OmniPlus-1"}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'cyr' ? "Масъул Уста:" : "Mas'ul Usta:"} <strong>{order.operator || "Rustam Karimov"}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">
                  {lang === 'cyr' ? "Сифат ва Ўлчов Назорати:" : "Sifat va O'lchov Nazorati:"}
                </span>
                <div className="text-sm font-black text-emerald-700 mt-1">
                  {order.qualityGrade || "1-nav Standart"}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'cyr' ? "Ҳар 1 рулон: 20-30 кг (ўртача 25 кг)" : "Har 1 rulon: 20-30 kg (o'rtacha 25 kg)"}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Maxsus ko'rsatmalar & Izoh */}
          {order.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 uppercase font-bold text-[10px] block mb-0.5">
                {lang === 'cyr' ? "Қўшимча Технологик Кўрсатмалар:" : "Qo'shimcha Texnologik Ko'rsatmalar:"}
              </span>
              <p className="text-slate-800 italic">{order.notes}</p>
            </div>
          )}

          {/* 6. QR Kod & Shtrix-kod identifikatori */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-900">
                {lang === 'cyr' ? "Рақамли Маркировка ва Кузатув (Traceability):" : "Raqamli Markirovka va Kuzatuv (Traceability):"}
              </div>
              <div className="font-mono text-slate-600 text-[10px]">
                ERP-UID: {order.id} • {order.orderNumber}
              </div>
              <div className="text-[10px] text-slate-500">
                {lang === 'cyr' ? "QR код тўқув ва омбор сканери орқали текshирилади" : "QR kod to'quv va ombor skaneri orqali tekshiriladi"}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              <QRCodeSVG
                value={`TEXTILEPRO-WEAVING:${order.orderNumber}|KG:${order.orderedKg}|D:${order.deadline}`}
                size={64}
                level="M"
              />
            </div>
          </div>

          {/* 7. Rasmiy Tasdiq & Imzolar */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Буюртма берди (Раҳбарият):" : "Buyurtma berdi (Rahbariyat):"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                (Imzo / Sana)
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Бош Технолог:" : "Bosh Texnolog:"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                (Imzo / Muhr)
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {lang === 'cyr' ? "Қабул қилди (Цех Устаси):" : "Qabul qildi (Sex Ustasi):"}
              </div>
              <div className="border-b border-slate-400 pb-1 text-slate-900 font-bold text-xs">
                {order.operator || "Rustam Karimov"}
              </div>
            </div>
          </div>
        </div>

        {/* Tugmalar (no-print) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 no-print">
          <button
            onClick={() => setPrintWeavingOrderData(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {lang === 'cyr' ? "Ёпиш" : "Yopish"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'cyr' ? "Чоп Этиш (Print)" : "Chop Etish (Print)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
