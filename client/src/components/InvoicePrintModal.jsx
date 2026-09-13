import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatKg, formatUsd, formatUzs, formatDualCurrency, formatDate } from '../utils/formatters';
import { Printer, X, FileText, CheckCircle2, DollarSign } from 'lucide-react';

export default function InvoicePrintModal() {
  const { lang, loc, usdRate, printInvoiceData, setPrintInvoiceData, settings } = useApp();
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' yoki 'receipt80'

  if (!printInvoiceData) return null;

  const inv = printInvoiceData;
  const company = inv.company || settings || {};
  const rate = inv.exchangeRate || usdRate || 12850;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Yuqori boshqaruv paneli (faqat ekranda) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {lang === 'cyr' ? "Мато Сотув Инвойси & Чек" : "Mato Sotuv Invoysi & Chek"} ({inv.invoiceNumber})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'a4' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                A4 {lang === 'cyr' ? "Инвойс" : "Invoys"}
              </button>
              <button
                onClick={() => setPrintFormat('receipt80')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'receipt80' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                80mm {lang === 'cyr' ? "Чек" : "Chek"}
              </button>
            </div>

            <button
              onClick={() => setPrintInvoiceData(null)}
              className="text-slate-400 hover:text-slate-600 text-xl font-bold ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHOP ETILADIGAN INVOYS HUDUDI */}
        <div className={`bg-white text-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 ${
          printFormat === 'receipt80' ? 'max-w-xs mx-auto text-xs p-4' : ''
        }`}>
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
                {loc(company.brandName || "TextilePro Uzbekistan")}
              </h2>
              <p className="text-xs text-slate-500">{loc(company.companyName || "Silk & Cotton Textile MCHJ")}</p>
              <p className="text-xs text-slate-500">{company.phone} • {loc(company.address || "")}</p>
            </div>

            <div className="text-right">
              <div className="text-xs font-black uppercase text-teal-700">
                {lang === 'cyr' ? "МАТО СОТУВ ИНВОЙСИ" : "MATO SOTUV INVOYSI"}
              </div>
              <div className="font-mono text-base font-black text-slate-950">{inv.invoiceNumber}</div>
              <div className="text-xs text-slate-500">{formatDate(inv.createdAt, lang)}</div>
              <div className="text-[11px] font-bold text-emerald-700 mt-1">
                {lang === 'cyr' ? "Курс:" : "Kurs:"} 1$ = {Number(rate).toLocaleString()} {lang === 'cyr' ? 'сўм' : "so'm"}
              </div>
            </div>
          </div>

          {/* Xaridor ma'lumotlari */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-0.5">
              {lang === 'cyr' ? "Харидор / Мижоз:" : "Xaridor / Mijoz:"}
            </span>
            <strong className="text-sm font-black text-slate-900">{inv.customerName}</strong>
            {inv.customer && inv.customer.phone && (
              <span className="text-slate-500 ml-2">({inv.customer.phone})</span>
            )}
          </div>

          {/* Mahsulotlar jadvali (KG va USD) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="py-2">{lang === 'cyr' ? "Рулон №" : "Rulon №"}</th>
                  <th className="py-2">{lang === 'cyr' ? "Мато & Ранги" : "Mato & Rangi"}</th>
                  <th className="py-2 text-right">{lang === 'cyr' ? "Вазн (кг)" : "Vazn (kg)"}</th>
                  <th className="py-2 text-right">{lang === 'cyr' ? "Нархи ($/кг)" : "Narxi ($/kg)"}</th>
                  <th className="py-2 text-right">{lang === 'cyr' ? "Жами ($)" : "Jami ($)"}</th>
                  <th className="py-2 text-right">{lang === 'cyr' ? "Жами (Сўм)" : "Jami (So'm)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(inv.items || []).map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2 font-mono font-bold text-slate-900">{item.rollCode || item.rollId}</td>
                    <td className="py-2 font-bold text-slate-900">
                      {loc(item.fabricName)}
                      <div className="text-[10px] text-purple-700 font-medium">
                        🎨 {loc(item.colorName)} {item.pantoneCode && `(${item.pantoneCode})`}
                      </div>
                    </td>
                    <td className="py-2 text-right font-black text-slate-900">{formatKg(item.kg, lang)}</td>
                    <td className="py-2 text-right font-bold text-slate-700">{formatUsd(item.unitPriceUsd)}</td>
                    <td className="py-2 text-right font-black text-slate-950">{formatUsd(item.lineTotalUsd)}</td>
                    <td className="py-2 text-right font-semibold text-slate-600">{formatUzs(item.lineTotalUzs, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Jami sumalar */}
          <div className="border-t-2 border-slate-900 pt-3 space-y-1.5 text-xs text-right">
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-slate-500 font-bold">{lang === 'cyr' ? "ЖАМИ ($ USD):" : "JAMI ($ USD):"}</span>
              <strong className="text-xl font-black text-slate-950">{formatUsd(inv.totalAmountUsd)}</strong>
            </div>

            <div className="flex justify-end gap-8 text-xs">
              <span className="text-slate-500 font-bold">{lang === 'cyr' ? "ЖАМИ (Сўмда):" : "JAMI (So'mda):"}</span>
              <strong className="text-sm font-black text-emerald-700">{formatUzs(inv.totalAmountUzs, lang)}</strong>
            </div>

            <div className="flex justify-end gap-8 pt-1 text-slate-600">
              <span>{lang === 'cyr' ? "Тўланган сумма:" : "To'langan summa:"}</span>
              <span className="font-bold">
                {inv.paidAmountUsd > 0 && `${formatUsd(inv.paidAmountUsd)} `}
                {inv.paidAmountUzs > 0 && `(${formatUzs(inv.paidAmountUzs, lang)})`}
                {(!inv.paidAmountUsd && !inv.paidAmountUzs) && "$0.00"}
              </span>
            </div>

            {inv.remainingDebtUsd > 0.05 && (
              <div className="flex justify-end gap-8 text-rose-700 font-bold pt-1">
                <span>{lang === 'cyr' ? "Қолган Насия (Қарз):" : "Qolgan Nasiya (Qarz):"}</span>
                <strong className="text-sm">{formatDualCurrency(inv.remainingDebtUsd, rate, lang)}</strong>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
            {loc(company.receiptFooter || "Xaridingiz uchun tashakkur! Mato og'irligi va sifatiga to'liq kafolat beriladi.")}
          </div>
        </div>

        {/* Tugmalar */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 no-print">
          <button
            onClick={() => setPrintInvoiceData(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            {lang === 'cyr' ? "Ёпиш" : "Yopish"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'cyr' ? "Чоп Этиш" : "Chop Etish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
