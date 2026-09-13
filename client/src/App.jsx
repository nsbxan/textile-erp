import React, { useState } from 'react';
import { useApp } from './context/AppContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import QRCodeModal from './components/QRCodeModal';
import QRScannerModal from './components/QRScannerModal';
import DefectModal from './components/DefectModal';
import CutFabricModal from './components/CutFabricModal';
import InvoicePrintModal from './components/InvoicePrintModal';
import WeavingOrderPrintModal from './components/WeavingOrderPrintModal';
import DyeingOrderPrintModal from './components/DyeingOrderPrintModal';
import NewRollModal from './components/NewRollModal';

// Pages
import Dashboard from './pages/Dashboard';
import FabricsList from './pages/FabricsList';
import WeavingProduction from './pages/WeavingProduction';
import DyeingProcess from './pages/DyeingProcess';
import FabricRolls from './pages/FabricRolls';
import QualityControl from './pages/QualityControl';
import FabricSales from './pages/FabricSales';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import AuthPage from './pages/AuthPage';

export default function App() {
  const { activeTab, currentUser, hasPermission, isAdmin, lang } = useApp();
  const [newRollModalOpen, setNewRollModalOpen] = useState(false);

  // Agar foydalanuvchi tizimga kirmagan bo'lsa, Kirish/Ro'yxatdan o'tish sahifasini ko'rsatish
  if (!currentUser) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const renderActivePage = () => {
    // Agar foydalanuvchida ushbu bo'limni ko'rish huquqi bo'lmasa
    if (!hasPermission(activeTab) && activeTab !== 'users') {
      return (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center font-black text-2xl">
            🔒
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {lang === 'ru' ? "Доступ Ограничен" : lang === 'cyr' ? "Кириш Чекланган" : "Kirish Cheklangan"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {lang === 'ru'
              ? "У вас нет прав для просмотра этого раздела. Обратитесь к Главному Администратору для предоставления доступа."
              : "Sizda ushbu bo'limni ko'rish huquqi yo'q. Bo'limni ochish uchun Bosh Administratorga murojaat qiling."}
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOpenNewRoll={() => setNewRollModalOpen(true)} />;
      case 'fabrics':
        return <FabricsList onOpenNewRoll={() => setNewRollModalOpen(true)} />;
      case 'weaving':
        return <WeavingProduction />;
      case 'dyeing':
        return <DyeingProcess />;
      case 'rolls':
        return <FabricRolls onOpenNewRoll={() => setNewRollModalOpen(true)} />;
      case 'defects':
        return <QualityControl />;
      case 'sales':
        return <FabricSales />;
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      case 'finance':
        return <Finance />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard onOpenNewRoll={() => setNewRollModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Yuqori Navbar */}
      <Navbar onOpenNewRoll={() => setNewRollModalOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Chap Sidebar */}
        <Sidebar />

        {/* Asosiy Sahifa Kontenti */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#f8fafc] dark:bg-[#0b0f17]">
          <div className="max-w-7xl mx-auto pb-12">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Modallar */}
      <ToastContainer />
      <QRCodeModal />
      <QRScannerModal />
      <DefectModal />
      <CutFabricModal />
      <InvoicePrintModal />
      <WeavingOrderPrintModal />
      <DyeingOrderPrintModal />
      <NewRollModal isOpen={newRollModalOpen} onClose={() => setNewRollModalOpen(false)} />
    </div>
  );
}
