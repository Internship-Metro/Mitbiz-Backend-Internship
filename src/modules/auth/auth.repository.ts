import { prisma } from '@/prisma/client';

// Infer tipe model langsung dari Prisma Client — selalu sinkron dengan schema
type User           = Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;
type Business       = Awaited<ReturnType<typeof prisma.business.findUniqueOrThrow>>;
type Outlet         = Awaited<ReturnType<typeof prisma.outlet.findUniqueOrThrow>>;
type TokenBlacklist = Awaited<ReturnType<typeof prisma.tokenBlacklist.findUniqueOrThrow>>;

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
      include: { customRole: true },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username },
      include: { customRole: true },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { customRole: true },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createUser(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Hapus user beserta semua data relasinya (business, outlet)
   * Dipakai saat user restart registrasi dengan email yang sama
   */
  async deleteUserAndRelatedData(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Hapus bisnis (cascade ke outlet via schema)
    if (user.businessId) {
      await prisma.outlet.deleteMany({ where: { businessId: user.businessId } });
      await prisma.business.delete({ where: { id: user.businessId } });
    }

    await prisma.tokenBlacklist.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Hitung total bisnis yang ada (termasuk yang soft-deleted)
   * Dipakai untuk generate businessCode otomatis (BIZ-001, BIZ-002, dst)
   */
  async countBusinesses(): Promise<number> {
    return prisma.business.count();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createBusiness(data: any): Promise<Business> {
    return prisma.business.create({
      data,
    });
  }

  async updateUserBusinessId(userId: string, businessId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { businessId },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOutlet(data: any): Promise<Outlet> {
    return prisma.outlet.create({
      data,
    });
  }

  async updateUserOutletId(userId: string, outletId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { outletId },
    });
  }

  async blacklistToken(token: string, userId: string, expiresAt: Date): Promise<TokenBlacklist> {
    return prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const count = await prisma.tokenBlacklist.count({
      where: { token },
    });
    return count > 0;
  }

  async updateLastLogin(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Set token verifikasi email beserta waktu kadaluarsanya (15 menit dari sekarang)
   */
  async setEmailVerificationToken(userId: string, token: string): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 menit dari sekarang

    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });
  }

  async findUserByVerificationToken(token: string) {
    return prisma.user.findUnique({
      where: { emailVerificationToken: token },
      include: { customRole: true },
    });
  }

  async markEmailAsVerified(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,           // Hapus token setelah dipakai
        emailVerificationTokenExpiresAt: null,  // Hapus expiry juga
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Hapus semua akun INACTIVE yang sudah lebih dari X jam
   * Dipanggil oleh cleanup job setiap jam
   */
  async deleteExpiredInactiveUsers(hoursOld: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursOld);

    // Ambil semua user INACTIVE yang dibuat sebelum cutoff
    const expiredUsers = await prisma.user.findMany({
      where: {
        status: 'INACTIVE',
        emailVerifiedAt: null,
        createdAt: { lt: cutoff },
      },
      select: { id: true, businessId: true },
    });

    if (expiredUsers.length === 0) return 0;

    // Hapus satu per satu dengan urutan yang benar (menghormati relasi)
    for (const user of expiredUsers) {
      await this.deleteUserAndRelatedData(user.id);
    }

    return expiredUsers.length;
  }
}

export const authRepository = new AuthRepository();
