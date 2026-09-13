# 📋 Textile Fabric & Dyeing ERP — O'zgarishlar va Yangilanishlar Qaydnomasi (Changelog)

Ushbu hujjat Textile ERP loyihasida amalga oshirilgan barcha arxitektura, xavfsizlik, foydalanuvchi interfeysi va funksional o'zgarishlarni to'liq qayd etadi.

---

## 🚀 1. Loyihani Versiyalash va GitHub Integratsiyasi
- **Git Repozitoriy:** Loyiha to'liq git bilan initsializatsiya qilindi.
- **GitHub Manzili:** `https://github.com/nsbxan/textile-erp`
- **Asosiy filial:** `main`
- **Xavfsizlik:** `.gitignore` fayliga `.env`, `.env.local`, `node_modules` va maxfiy ma'lumotlar qo'shilib, parollar va maxfiy kalitlar ochiq repozitoriyga chiqib ketishi to'liq bloklandi.

---

## 🔐 2. Autentifikatsiya va Kirish Xavfsizligi (Auth & RBAC)
- **Toza Kirish Sahifasi:** Kirish oynasidan barcha demo yozuvlar, default admin parollari va oshkora ma'lumotlar olib tashlandi.
- **Ko'p tilli interfeys:** O'zbekcha (Lotin), Ўзбекча (Кирилл) va Русский tillari to'liq qo'llab-quvvatlanadi.
- **Ruxsatlar Tizimi (RBAC):**
  - **Bosh Administrator:** Tizimdagi birinchi ro'yxatdan o'tgan foydalanuvchi avtomatik ravishda barcha bo'limlarga to'liq kirish va tahrirlash huquqiga ega bo'ladi.
  - **Xodimlar (Staff):** Ro'yxatdan o'tgan xodimlar dastlab faqat ruxsat berilgan bo'limlarni ko'ra oladi. Bo'limlarni ko'rish va tahrirlash huquqini Administrator `Foydalanuvchilar` bo'limidan sozlaydi.

---

## 🔑 3. Maxfiy Kod bilan Ro'yxatdan O'tish (`imperia`)
- **Talab:** Tizimga begona yoki ruxsatsiz shaxslar ro'yxatdan o'tib kirmasligi kerak.
- **Yechim:**
  - Ro'yxatdan o'tish formasining eng pastki qismiga **«Maxfiy kodni yozing»** (tizimga kirish uchun shart) maydoni joylashtirildi.
  - Tizim maxfiy kodi barcha uchun yagona qilib **`imperia`** so'ziga sozlandi.
  - Agar foydalanuvchi ushbu maydonga `imperia` so'zini to'g'ri kiritsa — ro'yxatdan o'tish muvaffaqiyatli yakunlanadi va tizimga kiradi.
  - Agar noto'g'ri kod yozilsa — tizim xatolik qaytaradi (*"Kiritilgan maxfiy kod noto'g'ri!"*) va ruxsat bermaydi.
  - Kodni tekshirish to'g'ridan-to'g'ri backend serverda (`server/routes/auth.js`) amalga oshiriladi.

---

## 📧 4. Gmail SMTP Email Xizmati (Nodemailer)
- **SMTP Server:** `smtp.gmail.com:465` (SSL)
- **Yuboruvchi Pochta:** `nsbxan@gmail.com`
- **Google App Password:** Google hisobining xavfsiz 16 xonali dastur paroli ulandi.
- **Sozlamalar Sahifasi:** `Tizim Sozlamalari` sahifasida **Email (SMTP)** bo'limi yaratilib, u yerda holat **`✅ Faol va Sozlangan`** tarzida aks ettirildi hamda bir tugma bilan **"Test xatini yuborish va tekshirish"** funksiyasi ishga tushirildi.
- **Server `.env`:** Server boshlanishida `.env` avtomatik o'qilib, kerak bo'lganda bildirishnomalar va xatlar yuborish uchun doim tayyor holatga keltirildi.

---

## 🏭 5. ERP Ishlab Chiqarish va Boshqaruv Modullari
1. **Boshqaruv Paneli (Dashboard):** Daromadlar, xarajatlar, to'quv dastgohlari unumdorligi, bo'yoqxona holati va ombordagi matolar qoldig'i real vaqtda.
2. **Matolar Katalogi:** Matolar turlari, eni, gramaji, tarkibi va narxlari nazorati.
3. **To'quv Ishlab Chiqarish (Weaving):** Xom mato to'qish, dastgohlar holati, smenalar hisobi.
4. **Bo'yoqxona Jarayoni (Dyeing):** Hamkor bo'yoqxonalarga yuborish, partiya (lot), rang kodlari, kirish-chiqish va vazn yo'qotish (shrinkage) nazorati.
5. **Tayyor Mahsulot Ombori:** Rulonlar hisobi, sifat nazorati (1-nav, 2-nav, brak), metraj va kilogramm.
6. **QR-kod / Shtrixkod:** Rulonlar uchun avtomatik QR-kod generatsiya qilish va chop etish.
7. **Savdo va Xaridorlar:** B2B xaridorlarga sotish, to'lov turlari (naqd, dollar, bank o'tkazmasi, qarz / nesiya).
8. **Moliya va Kassa:** Ko'p valyutali kassa (UZS, USD), daromad-xarajatlar, operatsiyalar jurnali.
9. **Zaxiralash (Backup):** Barcha bazani JSON formatida bir marta bosish orqali kompyuterga yuklab olish.

---

## 📝 6. Git Commit Tarixi
- `d91c715` — Textile Fabric and Apparel ERP tizimi tayyor
- `2bea03c` — Kirish sahifasidan demo yozuvlar va parollar olib tashlandi
- `6030df9` — Emailga maxfiy tasdiqlash kodi yuborish tizimi qo'shildi
- `91fbf32` — Nodemailer SMTP email tizimi va Sozlamalarga Gmail integratsiyasi kiritildi
- `210f071` — AuthPage da api import xatosi tuzatildi
- `6b0d28f` — EmailHelper da dotenv fayl yuklanishi yaxshilandi
- `e1eba30` — Demo tasdiqlash kodi olib tashlandi
- `457ab43` — Settings sahifasida SMTP 'Faol va Sozlangan' belgisi chiqarildi
- `d662a8f` — Maxfiy tasdiqlash kodi 'imperia' ga o'zgartirildi
- `15d057a` — Emailga kod yuborish olib tashlandi, ro'yxatdan o'tish pastiga 'imperia' maxfiy kodi katagi qo'shildi
