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
  Building2
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

  useEffect(() => {
    fetchUsers();
  }, [refreshSignal]);

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
        notify(
          lang === 'ru' ? "Права сохранены" : lang === 'cyr' ? "Ҳуқуқлар сақланди" : "Huquqlar saqlandi",
          `${selectedUser.name} - ${permForm.role === 'admin' ? 'Administrator' : 'Xodim'}`,
          'success'
        );
        setEditModalOpen(false);
        fetchUsers();
        if (currentUser?.id === selectedUser.id) {
          refreshCurrentUser();
        }
        triggerRefresh();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Huquqlarni saqlashda muammo yuz berdi", "error");
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      notify("Xatolik", "O'z hisobingizni o'chira olmaysiz!", "error");
      return;
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

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalWithEdit = users.filter(u => u.role === 'admin' || u.canEdit).length;
  const totalReadOnly = users.filter(u => u.role !== 'admin' && !u.canEdit).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sahifa sarlavhasi va statistika */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {lang === 'ru'
                  ? "Пользователи и Права Доступа (RBAC)"
                  : lang === 'cyr'
                  ? "Фойдаланувчилар ва Кириш Ҳуқуқлари (RBAC)"
                  : "Foydalanuvchilar va Ruxsatlar Boshqaruvi (RBAC)"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'ru'
                  ? "Только Администратор решает, кто и какие разделы может просматривать и редактировать"
                  : "Faqat Administrator kim qaysi bo'limni ko'rishi va tahrirlashi mumkinligini belgilaydi"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{lang === 'ru' ? "Обновить" : "Yangilash"}</span>
        </button>
      </div>

      {/* 4 Ta Statistika Kartasi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jami Ro'yxatdan O'tganlar</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{users.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">tizim a'zolari</p>
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

      {/* Qidiruv va Filter */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? "Поиск по имени, email или телефону..." : "Ism, email yoki telefon orqali qidirish..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Foydalanuvchilar Jadvali */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
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
                      {/* Ism va Avatar */}
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

                      {/* Aloqa */}
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

                      {/* Roli */}
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

                      {/* Tahrirlash Huquqi */}
                      <td className="py-3.5 px-4">
                        {userCanEdit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Tahrirlash mumkin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-bold border border-sky-200 dark:border-sky-800/50">
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            <span>Faqat ko'rish</span>
                          </span>
                        )}
                      </td>

                      {/* Ochiq Bo'limlar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-teal-600 dark:text-teal-400 text-xs">
                            {allowedCount} / {ALL_SYSTEM_TABS.length} ta bo'lim
                          </span>
                          {allowedCount === ALL_SYSTEM_TABS.length && (
                            <span className="text-[10px] text-slate-400">(Hammasi)</span>
                          )}
                        </div>
                      </td>

                      {/* Holat */}
                      <td className="py-3.5 px-4">
                        {user.status === 'blocked' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800">
                            <UserX className="w-3 h-3" />
                            <span>Bloklangan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-black border border-teal-200 dark:border-teal-800">
                            <UserCheck className="w-3 h-3" />
                            <span>Faol</span>
                          </span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all cursor-pointer shadow-2xs border border-teal-200 dark:border-teal-800"
                            title="Ruxsatlarni sozlash"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Ruxsatlar</span>
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* RUXSATLARNI SOZLASH MODALI (RBAC Permissions Editor) */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sarlavhasi */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}`}
                  alt=""
                  className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedUser.name} uchun huquqlarni belgilash
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.email} • {selectedUser.phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-5">
              {/* 1. Asosiy Rol & Tahrirlash Huquqlari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Administratorlik maqomi */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-teal-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={permForm.role === 'admin'}
                    onChange={e => {
                      const isAdm = e.target.checked;
                      setPermForm(prev => ({
                        ...prev,
                        role: isAdm ? 'admin' : 'staff',
                        canEdit: isAdm ? true : prev.canEdit,
                        allowedTabs: isAdm ? ['*'] : prev.allowedTabs
                      }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      Administrator maqomi
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Barcha bo'limlarni ko'rish, o'zgartirish va boshqa xodimlarga ruxsat berish huquqini beradi.
                    </p>
                  </div>
                </label>

                {/* Tahrirlash Huquqi (canEdit) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                  permForm.role === 'admin'
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20 opacity-70 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:border-emerald-500'
                }`}>
                  <input
                    type="checkbox"
                    checked={permForm.role === 'admin' || permForm.canEdit}
                    disabled={permForm.role === 'admin'}
                    onChange={e => setPermForm(prev => ({ ...prev, canEdit: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-emerald-500" />
                      Tahrirlash va Qo'shish huquqi
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Yangi rulon, to'quv buyurtmasi, savdo yoki to'lovlarni o'zgartirish huquqi. O'chiq bo'lsa faqat o'qish (Read-only) bo'ladi.
                    </p>
                  </div>
                </label>
              </div>

              {/* Foydalanuvchi Holati (Faol / Bloklangan) */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hisob holati (Status):</span>
                <select
                  value={permForm.status}
                  onChange={e => setPermForm({ ...permForm, status: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="active">🟢 Faol (Ishlaydi)</option>
                  <option value="blocked">🔴 Bloklangan (Kirish taqiqlangan)</option>
                </select>
              </div>

              {/* 2. Qaysi Bo'limlarni Ko'rishi Mumkinligi (allowedTabs) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Ko'rish Mumkin Bo'lgan Bo'limlar
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Xodim faqat belgilangan bo'limlarni ko'ra oladi, qolganlari Sidebar'dan yashiriladi.
                    </p>
                  </div>

                  {permForm.role !== 'admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllTabs}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        Barchasini belgilash
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleClearAllTabs}
                        className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
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
