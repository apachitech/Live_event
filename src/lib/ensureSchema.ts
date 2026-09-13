import { prisma } from './prisma';

let schemaEnsured = false;

/**
 * Ensures critical authentication columns exist in the database.
 * Executes non-destructive, idempotent DDL (PostgreSQL & SQLite) to prevent
 * "The column User.googleId does not exist" errors in production deployments.
 */
export async function ensureUserSchema(): Promise<void> {
  if (schemaEnsured) return;

  try {
    const rawDbUrl = (process.env.DATABASE_URL || '').trim();
    const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');

    if (isPostgres) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_resetPasswordToken_key" ON "User"("resetPasswordToken");`);
      console.log('[ensureSchema] PostgreSQL User schema successfully verified & updated.');
    } else {
      // SQLite fallback: columns will already exist or silently ignore if duplicate
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN googleId TEXT;`);
      } catch {
        // already exists
      }
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN resetPasswordToken TEXT;`);
      } catch {
        // already exists
      }
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN resetPasswordExpires DATETIME;`);
      } catch {
        // already exists
      }
    }

    schemaEnsured = true;
  } catch (err: any) {
    console.warn('[ensureSchema] Notice during schema verification:', err.message);
  }
}
