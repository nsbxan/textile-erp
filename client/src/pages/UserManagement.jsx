import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Sliders,
  Check,
  X,
  Lock,
  Eye,
  Key,
  Layers,
  Sparkles,
  Droplets,
  PackageCheck,
  ShoppingCart,
  Wallet,
  Settings,
  Building2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  Copy,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';

const ALL_SYSTEM_TABS = [
  { id: 'dashboard', nameLat: 'Boshqaruv Paneli', nameRu: 'Панель Управления', icon: Layers, color: 'text-teal-500' },
  { id: 'fabrics', nameLat: 'Matolar Katalogi', nameRu: 'Каталог Тканей', icon: Layers, color: 'text-blue-500' },
  { id: 'weaving', nameLat: "To'quv (Xom Mato)", nameRu: 'Ткачество (Суровое)', icon: Sparkles, color: 'text-amber-500' },
  { id: 'dyeing', nameLat: "Bo'yoqxona & Bo'yash", nameRu: 'Красильный Цех', icon: Droplets, color: 'text-purple-500' },
  { id: 'rolls', nameLat: 'Ombor & Rulonlar (KG)', nameRu: 'Склад Рулонов (КГ)', icon: PackageCheck, color: 'text-indigo-500' },
  { id: 'defects', nameLat: 'Sifat Nazorati (QC)', nameRu: 'Контроль Качества', icon: ShieldAlert, color: 'text-rose-500' },
  { id: 'sales', nameLat: 'Mato Savdosi (POS)', nameRu: 'Продажи Тканей', icon: ShoppingCart, color: 'text-emerald-500' },
  { id: 'customers', nameLat: 'Mijozlar & Nasiya', nameRu: 'Клиенты & Долги', icon: Users, color: 'text-sky-500' },
  { id: 'suppliers', nameLat: "Ta'minotchilar & Ip", nameRu: 'Поставщики & Пряжа', icon: Building2, color: 'text-orange-500' },
  { id: 'finance', nameLat: 'Kassa & Moliya', nameRu: 'Касса & Финансы', icon: Wallet, color: 'text-green-500' },
  { id: 'settings', nameLat: 'Sozlamalar', nameRu: 'Настройки', icon: Settings, color: 'text-slate-500' }
];

export default function UserManagement() {
  const { lang, notify, currentUser, refreshCurrentUser, triggerRefresh, refreshSignal } = useApp();

  // Asosiy bo'lim tanlovi: 'users' yoki 'audit'
  const [activeSubTab, setActiveSubTab] = useState('users');

  // Foydalanuvchilar holati
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Ruxsatlarni tahrirlash modali
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permForm, setPermForm] = useState({
    role: 'staff',
    canEdit: false,
    allowedTabs: [],
    status: 'active'
  });

  // Kirishlar va Xavfsizlik Jurnali (Audit Logs) holati
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState({});
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('all');
  const [copiedIp, setCopiedIp] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
      notify("Xatolik", "Foydalanuvchilarni yuklab bo'lmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.get('/auth/audit-logs');
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
        setAuditSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error(err);
      notify("Xatolik", "Kirishlar jurnalini yuklab bo'lmadi", "error");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [refreshSignal]);

  const handleClearAuditLogs = async () => {
    if (!window.confirm("Barcha kirish va xavfsizlik yozuvlarini tozalashni tasdiqlaysizmi?")) return;
    try {
      const res = await api.delete('/auth/audit-logs');
      if (res.success) {
        notify("Tozalandi", res.message, "success");
        fetchAuditLogs();
      }
    } catch (err) {
      notify("Xatolik", err.message, "error");
    }
  };

  const handleCopyIp = (ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setPermForm({
      role: user.role || 'staff',
      canEdit: Boolean(user.canEdit),
      allowedTabs: Array.isArray(user.allowedTabs) ? [...user.allowedTabs] : [],
      status: user.status || 'active'
    });
    setEditModalOpen(true);
  };

  const toggleTabPermission = (tabId) => {
    setPermForm(prev => {
      const exists = prev.allowedTabs.includes(tabId);
      let newTabs;
      if (exists) {
        newTabs = prev.allowedTabs.filter(t => t !== tabId && t !== '*');
      } else {
        newTabs = [...prev.allowedTabs.filter(t => t !== '*'), tabId];
      }
      return { ...prev, allowedTabs: newTabs };
    });
  };

  const handleSelectAllTabs = () => {
    setPermForm(prev => ({
      ...prev,
      allowedTabs: ALL_SYSTEM_TABS.map(t => t.id)
    }));
  };

  const handleClearAllTabs = () => {
    setPermForm(prev => ({
      ...prev,
      allowedTabs: []
    }));
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await api.put(`/auth/users/${selectedUser.id}/permissions`, permForm);
      if (res.success) {
        notify("Muvaffaqiyatli", res.message, 'success');
        setEditModalOpen(false);
        fetchUsers();
        triggerRefresh();

        if (selectedUser.id === currentUser?.id) {
          refreshCurrentUser();
        }
      }
    } catch (err) {
      notify("Xatolik", err.message || "Huquqlarni saqlashda xatolik", "error");
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') {
      const allAdmins = users.filter(u => u.role === 'admin');
      if (allAdmins.length <= 1) {
        notify("Taqiqlangan", "Tizimdagi yagona administratorni o'chirib bo'lmaydi!", "error");
        return;
      }
    }

    const confirmText = lang === 'ru'
      ? `Удалить пользователя "${user.name}"?`
      : `Haqiqatan ham "${user.name}" foydalanuvchisini tizimdan o'chirmoqchimisiz?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await api.delete(`/auth/users/${user.id}`);
      if (res.success) {
        notify("O'chirildi", res.message, 'success');
        fetchUsers();
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Foydalanuvchini o'chirishda xatolik", "error");
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();
    const matchQuery = (
      (log.user?.name || '').toLowerCase().includes(q) ||
      (log.user?.email || '').toLowerCase().includes(q) ||
      (log.ip || '').toLowerCase().includes(q) ||
      (log.device || '').toLowerCase().includes(q) ||
      (log.browser || '').toLowerCase().includes(q) ||
      (log.os || '').toLowerCase().includes(q) ||
      (log.location || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q)
    );

    if (!matchQuery) return false;

    if (auditStatusFilter === 'all') return true;
    if (auditStatusFilter === 'success') return log.status === 'Muvaffaqiyatli';
    if (auditStatusFilter === 'failed') return log.status.startsWith('Xatolik') || log.status.startsWith('Taqiqlangan');
    if (auditStatusFilter === 'visit') return log.status === 'Tashrif';
    return true;
  });

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalWithEdit = users.filter(u => u.role === 'admin' || u.canEdit).length;
  const totalReadOnly = users.filter(u => u.role !== 'admin' && !u.canEdit).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sahifa sarlavhasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeSubTab === 'users' ? "Foydalanuvchilar & Kirish Huquqlari (RBAC)" : "Kirishlar va Xavfsizlik Jurnali (Audit Logs)"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activeSubTab === 'users'
                  ? "Faqat Bosh Administrator xodimlar rollari va ochiq bo'limlarini boshqaradi."
                  : "Saytga kim, qayerdan, qaysi soatda, qaysi qurilmada va qaysi IP dan kirgani to'liq nazoratda."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {/* Sub-tab tugmalari */}
          <div className="flex flex-1 sm:flex-initial items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Foydalanuvchilar ({users.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('audit');
                fetchAuditLogs();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Kirishlar Jurnali ({auditLogs.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (activeSubTab === 'users') fetchUsers();
              else fetchAuditLogs();
            }}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading || auditLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1-TAB: FOYDALANUVCHILAR RO'YXATI VA HUQUQLAR (RBAC) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 4 Ta Statistika Kartasi */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jami A'zolar</span>
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{users.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ro'yxatdan o'tgan foydalanuvchilar</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Administratorlar</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalAdmins}</p>
              <p className="text-[11px] text-amber-500/80 mt-0.5">to'liq boshqaruv huquqi</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tahrirlash Huquqiga Ega</span>
                <Edit3 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalWithEdit}</p>
              <p className="text-[11px] text-emerald-500/80 mt-0.5">qo'shish/o'zgartirish ruxsati</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Faqat Ko'rish (Read-Only)</span>
                <Eye className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalReadOnly}</p>
              <p className="text-[11px] text-sky-500/80 mt-0.5">faqat o'qish/ko'rish huquqi</p>
            </div>
          </div>

          {/* Qidiruv */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ism, email yoki telefon orqali qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Mobil ekranlar uchun Foydalanuvchi Kartalari (md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs font-medium">
                Foydalanuvchilar topilmadi
              </div>
            ) : (
              filteredUsers.map(user => {
                const isCurrent = user.id === currentUser?.id;
                const isAdminUser = user.role === 'admin';
                const userCanEdit = isAdminUser || user.canEdit;
                const allowedCount = isAdminUser || (user.allowedTabs && user.allowedTabs.includes('*'))
                  ? ALL_SYSTEM_TABS.length
                  : (user.allowedTabs || []).length;

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    {/* Foydalanuvchi Bosh qismi */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 dark:text-white text-sm">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black border border-teal-200 dark:border-teal-800">
                                Siz
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                        </div>
                      </div>

                      {/* Amallar */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors cursor-pointer"
                          title="Ruxsatlar"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={isCurrent}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Aloqa */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Telefon:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{user.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Email:</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] truncate block">{user.email}</span>
                      </div>
                    </div>

                    {/* Roli va Ruxsatlar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isAdminUser ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-200 dark:border-amber-800/50">
                            <ShieldCheck className="w-3 h-3 text-amber-500" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>Xodim</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                          {allowedCount}/{ALL_SYSTEM_TABS.length} bo'lim
                        </span>
                      </div>

                      <div>
                        {user.status === 'blocked' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800">
                            <UserX className="w-3 h-3" />
                            <span>Bloklangan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            <UserCheck className="w-3 h-3" />
                            <span>Faol</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Katta ekranlar uchun Jadval (hidden md:block) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Foydalanuvchi</th>
                    <th className="py-3 px-4">Aloqa (Telefon / Email)</th>
                    <th className="py-3 px-4">Roli</th>
                    <th className="py-3 px-4">Tahrirlash Huquqi</th>
                    <th className="py-3 px-4">Ochiq Bo'limlar</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isCurrent = user.id === currentUser?.id;
                      const isAdminUser = user.role === 'admin';
                      const userCanEdit = isAdminUser || user.canEdit;
                      const allowedCount = isAdminUser || (user.allowedTabs && user.allowedTabs.includes('*'))
                        ? ALL_SYSTEM_TABS.length
                        : (user.allowedTabs || []).length;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                                alt={user.name}
                                className="w-9 h-9 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                                    {user.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black border border-teal-200 dark:border-teal-800">
                                      Siz
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {user.phone || "—"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                                {user.email}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isAdminUser ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-200 dark:border-amber-800/50">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                <span>Administrator</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Xodim / Operator</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {userCanEdit ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Tahrirlash ochiq</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Faqat ko'rish</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                                {allowedCount} / {ALL_SYSTEM_TABS.length}
                              </span>
                              <span className="text-[11px] text-slate-400">bo'lim</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {user.status === 'blocked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800">
                                <UserX className="w-3 h-3" />
                                <span>Bloklangan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                <UserCheck className="w-3 h-3" />
                                <span>Faol</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                title="Ruxsatlarni boshqarish"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={isCurrent}
                                className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2-TAB: KIRISHLAR VA XAVFSIZLIK JURNALI (AUDIT LOGS) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Xavfsizlik bo'yicha tushuntirish banneri */}
          <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-2xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                  Kirishlar va Tashriflar Xavfsizlik Nazorati Faol
                </h3>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300 leading-relaxed">
                  Tizimga kirgan har bir foydalanuvchi va saytga tashrif buyuruvchilarning <b>IP manzili</b>, <b>qurilma modeli (telefon yoki kompyuter)</b>, <b>brauzeri</b>, <b>aniq soati</b> hamda holati to'liq qayd etiladi. Faqat maxfiy kod (<b>imperia</b>) ni bilganlar ro'yxatdan o'ta oladi.
                </p>
              </div>
            </div>

            <button
              onClick={handleClearAuditLogs}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-bold cursor-pointer shrink-0 transition-all"
            >
              Jurnalni Tozalash
            </button>
          </div>

          {/* Statistika Kartalari */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jami Kirish & Tashrif</span>
                <Activity className="w-4 h-4 text-teal-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {auditSummary.total || auditLogs.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">qayd etilgan harakatlar</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Muvaffaqiyatli Kirishlar</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {auditSummary.successful || auditLogs.filter(l => l.status === 'Muvaffaqiyatli').length}
              </p>
              <p className="text-[11px] text-emerald-500/80 mt-0.5">to'g'ri parol & kod bilan</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Qaytarilgan Urinishlar</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {auditSummary.failed || auditLogs.filter(l => l.status.startsWith('Xatolik') || l.status.startsWith('Taqiqlangan')).length}
              </p>
              <p className="text-[11px] text-rose-500/80 mt-0.5">noto'g'ri parol yoki kod</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Noyob IP Manzillar</span>
                <Globe className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {auditSummary.uniqueIpsCount || new Set(auditLogs.map(l => l.ip)).size}
              </p>
              <p className="text-[11px] text-sky-500/80 mt-0.5">turli tarmoqlardan</p>
            </div>
          </div>

          {/* Qidiruv va Filtr paneli */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="IP manzil, ism, email, qurilma (iPhone, Android, PC) yoki shahar bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Filtr tugmalari */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'success', label: 'Muvaffaqiyatli' },
                { id: 'failed', label: 'Rad etilgan' },
                { id: 'visit', label: 'Tashriflar' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAuditStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    auditStatusFilter === tab.id
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobil qurilmalar uchun Qulay Karta Ko'rinishi (md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs font-medium">
                Kirish yozuvlari topilmadi
              </div>
            ) : (
              filteredAuditLogs.map(log => {
                const isSuccess = log.status === 'Muvaffaqiyatli';
                const isFailed = log.status.startsWith('Xatolik') || log.status.startsWith('Taqiqlangan');

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5"
                  >
                    {/* Yuqori: Foydalanuvchi va Holat */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          log.user?.email
                            ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {log.user?.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                            {log.user?.name || "Mehmon (Tashrif)"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {log.user?.email || "Ro'yxatdan o'tmagan"}
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : isFailed
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                          : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
                      }`}>
                        {isSuccess && <Check className="w-2.5 h-2.5" />}
                        {isFailed && <X className="w-2.5 h-2.5" />}
                        <span>{log.status}</span>
                      </span>
                    </div>

                    {/* O'rta: Amal va Qurilma */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Amal:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">{log.action}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Qurilma & OS:</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {log.deviceType === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : log.deviceType === 'tablet' ? (
                            <Tablet className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          )}
                          <span className="truncate">{log.device}</span>
                        </div>
                      </div>
                    </div>

                    {/* Past: IP, Vaqt va Tafsilot */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                        <span>{log.ip}</span>
                        <button
                          onClick={() => handleCopyIp(log.ip)}
                          className="text-slate-400 hover:text-teal-600 cursor-pointer"
                          title="Nusxalash"
                        >
                          {copiedIp === log.ip ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{log.formattedTime || formatDate(log.timestamp)}</span>
                      </div>
                    </div>

                    {log.details && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        {log.details}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Katta ekranlar uchun keng jadval (hidden md:block) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Vaqt & Sana (Toshkent)</th>
                    <th className="py-3 px-4">Foydalanuvchi / Shaxs</th>
                    <th className="py-3 px-4">Amal & Holat</th>
                    <th className="py-3 px-4">IP Manzili</th>
                    <th className="py-3 px-4">Qurilma Turi</th>
                    <th className="py-3 px-4">Brauzer & OS</th>
                    <th className="py-3 px-4">Joylashuv (Tarmoq)</th>
                    <th className="py-3 px-4">Tafsilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        Kirish yozuvlari topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => {
                      const isSuccess = log.status === 'Muvaffaqiyatli';
                      const isFailed = log.status.startsWith('Xatolik') || log.status.startsWith('Taqiqlangan');
                      const isVisit = log.status === 'Tashrif';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          {/* 1. Vaqt */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                  {log.formattedTime ? log.formattedTime.split(' ')[1] || log.formattedTime : '—'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {log.formattedTime ? log.formattedTime.split(' ')[0] : formatDate(log.timestamp)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Foydalanuvchi */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-[11px] ${
                                log.user?.email
                                  ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {log.user?.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                  {log.user?.name || "Mehmon (Tashrif)"}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {log.user?.email || "Ro'yxatdan o'tmagan"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Amal & Holat */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                                {log.action}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                isSuccess
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                                  : isFailed
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
                              }`}>
                                {isSuccess && <Check className="w-2.5 h-2.5" />}
                                {isFailed && <X className="w-2.5 h-2.5" />}
                                <span>{log.status}</span>
                              </span>
                            </div>
                          </td>

                          {/* 4. IP Manzili */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                              <span>{log.ip}</span>
                              <button
                                onClick={() => handleCopyIp(log.ip)}
                                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                                title="IP nusxalash"
                              >
                                {copiedIp === log.ip ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* 5. Qurilma */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {log.deviceType === 'mobile' ? (
                                <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                              ) : log.deviceType === 'tablet' ? (
                                <Tablet className="w-4 h-4 text-purple-500 shrink-0" />
                              ) : (
                                <Monitor className="w-4 h-4 text-teal-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {log.device}
                              </span>
                            </div>
                          </td>

                          {/* 6. Brauzer & OS */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {log.browser}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {log.os}
                              </div>
                            </div>
                          </td>

                          {/* 7. Joylashuv */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{log.location || "Lokal Tarmoq"}</span>
                            </div>
                          </td>

                          {/* 8. Tafsilot */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] block" title={log.details}>
                              {log.details || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ruxsatlarni Tahrirlash Modali (Faqat Admin uchun) */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal sarlavhasi */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}`}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-4">
              {/* 1. Foydalanuvchi Roli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tizimdagi Roli:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPermForm({ ...permForm, role: 'staff' })}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      permForm.role === 'staff'
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 text-teal-800 dark:text-teal-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Users className="w-4 h-4 text-teal-500" />
                    <div>
                      <div className="text-xs font-black">Xodim / Operator</div>
                      <div className="text-[10px] text-slate-400">Belgilangan bo'limlar</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPermForm({ ...permForm, role: 'admin' })}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      permForm.role === 'admin'
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs font-black">Administrator</div>
                      <div className="text-[10px] text-slate-400">Cheklovsiz to'liq ruxsat</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Tahrirlash Huquqi */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-teal-500" />
                    <span>Ma'lumotlarni Tahrirlash / Qo'shish Ruxsati</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {permForm.canEdit || permForm.role === 'admin'
                      ? "Foydalanuvchi ma'lumotlarni qo'sha oladi, o'zgartira oladi va saqlaydi."
                      : "Foydalanuvchi faqat ko'ra oladi (Read-Only rejim)."}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permForm.role === 'admin' || permForm.canEdit}
                    disabled={permForm.role === 'admin'}
                    onChange={e => setPermForm({ ...permForm, canEdit: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              {/* 3. Holat (Faol yoki Bloklangan) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hisob Holati:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPermForm({ ...permForm, status: 'active' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                      permForm.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Faol Hisob</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPermForm({ ...permForm, status: 'blocked' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                      permForm.status === 'blocked'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Bloklash</span>
                  </button>
                </div>
              </div>

              {/* 4. Ochiq Bo'limlar Ruxsati */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ko'rishga Ruxsat Berilgan Bo'limlar:
                  </label>
                  {permForm.role !== 'admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllTabs}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Barchasi
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllTabs}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        Tozalash
                      </button>
                    </div>
                  )}
                </div>

                {permForm.role === 'admin' ? (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Administrator tizimdagi barcha bo'limlarni to'liq ko'rish huquqiga ega.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ALL_SYSTEM_TABS.map(tab => {
                      const Icon = tab.icon;
                      const isAllowed = permForm.allowedTabs.includes('*') || permForm.allowedTabs.includes(tab.id);

                      return (
                        <label
                          key={tab.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isAllowed
                              ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 text-slate-900 dark:text-white font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => toggleTabPermission(tab.id)}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <div className={`p-1 rounded-lg bg-slate-100 dark:bg-slate-800 ${tab.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs truncate">{tab.nameLat}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Saqlash va Bekor qilish tugmalari */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Huquqlarni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
