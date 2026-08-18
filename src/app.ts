/**
 * src/app.ts
 *
 * TUJUAN: Setup Express application — daftarkan semua middleware global dan router.
 * File ini TIDAK menjalankan server (tidak panggil .listen()).
 * Yang menjalankan server adalah src/server.ts.
 *
 * Urutan middleware PENTING — jangan diubah:
 * 1. Security headers (helmet) — harus paling awal
 * 2. CORS — sebelum route handler
 * 3. Body parser — sebelum route handler
 * 4. Logger — sebelum route handler
 * 5. Routes — handler utama
 * 6. 404 handler — setelah semua route
 * 7. Error handler — harus PALING AKHIR
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@config/env';
import { morganLogger } from '@common/middlewares/logger.middleware';
import { httpExceptionFilter } from '@common/filters/http-exception.filter';
import { sendError } from '@common/utils/response.util';


// ─── Import Routes ─────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import outletRoutes from './modules/admin/outlet/outlet.routes';
import staffRoutes from './modules/admin/staff/staff.routes';
import superAdminUserRoutes from './modules/super-admin/user/user.routes';
import superAdminOutletRoutes from './modules/super-admin/outlet/outlet.routes';
import categoryRoutes from './modules/admin/category/category.routes';
import productRoutes from './modules/admin/product/product.routes';
import stockRoutes from './modules/admin/stock/stock.routes';
import roleRoutes from './modules/admin/role/role.routes';
import shiftRoutes from './modules/pos/shift/shift.routes';
import paymentMethodRoutes from './modules/admin/payment-method/payment-method.routes';
import { transactionRoutes } from './modules/pos/transaction/transaction.routes';
import dashboardRoutes from './modules/admin/dashboard/dashboard.routes';
import reportRoutes from './modules/admin/report/report.routes';
import settingRoutes from './modules/super-admin/setting/setting.routes';
import { adminSettingRouter } from './modules/admin/setting/setting.routes';
import packageRoutes from './modules/super-admin/package/package.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';
// TODO: Import route modules di sini saat setiap modul selesai dibuat

const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────
// Helmet: pasang berbagai HTTP security header otomatis
app.use(helmet());

// CORS: izinkan request dari domain frontend yang sudah terdaftar
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
      // Izinkan request tanpa origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
      }
    },
    credentials: true,            // Izinkan cookie & Authorization header
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Request Parsing ──────────────────────────────────────────────────────
// Parse JSON request body
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Parse cookies
app.use(cookieParser());

// ─── Logger ───────────────────────────────────────────────────────────────
app.use(morganLogger);

// ─── Health Check ─────────────────────────────────────────────────────────
// Endpoint untuk cek apakah server berjalan (berguna untuk deployment)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server berjalan normal',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Documentation ────────────────────────────────────────────────────
// Dokumentasi API tersedia di Scalar cloud registry (tidak di-host di server ini)
// Link: akan ditambahkan setelah publish ke registry.scalar.com

// ─── API Routes ───────────────────────────────────────────────────────────
// Mount semua router di sini dengan prefix /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/outlets', outletRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/superadmin/users', superAdminUserRoutes);
app.use('/api/v1/superadmin/outlets', superAdminOutletRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stocks', stockRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1', paymentMethodRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/admin/settings', adminSettingRouter);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────
// Tangkap semua request ke endpoint yang tidak ada
app.use((req: Request, res: Response) => {
  sendError(res, `Endpoint ${req.method} ${req.path} tidak ditemukan`, 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────
// HARUS di paling akhir — tangkap semua error dari route/middleware di atas
app.use(httpExceptionFilter);

export { app };
