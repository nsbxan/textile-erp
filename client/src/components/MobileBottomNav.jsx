import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  ShoppingCart,
  PackageCheck,
  Menu,
  Sparkles
} from 'lucide-react';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab, setMobileMenuOpen, lang, hasPermission } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      labelLat: 'Boshqaruv',
      labelCyr: 'Бошқарув',
      labelRu: 'Главная',
      icon: LayoutDashboard
    },
    {
      id: 'fabrics',
      labelLat: 'Matolar',
      labelCyr: 'Матолар',
      labelRu: 'Ткани',
      icon: Layers
    },
    {
      id: 'sales',
      labelLat: 'Savdo POS',
      labelCyr: 'Савдо POS',
      labelRu: 'Касса POS',
      icon: ShoppingCart
    },
    {
      id: 'rolls',
      labelLat: 'Ombor',
      labelCyr: 'Омбор',
      labelRu: 'Склад',
      icon: PackageCheck
    },
    {
      id: '__menu__',
      labelLat: 'Menyu',
      labelCyr: 'Меню',
      labelRu: 'Меню',
      icon: Menu,
      isMenuToggle: true
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 flex items-center justify-around py-1 px-1.5 shadow-lg select-none">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const label = lang === 'ru' ? item.labelRu : lang === 'cyr' ? item.labelCyr : item.labelLat;

        const handleClick = () => {
          if (item.isMenuToggle) {
            setMobileMenuOpen(true);
          } else {
            setActiveTab(item.id);
          }
        };

        return (
          <button
            key={item.id}
            type="button"
            onClick={handleClick}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer min-w-[56px] ${
              isActive
                ? 'text-teal-600 dark:text-teal-400 font-extrabold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
