import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatKg,
  formatWeightTonnes,
  formatUsd,
  formatUzs,
  formatDualCurrency,
  formatDate,
  getQualityGradeBadge
} from '../utils/formatters';
import { getPantoneHex } from '../utils/pantonePalette';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  CheckCircle2,
  User,
  UserPlus,
  DollarSign,
  CreditCard,
  Building,
  QrCode,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  History,
  FileText,
  Calendar,
  Layers,
  Eye,
  Clock,
  RotateCcw,
  Undo2,
  Phone,
  Tag,
  Sparkles,
  X,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function FabricSales() {
  const {
    lang,
    loc,
    usdRate,
    settings,
    setPrintInvoiceData,
    notify,
    refreshSignal,
    triggerRefresh,
    setQrScannerOpen
  } = useApp();

  // Tablar: 'pos' (Yangi Savdo) | 'history' (Sotuvlar Tarixi) | 'returns' (Mijozdan Qaytgan Matolar / Vozvratlar)
  const [activeTab, setActiveTab] = useState('pos');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [salesPeriod, setSalesPeriod] = useState('7days'); // 'daily' | '7days' | '30days' | 'yearly'
  const [salesAnalytics, setSalesAnalytics] = useState(null);

  const [rolls, setRolls] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Savat
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [discountUsd, setDiscountUsd] = useState(0);
  const [paidUsd, setPaidUsd] = useState('');
  const [paidUzs, setPaidUzs] = useState('');
  const [paymentType, setPaymentType] = useState('dollar_naqd');
  const [notes, setNotes] = useState('');

  // Rulon qidirish va filtrlash (Faqat bo'yalgan matolar)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [posDisplayLimit, setPosDisplayLimit] = useState(30);

  // Modallar
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Yangi xaridor formasi
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    initialDebtUsd: ''
  });

  // Yangi vozvrat (qaytgan mato) formasi
  const [returnForm, setReturnForm] = useState({
    customerId: '',
    customerName: '',
    invoiceNumber: '',
    fabricId: '',
    fabricName: "Suprem Penye 30/1 (Bo'yalgan Qora)",
    colorName: 'Qora (Jet Black)',
    pantoneCode: 'TCX-19-4008',
    returnedKg: '',
    pricePerKgUsd: '5.60',
    reason: "Bo'yoq rangi notekisligi (raznoottenochnost)",
    detailedReasonNotes: '',
    actionTaken: 'omborga_kirim_2nav',
    refundType: 'qarzdan_ayirish',
    responsiblePerson: 'Nodira Qodirova (QC)'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rollsRes, custRes, salesRes, retRes, fabRes, analyticsRes] = await Promise.all([
        api.get('/rolls'),
        api.get('/customers'),
        api.get('/sales'),
        api.get('/sales/returns').catch(() => ({ success: false, data: [] })),
        api.get('/fabrics').catch(() => ({ success: false, data: [] })),
        api.get('/sales/analytics').catch(() => null)
      ]);

      // TALAB 1: Sotuvda FAQAT bo'yalgan matolar bo'lsin!
      if (rollsRes.success && Array.isArray(rollsRes.data)) {
        const dyedOnly = rollsRes.data.filter(r =>
          (r.status === 'in_stock' || r.status === 'partially_sold') &&
          (r.fabricType === 'boyalgan')
        );
        setRolls(dyedOnly);
      }

      if (custRes.success) setCustomers(custRes.data || []);
      if (salesRes.success) setSalesHistory(salesRes.data || []);
      if (retRes.success && retRes.data) setSalesReturns(retRes.data);
      if (fabRes.success && fabRes.data) setFabrics(fabRes.data);
      if (analyticsRes && analyticsRes.success && analyticsRes.data) {
        setSalesAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  // Savatga qo'shish
  const addToCart = (roll) => {
    const existing = cart.find(item => item.rollId === roll.id);
    if (existing) {
      notify("Eslatma", "Ushbu bo'yalgan rulon allaqachon savatchada", "info");
      return;
    }

    const defaultKg = Number(roll.currentKg || 0);
    const unitPrice = Number(roll.sellingPricePerKgUsd || 5.20);

    setCart(prev => [
      ...prev,
      {
        rollId: roll.id,
        rollCode: roll.id,
        fabricName: roll.fabricName,
        colorName: roll.colorName || "Standart",
        pantoneCode: roll.pantoneCode,
        colorHex: roll.colorHex || getPantoneHex(roll.pantoneCode),
        qualityGrade: roll.qualityGrade,
        maxKg: Number(roll.currentKg || 0),
        kg: defaultKg,
        unitPriceUsd: unitPrice
      }
    ]);
  };

  const updateCartItemKg = (rollId, newKg) => {
    setCart(prev =>
      prev.map(item => {
        if (item.rollId === rollId) {
          const validKg = Math.min(item.maxKg, Math.max(0.1, Number(newKg) || 0.1));
          return { ...item, kg: validKg };
        }
        return item;
      })
    );
  };

  const updateCartItemPrice = (rollId, newPrice) => {
    setCart(prev =>
      prev.map(item => {
        if (item.rollId === rollId) {
          return { ...item, unitPriceUsd: Math.max(0.01, Number(newPrice) || 0.01) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (rollId) => {
    setCart(prev => prev.filter(item => item.rollId !== rollId));
  };

  // Hisob-kitoblar
  const subtotalUsd = cart.reduce((sum, item) => sum + (item.kg * item.unitPriceUsd), 0);
  const totalUsd = Math.max(0, subtotalUsd - Number(discountUsd || 0));
  const totalUzs = Math.round(totalUsd * usdRate);

  const totalPaidInUsdTerms = Number(paidUsd || 0) + (Number(paidUzs || 0) / usdRate);
  const remainingDebtUsd = Math.max(0, Number((totalUsd - totalPaidInUsdTerms).toFixed(2)));
  const remainingDebtUzs = Math.round(remainingDebtUsd * usdRate);

  // Tezkor to'lov
  const setExactPayment = (currency) => {
    if (currency === 'USD') {
      setPaidUsd(String(totalUsd.toFixed(2)));
      setPaidUzs('');
      setPaymentType('dollar_naqd');
    } else if (currency === 'UZS') {
      setPaidUsd('');
      setPaidUzs(String(totalUzs));
      setPaymentType('som_naqd');
    } else if (currency === 'NASIYA') {
      setPaidUsd('');
      setPaidUzs('');
      setPaymentType('nasiya');
    }
  };

  // Sotuvni yakunlash (Checkout)
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify("Xatolik", "Savatchaga bo'yalgan mato qo'shing", "error");
      return;
    }

    try {
      const payload = {
        customerId: selectedCustomerId || "",
        customerName: selectedCustomerId
          ? customers.find(c => c.id === selectedCustomerId)?.name
          : (customCustomerName || "Chakana xaridor"),
        items: cart,
        exchangeRate: usdRate,
        discountUsd: Number(discountUsd) || 0,
        paidAmountUsd: Number(paidUsd) || 0,
        paidAmountUzs: Number(paidUzs) || 0,
        paymentType,
        paymentAccount: paymentType === 'dollar_naqd' ? 'dollar_kassa' : 'som_kassa',
        notes
      };

      const res = await api.post('/sales', payload);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Сотув муваффақиятли!" : "Sotuv muvaffaqiyatli!",
          `${res.data.invoiceNumber} ($${res.data.totalAmountUsd})`,
          'success'
        );

        setPrintInvoiceData(res.data);
        setCart([]);
        setPaidUsd('');
        setPaidUzs('');
        setNotes('');
        setDiscountUsd(0);
        triggerRefresh();
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Sotuvda xatolik yuz berdi", "error");
    }
  };

  // TALAB 2: Yangi xaridor qo'shish
  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.name.trim()) {
      notify("Xatolik", "Xaridor ismi va familiyasi kiritilishi shart", "error");
      return;
    }

    try {
      const res = await api.post('/customers', newCustomerForm);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Янги харидор қўшилди!" : "Yangi xaridor qo'shildi!",
          res.data.name,
          'success'
        );
        setNewCustomerModalOpen(false);
        // Yangi xaridorni avtomatik tanlash
        setSelectedCustomerId(res.data.id);
        setCustomCustomerName('');
        setNewCustomerForm({ name: '', phone: '', company: '', address: '', initialDebtUsd: '' });
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Xaridor qo'shishda xatolik", "error");
    }
  };

  // TALAB 3: Qaytarilgan matoni (vozvrat) ro'yxatga olish
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.returnedKg || Number(returnForm.returnedKg) <= 0) {
      notify("Xatolik", "Qaytarilgan mato vaznini (kg) to'g'ri kiriting", "error");
      return;
    }
    if (!returnForm.detailedReasonNotes || !returnForm.detailedReasonNotes.trim()) {
      notify("Xatolik", "Mato nima sababdan qaytganligini batafsil yozing", "error");
      return;
    }

    try {
      const selectedCust = customers.find(c => c.id === returnForm.customerId);
      const payload = {
        ...returnForm,
        customerName: selectedCust ? selectedCust.name : (returnForm.customerName || "Chakana xaridor")
      };

      const res = await api.post('/sales/returns', payload);
      if (res.success) {
        notify(
          lang === 'cyr' ? "Қайтарилган мато рўйхатга олинди!" : "Qaytarilgan mato ro'yxatga olindi!",
          `${res.data.returnNumber} (${res.data.returnedKg} kg)`,
          'success'
        );
        setReturnModalOpen(false);
        setReturnForm({
          customerId: '',
          customerName: '',
          invoiceNumber: '',
          fabricId: '',
          fabricName: "Suprem Penye 30/1 (Bo'yalgan Qora)",
          colorName: 'Qora (Jet Black)',
          pantoneCode: 'TCX-19-4008',
          returnedKg: '',
          pricePerKgUsd: '5.60',
          reason: "Bo'yoq rangi notekisligi (raznoottenochnost)",
          detailedReasonNotes: '',
          actionTaken: 'omborga_kirim_2nav',
          refundType: 'qarzdan_ayirish',
          responsiblePerson: 'Nodira Qodirova (QC)'
        });
        triggerRefresh();
        fetchData();
      }
    } catch (err) {
      notify("Xatolik", err.message || "Qaytarishda xatolik yuz berdi", "error");
    }
  };

  // Filtrlangan sotuvbop bo'yalgan rulonlar
  const filteredRolls = rolls.filter(roll => {
    if (selectedQuality !== 'all' && roll.qualityGrade !== selectedQuality) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = roll.id.toLowerCase().includes(q);
      const matchName = roll.fabricName?.toLowerCase().includes(q);
      const matchColor = roll.colorName?.toLowerCase().includes(q);
      const matchPantone = roll.pantoneCode?.toLowerCase().includes(q);
      return matchId || matchName || matchColor || matchPantone;
    }
    return true;
  });

  // Filtrlangan sotuvlar tarixi
  const filteredSalesHistory = salesHistory.filter(sale => {
    if (historyStatusFilter !== 'all' && sale.status !== historyStatusFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchInv = sale.invoiceNumber?.toLowerCase().includes(q);
      const matchCust = sale.customerName?.toLowerCase().includes(q);
      const matchItems = (sale.items || []).some(it =>
        it.fabricName?.toLowerCase().includes(q) || it.colorName?.toLowerCase().includes(q)
      );
      return matchInv || matchCust || matchItems;
    }
    return true;
  });

  // Vozvratlar statistikasi
  const totalReturnsKg = salesReturns.reduce((sum, r) => sum + Number(r.returnedKg || 0), 0);
  const totalReturnsUsd = salesReturns.reduce((sum, r) => sum + Number(r.refundTotalUsd || 0), 0);

  // Sotuvlar diagrammasi ma'lumotlari (kunlik tushum va hajm)
  const [salesChartMetric, setSalesChartMetric] = useState('revenue'); // 'revenue' ($) | 'volume' (KG / Tonna)

  const fallbackSalesAnalytics = useMemo(() => ({
    daily: {
      period: 'daily',
      labelLat: 'Bugungi Kunlik',
      labelCyr: 'Бугунги Кунлик',
      salesKg: 3180,
      salesTonnes: 3.18,
      salesUsd: 17656.8,
      salesUzs: Math.round(17656.8 * usdRate),
      data: [
        { label: '08:00', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { label: '10:00', salesKg: 180, salesTonnes: 0.18, salesUsd: 856.8, invoicesCount: 1 },
        { label: '12:00', salesKg: 3000, salesTonnes: 3.0, salesUsd: 16800, invoicesCount: 1 },
        { label: '14:00', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { label: '16:00', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { label: '18:00', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 }
      ]
    },
    '7days': {
      period: '7days',
      labelLat: '7 Kunlik',
      labelCyr: '7 Кунлик',
      salesKg: 95180,
      salesTonnes: 95.18,
      salesUsd: 555656.8,
      salesUzs: Math.round(555656.8 * usdRate),
      data: [
        { date: '2026-09-07', label: '07-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-08', label: '08-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-09', label: '09-Sen', salesKg: 50000, salesTonnes: 50.0, salesUsd: 298000, invoicesCount: 1 },
        { date: '2026-09-10', label: '10-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-11', label: '11-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-12', label: '12-Sen', salesKg: 42000, salesTonnes: 42.0, salesUsd: 240000, invoicesCount: 1 },
        { date: '2026-09-13', label: '13-Sen', salesKg: 3180, salesTonnes: 3.18, salesUsd: 17656.8, invoicesCount: 2 }
      ]
    },
    '30days': {
      period: '30days',
      labelLat: '30 Kunlik',
      labelCyr: '30 Кунлик',
      salesKg: 179180,
      salesTonnes: 179.18,
      salesUsd: 991656.8,
      salesUzs: Math.round(991656.8 * usdRate),
      data: [
        { date: '2026-08-15', label: '15-Avg', salesKg: 14000, salesTonnes: 14.0, salesUsd: 81000, invoicesCount: 1 },
        { date: '2026-08-20', label: '20-Avg', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-08-25', label: '25-Avg', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-08-28', label: '28-Avg', salesKg: 27000, salesTonnes: 27.0, salesUsd: 166000, invoicesCount: 1 },
        { date: '2026-09-02', label: '02-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-04', label: '04-Sen', salesKg: 43000, salesTonnes: 43.0, salesUsd: 189000, invoicesCount: 1 },
        { date: '2026-09-06', label: '06-Sen', salesKg: 0, salesTonnes: 0, salesUsd: 0, invoicesCount: 0 },
        { date: '2026-09-09', label: '09-Sen', salesKg: 50000, salesTonnes: 50.0, salesUsd: 298000, invoicesCount: 1 },
        { date: '2026-09-12', label: '12-Sen', salesKg: 42000, salesTonnes: 42.0, salesUsd: 240000, invoicesCount: 1 },
        { date: '2026-09-13', label: '13-Sen', salesKg: 3180, salesTonnes: 3.18, salesUsd: 17656.8, invoicesCount: 2 }
      ]
    },
    yearly: {
      period: 'yearly',
      labelLat: 'Yillik (2026)',
      labelCyr: 'Йиллик (2026)',
      salesKg: 1051180,
      salesTonnes: 1051.18,
      salesUsd: 5696656.8,
      salesUzs: Math.round(5696656.8 * usdRate),
      data: [
        { month: '2026-01', label: 'Yan', salesKg: 95000, salesTonnes: 95.0, salesUsd: 510000, invoicesCount: 4 },
        { month: '2026-02', label: 'Fev', salesKg: 102000, salesTonnes: 102.0, salesUsd: 550000, invoicesCount: 5 },
        { month: '2026-03', label: 'Mar', salesKg: 115000, salesTonnes: 115.0, salesUsd: 620000, invoicesCount: 6 },
        { month: '2026-04', label: 'Apr', salesKg: 120000, salesTonnes: 120.0, salesUsd: 650000, invoicesCount: 6 },
        { month: '2026-05', label: 'May', salesKg: 135000, salesTonnes: 135.0, salesUsd: 730000, invoicesCount: 7 },
        { month: '2026-06', label: 'Iyun', salesKg: 128000, salesTonnes: 128.0, salesUsd: 690000, invoicesCount: 7 },
        { month: '2026-07', label: 'Iyul', salesKg: 140000, salesTonnes: 140.0, salesUsd: 760000, invoicesCount: 8 },
        { month: '2026-08', label: 'Avg', salesKg: 148000, salesTonnes: 148.0, salesUsd: 810000, invoicesCount: 9 },
        { month: '2026-09', label: 'Sen', salesKg: 68180, salesTonnes: 68.18, salesUsd: 376656.8, invoicesCount: 4 }
      ]
    }
  }), [usdRate]);

  const activeSalesAnalytics = salesAnalytics || fallbackSalesAnalytics;
  const currentSalesPeriodData = activeSalesAnalytics[salesPeriod] || activeSalesAnalytics['7days'];

  const salesPeriodsList = [
    { key: 'daily', lat: 'Kunlik', cyr: 'Кунлик' },
    { key: '7days', lat: '7 Kunlik', cyr: '7 Кунлик' },
    { key: '30days', lat: '30 Kunlik', cyr: '30 Кунлик' },
    { key: 'yearly', lat: 'Yillik (2026)', cyr: 'Йиллик (2026)' }
  ];

  const salesChartData = useMemo(() => {
    return (currentSalesPeriodData.data || []).map(item => ({
      ...item,
      date: item.date || item.month || item.label,
      revenueUsd: Math.round(item.salesUsd || 0),
      revenueUzs: Math.round((item.salesUsd || 0) * usdRate),
      soldKg: Math.round(item.salesKg || 0),
      soldTonnes: Number(((item.salesKg || 0) / 1000).toFixed(2)),
      invoicesCount: item.invoicesCount || 1
    }));
  }, [currentSalesPeriodData, usdRate]);

  const totalSalesRevenueUsd = activeSalesAnalytics.yearly?.salesUsd || 5696656.8;
  const totalSalesKg = activeSalesAnalytics.yearly?.salesKg || 1051180;

  return (
    <div className="space-y-6">
      {/* Sarlavha va Valyuta kursi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            <span>{lang === 'cyr' ? "Мато Сотуви & POS Касса" : "Mato Sotuvi & POS Kassa"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'cyr'
              ? "Фақат бўялган тайёр матолар сотуви (КГ ва USD), янги харидорлар, сотувлар тарихи ва мижоздан қайтган матолар (возврат)."
              : "Faqat bo'yalgan tayyor matolar sotuvi (KG va USD), yangi xaridorlar, sotuvlar tarixi va mijozdan qaytgan matolar (vozvrat)."}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>1$ = {Number(usdRate).toLocaleString()} {lang === 'cyr' ? 'сўм' : "so'm"}</span>
          </div>

          <button
            onClick={() => setNewCustomerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'cyr' ? "+ Янги Харидор" : "+ Yangi Xaridor"}</span>
          </button>

          {activeTab === 'pos' && (
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{lang === 'cyr' ? "QR Скан" : "QR Skan"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab almashtirish tugmalari */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{lang === 'cyr' ? "Янги Савдо (Бўялган Мато)" : "Yangi Savdo (Bo'yalgan Mato)"}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>
            {lang === 'cyr'
              ? `Сотувлар Тарихи & Диаграмма (${salesHistory.length})`
              : `Sotuvlar Tarixi & Diagramma (${salesHistory.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>
            {lang === 'cyr'
              ? `↩️ Қайтган Матолар (${salesReturns.length})`
              : `↩️ Qaytgan Matolar (${salesReturns.length})`}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. TAB: POS KASSA (Faqat Bo'yalgan Matolar) */}
      {/* ======================================================== */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chap tomon: Ombordagi mavjud Bo'yalgan rulonlar (7 ustun) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs space-y-3">
              {/* Eslatma: Faqat bo'yalgan mato sotiladi */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'cyr' ? "Сотувда Фақат Бўялган Тайёр Матолар:" : "Sotuvda Faqat Bo'yalgan Tayyor Matolar:"}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredRolls.length} {lang === 'cyr' ? "та рулон мавжуд" : "ta rulon mavjud"}
                </span>
              </div>

              {/* Qidiruv va Sifat filtri */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lang === 'cyr' ? "Бўялган мато, ранг ёки рулон ID..." : "Bo'yalgan mato, rang yoki rulon ID..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedQuality('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedQuality === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'cyr' ? "Барчаси" : "Barchasi"}
                  </button>
                  <button
                    onClick={() => setSelectedQuality('1-nav')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedQuality === '1-nav'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'cyr' ? "1-нав" : "1-nav"}
                  </button>
                  <button
                    onClick={() => setSelectedQuality('2-nav')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedQuality === '2-nav'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'cyr' ? "2-нав" : "2-nav"}
                  </button>
                </div>
              </div>

              {/* Rulonlar ro'yxati */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredRolls.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <p>{lang === 'cyr' ? "Сотувга мос бўялган рулонлар топилмади" : "Sotuvga mos bo'yalgan rulonlar topilmadi"}</p>
                  </div>
                ) : (
                  <>
                    {filteredRolls.slice(0, posDisplayLimit).map(roll => {
                      const gradeBadge = getQualityGradeBadge(roll.qualityGrade, lang);
                      const colorHex = roll.colorHex || getPantoneHex(roll.pantoneCode);

                      return (
                        <div
                          key={roll.id}
                          className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-600 transition-all flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Rang swatch belgisi */}
                            <div
                              className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-600 shrink-0 shadow-xs flex items-center justify-center"
                              style={{ backgroundColor: colorHex }}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {roll.id}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${gradeBadge.className}`}>
                                  {gradeBadge.label}
                                </span>
                              </div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {loc(roll.fabricName)}
                              </div>
                              <div className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold flex items-center gap-1">
                                <span>🎨 {loc(roll.colorName)}</span>
                                {roll.pantoneCode && (
                                  <span className="font-mono text-[10px] px-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200">
                                    {roll.pantoneCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-black text-slate-900 dark:text-white">
                                {formatKg(roll.currentKg, lang)}
                              </div>
                              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                {formatUsd(roll.sellingPricePerKgUsd || 5.20)}/kg
                              </div>
                            </div>

                            <button
                              onClick={() => addToCart(roll)}
                              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-xs"
                              title="Savatga qo'shish"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredRolls.length > posDisplayLimit && (
                      <button
                        type="button"
                        onClick={() => setPosDisplayLimit(prev => prev + 30)}
                        className="w-full py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        {lang === 'cyr'
                          ? `Кўпроқ кўрсатиш (+30 та, жами ${filteredRolls.length.toLocaleString()} та рулон)`
                          : `Ko'proq ko'rsatish (+30 ta, jami ${filteredRolls.length.toLocaleString()} ta rulon)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* O'ng tomon: Savat va Kassaga to'lov (5 ustun) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'cyr' ? "Саватча" : "Savatcha"} ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'cyr' ? "Тозалаш" : "Tozalash"}</span>
                  </button>
                )}
              </div>

              {/* Savatdagi tovarlar */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>{lang === 'cyr' ? "Саватча бўш. Чап томондан бўялган мато танланг." : "Savatcha bo'sh. Chap tomondan bo'yalgan mato tanlang."}</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.rollId}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">{loc(item.fabricName)}</div>
                          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                            {loc(item.colorName)} ({item.rollCode})
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.rollId)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            {lang === 'cyr' ? "Вазн (кг):" : "Vazn (kg):"} (max {item.maxKg})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            max={item.maxKg}
                            min="0.1"
                            value={item.kg}
                            onChange={(e) => updateCartItemKg(item.rollId, e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            {lang === 'cyr' ? "Нархи ($/кг):" : "Narxi ($/kg):"}
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={item.unitPriceUsd}
                            onChange={(e) => updateCartItemPrice(item.rollId, e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold pt-1 text-emerald-600 dark:text-emerald-400">
                        <span>{formatDualCurrency(item.kg * item.unitPriceUsd, usdRate, lang)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Xaridor tanlash va Yangi Xaridor qo'shish */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'cyr' ? "Мижоз (Харидор):" : "Mijoz (Xaridor):"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewCustomerModalOpen(true)}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{lang === 'cyr' ? "+ Янги Харидор Қўшиш" : "+ Yangi Xaridor Qo'shish"}</span>
                  </button>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setCustomCustomerName('');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- {lang === 'cyr' ? "Чакана харидор" : "Chakana xaridor"} --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {Number(c.debtUsd || 0) > 0 ? `[Qarz: $${c.debtUsd}]` : ''}
                    </option>
                  ))}
                </select>

                {!selectedCustomerId && (
                  <input
                    type="text"
                    placeholder={lang === 'cyr' ? "Харидор исми / телефони..." : "Xaridor ismi / telefoni..."}
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>

              {/* Jami hisob va To'lovlar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{lang === 'cyr' ? "Оралиқ сумма:" : "Oraliq summa:"}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatUsd(subtotalUsd)}</span>
                </div>

                <div className="flex justify-between items-baseline border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-500">
                      {lang === 'cyr' ? "ЖАМИ ТЎЛОВ:" : "JAMI TO'LOV:"}
                    </span>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatUzs(totalUzs, lang)}
                    </div>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatUsd(totalUsd)}
                  </span>
                </div>

                {/* Tezkor to'lov tugmalari */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setExactPayment('USD')}
                    className="py-1 px-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-200 cursor-pointer"
                  >
                    💵 {lang === 'cyr' ? "Тўлиқ $" : "To'liq $"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExactPayment('UZS')}
                    className="py-1 px-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-200 cursor-pointer"
                  >
                    💳 {lang === 'cyr' ? "Тўлиқ Сўм" : "To'liq So'm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExactPayment('NASIYA')}
                    className="py-1 px-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] hover:bg-amber-200 cursor-pointer"
                  >
                    ⏳ {lang === 'cyr' ? "Насия" : "Nasiya"}
                  </button>
                </div>
              </div>

              {/* To'lov kiritish inputlari */}
              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      {lang === 'cyr' ? "Тўланди ($ USD):" : "To'landi ($ USD):"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paidUsd}
                      onChange={(e) => setPaidUsd(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      {lang === 'cyr' ? "Тўланди (Сўм UZS):" : "To'landi (So'm UZS):"}
                    </label>
                    <input
                      type="number"
                      step="1000"
                      placeholder="0"
                      value={paidUzs}
                      onChange={(e) => setPaidUzs(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {remainingDebtUsd > 0.05 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs flex justify-between items-center font-bold">
                    <span className="text-rose-700 dark:text-rose-300">{lang === 'cyr' ? "Қарздорлик (Насия):" : "Qarzdorlik (Nasiya):"}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      {formatDualCurrency(remainingDebtUsd, usdRate, lang)}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'cyr' ? "Сотувни Тасдиқлаш & Чек Чиқариш" : "Sotuvni Tasdiqlash & Chek Chiqarish"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAB: SOTUVLAR TARIXI VA DIAGRAMMASI */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* SOTUV DIAGRAMMASI VA KPI TAHLILI */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Сотувлар Диаграммаси & Динамика" : "Sotuvlar Diagrammasi & Dinamika"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'cyr'
                      ? "Кунлик, 7 кунлик, 30 кунлик ва Йиллик бўялган мато савдоси (КГ ва $ USD)"
                      : "Kunlik, 7 kunlik, 30 kunlik va Yillik bo'yalgan mato savdosi (KG va $ USD)"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 4 Period Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {salesPeriodsList.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSalesPeriod(p.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        salesPeriod === p.key
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang === 'cyr' ? p.cyr : p.lat}
                    </button>
                  ))}
                </div>

                {/* Metric switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSalesChartMetric('revenue')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      salesChartMetric === 'revenue'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{lang === 'cyr' ? "Тушум ($)" : "Tushum ($)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesChartMetric('volume')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      salesChartMetric === 'volume'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{lang === 'cyr' ? "Ҳажм (КГ)" : "Hajm (KG)"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Period Solishtirma KPI Kartochkalari: Kunlik KG/$, 7 kunlik KG/$, 30 kunlik KG/$, Yillik KG/$ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {salesPeriodsList.map(p => {
                const pData = activeSalesAnalytics[p.key] || {};
                const isSelected = salesPeriod === p.key;

                return (
                  <div
                    key={p.key}
                    onClick={() => setSalesPeriod(p.key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-500 flex justify-between items-center">
                      <span>{lang === 'cyr' ? p.cyr : p.lat}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>

                    {/* Sotilgan Mato KG */}
                    <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {formatKg(pData.salesKg || 0, lang)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {pData.salesTonnes} tn • {lang === 'cyr' ? 'сотилган мато' : 'sotilgan mato'}
                    </div>

                    {/* Tushum $ USD */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[10px]">{lang === 'cyr' ? "Тушум:" : "Tushum:"}</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">
                        {formatUsd(pData.salesUsd || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recharts Interactive AreaChart */}
            <div className="pt-2">
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="salesVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) =>
                        salesChartMetric === 'revenue'
                          ? `$${(val / 1000).toFixed(0)}k`
                          : val >= 1000 ? `${(val / 1000).toFixed(0)}t` : `${val}kg`
                      }
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[210px] space-y-1.5">
                              <div className="font-mono font-black text-emerald-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                                <span>📅 {d.date}</span>
                                <span className="text-[10px] text-slate-400">{d.invoicesCount || 1} ta invoys</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">{lang === 'cyr' ? "Тушум ($):" : "Tushum ($):"}</span>
                                <span className="font-bold text-emerald-300">{formatUsd(d.revenueUsd)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span>{lang === 'cyr' ? "Сўмда:" : "So'mda:"}</span>
                                <span>{formatUzs(d.revenueUzs, lang)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                <span className="text-slate-400">{lang === 'cyr' ? "Мато ҳажми:" : "Mato hajmi:"}</span>
                                <span className="font-bold text-indigo-300">{d.soldTonnes} tn ({Number(d.soldKg).toLocaleString()} kg)</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {salesChartMetric === 'revenue' ? (
                      <Area
                        type="monotone"
                        dataKey="revenueUsd"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#salesRevenueGrad)"
                        name="Tushum ($)"
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="soldKg"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#salesVolumeGrad)"
                        name="Hajm (KG)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Kunlik sotuvlar jadvalchasi (Tafsilotlar) */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                  <span>{lang === 'cyr' ? "Кунлар Кесимида Сотув Тафсилотлари:" : "Kunlar Kesimida Sotuv Tafsilotlari:"}</span>
                  <span className="text-[10px] text-slate-400">{salesChartData.length} {lang === 'cyr' ? "кун савдоси" : "kun savdosi"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {salesChartData.map(d => (
                    <div
                      key={d.date}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1"
                    >
                      <div className="font-mono text-[11px] font-bold text-slate-500">{d.date}</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatUsd(d.revenueUsd)}</div>
                      <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{d.soldTonnes} tn ({Number(d.soldKg).toLocaleString()} kg)</div>
                      <div className="text-[9px] text-slate-400">{d.invoicesCount} ta invoys</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SOTUVLAR TARIXI VA INVOYSLAR RO'YXATI */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'cyr' ? "Сотувлар Тарихи & Инвойслар" : "Sotuvlar Tarixi & Invoyslar"} ({filteredSalesHistory.length})
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={lang === 'cyr' ? "Инвойс, мижоз ёки мато..." : "Invoys, mijoz yoki mato..."}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredSalesHistory.map(sale => {
              const isPaid = sale.status === 'tolandi';
              const totalSaleKg = (sale.items || []).reduce((s, it) => s + Number(it.kg || 0), 0);

              return (
                <div
                  key={sale.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {sale.invoiceNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPaid ? "To'langan" : "Qarzdorlik (Nasiya)"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(sale.createdAt, lang)} • <strong>{sale.customerName || "Chakana xaridor"}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setPrintInvoiceData(sale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-xs font-bold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'cyr' ? "Чек" : "Chek"}</span>
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">{formatWeightTonnes(totalSaleKg, lang)} bo'yalgan mato</span>
                    <div className="text-right">
                      <strong className="text-sm font-black text-slate-900 dark:text-white">{formatUsd(sale.totalAmountUsd)}</strong>
                      <div className="text-[10px] text-slate-400">{formatUzs(sale.totalAmountUzs, lang)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB: MIJOZDAN QAYTGAN MATOLAR (VOZVRATLAR) */}
      {/* ======================================================== */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {/* Vozvrat KPI Kartochkalari */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                <span>{lang === 'cyr' ? "Жами Қайтарилган Мато" : "Jami Qaytarilgan Mato"}</span>
                <RotateCcw className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatKg(totalReturnsKg, lang)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'cyr' ? "Мижозлардан қайтган жами вазн" : "Mijozlardan qaytgan jami vazn"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                <span>{lang === 'cyr' ? "Қайтарилган Сумма ($)" : "Qaytarilgan Summa ($)"}</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatUsd(totalReturnsUsd)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {formatUzs(Math.round(totalReturnsUsd * usdRate), lang)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                <span>{lang === 'cyr' ? "Возврат Қайд Қилиш" : "Vozvrat Qayd Qilish"}</span>
                <AlertCircle className="w-4 h-4 text-purple-500" />
              </div>
              <button
                onClick={() => setReturnModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'cyr' ? "+ Қайтган Матони Киритиш" : "+ Qaytgan Matoni Kiritish"}</span>
              </button>
            </div>
          </div>

          {/* Vozvratlar Jadvali */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>{lang === 'cyr' ? "Мижоздан Қайтган Матолар Рўйхати" : "Mijozdan Qaytgan Matolar Ro'yxati"}</span>
                <span className="text-xs font-bold text-slate-500">({salesReturns.length} ta)</span>
              </h3>

              <button
                onClick={() => setReturnModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'cyr' ? "Қайтариш (Возврат)" : "Qaytarish (Vozvrat)"}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-3">{lang === 'cyr' ? "Қайднома №" : "Qaydnoma №"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Мижоз (Харидор)" : "Mijoz (Xaridor)"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Мато & Ранг" : "Mato & Rang"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Вазн (кг)" : "Vazn (kg)"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Сумма ($)" : "Summa ($)"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Қайтиш Сабаби & Изоҳ" : "Qaytish Sababi & Izoh"}</th>
                    <th className="p-3">{lang === 'cyr' ? "Қабул Қилинган Чора" : "Qabul Qilingan Chora"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {salesReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        {lang === 'cyr' ? "Қайтарилган матолар мавжуд эмас" : "Qaytarilgan matolar mavjud emas"}
                      </td>
                    </tr>
                  ) : (
                    salesReturns.map(ret => {
                      const colorHex = getPantoneHex(ret.pantoneCode);

                      return (
                        <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>{ret.returnNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans font-normal">
                              {formatDate(ret.returnDate || ret.createdAt, lang)}
                            </div>
                          </td>

                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            <div>{ret.customerName}</div>
                            {ret.invoiceNumber && (
                              <span className="font-mono text-[10px] text-slate-400">
                                Invoys: {ret.invoiceNumber}
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{loc(ret.fabricName)}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs border border-slate-300"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {ret.colorName}
                              </span>
                              {ret.pantoneCode && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  {ret.pantoneCode}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 font-black text-rose-600 dark:text-rose-400">
                            {formatKg(ret.returnedKg, lang)}
                            <div className="text-[10px] text-slate-400 font-normal">
                              {formatUsd(ret.pricePerKgUsd)}/kg
                            </div>
                          </td>

                          <td className="p-3 font-black text-slate-900 dark:text-white">
                            {formatUsd(ret.refundTotalUsd)}
                            <div className="text-[10px] text-slate-500">
                              {formatUzs(ret.refundTotalUzs, lang)}
                            </div>
                          </td>

                          {/* Qaytish sababi va batafsil izoh */}
                          <td className="p-3 max-w-xs">
                            <div className="font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{ret.reason}</span>
                            </div>
                            {ret.detailedReasonNotes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic">
                                "{ret.detailedReasonNotes}"
                              </p>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Mas'ul: {ret.responsiblePerson}
                            </div>
                          </td>

                          {/* Qabul qilingan chora */}
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 inline-block">
                              {ret.actionTaken === 'omborga_kirim_1nav' && "✅ 1-nav omborga kirim"}
                              {ret.actionTaken === 'omborga_kirim_2nav' && "⚠️ 2-nav chegirmali kirim"}
                              {ret.actionTaken === 'brak_3nav' && "❌ 3-nav (Brakka chiqarildi)"}
                              {ret.actionTaken === 'chiqit' && "🗑️ Chiqit (Utilizatsiya)"}
                            </span>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                              {ret.refundType === 'qarzdan_ayirish' && "📉 Qarzdan chegirildi"}
                              {ret.refundType === 'pul_qaytarildi' && "💵 Pul qaytarildi"}
                              {ret.refundType === 'almashtirildi' && "🔄 Matoga almashtirildi"}
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

      {/* ======================================================== */}
      {/* 4. MODAL: Yangi Xaridor Qo'shish */}
      {/* ======================================================== */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Янги Харидор Қўшиш" : "Yangi Xaridor Qo'shish"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'cyr' ? "Исм, телефон ва корхона маълумотлари" : "Ism, telefon va korxona ma'lumotlari"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Исми ва Шарифи" : "Ismi va Sharifi"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dilmurod Ergashov"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Телефон Рақами" : "Telefon Raqami"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 90 123 45 67"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Корхона / Бренд Номи" : "Korxona / Brend Nomi"}
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Moda Textile MCHJ"
                  value={newCustomerForm.company}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, company: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Манзили" : "Manzili"}
                </label>
                <input
                  type="text"
                  placeholder="Toshkent sh., Chilonzor tumani"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'cyr' ? "Сақлаш" : "Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: Qaytarilgan Matoni Ro'yxatga Olish (Vozvrat) */}
      {/* ======================================================== */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'cyr' ? "Мижоздан Қайтган Матони Қайд Қилиш" : "Mijozdan Qaytgan Matoni Qayd Qilish"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'cyr' ? "Қайтиш сабаблари, нуқсон тафсилоти ва молиявий чора" : "Qaytish sabablari, nuqson tafsiloti va moliyaviy chora"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Xaridor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Мижоз (Харидор)" : "Mijoz (Xaridor)"} *
                  </label>
                  <select
                    value={returnForm.customerId}
                    onChange={(e) => {
                      const c = customers.find(x => x.id === e.target.value);
                      setReturnForm({
                        ...returnForm,
                        customerId: e.target.value,
                        customerName: c ? c.name : ''
                      });
                    }}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Xaridorni tanlang --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Invoys raqami */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Инвойс № (Ихтиёрий)" : "Invoys № (Ixtiyoriy)"}
                  </label>
                  <input
                    type="text"
                    placeholder="INV-2026-0005"
                    value={returnForm.invoiceNumber}
                    onChange={(e) => setReturnForm({ ...returnForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Mato turi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Қайтган Мато Тури" : "Qaytgan Mato Turi"} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Suprem Penye 30/1"
                    value={returnForm.fabricName}
                    onChange={(e) => setReturnForm({ ...returnForm, fabricName: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Rang va Pantone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Ранги & Pantone" : "Rangi & Pantone"} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Qora (Jet Black)"
                      value={returnForm.colorName}
                      onChange={(e) => setReturnForm({ ...returnForm, colorName: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="TCX-19-4008"
                      value={returnForm.pantoneCode}
                      onChange={(e) => setReturnForm({ ...returnForm, pantoneCode: e.target.value })}
                      className="w-28 px-2 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Qaytarilgan vazn (kg) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Қайтарилган Вазн (кг)" : "Qaytarilgan Vazn (kg)"} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="250.0"
                    value={returnForm.returnedKg}
                    onChange={(e) => setReturnForm({ ...returnForm, returnedKg: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-black rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/40 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Narxi ($/kg) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Нархи ($/кг)" : "Narxi ($/kg)"}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="5.60"
                    value={returnForm.pricePerKgUsd}
                    onChange={(e) => setReturnForm({ ...returnForm, pricePerKgUsd: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Qaytish sababi (STANDART RO'YXAT) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Мато Қайтиш Сабаби (Нуқсон тури)" : "Mato Qaytish Sababi (Nuqson turi)"} *
                </label>
                <select
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Bo'yoq rangi notekisligi (raznoottenochnost)">🎨 Bo'yoq rangi notekisligi (raznoottenochnost)</option>
                  <option value="Mato eni tor / Uvalka katta (Shrinkage)">📏 Mato eni tor / Uvalka katta (Shrinkage me'yordan oshgan)</option>
                  <option value="Moy yoki bo'yoq dog'lari mavjud">💧 Moy yoki bo'yoq dog'lari mavjud</option>
                  <option value="Igna sinishi va bo'ylama teshik nuqsoni">🪡 Igna sinishi va bo'ylama teshik nuqsoni</option>
                  <option value="Buyurtmachi modelini o'zgartirishi sababli ortiqcha qolgan">✂️ Buyurtmachi modelini o'zgartirishi sababli ortiqcha qolgan</option>
                  <option value="Ip xomashyosi pilling / ifloslik ko'p">🧶 Ip xomashyosi pilling / ifloslik ko'p</option>
                  <option value="Boshqa sabab">❓ Boshqa sabab</option>
                </select>
              </div>

              {/* Batafsil sabab va izoh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'cyr' ? "Нима Сабабдан Қайтганлиги Ҳақида Батафсил Изоҳ" : "Nima Sababdan Qaytganligi Haqida Batafsil Izoh"} *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Masalan: Tikuv sexida bichish paytida rulonlar orasida rang tafovuti chiqdi, 250 kg mato tikuvga yaroqsiz deb topildi..."
                  value={returnForm.detailedReasonNotes}
                  onChange={(e) => setReturnForm({ ...returnForm, detailedReasonNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Qabul qilinadigan chora va Moliyaviy yechim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Матони Қабул Қилиш Чораси" : "Matoni Qabul Qilish Chorasi"}
                  </label>
                  <select
                    value={returnForm.actionTaken}
                    onChange={(e) => setReturnForm({ ...returnForm, actionTaken: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="omborga_kirim_2nav">⚠️ 2-nav chegirma bilan omborga kirim qilish</option>
                    <option value="brak_3nav">❌ 3-nav (Brak ro'yxatiga chiqarish)</option>
                    <option value="omborga_kirim_1nav">✅ 1-nav toza holda omborga qayta qo'yish</option>
                    <option value="chiqit">🗑️ Chiqitga chiqarish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'cyr' ? "Молиявий Ечим (Ҳисоб-китоб)" : "Moliyaviy Yechim (Hisob-kitob)"}
                  </label>
                  <select
                    value={returnForm.refundType}
                    onChange={(e) => setReturnForm({ ...returnForm, refundType: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="qarzdan_ayirish">📉 Mijozning qarzdorligidan yechish</option>
                    <option value="pul_qaytarildi">💵 Kassadan naqd pul qaytarish</option>
                    <option value="almashtirildi">🔄 Boshqa matoga almashtirib berish</option>
                  </select>
                </div>
              </div>

              {/* Jami hisoblangan summa preview */}
              {Number(returnForm.returnedKg) > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Qaytariladigan summa:</span>
                  <span className="text-rose-600 font-black text-sm">
                    {formatDualCurrency(Number(returnForm.returnedKg) * Number(returnForm.pricePerKgUsd || 5.60), usdRate, lang)}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'cyr' ? "Бекор қилиш" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'cyr' ? "Возвратни Сақлаш" : "Vozvratni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
