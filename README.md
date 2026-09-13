# TextilePro ERP - To'qimachilik, Matolar va Kiyim Ishlab Chiqarish Tizimi

Ushbu loyiha **matolar savdosi, to'qimachilik korxonalari va kiyim-kechak ishlab chiqarish (bichuv/tikuv)** uchun maxsus yaratilgan professional ERP tizimidir.

---

## 🌟 Asosiy Imkoniyatlar

1. **Har bir Mato Ruloniga Unikal QR Kod**:
   - Har bir kirim qilingan to'p/rulonga avtomatik unikal QR kod biriktiriladi.
   - **QR Yorliq (Stiker/Etiketka) chop etish**: 58mm, 80mm termoprinter yoki A4 formatda matoga yopishtirish uchun tayyor yorliq.
   - **Kamera orqali QR skanerlash**: Kamera orqali matoni darhol topish, qoldig'ini ko'rish yoki sotuvga qo'shish.

2. **Sifat Nazorati va Kamchiliklar Jurnali (QC & Defects)**:
   - Matodagi nuqsonlarni (ip uzilishi, dog', teshik, to'qilish nuqsoni) metr nuqtasi bilan qayd etish.
   - 1-nav, 2-nav, 3-nav (brak/chegirmali) sifat navlariga ajratish.
   - Nuqsonli joylarni kesib tashlash yoki avtomatik 10% chegirma belgilash.

3. **Mato va Mahsulot Savdosi (POS Terminal)**:
   - Rulonlab yoki metrlab kesib sotish imkoniyati.
   - Har bir sotuvda rulonning qoldig'i avtomatik kamayadi.
   - Professional hisob-faktura (invoys/chek) chop etish.
   - To'lov turlari: Naqd, Plastik karta, Pul o'tkazish, Nasiya (qarz).

4. **Kiyim Ishlab Chiqarish va Bichuv (BOM)**:
   - Kiyim modellari retsepturasi va 1 dona mahsulot tannarxini hisoblash (xomashyo + furnitura + mehnat sarfi).
   - Ishlab chiqarish buyurtmasi ochilganda rulonlardan kerakli metraj sarfi avtomatik yechiladi.
   - Bosqichlar: *Rejalashtirilgan -> Bichuvda -> Tikuvda -> Sifat nazorati -> Yakunlandi*.
   - Ish yakunlanganda tayyor kiyimlar omborga kirim qilinadi.

5. **Kassa, Moliya va P&L**:
   - Asosiy naqd kassa, Bank hisob raqam, Plastik terminal hisoblari.
   - Sof foyda (P&L) va xarajatlar monitoringi.
   - Mijozlar qarz daftari va qarz to'lash amaliyoti.

---

## 🚀 Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish:
```bash
# Server uchun
cd server
npm install

# Client uchun
cd ../client
npm install
```

### 2. Tizimni bitta buyruq bilan ishga tushirish:
```bash
# Asosiy papkada
node dev.js
# yoki
npm run dev
```

Dastur brauzerda avtomatik ochiladi:
- **Frontend Interfeysi**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000`

---

## 📂 Loyiha Tuzilmasi

```
erp/
├── server/
│   ├── index.js              # Express REST API server
│   ├── db.js                 # JSON/SQLite ma'lumotlar bazasi
│   ├── seed.js               # O'zbekcha demo matolar va kiyimlar
│   └── routes/
│       ├── fabrics.js        # Matolar katalogi
│       ├── rolls.js          # Rulonlar va metrlab kesish
│       ├── defects.js        # Kamchiliklar va sifat daftari
│       ├── qr.js             # QR kod qidiruv va yorliqlar
│       ├── sales.js          # Savdo va invoyslar
│       ├── production.js     # Kiyim ishlab chiqarish va BOM
│       ├── apparel.js        # Tayyor kiyimlar ombori
│       ├── finance.js        # Kassa va moliya
│       ├── customers.js      # Mijozlar va qarzlar
│       ├── suppliers.js      # Ta'minotchilar
│       └── settings.js       # Zaxira va sozlamalar
├── client/
│   ├── src/
│   │   ├── components/       # Modallar, QR stiker, Navbar, Sidebar
│   │   ├── pages/            # Dashboard, Matolar, Rulonlar, Savdo, Moliya...
│   │   ├── utils/            # Pul, metr, sana formatlash
│   │   └── context/          # Global holat va bildirishnomalar
└── dev.js                    # Bitta buyruq bilan ishga tushiruvchi
```
