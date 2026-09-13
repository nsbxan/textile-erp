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
  UserPlus
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
  const [regStep, setRegStep] = useState('form'); // 'form' | 'code'
  const [verificationCode, setVerificationCode] = useState('');
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '+998 ',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Google Simulyatsiya Modali
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

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

  // 1-QADAM: Emailga maxfiy kod yuborish
  const handleSendCodeSubmit = async (e) => {
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

    try {
      setLoading(true);
      const res = await api.post('/auth/send-code', {
        email: regForm.email.trim().toLowerCase(),
        name: regForm.name.trim()
      });

      if (res.success) {
        setRegStep('code');
        notify(
          "Emailga kod yuborildi",
          `${regForm.email} pochtangizga maxfiy tasdiqlash kodi yuborildi. Pochtani tekshiring!`,
          'success'
        );
      }
    } catch (err) {
      setErrorMsg(err.message || "Tasdiqlash kodini yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 2-QADAM: Maxfiy kodni tekshirib ro'yxatdan o'tishni yakunlash
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!verificationCode || verificationCode.trim().length < 3) {
      setErrorMsg(lang === 'ru' ? "Введите секретный код" : "Maxfiy kodni kiriting");
      return;
    }

    try {
      setLoading(true);
      await register({
        name: regForm.name.trim(),
        phone: regForm.phone.trim(),
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        code: verificationCode.trim()
      });
    } catch (err) {
      setErrorMsg(err.message || "Tasdiqlash kodi noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (email, name) => {
    try {
      setLoading(true);
      setGoogleModalOpen(false);
      await loginWithGoogle({
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        googleId: `goog_${Date.now()}`
      });
    } catch (err) {
      setErrorMsg(err.message || "Google orqali kirishda xatolik");
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

          {/* 2. RO'YXATDAN O'TISH FORMASI (2 BOSQICHLI: MA'LUMOTLAR + EMAIL MAXFIY KODI) */}
          {mode === 'register' && regStep === 'form' && (
            <form onSubmit={handleSendCodeSubmit} className="space-y-3.5">
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
                    placeholder="Alisher Valiyev"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>{lang === 'ru' ? "Отправка кода..." : "Kod yuborilmoqda..."}</span>
                ) : (
                  <>
                    <span>{lang === 'ru' ? "Отправить секретный код на Email" : lang === 'cyr' ? "Emailга махфий код юбориш" : "Emailga Maxfiy Kod Yuborish"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2-BOSQICH: EMAIL MAXFIY KODINI KIRITISH */}
          {mode === 'register' && regStep === 'code' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center font-black">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-base font-black text-white">
                  {lang === 'ru' ? "Подтверждение Email" : "Emailni Tasdiqlash"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'ru'
                    ? `Секретный код отправлен на ${regForm.email}:`
                    : `Maxfiy tasdiqlash kodi ${regForm.email} manziliga yuborildi:`}
                </p>
              </div>

              {/* Email yuborilganlik bildirishnomasi */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'ru' ? "Секретный код отправлен на вашу почту!" : "Maxfiy tasdiqlash kodi pochtangizga yuborildi!"}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ru'
                    ? `Секретный код доступа отправлен на адрес ${regForm.email}. Проверьте почту (и папку «Спам») и введите его ниже.`
                    : `Maxfiy tasdiqlash kodi ${regForm.email} pochtangizga yuborildi. Pochtani (Spam papkasini ham) oching va maxfiy kodni kiriting.`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 text-center mb-2">
                  {lang === 'ru' ? "Введите секретный код:" : "Maxfiy kodni kiriting:"}
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="imperia"
                  className="w-full py-3 text-center bg-slate-950/80 border-2 border-teal-500/60 focus:border-teal-400 rounded-2xl text-xl font-mono tracking-widest font-black text-white focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !verificationCode.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {loading ? (
                  <span>{lang === 'ru' ? "Проверка кода..." : "Tekshirilmoqda..."}</span>
                ) : (
                  <>
                    <span>{lang === 'ru' ? "Подтвердить и войти в систему" : "Kodni Tasdiqlash va Tizimga Kirish"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setRegStep('form'); setErrorMsg(''); }}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  ← Ma'lumotlarni o'zgartirish
                </button>
                <button
                  type="button"
                  onClick={handleSendCodeSubmit}
                  disabled={loading}
                  className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
                >
                  Kodni qayta yuborish
                </button>
              </div>
            </form>
          )}

          {/* AJRATUVCHI CHIZIQ */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              {lang === 'ru' ? "Или через" : lang === 'cyr' ? "Ёки" : "Yoki"}
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* GOOGLE ORQALI KIRISH / RO'YXATDAN O'TISH */}
          <button
            type="button"
            onClick={() => setGoogleModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            {/* Google Icon SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {mode === 'login'
                ? (lang === 'ru' ? "Войти через Google" : lang === 'cyr' ? "Google орқали кириш" : "Google orqali kirish")
                : (lang === 'ru' ? "Регистрация через Google" : lang === 'cyr' ? "Google орқали рўйхатдан ўтиш" : "Google orqali ro'yxatdan o'tish")}
            </span>
          </button>
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

      {/* GOOGLE SIGN IN POPUP MODAL */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-sm font-black text-white">Google bilan davom etish</h3>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'ru'
                ? "Введите имя и адрес Gmail для входа через Google:"
                : "Tizimga kirish uchun ismingiz va Gmail manzilingizni kiriting:"}
            </p>

            {/* Shaxsiy Gmail kiritish */}
            <div className="space-y-3">
              <input
                type="text"
                value={googleCustomName}
                onChange={e => setGoogleCustomName(e.target.value)}
                placeholder="Ismingiz (masalan: Rustam)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <input
                type="email"
                value={googleCustomEmail}
                onChange={e => setGoogleCustomEmail(e.target.value)}
                placeholder="sizning.nomingiz@gmail.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!googleCustomEmail || !googleCustomEmail.includes('@')) {
                    notify("Xatolik", "Google email manzilini to'g'ri kiriting", "error");
                    return;
                  }
                  handleGoogleAuth(googleCustomEmail, googleCustomName);
                }}
                className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Davom etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
