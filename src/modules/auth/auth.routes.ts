import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@common/pipes/zod-validation.pipe';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { registrationGuard } from '@common/guards/registration.guard';

import { RegisterStep1Dto } from './dto/register-step1.dto';
import { RegisterStep2Dto } from './dto/register-step2.dto';
import { RegisterStep3Dto } from './dto/register-step3.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const router = Router();

// ==========================================
// PUBLIC ROUTES (Tidak butuh token JWT)
// ==========================================

// Register Step 1: Buat akun (nama, email, password)
router.post('/register/step1', validate(RegisterStep1Dto), authController.registerStep1);

// Verifikasi email via link yang dikirim ke inbox user
router.get('/verify-email', authController.verifyEmail);

// Kirim ulang email verifikasi (jika token expired atau email tidak diterima)
router.post('/resend-verification', authController.resendVerification);

// Refresh access token menggunakan refresh token yang masih valid
router.post('/refresh-token', authController.refreshToken);

// Login
router.post('/login', validate(LoginDto), authController.login);


// ==========================================
// REGISTRATION ROUTES (Butuh token 'access' ATAU 'registration')
// Menerima token dari Step 1 biasa ATAU token resume login
// ==========================================

// Register Step 2: Daftarkan bisnis/tenant
router.post('/register/step2', registrationGuard, validate(RegisterStep2Dto), authController.registerStep2);

// Register Step 3: Daftarkan cabang pertama
router.post('/register/step3', registrationGuard, validate(RegisterStep3Dto), authController.registerStep3);

// Batalkan registrasi yang belum selesai (hapus semua data user INACTIVE)
// Dipanggil frontend saat user klik "Batalkan" di dialog konfirmasi registrasi
router.delete('/register/cancel', registrationGuard, authController.cancelRegistration);


// Logout (blacklist token)
router.post('/logout', jwtAuthGuard, authController.logout);

// Change Password
router.patch('/change-password', jwtAuthGuard, validate(ChangePasswordDto), authController.changePassword);

// Get current user profile (Me)
router.get('/me', jwtAuthGuard, authController.getMe);

export default router;
