import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';

async function clearData() {
  await prisma.stockAdjustment.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.businessSubscription.deleteMany();
  await prisma.business.deleteMany();
}

describe('Product Module', () => {
  let adminToken: string;
  let kasirToken: string;
  let outletId: string;
  let businessId: string;
  let categoryId: string;
  let productId: string;
  let staffRoleId: string;

  beforeAll(async () => {
    await clearData();

    // 1. Setup Business & Outlet
    const business = await prisma.business.create({
      data: {
        businessCode: 'TEST-BIZ-PROD',
        name: 'Test Business Product',
        slug: 'test-business-prod',
        status: 'ACTIVE',
      },
    });
    businessId = business.id;

    const outlet = await prisma.outlet.create({
      data: {
        businessId: business.id,
        name: 'Cabang Produk',
        address: 'Jl. Produk',
        status: 'ACTIVE',
      },
    });
    outletId = outlet.id;

    // 2. Setup Category (business-level)
    const category = await prisma.category.create({
      data: {
        businessId: business.id,
        name: 'Makanan Test',
      },
    });
    categoryId = category.id;

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
    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        name: 'Admin Produk',
        email: 'admin@prod.com',
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
        name: 'Kasir Produk',
        email: 'kasir@prod.com',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 5. Get Tokens
    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@prod.com', password: 'Password123' });
    adminToken = loginAdmin.headers['set-cookie'];

    const loginKasir = await request(app).post('/api/v1/auth/login').send({ email: 'kasir@prod.com', password: 'Password123' });
    kasirToken = loginKasir.headers['set-cookie'];
  });

  afterAll(async () => {
    await clearData();
  });

  describe('POST /api/v1/products', () => {
    it('Harusnya Admin bisa membuat produk baru (201)', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', adminToken)
        // Multer uploadSingle requires multipart/form-data to parse body!
        // So we use .field() for form-data instead of .send()
        .field('name', 'Mie Ayam Test')
        .field('sku', 'MIE-001')
        .field('price', '15000')
        .field('categoryId', categoryId);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mie Ayam Test');
      expect(res.body.data.sku).toBe('MIE-001');
      expect(res.body.data.price).toBe(15000);

      productId = res.body.data.id;

      // Verifikasi stock terbuat otomatis untuk setiap cabang
      const stocks = await prisma.stock.findMany({ where: { productId } });
      expect(stocks.length).toBeGreaterThanOrEqual(1);
      expect(stocks[0].quantity).toBe(0);
      expect(stocks[0].outletId).toBe(outletId);
    });

    it('Harusnya Admin TIDAK BISA membuat produk dengan SKU yang sama (400)', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', adminToken)
        .field('name', 'Mie Ayam Lain')
        .field('sku', 'MIE-001') // Sama dengan di atas
        .field('price', '12000')
        .field('categoryId', categoryId);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/SKU sudah digunakan/i);
    });

    it('Harusnya Staff (tanpa izin MENU_PRODUCT) TIDAK BISA membuat produk baru (403)', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', kasirToken)
        .field('name', 'Es Teh')
        .field('sku', 'ES-001')
        .field('price', '5000');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/products', () => {
    it('Harusnya Staff (dengan izin MENU_POS/PRODUCT) bisa melihat daftar produk (200)', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set('Cookie', kasirToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Harusnya Admin bisa melihat detail produk (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(productId);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('Harusnya Admin bisa mengubah harga produk (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Cookie', adminToken)
        .field('price', '17000');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(17000);
    });

    it('Harusnya Staff TIDAK BISA mengubah produk (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Cookie', kasirToken)
        .field('name', 'Diubah Kasir');

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('Harusnya Staff TIDAK BISA menghapus produk (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Cookie', kasirToken);

      expect(res.status).toBe(403);
    });

    it('Harusnya Admin bisa menghapus (soft delete) produk (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verifikasi di database
      const deletedProd = await prisma.product.findUnique({ where: { id: productId }});
      expect(deletedProd?.deletedAt).not.toBeNull();
    });
  });
});

