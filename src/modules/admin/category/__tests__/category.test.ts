/**
 * src/modules/category/__tests__/category.test.ts
 */

import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';

async function clearData() {
  await prisma.category.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.businessSubscription.deleteMany();
  await prisma.business.deleteMany();
}

describe('Category Module', () => {
  let adminToken: string;
  let kasirToken: string;
  let outletId: string;
  let categoryId: string;
  let staffRoleId: string;

  beforeAll(async () => {
    await clearData();

    // 1. Setup Business & Outlet
    const business = await prisma.business.create({
      data: {
        businessCode: 'TEST-BIZ-CAT',
        name: 'Test Business Category',
        slug: 'test-business-cat',
        status: 'ACTIVE',
      },
    });

    const outlet = await prisma.outlet.create({
      data: {
        businessId: business.id,
        name: 'Cabang Kategori',
        address: 'Jl. Kategori',
        status: 'ACTIVE',
      },
    });
    outletId = outlet.id;

    // 2. Setup Role
    const staffRole = await prisma.role.create({
      data: {
        businessId: business.id,
        name: 'Kasir',
        permissions: { create: [{ menu: 'MENU_POS', canRead: true }] }
      }
    });
    staffRoleId = staffRole.id;

    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    // Admin
    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        name: 'Admin Kategori',
        email: 'admin@cat.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Staff
    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        roleId: staffRoleId,
        name: 'Kasir Kategori',
        email: 'kasir@cat.com',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 3. Get Tokens
    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@cat.com', password: 'Password123' });
    adminToken = loginAdmin.headers['set-cookie'];

    const loginKasir = await request(app).post('/api/v1/auth/login').send({ email: 'kasir@cat.com', password: 'Password123' });
    kasirToken = loginKasir.headers['set-cookie'];
  });

  afterAll(async () => {
    await clearData();
  });

  describe('POST /api/v1/categories', () => {
    it('Harusnya Admin bisa membuat kategori baru (201)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', adminToken)
        .send({
          name: 'Makanan Berat',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Makanan Berat');
      
      categoryId = res.body.data.id;
    });

    it('Harusnya Admin TIDAK BISA membuat kategori dengan nama yang sama (400)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', adminToken)
        .send({
          name: 'Makanan Berat', // Sama dengan di atas
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sudah digunakan/i);
    });

    it('Harusnya Kasir TIDAK BISA membuat kategori baru (403)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', kasirToken)
        .send({
          name: 'Makanan Ringan',
        });
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('Harusnya Kasir bisa melihat daftar kategori (200)', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('Harusnya Admin bisa mengubah nama kategori (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Cookie', adminToken)
        .send({
          name: 'Menu Andalan',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Menu Andalan');
    });

    it('Harusnya Kasir TIDAK BISA mengubah nama kategori (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Cookie', kasirToken)
        .send({
          name: 'Diubah Kasir',
        });
      
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('Harusnya Kasir TIDAK BISA menghapus kategori (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(403);
    });

    it('Harusnya Admin bisa menghapus (soft delete) kategori (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verifikasi di database
      const deletedCat = await prisma.category.findUnique({ where: { id: categoryId }});
      expect(deletedCat?.deletedAt).not.toBeNull();
    });
  });
});

