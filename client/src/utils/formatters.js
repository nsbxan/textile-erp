import { toCyrillic } from './lang';

// Og'irlikni KG da formatlash (masalan: "125.4 kg", "125.4 кг")
export function formatKg(kg, lang = 'lat') {
  if (kg === undefined || kg === null || isNaN(kg)) {
    return (lang === 'cyr' || lang === 'ru') ? "0 кг" : "0 kg";
  }
  const formatted = Number(kg).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  const unit = (lang === 'cyr' || lang === 'ru') ? 'кг' : 'kg';
  return `${formatted} ${unit}`;
}

// Katta og'irlikni KG va Tonnada formatlash (masalan: "108 450 kg (108.5 tonna)")
export function formatWeightTonnes(kg, lang = 'lat') {
  const val = Number(kg) || 0;
  const numStr = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const unitKg = (lang === 'cyr' || lang === 'ru') ? 'кг' : 'kg';
  
  if (val >= 1000) {
    const tonnes = (val / 1000).toFixed(1);
    const tonUnit = lang === 'cyr' ? 'тонна' : lang === 'ru' ? 'тонн' : 'tonna';
    return `${numStr} ${unitKg} (${tonnes} ${tonUnit})`;
  }
  return `${numStr} ${unitKg}`;
}

// Dollar summasini formatlash (masalan: "$1,250.00" yoki "$4.50")
export function formatUsd(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0.00";
  const num = Number(amount);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// So'm summasini formatlash (masalan: "12 850 000 so'm / сўм / сум")
export function formatUzs(amount, lang = 'lat') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    const cur = lang === 'cyr' ? 'сўм' : lang === 'ru' ? 'сум' : "so'm";
    return `0 ${cur}`;
  }
  const formatted = Math.round(Number(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const cur = lang === 'cyr' ? 'сўм' : lang === 'ru' ? 'сум' : "so'm";
  return `${formatted} ${cur}`;
}

// Ikkala valyutada formatlash: "$100 (1 285 000 so'm)"
export function formatDualCurrency(usdAmount, rate = 12850, lang = 'lat') {
  const usd = Number(usdAmount) || 0;
  const uzs = usd * (Number(rate) || 12850);
  return `${formatUsd(usd)} (${formatUzs(uzs, lang)})`;
}

// Sanani formatlash
export function formatDate(dateVal, lang = 'lat') {
  if (!dateVal) return "-";
  try {
    const d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : "-";

    const monthsLat = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const monthsCyr = [
      "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
      "Июл", "Август", "Сентабр", "Октабр", "Ноябр", "Декабр"
    ];
    const monthsRu = [
      "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
      "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
    ];

    const day = d.getDate();
    const month = (lang === 'ru' ? monthsRu : lang === 'cyr' ? monthsCyr : monthsLat)[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    const str = typeof dateVal === 'string' ? dateVal : d.toISOString();
    if (str.includes('T') || str.includes(':')) {
      return `${day}-${month}, ${year} ${hours}:${mins}`;
    }
    return `${day}-${month}, ${year}`;
  } catch (e) {
    return typeof dateVal === 'string' ? dateVal : "-";
  }
}

// Aniq sana va vaqti-soati bilan (masalan: "13-Sentabr, 2026 14:30:25")
export function formatDateTime(dateVal, lang = 'lat') {
  if (!dateVal) return "-";
  try {
    const d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : "-";

    const monthsLat = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const monthsCyr = [
      "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
      "Июл", "Август", "Сентабр", "Октабр", "Ноябр", "Декабр"
    ];
    const monthsRu = [
      "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
      "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
    ];

    const day = String(d.getDate()).padStart(2, '0');
    const month = (lang === 'ru' ? monthsRu : lang === 'cyr' ? monthsCyr : monthsLat)[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');

    return `${day}-${month}, ${year} • ${hours}:${mins}:${secs}`;
  } catch (e) {
    return typeof dateVal === 'string' ? dateVal : "-";
  }
}

// Jonli soat vaqtini sekundlari bilan formatlash (masalan: "23:48:15")
export function formatLiveTime(d = new Date()) {
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

// Jonli sanani formatlash (masalan: "13-Sentabr, 2026")
export function formatLiveDate(d = new Date(), lang = 'lat') {
  const monthsLat = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];
  const monthsCyr = [
    "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
    "Июл", "Август", "Сентабр", "Октабр", "Ноябр", "Декабр"
  ];
  const monthsRu = [
    "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
  ];

  const day = d.getDate();
  const month = (lang === 'ru' ? monthsRu : lang === 'cyr' ? monthsCyr : monthsLat)[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}, ${year}`;
}

// Sifat navi bo'yicha ma'lumot
export function getQualityGradeBadge(grade, lang = 'lat') {
  switch (grade) {
    case '1-nav':
      return {
        label: lang === 'ru' ? '1-сорт (Высший)' : lang === 'cyr' ? '1-нав (Олий сифат)' : '1-nav (Oliy sifat)',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
      };
    case '2-nav':
      return {
        label: lang === 'ru' ? '2-сорт (С дефектом)' : lang === 'cyr' ? '2-нав (Кичик нуқсонли)' : '2-nav (Kichik nuqsonli)',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
      };
    case '3-nav':
    case 'brak':
      return {
        label: lang === 'ru' ? '3-сорт (Брак)' : lang === 'cyr' ? '3-нав (Брак / Чегирмали)' : '3-nav (Brak / Chegirmali)',
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
      };
    default:
      return {
        label: lang === 'ru' ? 'Стандарт' : lang === 'cyr' ? toCyrillic(grade || 'Стандарт') : (grade || 'Standart'),
        className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
      };
  }
}

// Rulon holati bo'yicha ma'lumot
export function getRollStatusBadge(status, lang = 'lat') {
  switch (status) {
    case 'in_stock':
      return {
        label: lang === 'ru' ? 'На складе (В наличии)' : lang === 'cyr' ? 'Омборда (Мавжуд)' : 'Omborda (Mavjud)',
        className: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
      };
    case 'dyeing':
    case 'in_dyeing':
      return {
        label: lang === 'ru' ? 'В красильном цеху' : lang === 'cyr' ? 'Бўёқхонада (Бўяшда)' : "Bo'yoqxonada (Bo'yashda)",
        className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
      };
    case 'partially_sold':
      return {
        label: lang === 'ru' ? 'Частично продан' : lang === 'cyr' ? 'Қисман сотилган' : 'Qisman sotilgan',
        className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
      };
    case 'sold':
      return {
        label: lang === 'ru' ? 'Продан' : lang === 'cyr' ? 'Тугаган (Сотилган)' : 'Tugagan (Sotilgan)',
        className: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
      };
    case 'scrapped':
      return {
        label: lang === 'ru' ? 'Списан (Брак)' : lang === 'cyr' ? 'Брак қилинган' : 'Brak qilingan',
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
      };
    default:
      return {
        label: lang === 'ru' ? (status || 'В наличии') : lang === 'cyr' ? toCyrillic(status || 'Мавжуд') : (status || 'Mavjud'),
        className: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
      };
  }
}

// Bo'yoqxona buyurtmasi holati
export function getDyeingStatusBadge(status, lang = 'lat') {
  switch (status) {
    case 'yuborildi':
      return {
        label: lang === 'ru' ? '1. Отправлен' : lang === 'cyr' ? '1. Юборилди' : '1. Yuborildi',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
      };
    case 'boyalmoqda':
      return {
        label: lang === 'ru' ? '2. В процессе покраски' : lang === 'cyr' ? '2. Бўялмоқда' : "2. Bo'yalmoqda",
        className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
      };
    case 'tayyor':
    case 'qaytdi':
      return {
        label: lang === 'ru' ? '3. Окрашен (Готов к вывозу)' : lang === 'cyr' ? '3. Бўялган (Олиб келишга тайёр)' : "3. Bo'yalgan (Olib kelishga tayyor)",
        className: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 font-black'
      };
    case 'qabul_qilindi':
      return {
        label: lang === 'ru' ? '4. Принят на склад' : lang === 'cyr' ? '4. Қабул қилинди (Омборда)' : '4. Qabul qilindi (Omborda)',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
      };
    default:
      return {
        label: lang === 'ru' ? status : lang === 'cyr' ? toCyrillic(status) : status,
        className: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
      };
  }
}

// Nuqson turi nomi
export function getDefectTypeName(type, lang = 'lat') {
  const mapLat = {
    ip_uzilishi: "Ip uzilishi / Qayta ulanish",
    dog_rang_farqi: "Dog' / Rang tafovuti",
    teshik: "Teshik / Yirtiq nuqson",
    toqilish_xatosi: "To'qilish nuqsoni / Qalin ip",
    ulanish_choki: "Mato ulanish choki",
    yog_dogi: "Yog' / Moy dog'i (reduktor)",
    igna_sinishi: "Igna sinishi (chiziq va teshik)",
    ip_chalkashligi: "Ip loti aralashishi (zebra)",
    taranglik_buzilishi: "Taranglik notekisligi (to'lqinsimon)",
    rang_notekisligi: "Rang notekisligi (raznoottenochnost)",
    kuyish_uvalka: "Kuyish / Yuqori kirishish (uvalka)",
    qiyshayish: "Mato qiyshayishi / Perikos",
    boshqa: "Boshqa kamchilik"
  };
  const mapCyr = {
    ip_uzilishi: "Ип узилиши / Қайта уланиш",
    dog_rang_farqi: "Доғ / Ранг тафовути",
    teshik: "Тешик / Йиртиқ нуқсон",
    toqilish_xatosi: "Тўқилиш нуқсони / Қалин ип",
    ulanish_choki: "Мато уланиш чоки",
    yog_dogi: "Ёғ / Мой доғи (редуктор)",
    igna_sinishi: "Игна синиши (чизиқ ва тешик)",
    ip_chalkashligi: "Ип лоти аралашиши (зебра)",
    taranglik_buzilishi: "Таранглик нотекислиги (тўлқинсимон)",
    rang_notekisligi: "Ранг нотекислиги (разнооттеночность)",
    kuyish_uvalka: "Куйиш / Юқори киришиш (увалка)",
    qiyshayish: "Мато қийшайиши / Перекос",
    boshqa: "Бошқа камчилик"
  };
  const mapRu = {
    ip_uzilishi: "Обрыв нити / Узел",
    dog_rang_farqi: "Пятно / Разнотоп",
    teshik: "Дырка / Пробоина",
    toqilish_xatosi: "Дефект вязки / Утолщенная нить",
    ulanish_choki: "Стыковочный шов полотна",
    yog_dogi: "Масляное пятно (редуктор)",
    igna_sinishi: "Поломка иглы (полоса и дыры)",
    ip_chalkashligi: "Смешение партий нитей (зебристость)",
    taranglik_buzilishi: "Неравномерное натяжение (волнистость)",
    rang_notekisligi: "Разнооттеночность полотна",
    kuyish_uvalka: "Пригар / Превышение усадки",
    qiyshayish: "Перекос полотна",
    boshqa: "Прочий дефект"
  };
  const map = lang === 'ru' ? mapRu : lang === 'cyr' ? mapCyr : mapLat;
  return map[type] || type || "Noma'lum";
}
