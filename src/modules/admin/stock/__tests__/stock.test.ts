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

describe('Stock Module', () => {
  let adminToken: string;
  let kasirToken: string;
  let outletId: string;
  let categoryId: string;
  let productId1: string;
  let productId2: string;
  let staffRoleId: string;

  beforeAll(async () => {
    await clearData();

    // 1. Setup Business & Outlet
    const business = await prisma.business.create({
      data: {
        businessCode: 'TEST-BIZ-STOCK',
        name: 'Test Business Stock',
        slug: 'test-business-stock',
        status: 'ACTIVE',
      },
    });

    const outlet = await prisma.outlet.create({
      data: {
        businessId: business.id,
        name: 'Cabang Stok',
        address: 'Jl. Stok',
        status: 'ACTIVE',
      },
    });
    outletId = outlet.id;

    // 2. Setup Role
    const staffRole = await prisma.role.create({
      data: {
        businessId: business.id,
        name: 'Kasir',
        permissions: ['MENU_POS', 'MENU_STOCK']
      }
    });
    staffRoleId = staffRole.id;

    // 3. Setup Users
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        name: 'Admin Stok',
        email: 'admin@stok.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.create({
      data: {
        businessId: business.id,
        outletId: outlet.id,
        roleId: staffRoleId,
        name: 'Kasir Stok',
        email: 'kasir@stok.com',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    // 4. Get Tokens
    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@stok.com', password: 'Password123' });
    adminToken = loginAdmin.headers['set-cookie'];

    const loginKasir = await request(app).post('/api/v1/auth/login').send({ email: 'kasir@stok.com', password: 'Password123' });
    kasirToken = loginKasir.headers['set-cookie'];

    // 5. Create products (ini otomatis bikin stock qty = 0 lewat prisma middleware atau logic controller - oh tunggu, logic product yg bikin)
    // Supaya aman dan tidak ribet dengan router produk, kita insert langsung ke db untuk test stok ini
    
    const p1 = await prisma.product.create({
      data: {
        outletId: outletId,
        name: 'Nasi Goreng Test',
        sku: 'NS-001',
        price: 20000,
        stock: {
          create: {
            outletId: outletId,
            quantity: 0,
            minQuantity: 5,
          }
        }
      }
    });
    productId1 = p1.id;

    const p2 = await prisma.product.create({
      data: {
        outletId: outletId,
        name: 'Es Teh Test',
        sku: 'ES-001',
        price: 5000,
        stock: {
          create: {
            outletId: outletId,
            quantity: 10,
            minQuantity: 2,
          }
        }
      }
    });
    productId2 = p2.id;
  });

  afterAll(async () => {
    await clearData();
  });

  describe('GET /api/v1/stocks', () => {
    it('Harusnya Staff (dengan izin MENU_POS/MENU_STOCK) bisa melihat daftar stok (200)', async () => {
      const res = await request(app)
        .get('/api/v1/stocks')
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('Harusnya parameter lowStockOnly jalan (200)', async () => {
      // productId1 quantity = 0, min = 5 -> low stock
      // productId2 quantity = 10, min = 2 -> OK
      const res = await request(app)
        .get('/api/v1/stocks?lowStockOnly=true')
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].productId).toBe(productId1);
    });
  });

  describe('POST /api/v1/stocks/adjust', () => {
    it('Harusnya Staff TIDAK BISA menyesuaikan stok (403)', async () => {
      const res = await request(app)
        .post('/api/v1/stocks/adjust')
        .set('Cookie', kasirToken)
        .send({
          productId: productId1,
          type: 'IN',
          quantity: 10,
          notes: 'Test kasir'
        });
      
      expect(res.status).toBe(403);
    });

    it('Harusnya Admin BISA menambah stok (IN) (201)', async () => {
      const res = await request(app)
        .post('/api/v1/stocks/adjust')
        .set('Cookie', adminToken)
        .send({
          productId: productId1, // awal: 0
          type: 'IN',
          quantity: 20,
          notes: 'Restok'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.quantity).toBe(20);
    });

    it('Harusnya Admin BISA mengurangi stok (OUT) (201)', async () => {
      const res = await request(app)
        .post('/api/v1/stocks/adjust')
        .set('Cookie', adminToken)
        .send({
          productId: productId1, // sekarang: 20
          type: 'OUT',
          quantity: 5,
          notes: 'Rusak'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.quantity).toBe(15);
    });

    it('Harusnya GAGAL jika mengurangi stok melebihi sisa stok (400)', async () => {
      const res = await request(app)
        .post('/api/v1/stocks/adjust')
        .set('Cookie', adminToken)
        .send({
          productId: productId1, // sekarang: 15
          type: 'OUT',
          quantity: 20,
          notes: 'Coba kurangi berlebih'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Stok tidak mencukupi/i);
    });

    it('Harusnya Admin BISA mengoreksi stok (CORRECTION) (201)', async () => {
      const res = await request(app)
        .post('/api/v1/stocks/adjust')
        .set('Cookie', adminToken)
        .send({
          productId: productId1, // sekarang: 15
          type: 'CORRECTION',
          quantity: 12,
          notes: 'Opname'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.quantity).toBe(12);
    });
  });

  describe('GET /api/v1/stocks/adjustments', () => {
    it('Harusnya Staff TIDAK BISA melihat riwayat penyesuaian (403)', async () => {
      const res = await request(app)
        .get('/api/v1/stocks/adjustments')
        .set('Cookie', kasirToken);
      
      expect(res.status).toBe(403);
    });

    it('Harusnya Admin bisa melihat riwayat penyesuaian (200)', async () => {
      const res = await request(app)
        .get('/api/v1/stocks/adjustments')
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Kita melakukan 3 penyesuaian di atas (IN, OUT, CORRECTION)
      expect(res.body.data.data.length).toBe(3);
      expect(res.body.data.meta.total).toBe(3);
    });
  });

  describe('GET /api/v1/stocks/:productId', () => {
    it('Harusnya Admin bisa melihat detail stok 1 produk (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/stocks/${productId1}`)
        .set('Cookie', adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productId).toBe(productId1);
      expect(res.body.data.recentAdjustments.length).toBe(3);
    });
  });
});
