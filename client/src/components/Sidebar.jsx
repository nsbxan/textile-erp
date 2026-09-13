import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Droplets,
  PackageCheck,
  ShieldAlert,
  ShoppingCart,
  Users,
  Building2,
  Wallet,
  Settings,
  ShieldCheck,
  UserCog
} from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, lang, hasPermission, isAdmin } = useApp();

  const menuItems = [
    {
      id: 'dashboard',
      labelLat: 'Boshqaruv Paneli',
      labelCyr: 'Бошқарув Панели',
      labelRu: 'Панель Управления',
      icon: LayoutDashboard,
      color: 'text-teal-500 bg-teal-500/10 dark:text-teal-400',
      badge: null
    },
    {
      id: 'fabrics',
      labelLat: 'Matolar Katalogi',
      labelCyr: 'Матолар Каталоги',
      labelRu: 'Каталог Тканей',
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10 dark:text-blue-400',
      badge: null
    },
    {
      id: 'weaving',
      labelLat: 'To\'quv (Xom Mato)',
      labelCyr: 'Тўқув (Хом Мато)',
      labelRu: 'Ткачество (Суровое)',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400',
      badge: lang === 'ru' ? 'Станки' : lang === 'cyr' ? 'Дастгоҳ' : 'Dastgoh'
    },
    {
      id: 'dyeing',
      labelLat: 'Bo\'yoqxona & Bo\'yash',
      labelCyr: 'Бўёқхона & Бўяш',
      labelRu: 'Красильный Цех',
      icon: Droplets,
      color: 'text-purple-500 bg-purple-500/10 dark:text-purple-400',
      badge: lang === 'ru' ? 'Покраска' : lang === 'cyr' ? 'Бўяш' : 'Bo\'yash'
    },
    {
      id: 'rolls',
      labelLat: 'Ombor & Rulonlar (KG)',
      labelCyr: 'Омбор & Рулонлар (КГ)',
      labelRu: 'Склад Рулонов (КГ)',
      icon: PackageCheck,
      color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400',
      badge: 'QR / KG'
    },
    {
      id: 'defects',
      labelLat: 'Sifat Nazorati (QC)',
      labelCyr: 'Сифат Назорати (QC)',
      labelRu: 'Контроль Качества (ОТК)',
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-500/10 dark:text-rose-400',
      badge: null
    },
    {
      id: 'sales',
      labelLat: 'Mato Savdosi (POS)',
      labelCyr: 'Мато Савдоси (POS)',
      labelRu: 'Продажи Тканей (POS)',
      icon: ShoppingCart,
      color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400',
      badge: '$ / KG'
    },
    {
      id: 'customers',
      labelLat: 'Mijozlar & Nasiya',
      labelCyr: 'Мижозлар & Насия',
      labelRu: 'Клиенты & Долги',
      icon: Users,
      color: 'text-sky-500 bg-sky-500/10 dark:text-sky-400',
      badge: null
    },
    {
      id: 'suppliers',
      labelLat: 'Ta\'minotchilar & Ip',
      labelCyr: 'Таъминотчилар & Ип',
      labelRu: 'Поставщики & Пряжа',
      icon: Building2,
      color: 'text-orange-500 bg-orange-500/10 dark:text-orange-400',
      badge: null
    },
    {
      id: 'finance',
      labelLat: 'Kassa & Moliya',
      labelCyr: 'Касса & Молия',
      labelRu: 'Касса & Финансы',
      icon: Wallet,
      color: 'text-green-500 bg-green-500/10 dark:text-green-400',
      badge: null
    },
    {
      id: 'settings',
      labelLat: 'Sozlamalar',
      labelCyr: 'Созламалар',
      labelRu: 'Настройки',
      icon: Settings,
      color: 'text-slate-500 bg-slate-500/10 dark:text-slate-400',
      badge: null
    },
    ...(isAdmin ? [{
      id: 'users',
      labelLat: 'Foydalanuvchilar (RBAC)',
      labelCyr: 'Фойдаланувчилар (RBAC)',
      labelRu: 'Пользователи (RBAC)',
      icon: UserCog,
      color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400',
      badge: 'Admin'
    }] : [])
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'users') return isAdmin;
    return hasPermission(item.id);
  });

  return (
    <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 no-print transition-colors duration-200">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {lang === 'ru' ? "Основные Разделы" : lang === 'cyr' ? "Асосий Бўлимлар" : "Asosiy Bo'limlar"}
        </div>
        {visibleMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const label = lang === 'ru' ? item.labelRu : lang === 'cyr' ? item.labelCyr : item.labelLat;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl transition-colors ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pastki qism: Tizim Holati Widget */}
      <div className="p-3.5 m-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            {lang === 'ru'
              ? "Система Активна"
              : lang === 'cyr'
              ? "Тўқимачилик Тизми Фаол"
              : "To'qimachilik Tizimi Faol"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'ru'
            ? "Учет тканей в КГ и долларах ($)."
            : lang === 'cyr'
            ? "Матолар фақат КГ ва $ ҳисобида юритилади."
            : "Matolar faqat KG va $ hisobida yuritiladi."}
        </p>
      </div>
    </aside>
  );
}
