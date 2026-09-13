import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Globe,
  LogIn,
  UserPlus,
  Key
} from 'lucide-react';

export default function AuthPage() {
  const { login, register, loginWithGoogle, lang, setLang, notify } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login form
  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '+998 ',
    email: '',
    password: '',
    confirmPassword: '',
    secretCode: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginInput.trim()) {
      setErrorMsg(lang === 'ru' ? "Введите email или номер телефона" : "Email yoki telefon raqamingizni kiriting");
      return;
    }
    if (!loginPass) {
      setErrorMsg(lang === 'ru' ? "Введите пароль" : "Parolingizni kiriting");
      return;
    }

    try {
      setLoading(true);
      await login(loginInput.trim(), loginPass);
    } catch (err) {
      setErrorMsg(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Ro'yxatdan o'tish (Faqat 'imperia' maxfiy kodi bilan)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regForm.name.trim()) {
      setErrorMsg(lang === 'ru' ? "Введите Ф.И.О." : "Ism va familiyangizni to'liq kiriting");
      return;
    }
    if (!regForm.phone.trim() || regForm.phone.trim().length < 9) {
      setErrorMsg(lang === 'ru' ? "Введите корректный номер телефона" : "To'g'ri telefon raqam kiriting (masalan: +998 90 123 45 67)");
      return;
    }
    if (!regForm.email.trim() || !regForm.email.includes('@')) {
      setErrorMsg(lang === 'ru' ? "Введите корректный email (gmail)" : "To'g'ri email (yoki gmail) manzil kiriting");
      return;
    }
    if (!regForm.password || regForm.password.length < 4) {
      setErrorMsg(lang === 'ru' ? "Пароль должен быть не менее 4 символов" : "Parol kamida 4 ta belgidan iborat bo'lsin");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMsg(lang === 'ru' ? "Пароли не совпадают" : "Kiritilgan parollar bir-biriga mos kelmadi");
      return;
    }
    if (!regForm.secretCode || regForm.secretCode.trim().toLowerCase() !== 'imperia') {
      setErrorMsg(
        lang === 'ru'
          ? "Неверный секретный код! Доступ разрешен только по секретному коду."
          : "Maxfiy kod noto'g'ri! Tizimga kirish uchun to'g'ri maxfiy kodni yozing."
      );
      return;
    }

    try {
      setLoading(true);
      await register({
        name: regForm.name.trim(),
        phone: regForm.phone.trim(),
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        code: regForm.secretCode.trim()
      });
    } catch (err) {
      setErrorMsg(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Orqa fon nur effekti */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Yuqori til tanlash */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-1 shadow-lg backdrop-blur-md z-10">
        <button
          onClick={() => setLang('lat')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
            lang === 'lat' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          🇺🇿 Lotin
        </button>
        <button
          onClick={() => setLang('cyr')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
            lang === 'cyr' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          🇺🇿 Кирилл
        </button>
        <button
          onClick={() => setLang('ru')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
            lang === 'ru' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          🇷🇺 Русский
        </button>
      </div>

      <div className="w-full max-w-md my-auto relative z-10">
        {/* Logo va Tizim Nomi */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-teal-500/20 mb-3 transform hover:scale-105 transition-transform duration-300">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            TextilePro Uzbekistan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            {lang === 'ru'
              ? "Умная ERP система текстильного производства и торговли"
              : lang === 'cyr'
              ? "Тўқимачилик, бўёқхона ва мато савдоси ERP тизими"
              : "To'qimachilik, bo'yoqxona va mato savdosi ERP tizimi"}
          </p>
        </div>

        {/* Asosiy Kartochka */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Kirish / Ro'yxatdan o'tish Tablari */}
          <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                mode === 'login'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{lang === 'ru' ? "Войти" : lang === 'cyr' ? "Кириш" : "Kirish"}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                mode === 'register'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'ru' ? "Регистрация" : lang === 'cyr' ? "Рўйхатдан ўтиш" : "Ro'yxatdan o'tish"}</span>
            </button>
          </div>

          {/* Xatolik xabari */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. KIRISH FORMASI */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {lang === 'ru' ? "Email или Номер телефона" : lang === 'cyr' ? "Email ёки Телефон рақами" : "Email yoki Telefon raqami"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    placeholder={lang === 'ru' ? "Email или телефон..." : "Email yoki telefon..."}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {lang === 'ru' ? "Пароль" : lang === 'cyr' ? "Парол" : "Parol"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>{lang === 'ru' ? "Вход в систему..." : "Kirilmoqda..."}</span>
                ) : (
                  <>
                    <span>{lang === 'ru' ? "Войти в систему" : lang === 'cyr' ? "Тизимга кириш" : "Tizimga kirish"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. RO'YXATDAN O'TISH FORMASI */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ru' ? "Ф.И.О. (Имя и Фамилия)" : lang === 'cyr' ? "Ф.И.Ш. (Исм ва Фамилия)" : "F.I.Sh. (Ism va Familiya)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder={lang === 'ru' ? "например: Polat Alemdar" : lang === 'cyr' ? "масалан: Polat Alemdar" : "masalan: Polat Alemdar"}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ru' ? "Номер телефона" : lang === 'cyr' ? "Телефон рақами" : "Telefon raqami"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ru' ? "Email адрес (Gmail или др.)" : lang === 'cyr' ? "Email манзили (Gmail ва б.)" : "Email manzili (Gmail yoki boshqa)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="misol@gmail.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ru' ? "Пароль" : "Parol"}
                  </label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ru' ? "Повторите" : "Tasdiqlang"}
                  </label>
                  <input
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="••••••"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* MAXFIY KODNI YOZING */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{lang === 'ru' ? "Секретный код" : lang === 'cyr' ? "Махфий кодни ёзинг" : "Maxfiy kodni yozing"}</span>
                  <span className="text-[10px] text-teal-400 font-semibold">({lang === 'ru' ? "доступ к системе" : "tizimga kirish uchun"})</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4 text-teal-400" />
                  </div>
                  <input
                    type="password"
                    value={regForm.secretCode}
                    onChange={e => setRegForm({ ...regForm, secretCode: e.target.value })}
                    placeholder={lang === 'ru' ? "Секретный код организации..." : "Maxfiy kodni yozing..."}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors font-mono tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>{lang === 'ru' ? "Регистрация..." : "Ro'yxatdan o'tilmoqda..."}</span>
                ) : (
                  <>
                    <span>{lang === 'ru' ? "Зарегистрироваться и войти" : lang === 'cyr' ? "Рўйхатдан ўтиш ва тизимга кириш" : "Ro'yxatdan O'tish va Tizimga Kirish"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Xavfsizlik va Ma'lumot */}
        <div className="text-center mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {lang === 'ru'
              ? "Корпоративная система управления текстильным производством"
              : "To'qimachilik korxonasini boshqarish ERP tizimi"}
          </span>
        </div>
      </div>
    </div>
  );
}
