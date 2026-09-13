// O'zbekcha Lotin <-> Кирилл <-> Русский transliteratsiya va tarjima tizimi

const latToCyrMap = {
  "Sh": "Ш", "SH": "Ш", "sh": "ш",
  "Ch": "Ч", "CH": "Ч", "ch": "ч",
  "O'": "Ў", "O`": "Ў", "Oʻ": "Ў", "O’": "Ў", "o'": "ў", "o`": "ў", "oʻ": "ў", "o’": "ў",
  "G'": "Ғ", "G`": "Ғ", "Gʻ": "Ғ", "G’": "Ғ", "g'": "ғ", "g`": "ғ", "gʻ": "ғ", "g’": "ғ",
  "Yo": "Ё", "YO": "Ё", "yo": "ё",
  "Yu": "Ю", "YU": "Ю", "yu": "ю",
  "Ya": "Я", "YA": "Я", "ya": "я",
  "Ye": "Е", "YE": "Е", "ye": "е",
  "A": "А", "a": "а",
  "B": "Б", "b": "б",
  "D": "Д", "d": "д",
  "E": "Э", "e": "е",
  "F": "Ф", "f": "ф",
  "G": "Г", "g": "г",
  "H": "Ҳ", "h": "ҳ",
  "I": "И", "i": "и",
  "J": "Ж", "j": "ж",
  "K": "К", "k": "к",
  "L": "Л", "l": "л",
  "M": "М", "m": "м",
  "N": "Н", "n": "н",
  "O": "О", "o": "о",
  "P": "П", "p": "п",
  "Q": "Қ", "q": "қ",
  "R": "Р", "r": "р",
  "S": "С", "s": "с",
  "T": "Т", "t": "т",
  "U": "У", "u": "у",
  "V": "В", "v": "в",
  "X": "Х", "x": "х",
  "Y": "Й", "y": "й",
  "Z": "З", "z": "з",
  "'": "ъ", "`": "ъ", "ʻ": "ъ", "’": "ъ"
};

// Matnni Lotindan Kirillga o'tkazish
export function toCyrillic(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  const multiChars = ["Sh", "SH", "sh", "Ch", "CH", "ch", "O'", "O`", "Oʻ", "O’", "o'", "o`", "oʻ", "o’", "G'", "G`", "Gʻ", "G’", "g'", "g`", "gʻ", "g’", "Yo", "YO", "yo", "Yu", "YU", "yu", "Ya", "YA", "ya", "Ye", "YE", "ye"];
  multiChars.forEach(key => {
    const reg = new RegExp(key, 'g');
    result = result.replace(reg, latToCyrMap[key]);
  });

  return result.split('').map(char => latToCyrMap[char] || char).join('');
}

// 3 tilli lug'at bazasi (Lotin, Kirill, Rus tili)
export const dictionary = {
  // Navigation
  dashboard: { lat: "Boshqaruv Paneli", cyr: "Бошқарув Панели", ru: "Панель Управления" },
  fabrics: { lat: "Matolar Katalogi", cyr: "Матолар Каталоги", ru: "Каталог Тканей" },
  weaving: { lat: "To'quv (Xom Mato)", cyr: "Тўқув (Хом Мато)", ru: "Ткачество (Суровое полотно)" },
  dyeing: { lat: "Bo'yoqxona & Bo'yash", cyr: "Бўёқхона & Бўяш", ru: "Красильный Цех & Покраска" },
  rolls: { lat: "Ombor & Rulonlar (KG)", cyr: "Омбор & Рулонлар (КГ)", ru: "Склад Рулонов (КГ)" },
  defects: { lat: "Sifat Nazorati (QC)", cyr: "Сифат Назорати (QC)", ru: "Контроль Качества (ОТК)" },
  sales: { lat: "Mato Savdosi (POS)", cyr: "Мато Савдоси (POS)", ru: "Продажи Тканей (POS)" },
  customers: { lat: "Mijozlar & Nasiya", cyr: "Мижозлар & Насия", ru: "Клиенты & Задолженности" },
  suppliers: { lat: "Ta'minotchilar & Ip", cyr: "Таъминотчилар & Ип", ru: "Поставщики & Пряжа" },
  finance: { lat: "Kassa & Moliya", cyr: "Касса & Молия", ru: "Касса & Финансы" },
  settings: { lat: "Sozlamalar", cyr: "Созламалар", ru: "Настройки" },

  // General terms
  raw_fabric: { lat: "Xom mato", cyr: "Хом мато", ru: "Суровое полотно" },
  dyed_fabric: { lat: "Bo'yalgan mato", cyr: "Бўялган мато", ru: "Крашеная ткань" },
  in_dyeing: { lat: "Bo'yoqxonada", cyr: "Бўёқхонада", ru: "В покраске" },
  weight_kg: { lat: "Vazn (kg)", cyr: "Вазн (кг)", ru: "Вес (кг)" },
  total_kg: { lat: "Jami og'irlik (kg)", cyr: "Жами оғирлик (кг)", ru: "Общий вес (кг)" },
  roll_count: { lat: "Rulonlar soni", cyr: "Рулонлар сони", ru: "Количество рулонов" },
  price_usd: { lat: "Narxi ($/kg)", cyr: "Нархи ($/кг)", ru: "Цена ($/кг)" },
  dollar_rate: { lat: "Dollar kursi", cyr: "Доллар курси", ru: "Курс доллара" },
  add_new: { lat: "Yangi qo'shish", cyr: "Янги қўшиш", ru: "Добавить новый" },
  search: { lat: "Qidirish...", cyr: "Қидириш...", ru: "Поиск..." },
  filter: { lat: "Filtr", cyr: "Филтр", ru: "Фильтр" },
  save: { lat: "Saqlash", cyr: "Сақлаш", ru: "Сохранить" },
  cancel: { lat: "Bekor qilish", cyr: "Бекор қилиш", ru: "Отмена" },
  delete: { lat: "O'chirish", cyr: "Ўчириш", ru: "Удалить" },
  edit: { lat: "Tahrirlash", cyr: "Таҳрирлаш", ru: "Редактировать" },
  print: { lat: "Chop etish", cyr: "Чоп этиш", ru: "Печать" },
  qr_code: { lat: "QR Kod", cyr: "QR Код", ru: "QR Код" },
  defect: { lat: "Nuqson", cyr: "Нуқсон", ru: "Дефект" },
  cut: { lat: "Kesish", cyr: "Кесиш", ru: "Отрез" },
  status: { lat: "Holati", cyr: "Ҳолати", ru: "Статус" },
  actions: { lat: "Amallar", cyr: "Амаллар", ru: "Действия" },
  loom: { lat: "To'quv dastgohi", cyr: "Тўқув дастгоҳи", ru: "Ткацкий станок" },
  yarn_lot: { lat: "Ip partiyasi", cyr: "Ип партияси", ru: "Партия пряжи" },
  shrinkage: { lat: "Uvalka / Yo'qotish %", cyr: "Увалка / Йўқотиш %", ru: "Усадка / Потери %" },
  all: { lat: "Barchasi", cyr: "Барчаси", ru: "Все" },
  total_revenue: { lat: "Yillik Umumiy Aylanma", cyr: "Йиллик Умумий Айланма", ru: "Годовой Оборот" },
  today_sales: { lat: "Bugungi Savdo", cyr: "Бугунги Савдо", ru: "Продажи за сегодня" },
  sales_history: { lat: "Sotuvlar Tarixi & Invoyslar", cyr: "Сотувлар Тарихи & Инвойслар", ru: "История Продаж & Накладные" },
  sales_pos: { lat: "Yangi Savdo (POS Kassa)", cyr: "Янги Савдо (POS Касса)", ru: "Новая Продажа (POS)" },
  defect_reason: { lat: "Brak / Nuqson Sababi", cyr: "Брак / Нуқсон Сабаби", ru: "Причина Брака / Дефекта" },
  defective_rolls: { lat: "Brak Matolar (3-nav)", cyr: "Брак Матолар (3-нав)", ru: "Бракованные Ткани (3-сорт)" },
  tonnes: { lat: "tonna", cyr: "тонна", ru: "тонн" },
  invoices: { lat: "Invoyslar", cyr: "Инвойслар", ru: "Накладные" },
  paid: { lat: "To'langan", cyr: "Тўланган", ru: "Оплачено" },
  debt: { lat: "Nasiya (Qarz)", cyr: "Насия (Қарз)", ru: "Задолженность" },
  reprint_invoice: { lat: "Invoysni Chop Etish", cyr: "Инвойсни Чоп Этиш", ru: "Распечатать Накладную" }
};

// Tarjima helper funksiyasi (Lotin, Kirill, Rus)
export function t(key, lang = 'lat', defaultText = '') {
  if (dictionary[key]) {
    return dictionary[key][lang] || dictionary[key].lat;
  }
  if (defaultText) {
    if (lang === 'cyr') return toCyrillic(defaultText);
    return defaultText;
  }
  if (lang === 'cyr') return toCyrillic(key);
  return key;
}

// Ixtiyoriy matnni tanlangan tilga moslash
export function localizeText(text, lang = 'lat') {
  if (!text || typeof text !== 'string') return text;
  if (lang === 'cyr') {
    return toCyrillic(text);
  }
  return text;
}
