import { db } from './db.js';

/**
 * User-Agent matnidan Qurilma, OS va Brauzerni aniqlash
 */
export function parseUserAgent(ua = '') {
  if (!ua) {
    return {
      device: 'Noma\'lum Qurilma',
      deviceType: 'desktop',
      os: 'Noma\'lum OS',
      browser: 'Noma\'lum Brauzer'
    };
  }

  let deviceType = 'desktop';
  let device = 'Kompyuter / Noutbuk';
  let os = 'Windows / Boshqa';
  let browser = 'Brauzer';

  // Device & OS detection
  if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet';
    device = 'Planshet';
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
    device = 'Smartfon (Telefon)';
  } else {
    deviceType = 'desktop';
    device = 'Kompyuter (PC / Noutbuk)';
  }

  // OS Detection
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10 / 11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/iPhone|iPad/i.test(ua)) {
    const match = ua.match(/OS ([0-9_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (Apple)';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9\.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([0-9_]+)/);
    os = match ? `macOS (${match[1].replace(/_/g, '.')})` : 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Specific Device Model
  if (/iPhone/i.test(ua)) device = 'Apple iPhone';
  else if (/iPad/i.test(ua)) device = 'Apple iPad';
  else if (/SM-[A-Z0-9]+/i.test(ua)) {
    const samMatch = ua.match(/SM-[A-Z0-9]+/i);
    device = `Samsung Galaxy (${samMatch[0]})`;
  } else if (/Redmi|POCO|Xiaomi/i.test(ua)) {
    device = 'Xiaomi / Redmi';
  } else if (/Pixel/i.test(ua)) {
    device = 'Google Pixel';
  }

  // Browser Detection
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium|OPR/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/YaBrowser/i.test(ua)) browser = 'Yandex Browser';

  return { device, deviceType, os, browser };
}

/**
 * Request'dan IP manzilini ajratib olish
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = forwarded.split(',');
    let ip = list[0].trim().replace(/^::ffff:/, '');
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
  }
  const realIp = req.headers['x-real-ip'] || req.headers['cf-connecting-ip'];
  if (realIp) {
    let ip = realIp.trim().replace(/^::ffff:/, '');
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
  }
  let remote = req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  remote = remote.replace(/^::ffff:/, '');
  if (remote === '::1') remote = '127.0.0.1';
  return remote;
}

/**
 * IP asosida joylashuvni aniqlash
 */
export function getLocationFromIp(ip, req) {
  // Cloudflare yoki Render headerlari
  const cfCountry = req?.headers?.['cf-ipcountry'];
  if (cfCountry) {
    return `${cfCountry} (Cloudflare)`;
  }

  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return "Mahalliy Qurilma (Localhost / Server)";
  }

  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return "Lokal Ofis / Zavod Tarmog'i (LAN)";
  }

  // Umumiy O'zbekiston yoki Tashqi tarmoq
  return "Internet (Tashqi IP manzil)";
}

/**
 * Kirish harakatini jurnalga (access_logs) yozish
 */
export function logAccess(req, {
  action = "Tizimga kirish",
  status = "Muvaffaqiyatli", // "Muvaffaqiyatli", "Xatolik", "Tashrif", "Ogohlantirish"
  userEmail = null,
  userName = null,
  userId = null,
  details = ""
} = {}) {
  try {
    const ip = getClientIp(req);
    const uaString = req.headers['user-agent'] || '';
    const { device, deviceType, os, browser } = parseUserAgent(uaString);
    const location = getLocationFromIp(ip, req);

    const now = new Date();
    // Toshkent vaqti formati
    const formattedTime = new Intl.DateTimeFormat('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const logEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      formattedTime,
      user: {
        id: userId || null,
        name: userName || "Mehmon (Noma'lum)",
        email: userEmail || null
      },
      action,
      status,
      ip,
      device,
      deviceType,
      os,
      browser,
      location,
      path: req.originalUrl || req.url,
      method: req.method,
      details
    };

    // Bazadagi access_logs ro'yxatini olish
    let logs = db.get('access_logs');
    if (!Array.isArray(logs)) {
      logs = [];
    }

    // Eng yangisini boshiga qo'shish
    logs.unshift(logEntry);

    // Oxirgi 500 ta logni saqlash
    if (logs.length > 500) {
      logs = logs.slice(0, 500);
    }

    // Saqlash
    db.set('access_logs', logs);

    console.log(`🛡️ [XAVFSIZLIK JURNALI] ${formattedTime} | ${ip} | ${device} (${os}, ${browser}) | ${userEmail || 'Mehmon'} -> ${action} [${status}]`);

    return logEntry;
  } catch (err) {
    console.error("Audit log error:", err);
    return null;
  }
}
