import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  QrCode,
  PlusCircle,
  TrendingUp,
  Languages,
  DollarSign,
  Building,
  Check,
  ChevronDown,
  Clock,
  Calendar,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';
import { formatLiveTime, formatLiveDate } from '../utils/formatters';

export function Navbar({ onOpenNewRoll }) {
  const {
    theme,
    toggleTheme,
    lang,
    setLang,
    cycleLang,
    loc,
    usdRate,
    setUsdRate,
    setQrScannerOpen,
    settings,
    notify,
    currentUser,
    logout,
    isAdmin,
    canEdit
  } = useApp();

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [newRateInput, setNewRateInput] = useState(String(usdRate));

  // Jonli vaqt va sana (har sekundda yangilanadi)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveRate = async () => {
    const r = Number(newRateInput);
    if (!r || r <= 0) return;
    try {
      const res = await api.post('/settings/rate', { rate: r });
      if (res.success) {
        setUsdRate(r);
        setRateModalOpen(false);
        notify(
          lang === 'ru' ? "Курс обновлен" : lang === 'cyr' ? "Курс янгиланди" : "Kurs yangilandi",
          `1$ = ${r.toLocaleString()} ${lang === 'ru' ? 'сум' : lang === 'cyr' ? 'сўм' : "so'm"}`,
          'success'
        );
      }
    } catch (e) {
      notify("Xatolik", "Kursni saqlashda muammo yuz berdi", "error");
    }
  };

  const getLangLabel = () => {
    if (lang === 'ru') return "🇷🇺 RU (Русский)";
    if (lang === 'cyr') return "🇺🇿 ЎЗ (Кирилл)";
    return "🇺🇿 UZ (Lotin)";
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 shrink-0 select-none transition-colors duration-200">
        {/* Chap tomon: Brand va sarlavha */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-extrabold shadow-sm">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {settings.brandName || "TextilePro Uzbekistan"}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {lang === 'ru'
                ? "Текстильное производство, красильня и продажи"
                : lang === 'cyr'
                ? "Мато тўқув, бўёқхона ва савдо"
                : "Mato to'quv, bo'yoqxona va savdo"}
            </p>
          </div>
        </div>

        {/* O'ng tomon: Jonli Sana & Soat, Valyuta kursi, Til, QR, Yangi Rulon, Rejim */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Bugungi Sana va Jonli Soat (sekundlari bilan) - Dollar kursi oldida */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-xs select-none"
            title={lang === 'ru' ? "Сегодняшняя дата и точное время с секундами" : lang === 'cyr' ? "Бугунги сана ва аниқ вақт (секундлари билан)" : "Bugungi sana va aniq vaqt (sekundlari bilan)"}
          >
            {/* Sana */}
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="whitespace-nowrap">{formatLiveDate(currentTime, lang)}</span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>

            {/* Jonli Soat sekundlari bilan */}
            <div className="flex items-center gap-1 font-mono font-black text-sky-600 dark:text-sky-400 text-xs sm:text-[13px]">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0 animate-pulse" />
              <span className="tabular-nums tracking-wider">{formatLiveTime(currentTime)}</span>
            </div>
          </div>

          {/* Jonli Dollar Kursi Badge */}
          <button
            onClick={() => {
              setNewRateInput(String(usdRate));
              setRateModalOpen(true);
            }}
            title={lang === 'ru' ? "Изменить курс доллара" : lang === 'cyr' ? "Доллар курсини ўзгартириш" : "Dollar kursini o'zgartirish"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>1$ = {Number(usdRate).toLocaleString()} {lang === 'ru' ? 'сум' : lang === 'cyr' ? 'сўм' : "so'm"}</span>
          </button>

          {/* 3 Tilli Almashtirgich (Lotin, Kirill, Rus) */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              title="Tilni tanlash / Выбрать язык"
            >
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{getLangLabel()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setLang('lat'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    lang === 'lat' ? 'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-slate-800/50' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>🇺🇿 UZ (Lotin)</span>
                  {lang === 'lat' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLang('cyr'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    lang === 'cyr' ? 'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-slate-800/50' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>🇺🇿 ЎЗ (Кирилл)</span>
                  {lang === 'cyr' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLang('ru'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    lang === 'ru' ? 'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-slate-800/50' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>🇷🇺 RU (Русский)</span>
                  {lang === 'ru' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Tezkor QR Skaner */}
          <button
            onClick={() => setQrScannerOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? "QR Сканер" : lang === 'cyr' ? "QR Сканер" : "QR Skaner"}</span>
          </button>

          {/* Tezkor Yangi Rulon (KG) - Faqat tahrirlash huquqi bo'lsa ko'rinadi */}
          {canEdit && (
            <button
              onClick={onOpenNewRoll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden md:inline">
                {lang === 'ru' ? "+ Новый Рулон (КГ)" : lang === 'cyr' ? "+ Янги Рулон (КГ)" : "+ Yangi Rulon (KG)"}
              </span>
              <span className="md:hidden">
                {lang === 'ru' ? "+ Рулон" : lang === 'cyr' ? "+ Рулон" : "+ Rulon"}
              </span>
            </button>
          )}

          {/* Dark / Light tema almashtirgich */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={theme === 'dark' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Foydalanuvchi Profili va Chiqish (RBAC) */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                  isAdmin
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : canEdit
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isAdmin ? '👑 Admin' : canEdit ? '✍️ Xodim' : '👁️ Ko\'rish'}
                </span>
              </div>

              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                title={`${currentUser.name} (${isAdmin ? 'Admin' : 'Xodim'})`}
              />

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title={lang === 'ru' ? "Выйти из системы" : lang === 'cyr' ? "Тизимдан чиқиш" : "Tizimdan chiqish"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Dollar Kursini Tezkor Yangilash Modali */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>{lang === 'ru' ? "Установить курс доллара" : lang === 'cyr' ? "Доллар курсини ўрнатиш" : "Dollar kursini o'rnatish"}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ru'
                ? "Введите курс 1 доллара США в сумах. Все расчеты и продажи автоматически пересчитаются."
                : lang === 'cyr'
                ? "1 АҚШ долларининг сўмдаги курсини киритинг. Барча савдо ва ҳисоб-китоблар автоматик янгиланади."
                : "1 AQSH dollarining so'mdagi kursini kiriting. Barcha savdo va hisob-kitoblar avtomatik yangilanadi."}
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>{formatLiveDate(currentTime, lang)}</span>
              </span>
              <span className="flex items-center gap-1 font-mono font-bold text-sky-600 dark:text-sky-400">
                <Clock className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>{formatLiveTime(currentTime)}</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ru' ? "1 USD = ... сум" : lang === 'cyr' ? "1 USD = ... сўм" : "1 USD = ... so'm"}
              </label>
              <input
                type="number"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                placeholder="12850"
                className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'ru' ? "Отмена" : lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
              </button>
              <button
                onClick={handleSaveRate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ru' ? "Сохранить" : lang === 'cyr' ? "Сақлаш" : "Saqlash"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
