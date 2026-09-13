import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Settings as SettingsIcon,
  DollarSign,
  Building,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  Printer,
  Droplets,
  Languages,
  Mail,
  Key,
  Send,
  ShieldCheck
} from 'lucide-react';

export default function Settings() {
  const { lang, loc, setLang, usdRate, setUsdRate, notify, refreshSignal, triggerRefresh } = useApp();

  const [formData, setFormData] = useState({
    companyName: '',
    brandName: '',
    phone: '',
    email: '',
    address: '',
    currency: 'USD',
    usdExchangeRate: 12850,
    dyehouses: [],
    standardShrinkageTolerance: 5.0,
    receiptFooter: '',
    labelPrinterSize: '58mm',
    smtp: {
      user: '',
      pass: '',
      host: 'smtp.gmail.com',
      port: 465
    }
  });

  const [newDyehouseInput, setNewDyehouseInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.success && res.data) {
          setFormData(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshSignal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/settings', formData);
      if (res.success) {
        setUsdRate(Number(formData.usdExchangeRate || 12850));
        notify(
          lang === 'cyr' ? "Созламалар сақланди" : "Sozlamalar saqlandi",
          res.message,
          'success'
        );
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message, 'error');
    }
  };

  const handleAddDyehouse = () => {
    if (!newDyehouseInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      dyehouses: [...(prev.dyehouses || []), newDyehouseInput.trim()]
    }));
    setNewDyehouseInput('');
  };

  const handleRemoveDyehouse = (index) => {
    setFormData(prev => ({
      ...prev,
      dyehouses: prev.dyehouses.filter((_, i) => i !== index)
    }));
  };

  const handleDownloadBackup = () => {
    window.open('http://localhost:5000/api/settings/backup', '_blank');
  };

  const handleTestEmail = async () => {
    const targetEmail = formData.smtp?.user || formData.email;
    if (!targetEmail) {
      notify("Xatolik", "Avval Gmail manzilingizni kiriting", "error");
      return;
    }
    if (!formData.smtp?.pass) {
      notify("Xatolik", "Google App Password (16 xonali maxfiy parol) kiriting", "error");
      return;
    }

    try {
      setTestingEmail(true);
      // Avval sozlamalarni saqlaymiz
      await api.post('/settings', formData);
      const res = await api.post('/settings/test-email', { email: targetEmail });
      notify("Muvaffaqiyatli", res.message, "success");
    } catch (err) {
      notify("Email xatosi", err.message || "Email yuborishda xatolik yuz berdi", "error");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <span>{lang === 'cyr' ? "Тизим Созламалари & Захиралаш" : "Tizim Sozlamalari & Zaxiralash"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Доллар курси, корхона реквизитлари, ҳамкор бўёқхоналар ва маълумотлар базаси нусхаси."
              : "Dollar kursi, korxona rekvizitlari, hamkor bo'yoqxonalar va ma'lumotlar bazasi nusxasi."}
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-teal-600" />
          <span>{lang === 'cyr' ? "База Захирасини Юклаб Олиш (JSON)" : "Baza Zaxirasini Yuklab Olish (JSON)"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Valyuta va Dollar Kursi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'cyr' ? "Валюта & Доллар Курси" : "Valyuta & Dollar Kursi"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "1 АҚШ Доллари курси (Сўмда):" : "1 AQSH Dollari kursi (So'mda):"} *
              </label>
              <input
                type="number"
                value={formData.usdExchangeRate}
                onChange={(e) => setFormData({ ...formData, usdExchangeRate: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 text-base font-black rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'cyr'
                  ? "Савдо ва инвойсларда сўм қиймати автоматик ҳисобланади."
                  : "Savdo va invoyslarda so'm qiymati avtomatik hisoblanadi."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Стандарт Увалка (Бўяшдаги йўқотиш) Меъёри %:" : "Standart Uvalka (Bo'yashdagi yo'qotish) Me'yori %:"}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.standardShrinkageTolerance}
                onChange={(e) => setFormData({ ...formData, standardShrinkageTolerance: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Hamkor Bo'yoqxonalar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Droplets className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'cyr' ? "Ҳамкор Бўёқхона Заводлари" : "Hamkor Bo'yoqxona Zavodlari"}
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={lang === 'cyr' ? "Янги бўёқхона номи..." : "Yangi bo'yoqxona nomi..."}
                value={newDyehouseInput}
                onChange={(e) => setNewDyehouseInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddDyehouse}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                + {lang === 'cyr' ? "Қўшиш" : "Qo'shish"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(formData.dyehouses || []).map((dh, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold"
                >
                  <span>{dh}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDyehouse(idx)}
                    className="text-purple-500 hover:text-rose-600 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Korxona Rekvizitlari */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Building className="w-5 h-5 text-teal-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'cyr' ? "Корхона Реквизитлари & Чек Текстлари" : "Korxona Rekvizitlari & Chek Matnlari"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Бренд Номи" : "Brend Nomi"}
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Корхона Юридик Номи" : "Korxona Yuridik Nomi"}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Манзил" : "Manzil"}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Инвойс / Чек Пастки Қисми Матн" : "Invoys / Chek Pastki Qismi Matn"}
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Email Xabarnomalar & SMTP (Gmail) Sozlamalari */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'cyr' ? "Email Хабарномалар & SMTP (Gmail) Созламалари" : "Email Xabarnomalar & SMTP (Gmail) Sozlamalari"}
              </h3>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
              formData.smtp?.isConfigured || formData.smtp?.user
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
            }`}>
              {formData.smtp?.isConfigured || formData.smtp?.user ? "✅ Faol va Sozlangan" : "Sozlanmagan"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed">
            <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Gmail orqali foydalanuvchilar emailiga haqiqiy tasdiqlash kodi yuborish:
            </p>
            <p className="text-[11px]">
              1. Google hisobingizda <b>2 bosqichli tekshirish</b> (2-Step Verification) ni yoqing.<br/>
              2. <b>Google Hisob &gt; Xavfsizlik &gt; Ilova parollari (App Passwords)</b> bo'limiga kirib yangi 16 xonali parol oling.<br/>
              3. Olingan 16 xonali maxsus parolni pastdagi <b>«Google App Password»</b> katagiga kiriting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Юборувчи Gmail / Email" : "Yuboruvchi Gmail / Email"}
              </label>
              <input
                type="email"
                placeholder="masalan: textile.erp.uz@gmail.com"
                value={formData.smtp?.user || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  smtp: { ...(formData.smtp || {}), user: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'cyr' ? "Google App Password (16 хонали парол)" : "Google App Password (16 xonali maxfiy parol)"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="•••• •••• •••• ••••"
                  value={formData.smtp?.pass || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...(formData.smtp || {}), pass: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              Standart server: <b>smtp.gmail.com</b>, Port: <b>465 (SSL)</b>
            </span>
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingEmail ? "Xat yuborilmoqda..." : "Test xatini yuborish va tekshirish"}</span>
            </button>
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-black shadow-md cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'cyr' ? "Барча Созламаларни Сақлаш" : "Barcha Sozlamalarni Saqlash"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
