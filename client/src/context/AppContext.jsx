import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { t, toCyrillic, localizeText } from '../utils/lang';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('erp_theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('erp_lang') || 'lat'); // 'lat' | 'cyr' | 'ru'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usdRate, setUsdRate] = useState(() => Number(localStorage.getItem('erp_usd_rate')) || 12850);
  
  const [settings, setSettings] = useState({
    companyName: "Silk & Cotton Textile",
    brandName: "TextilePro Uzbekistan",
    currency: "USD",
    usdExchangeRate: 12850,
    phone: "+998 71 200 45 60",
    address: "Toshkent sh., To'qimachilar sanoat zonasi",
    defaultShrinkageTolerance: 5.0
  });

  const [toasts, setToasts] = useState([]);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Foydalanuvchi va Ruxsatlar (Auth & RBAC)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('erp_token') || null);

  // Modallar holati
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrModalRoll, setQrModalRoll] = useState(null);
  const [defectModalRoll, setDefectModalRoll] = useState(null);
  const [cutModalRoll, setCutModalRoll] = useState(null);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const [printWeavingOrderData, setPrintWeavingOrderData] = useState(null);
  const [printDyeingOrderData, setPrintDyeingOrderData] = useState(null);

  // Dark/Light rejim
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('erp_theme', theme);
  }, [theme]);

  // Til o'zgarishi
  useEffect(() => {
    localStorage.setItem('erp_lang', lang);
  }, [lang]);

  // Dollar kursi saqlanishi
  useEffect(() => {
    localStorage.setItem('erp_usd_rate', String(usdRate));
  }, [usdRate]);

  // Sozlamalarni yuklash
  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.success && res.data) {
          setSettings(res.data);
          if (res.data.usdExchangeRate) {
            setUsdRate(Number(res.data.usdExchangeRate));
          }
        }
      })
      .catch(err => console.error("Sozlamalarni yuklash xatosi:", err));
  }, [refreshSignal]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const cycleLang = () => {
    setLang(prev => {
      if (prev === 'lat') return 'cyr';
      if (prev === 'cyr') return 'ru';
      return 'lat';
    });
  };

  const notify = (title, message = '', type = 'success') => {
    const id = Date.now() + Math.random();
    const displayTitle = lang === 'cyr' ? toCyrillic(title) : title;
    const displayMsg = lang === 'cyr' ? toCyrillic(message) : message;
    setToasts(prev => [...prev, { id, title: displayTitle, message: displayMsg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const triggerRefresh = () => {
    setRefreshSignal(prev => prev + 1);
  };

  // Avtorizatsiya amallari
  const handleSetAuthData = (userData, tokenString) => {
    setCurrentUser(userData);
    setToken(tokenString);
    if (userData) {
      localStorage.setItem('erp_user', JSON.stringify(userData));
      localStorage.setItem('erp_user_id', String(userData.id));
    } else {
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_user_id');
    }
    if (tokenString) {
      localStorage.setItem('erp_token', tokenString);
    } else {
      localStorage.removeItem('erp_token');
    }
  };

  const login = async (emailOrPhone, password) => {
    const res = await api.post('/auth/login', { emailOrPhone, password });
    if (res.success && res.data) {
      handleSetAuthData(res.data.user, res.data.token);
      notify(
        lang === 'ru' ? "Успешный вход" : lang === 'cyr' ? "Тизимга кирилди" : "Tizimga kirildi",
        res.message || (lang === 'ru' ? `Добро пожаловать, ${res.data.user.name}` : `Xush kelibsiz, ${res.data.user.name}`),
        'success'
      );
      return res.data;
    }
    throw new Error(res.message || "Kirishda xatolik");
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.data) {
      handleSetAuthData(res.data.user, res.data.token);
      notify(
        lang === 'ru' ? "Регистрация успешна" : lang === 'cyr' ? "Рўйхатдан ўтилди" : "Ro'yxatdan o'tildi",
        res.message || "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
        'success'
      );
      return res.data;
    }
    throw new Error(res.message || "Ro'yxatdan o'tishda xatolik");
  };

  const loginWithGoogle = async (googleData) => {
    const res = await api.post('/auth/google', googleData);
    if (res.success && res.data) {
      handleSetAuthData(res.data.user, res.data.token);
      notify(
        "Google",
        lang === 'ru' ? `Вход через Google: ${res.data.user.name}` : `Google orqali kirildi: ${res.data.user.name}`,
        'success'
      );
      return res.data;
    }
    throw new Error(res.message || "Google orqali kirishda xatolik");
  };

  const logout = () => {
    handleSetAuthData(null, null);
    setActiveTab('dashboard');
    notify(
      lang === 'ru' ? "Выход из системы" : lang === 'cyr' ? "Тизимдан чиқилди" : "Tizimdan chiqildi",
      lang === 'ru' ? "До скорой встречи!" : "Xayr, salomat bo'ling!",
      'info'
    );
  };

  // Foydalanuvchi ma'lumotlarini (ruxsatlarini) yangilash
  const refreshCurrentUser = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await api.get(`/auth/me?userId=${currentUser.id}`);
      if (res.success && res.data) {
        setCurrentUser(res.data);
        localStorage.setItem('erp_user', JSON.stringify(res.data));
      }
    } catch (e) {
      console.error("User refresh error:", e);
    }
  };

  // RBAC Huquqlari
  const isAdmin = Boolean(currentUser?.role === 'admin');
  const canEdit = Boolean(isAdmin || currentUser?.canEdit);

  const hasPermission = (tabId) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (tabId === 'users') return false; // Faqat administrator ko'radi
    if (!currentUser.allowedTabs || !Array.isArray(currentUser.allowedTabs)) return false;
    if (currentUser.allowedTabs.includes('*')) return true;
    return currentUser.allowedTabs.includes(tabId);
  };

  const translate = (key, defaultText) => t(key, lang, defaultText);
  const loc = (text) => localizeText(text, lang);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        lang,
        setLang,
        cycleLang,
        translate,
        loc,
        usdRate,
        setUsdRate,
        activeTab,
        setActiveTab,
        settings,
        setSettings,
        toasts,
        notify,
        refreshSignal,
        triggerRefresh,
        qrScannerOpen,
        setQrScannerOpen,
        qrModalRoll,
        setQrModalRoll,
        defectModalRoll,
        setDefectModalRoll,
        cutModalRoll,
        setCutModalRoll,
        printInvoiceData,
        setPrintInvoiceData,
        printWeavingOrderData,
        setPrintWeavingOrderData,
        printDyeingOrderData,
        setPrintDyeingOrderData,
        // Auth & Permissions (RBAC)
        currentUser,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshCurrentUser,
        isAdmin,
        canEdit,
        hasPermission
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp AppProvider ichida ishlatilishi kerak');
  }
  return context;
}
