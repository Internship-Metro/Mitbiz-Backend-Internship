/**
 * src/modules/outlet/__tests__/outlet.test.ts
 */

import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';

async function clearData() {
  await prisma.tokenBlacklist.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.businessSubscription.deleteMany();
  await prisma.business.deleteMany();
}

describe('Outlet Module', () => {
  let adminToken: string;
  let kasirToken: string;
  let businessId: string;
  let initialOutletId: string;
  let staffRoleId: string;

  beforeAll(async () => {
    await clearData();

    // 1. Setup Business
    const business = await prisma.business.create({
      data: {
        businessCode: 'TEST-BIZ-01',
        name: 'Test Business',
        slug: 'test-business',
        status: 'ACTIVE',
      },
    });
    businessId = business.id;

    // 2. Setup Initial Outlet
    const outlet = await prisma.outlet.create({
      data: {
        businessId: business.id,
        name: 'Pusat Test',
        address: 'Jl. Pusat',
        status: 'ACTIVE',
      },
    });
    initialOutletId = outlet.id;

    // 3. Setup Role
    const staffRole = await prisma.role.create({
      data: {
        businessId: business.id,
        name: 'Kasir',
        permissions: { create: [{ menu: 'MENU_POS', canRead: true }] }
      }
    });
    staffRoleId = staffRole.id;

    // 4. Setup Users
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Admin
    const admin = await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        name: 'Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Staff
    const kasir = await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        roleId: staffRoleId,
        name: 'Kasir',
        email: 'kasir@test.com',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 5. Get Tokens (Simulate login to get HttpOnly cookies)

    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password123' });
    adminToken = loginAdmin.headers['set-cookie'];

    const loginKasir = await request(app).post('/api/v1/auth/login').send({ email: 'kasir@test.com', password: 'Password123' });
    kasirToken = loginKasir.headers['set-cookie'];
  });

  afterAll(async () => {
    await clearData();
  });

  describe('GET /api/v1/outlets', () => {
    it('Harusnya Admin bisa mengambil daftar outlet (200)', async () => {
      const res = await request(app)
        .get('/api/v1/outlets')
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Harusnya Staff (tanpa izin MENU_CABANG) TIDAK bisa mengambil daftar outlet (403)', async () => {
      const res = await request(app)
        .get('/api/v1/outlets')
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/outlets', () => {
    it('Harusnya Admin bisa membuat outlet baru (201)', async () => {
      const res = await request(app)
        .post('/api/v1/outlets')
        .set('Cookie', adminToken)
        .send({
          name: 'Cabang Baru Test',
          address: 'Jl. Cabang Baru',
          phone: '081111111',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Cabang Baru Test');
    });
  });

  describe('PUT /api/v1/outlets/:id', () => {
    it('Harusnya Admin bisa mengupdate data outletnya sendiri (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/outlets/${initialOutletId}`)
        .set('Cookie', adminToken)
        .send({
          name: 'Pusat Test Updated',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Pusat Test Updated');
    });
  });

  describe('DELETE /api/v1/outlets/:id', () => {
    it('Harusnya Admin bisa menghapus outlet (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/outlets/${initialOutletId}`)
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verifikasi soft delete
      const deletedOutlet = await prisma.outlet.findUnique({ where: { id: initialOutletId }});
      expect(deletedOutlet?.deletedAt).not.toBeNull();
      expect(deletedOutlet?.status).toBe('INACTIVE');
    });
  });
});

