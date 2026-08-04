/**
 * prisma/seed.ts
 *
 * Script untuk mengisi data awal (initial data) ke database.
 * Dijalankan SEKALI saat pertama kali deploy, atau kapanpun perlu reset data awal.
 *
 * Cara jalankan:
 *   npx tsx prisma/seed.ts
 *
 * Aman dijalankan berkali-kali — pakai upsert, tidak akan error jika data sudah ada.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load .env sebelum apapun
dotenv.config();

const prisma = new PrismaClient();

// ─── Helper: hash password ─────────────────────────────────────────────────
async function hashPassword(plain: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10');
  return bcrypt.hash(plain, saltRounds);
}

// ─── Seed 1: SUPER ADMIN ──────────────────────────────────────────────────
async function seedSuperAdmin() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password || !name) {
    console.warn(
      '⚠️  SUPER_ADMIN_NAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD tidak ditemukan di .env\n' +
        '   Tambahkan ketiga variabel tersebut agar akun Super Admin terbuat.',
    );
    return;
  }

  const hashedPassword = await hashPassword(password);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      // Kalau sudah ada: update nama & password saja (jangan ganti role)
      name,
      password: hashedPassword,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(), // Super Admin tidak perlu verifikasi email
    },
  });

  console.log(`✅ Super Admin siap: ${superAdmin.email} (ID: ${superAdmin.id})`);
}

// ─── Seed 2: Paket Langganan Default ──────────────────────────────────────
async function seedDefaultPackages() {
  const packages = [
    {
      name: 'Paket Starter',
      description: 'Paket dasar untuk bisnis yang baru memulai digitalisasi.',
      price: 99000,
      billingCycle: 'MONTHLY' as const,
      maxBranches: 1,
      maxKasir: 3,
      features: ['Manajemen Produk', 'Transaksi POS', 'Laporan Harian', 'Manajemen Stok Dasar'],
    },
    {
      name: 'Paket Pro',
      description: 'Paket lengkap untuk bisnis yang sudah berkembang dengan multi-cabang.',
      price: 299000,
      billingCycle: 'MONTHLY' as const,
      maxBranches: 5,
      maxKasir: 15,
      features: [
        'Semua fitur Starter',
        'Multi Cabang (maks 5)',
        'Laporan Mingguan & Bulanan',
        'Manajemen Kasir Lengkap',
        'Metode Pembayaran Beragam',
        'Export Laporan',
      ],
    },
    {
      name: 'Paket Enterprise',
      description: 'Paket tak terbatas untuk bisnis skala besar dengan banyak cabang.',
      price: 799000,
      billingCycle: 'MONTHLY' as const,
      maxBranches: 999,
      maxKasir: 999,
      features: [
        'Semua fitur Pro',
        'Cabang Tidak Terbatas',
        'Kasir Tidak Terbatas',
        'Prioritas Support',
        'Custom Branding',
        'API Access',
      ],
    },
  ];

  for (const pkg of packages) {
    const { features, ...pkgData } = pkg;

    const existingPackage = await prisma.package.findUnique({
      where: { name: pkg.name },
    });

    if (existingPackage) {
      console.log(`⏭️  Paket "${pkg.name}" sudah ada, skip.`);
      continue;
    }

    await prisma.package.create({
      data: {
        ...pkgData,
        isActive: true,
        features: {
          create: features.map((f) => ({ name: f })),
        },
      },
    });

    console.log(`✅ Paket "${pkg.name}" berhasil dibuat.`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Menjalankan seed database...\n');

  await seedSuperAdmin();
  await seedDefaultPackages();

  console.log('\n✅ Seed selesai!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
