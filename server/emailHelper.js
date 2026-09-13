import nodemailer from 'nodemailer';
import { db } from './db.js';

/**
 * SMTP sozlamalarini olish (avval .env dan, keyin DB settings dan)
 */
export function getSmtpConfig() {
  const dbSettings = db.getSettings() || {};
  const dbSmtp = dbSettings.smtp || {};

  const host = process.env.SMTP_HOST || dbSmtp.host || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || dbSmtp.port || 465);
  const user = process.env.SMTP_USER || dbSmtp.user || '';
  const pass = process.env.SMTP_PASS || dbSmtp.pass || '';
  const fromName = process.env.SMTP_FROM_NAME || dbSmtp.fromName || 'Textile ERP Tizimi';

  return {
    host,
    port,
    secure: port === 465,
    user: user.trim(),
    pass: pass.trim().replace(/\s+/g, ''), // Google App passwordlardagi bo'shliqlarni olib tashlash
    from: `"${fromName}" <${user.trim() || 'noreply@textile-erp.uz'}>`,
    isConfigured: Boolean(user.trim() && pass.trim())
  };
}

/**
 * 6 xonali maxfiy tasdiqlash kodini emailga yuborish
 */
export async function sendVerificationEmail({ to, name, code }) {
  const config = getSmtpConfig();

  // Agar SMTP hali sozlanmagan bo'lsa
  if (!config.isConfigured) {
    console.warn(`⚠️ [EMAIL] SMTP sozlanmagan (SMTP_USER va SMTP_PASS yo'q). Kod konsolda: ${code}`);
    return {
      success: true,
      emailSent: false,
      reason: "SMTP sozlanmagan (Gmail yoki boshqa pochta ulanmagan)",
      code
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: config.from,
      to: to.trim().toLowerCase(),
      subject: `${code} - Textile ERP Tizimiga kirish tasdiqlash kodi`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
            .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
            .body { padding: 32px 28px; text-align: center; }
            .greeting { font-size: 16px; color: #1e293b; margin-bottom: 20px; text-align: left; }
            .code-box { background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .code-title { font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 8px; }
            .code-num { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #4f46e5; margin: 0; font-family: monospace; }
            .warning { font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 20px; }
            .footer { background: #f8fafc; padding: 18px 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>TEXTILE FABRIC & DYEING ERP</h1>
              <p>Avtomatlashtirilgan Ishlab Chiqarish va Boshqaruv Tizimi</p>
            </div>
            <div class="body">
              <div class="greeting">
                Assalomu alaykum, <b>${name || 'Hurmatli foydalanuvchi'}</b>!
              </div>
              <p style="color: #475569; font-size: 14px; text-align: left; margin: 0 0 16px;">
                Textile ERP tizimida ro'yxatdan o'tish yoki tizimga kirishni tasdiqlash uchun quyidagi bir martalik maxfiy koddan foydalaning:
              </p>
              <div class="code-box">
                <div class="code-title">Maxfiy Tasdiqlash Kodi</div>
                <div class="code-num">${code}</div>
              </div>
              <p class="warning">
                ⏳ <b>Eslatma:</b> Ushbu kod <b>10 daqiqa</b> davomida amal qiladi.<br/>
                Xavfsizlik maqsadida ushbu maxfiy kodni begona shaxslarga aslo bermang.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Textile ERP. Barcha huquqlar himoyalangan.
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] Xat muvaffaqiyatli yetkazildi: ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      emailSent: true,
      messageId: info.messageId
    };
  } catch (err) {
    console.error(`❌ [EMAIL] Yuborishda xatolik (${to}):`, err.message);
    return {
      success: false,
      emailSent: false,
      error: err.message,
      code
    };
  }
}
