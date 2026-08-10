import nodemailer from 'nodemailer';
import { env } from '@config/env';

// Konfigurasi SMTP dipisahkan ke variabel tersendiri.
// Mailtrap sandbox dipakai untuk testing — email tertangkap di virtual inbox Mailtrap.
// Port 2525 dipakai karena Railway tidak memblokir port ini
// (Railway hanya memblokir 465/587 yang merupakan port SMTP standar).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const smtpConfig: any = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,      // 2525 — port alternatif Mailtrap
  secure: false,
  family: 4,                // Paksa IPv4 — Railway tidak support koneksi keluar via IPv6
  connectionTimeout: 8000,  // Gagal cepat dalam 8 detik (default nodemailer = 2 menit)
  greetingTimeout: 8000,    // Timeout saat handshake SMTP
  socketTimeout: 8000,      // Timeout per operasi socket
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
};

// Buat transporter Nodemailer sekali — pakai untuk semua pengiriman email
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Kirim email verifikasi akun ke user yang baru daftar
 * @param toEmail  - Email tujuan (email user)
 * @param userName - Nama user untuk sapaan di email
 * @param token    - Token unik untuk verifikasi
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Mitbiz POS" <${env.EMAIL_FROM}>`,
    to: toEmail,
    subject: 'Verifikasi Akun Mitbiz POS Anda',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Mitbiz POS</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">Halo, ${userName}! 👋</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Terima kasih sudah mendaftar di <strong>Mitbiz POS</strong>.
            Klik tombol di bawah untuk memverifikasi email Anda dan mengaktifkan akun.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}"
               style="background: #1a56db; color: white; padding: 14px 32px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      display: inline-block; font-size: 16px;">
              Verifikasi Email Saya
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">
            Link ini berlaku selama <strong>15 menit</strong>. Jika Anda tidak mendaftar, abaikan email ini.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Mitbiz POS. Semua hak dilindungi.
          </p>
        </div>
      </div>
    `,
  });
}
