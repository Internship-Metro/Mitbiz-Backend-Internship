import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/utils/app-error.util';
import { MenuPermission } from '@prisma/client';

// ─── Tipe baru untuk permission CRUD ──────────────────────────────────────────
export type CrudAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface PermissionRequirement {
  menu: MenuPermission;
  action: CrudAction;
}

// ─── Guard Utama ───────────────────────────────────────────────────────────────
/**
 * Guard yang memeriksa hak akses berbasis matriks CRUD.
 *
 * Cara pakai di routes:
 *   requirePermissions([{ menu: 'MENU_CABANG', action: 'READ' }])
 *
 * Aturan per role:
 *   - SUPER_ADMIN : selalu lolos tanpa cek apapun
 *   - ADMIN       : lolos untuk semua aksi, KECUALI jika semua requirement
 *                   hanya menyebut MENU_POS (fitur murni kasir)
 *   - STAFF       : dicek per baris di tabel RolePermission (matriks CRUD)
 */
export const requirePermissions = (requirements: PermissionRequirement[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Unauthorized', 401);
      }

      // ── SUPER_ADMIN: akses penuh tanpa syarat ────────────────────────────
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // ── ADMIN: lolos semua, kecuali fitur murni MENU_POS ────────────────
      if (user.role === 'ADMIN') {
        const allPOS = requirements.every(
          (r) => r.menu === MenuPermission.MENU_POS
        );
        if (allPOS) {
          throw new AppError(
            'Akses ditolak. Fitur ini hanya tersedia pada modul Point of Sale (POS).',
            403
          );
        }
        return next();
      }

      // ── STAFF: cek matriks CRUD dari RolePermission ──────────────────────
      if (user.role === 'STAFF') {
        // customPermissions dikirim saat login dalam format:
        // { "MENU_CABANG": { canCreate: true, canRead: true, ... }, ... }
        const userPermissions = (user.customPermissions as Record<
          string,
          Record<string, boolean>
        >) || {};

        // OR logic: Staff lolos jika memenuhi SALAH SATU dari requirements.
        // Contoh: GET produk → [MENU_PRODUCT READ, MENU_POS READ]
        //         Staff kasir (hanya punya MENU_POS READ) → lolos
        //         Staff supervisor (hanya punya MENU_PRODUCT READ) → lolos
        const hasAccess = requirements.some((req) => {
          const menuAccess = userPermissions[req.menu];
          if (!menuAccess) return false;

          const actionMap: Record<CrudAction, string> = {
            CREATE: 'canCreate',
            READ: 'canRead',
            UPDATE: 'canUpdate',
            DELETE: 'canDelete',
          };

          return menuAccess[actionMap[req.action]] === true;
        });

        if (!hasAccess) {
          throw new AppError(
            'Anda tidak memiliki akses (permission) ke fitur ini.',
            403
          );
        }

        return next();
      }

      throw new AppError('Akses ditolak.', 403);
    } catch (error) {
      next(error);
    }
  };
};
