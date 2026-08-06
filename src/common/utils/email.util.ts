import nodemailer from 'nodemailer';
import { env } from '@config/env';
import dns from 'dns';

// Fix ENETUNREACH IPv6 issue (biasa terjadi di Railway / Docker)
// Memaksa DNS resolver Node.js untuk memprioritaskan IPv4 daripada IPv6
dns.setDefaultResultOrder('ipv4first');

// Buat transporter Nodemailer sekali — pakai untuk semua pengiriman email
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,      // false untuk port 587 (STARTTLS) — true hanya untuk port 465
  requireTLS: true,   // Wajib pakai TLS (keamanan koneksi)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

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
