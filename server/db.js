import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Papka mavjudligini ta'minlash
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
  fabrics: [],
  rolls: [],
  defects: [],
  suppliers: [],
  customers: [],
  sales: [],
  looms: [],
  weaving_batches: [],
  dyeing_orders: [],
  finance_transactions: [],
  employees: [],
  users: [
    {
      id: "USR-ADMIN-01",
      name: "Polat Alemdar",
      phone: "+998 90 123 45 67",
      email: "admin@textilepro.uz",
      password: "admin123",
      role: "admin",
      canEdit: true,
      allowedTabs: ["*"],
      status: "active",
      createdAt: "2026-09-01T08:00:00.000Z"
    }
  ],
  settings: {
    companyName: "Silk & Cotton Textile ERP",
    brandName: "TextilePro Uzbekistan",
    phone: "+998 71 200 45 60",
    email: "info@textilepro.uz",
    address: "Toshkent shahri, Yakkasaroy tumani, To'qimachilar ko'chasi 12-uy",
    taxId: "305928194",
    bankAccount: "20208000900123456001",
    bankName: "Ipak Yo'li Bank ATB",
    mfo: "00401",
    currency: "USD",
    usdExchangeRate: 12850,
    dyehouses: ["Andijon Tekstil Bo'yoqxona", "Toshkent Global Dyeing", "Namangan Rangli Mato MCHJ", "Samarqand To'qima Bo'yash"],
    standardShrinkageTolerance: 5.0, // 5% uvalka me'yori
    receiptFooter: "Xaridingiz uchun tashakkur! Mato sifati va og'irligiga to'liq kafolat beriladi.",
    labelPrinterSize: "58mm", // 58mm, 80mm, A4_sticker
    defectAutoDiscount: 10 // 2-nav uchun avtomatik chegirma %
  }
};

class JSONDatabase {
  constructor() {
    this.cache = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        if (!this.cache.dyeing_orders) this.cache.dyeing_orders = [];
        if (!this.cache.looms) this.cache.looms = [];
        if (!this.cache.weaving_batches) this.cache.weaving_batches = [];
        if (!this.cache.users || !Array.isArray(this.cache.users) || this.cache.users.length === 0) {
          this.cache.users = [
            {
              id: "USR-ADMIN-01",
              name: "Bosh Administrator",
              phone: "+998 90 123 45 67",
              email: "admin@textilepro.uz",
              password: "admin123",
              role: "admin",
              canEdit: true,
              allowedTabs: ["*"],
              status: "active",
              createdAt: "2026-09-01T08:00:00.000Z"
            }
          ];
        }
        if (!this.cache.access_logs) this.cache.access_logs = [];
        if (!this.cache.settings.usdExchangeRate) this.cache.settings.usdExchangeRate = 12850;
      } else {
        this.cache = JSON.parse(JSON.stringify(defaultData));
        this.save();
      }
    } catch (err) {
      console.error("Ma'lumotlar bazasini yuklashda xatolik:", err);
      this.cache = JSON.parse(JSON.stringify(defaultData));
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error("Ma'lumotlar bazasini saqlashda xatolik:", err);
      return false;
    }
  }

  get(collectionName) {
    if (!this.cache[collectionName]) {
      this.cache[collectionName] = [];
    }
    return this.cache[collectionName];
  }

  set(collectionName, data) {
    this.cache[collectionName] = data;
    this.save();
    return this.cache[collectionName];
  }

  find(collectionName, queryFn) {
    const list = this.get(collectionName);
    return typeof queryFn === 'function' ? list.filter(queryFn) : list;
  }

  findById(collectionName, id) {
    const list = this.get(collectionName);
    return list.find(item => String(item.id) === String(id)) || null;
  }

  insert(collectionName, record) {
    const list = this.get(collectionName);
    const newRecord = {
      id: record.id || this.generateId(collectionName),
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(newRecord);
    this.save();
    return newRecord;
  }

  update(collectionName, id, updates) {
    const list = this.get(collectionName);
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return list[index];
  }

  delete(collectionName, id) {
    const list = this.get(collectionName);
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    return true;
  }

  getSettings() {
    return this.cache.settings || defaultData.settings;
  }

  updateSettings(updates) {
    this.cache.settings = { ...this.getSettings(), ...updates };
    this.save();
    return this.cache.settings;
  }

  resetWith(data) {
    this.cache = JSON.parse(JSON.stringify(data));
    this.save();
  }

  generateId(collectionName) {
    const prefixMap = {
      fabrics: 'FAB',
      rolls: 'ROL',
      defects: 'DEF',
      suppliers: 'SUP',
      customers: 'CUS',
      sales: 'INV',
      looms: 'DAS',
      weaving_batches: 'TOQ',
      dyeing_orders: 'BOY',
      dyehouses: 'DYE',
      sales_returns: 'RET',
      finance_transactions: 'TXN',
      employees: 'EMP'
    };
    const prefix = prefixMap[collectionName] || 'ID';
    const list = this.get(collectionName);
    const nextNum = list.length + 1;
    const pad = String(nextNum).padStart(4, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${pad}`;
  }
}

export const db = new JSONDatabase();
