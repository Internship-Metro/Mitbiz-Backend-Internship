/**
 * src/modules/auth/__tests__/auth.test.ts
 *
 * Integration test untuk Auth module menggunakan Jest + Supertest.
 * Setiap test mengirim HTTP request nyata ke aplikasi dan mengecek response-nya.
 *
 * Jalankan: npm test
 */

import request from 'supertest';
import { app } from '../../../app';
import { prisma } from '../../../prisma/client';

// ─── Mock nodemailer agar email tidak benar-benar terkirim saat test ──────────
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// ─── Helper: bersihkan data user setelah setiap test ─────────────────────────────
async function clearUsers() {
  await prisma.tokenBlacklist.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.businessSubscription.deleteMany();
  await prisma.business.deleteMany();
}

// ─── Data dummy untuk test ────────────────────────────────────────────────────
const testUser = {
  name: 'Budi Santoso',
  email: 'budi.test@gmail.com',
  phone: '08123456789',
  password: 'password123',
  confirmPassword: 'password123',
};

const testBusiness = {
  businessName: 'Cafe Test',
  businessCategory: 'Cafe',
  city: 'Padang',
  province: 'Sumatera Barat',
};

const testBranch = {
  outletName: 'Cafe Test - Pusat',
  outletAddress: 'Jl. Sudirman No. 1',
  outletPhone: '0751123456',
};

// ==============================================================================
// TEST SUITE: Register
// ==============================================================================
describe('Auth — Register', () => {
  beforeEach(async () => {
    await clearUsers();
  });

  // ─── Step 1 ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register/step1', () => {
    it('✅ berhasil membuat akun baru', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('❌ ditolak jika email sudah terdaftar dan aktif', async () => {
      // Buat user aktif dulu
      await request(app).post('/api/v1/auth/register/step1').send(testUser);
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      await prisma.user.update({
        where: { id: user!.id },
        data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      });

      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('❌ ditolak jika email tidak valid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send({ ...testUser, email: 'bukan-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('❌ ditolak jika password kurang dari 8 karakter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send({ ...testUser, password: '123', confirmPassword: '123' });

      expect(res.status).toBe(400);
    });

    it('❌ ditolak jika confirmPassword tidak cocok', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send({ ...testUser, confirmPassword: 'berbeda123' });

      expect(res.status).toBe(400);
    });

    it('✅ izinkan daftar ulang jika email INACTIVE dan belum Step 2', async () => {
      // Register pertama
      await request(app).post('/api/v1/auth/register/step1').send(testUser);

      // Register lagi dengan email yang sama — harus berhasil (reset data lama)
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Step 2 ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register/step2', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step1')
        .send(testUser);
      console.log(res.body); accessToken = res.body.data.tokens.accessToken;
    });

    it('✅ berhasil mendaftarkan bisnis', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step2')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBusiness);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testBusiness.businessName);
    });

    it('❌ ditolak tanpa token JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step2')
        .send(testBusiness);

      expect(res.status).toBe(401);
    });

    it('❌ ditolak jika bisnis sudah terdaftar (Step 2 dua kali)', async () => {
      await request(app)
        .post('/api/v1/auth/register/step2')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBusiness);

      const res = await request(app)
        .post('/api/v1/auth/register/step2')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBusiness);

      expect(res.status).toBe(400);
    });
  });

  // ─── Step 3 ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register/step3', () => {
    let accessToken: string;

    beforeEach(async () => {
      const step1 = await request(app)
        .post('/api/v1/auth/register/step1')
        .send(testUser);
      accessToken = step1.body.data.tokens.accessToken;

      await request(app)
        .post('/api/v1/auth/register/step2')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBusiness);
    });

    it('✅ berhasil mendaftarkan cabang + kirim email verifikasi', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/step3')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBranch);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.outlet.name).toBe(testBranch.outletName);
    });

    it('❌ ditolak jika belum Step 2', async () => {
      // Register baru tanpa Step 2
      const freshStep1 = await request(app)
        .post('/api/v1/auth/register/step1')
        .send({ ...testUser, email: 'fresh@gmail.com' });

      const res = await request(app)
        .post('/api/v1/auth/register/step3')
        .set('Authorization', `Bearer ${freshStep1.body.data.tokens.accessToken}`)
        .send(testBranch);

      expect(res.status).toBe(404);
    });

    it('❌ ditolak jika Step 3 dilakukan dua kali', async () => {
      await request(app)
        .post('/api/v1/auth/register/step3')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBranch);

      const res = await request(app)
        .post('/api/v1/auth/register/step3')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testBranch);

      expect(res.status).toBe(400);
    });
  });
});

// ==============================================================================
// TEST SUITE: Login
// ==============================================================================
describe('Auth — Login', () => {
  let verifiedUserToken: string;

  beforeAll(async () => {
    await clearUsers();

    // Setup: buat user yang sudah terverifikasi penuh
    const step1 = await request(app)
      .post('/api/v1/auth/register/step1')
      .send(testUser);
    verifiedUserToken = step1.body.data.tokens.accessToken;

    await request(app)
      .post('/api/v1/auth/register/step2')
      .set('Authorization', `Bearer ${verifiedUserToken}`)
      .send(testBusiness);

    await request(app)
      .post('/api/v1/auth/register/step3')
      .set('Authorization', `Bearer ${verifiedUserToken}`)
      .send(testBranch);

    // Verifikasi email langsung di DB (bypass link email)
    await prisma.user.updateMany({
      where: { email: testUser.email },
      data: {
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        emailVerificationToken: null,
      },
    });
  });

  it('✅ berhasil login dengan kredensial benar', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('❌ ditolak jika password salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'salah123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('❌ ditolak jika email tidak terdaftar', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tidakada@gmail.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('❌ ditolak jika email belum diverifikasi', async () => {
    // Buat user baru yang belum verifikasi
    await request(app)
      .post('/api/v1/auth/register/step1')
      .send({ ...testUser, email: 'belumverif@gmail.com' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'belumverif@gmail.com', password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.requiresRegistration).toBe(true);
    expect(res.body.data.currentStep).toBe(2);
  });
});

// ==============================================================================
// TEST SUITE: Me & Change Password
// ==============================================================================
describe('Auth — Me & Change Password', () => {
  let accessToken: string;

  beforeAll(async () => {
    await clearUsers();

    const step1 = await request(app)
      .post('/api/v1/auth/register/step1')
      .send(testUser);
    const token = step1.body.data.tokens.accessToken;

    await request(app)
      .post('/api/v1/auth/register/step2')
      .set('Authorization', `Bearer ${token}`)
      .send(testBusiness);

    await request(app)
      .post('/api/v1/auth/register/step3')
      .set('Authorization', `Bearer ${token}`)
      .send(testBranch);

    await prisma.user.updateMany({
      where: { email: testUser.email },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE', emailVerificationToken: null },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    accessToken = loginRes.body.data.tokens.accessToken;
  });

  it('✅ GET /me mengembalikan data user yang sedang login', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('❌ GET /me ditolak tanpa token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('✅ ganti password berhasil', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: testUser.password, newPassword: 'newpassword123', confirmNewPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('❌ ganti password ditolak jika password lama salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: 'salah123', newPassword: 'newpassword123', confirmNewPassword: 'newpassword123' });

    expect(res.status).toBe(400);
  });
});

// ==============================================================================
// TEST SUITE: Refresh Token & Logout
// ==============================================================================
describe('Auth — Refresh Token & Logout', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await clearUsers();

    const step1 = await request(app)
      .post('/api/v1/auth/register/step1')
      .send(testUser);
    const token = step1.body.data.tokens.accessToken;

    await request(app)
      .post('/api/v1/auth/register/step2')
      .set('Authorization', `Bearer ${token}`)
      .send(testBusiness);

    await request(app)
      .post('/api/v1/auth/register/step3')
      .set('Authorization', `Bearer ${token}`)
      .send(testBranch);

    await prisma.user.updateMany({
      where: { email: testUser.email },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE', emailVerificationToken: null },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    accessToken = loginRes.body.data.tokens.accessToken;
    refreshToken = loginRes.body.data.tokens.refreshToken;
  });

  it('✅ refresh token berhasil menghasilkan access token baru', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('❌ refresh token ditolak jika token tidak valid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: 'ini-bukan-token' });

    expect(res.status).toBe(401);
  });

  it('✅ logout berhasil', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
