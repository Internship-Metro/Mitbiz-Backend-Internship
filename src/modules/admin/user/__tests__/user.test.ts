/**
 * src/modules/user/__tests__/user.test.ts
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

describe('User Module', () => {
  let adminToken: string;
  let kasirToken: string;
  let outletId: string;
  let adminId: string;
  let staffRoleId: string;
  let businessId: string;

  beforeAll(async () => {
    await clearData();

    // 1. Setup Business & Outlet
    const business = await prisma.business.create({
      data: {
        businessCode: 'TEST-BIZ-USER',
        name: 'Test Business User',
        slug: 'test-business-user',
        status: 'ACTIVE',
      },
    });
    businessId = business.id;

    const outlet = await prisma.outlet.create({
      data: {
        businessId: business.id,
        name: 'Cabang User',
        address: 'Jl. User',
        status: 'ACTIVE',
      },
    });
    outletId = outlet.id;

    // 2. Setup Role
    const staffRole = await prisma.role.create({
      data: {
        businessId: business.id,
        name: 'Kasir',
        permissions: ['MENU_POS']
      }
    });
    staffRoleId = staffRole.id;

    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Admin
    const admin = await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        name: 'Admin User',
        email: 'admin@user.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminId = admin.id;

    // Staff
    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        roleId: staffRoleId,
        name: 'Kasir User',
        email: 'kasir@user.com',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 3. Get Tokens

    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@user.com', password: 'Password123' });
    adminToken = loginAdmin.headers['set-cookie'];

    const loginKasir = await request(app).post('/api/v1/auth/login').send({ email: 'kasir@user.com', password: 'Password123' });
    kasirToken = loginKasir.headers['set-cookie'];
  });

  afterAll(async () => {
    await clearData();
  });

  describe('GET /api/v1/users', () => {
    it('Harusnya Admin bisa mengambil daftar user (200)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2); // Ada admin, kasir
    });

    it('Harusnya Staff (tanpa izin karyawan) TIDAK bisa mengambil daftar user (403)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/users', () => {




    it('Harusnya Admin bisa membuat STAFF baru (201)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminToken)
        .send({
          name: 'Kasir Baru',
          email: 'kasir2@user.com',
          phone: '08111222555',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'STAFF',
          roleId: staffRoleId,
          outletId: outletId,
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('STAFF');
    });

    it('Harusnya Admin TIDAK bisa membuat ADMIN baru (403)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminToken)
        .send({
          name: 'Admin Ilegal',
          email: 'admin3@user.com',
          phone: '08111222666',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'ADMIN',
          outletId: outletId,
        });
      
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('Harusnya Admin bisa update data dirinya sendiri/user di cabangnya (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${adminId}`)
        .set('Cookie', adminToken)
        .send({
          name: 'Admin Updated',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('Harusnya Admin bisa menghapus user di cabangnya (200)', async () => {
      // Kita hapus adminId saja untuk mengetes soft delete (walaupun harusnya hapus user lain)
      const res = await request(app)
        .delete(`/api/v1/users/${adminId}`)
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      
      const deletedUser = await prisma.user.findUnique({ where: { id: adminId } });
      expect(deletedUser?.deletedAt).not.toBeNull();
      expect(deletedUser?.status).toBe('INACTIVE');
    });
  });
});
