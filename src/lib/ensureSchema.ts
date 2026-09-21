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
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyName" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "StreamerProfile" ADD COLUMN IF NOT EXISTS "kycDetails" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "StreamerProfile" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_resetPasswordToken_key" ON "User"("resetPasswordToken");`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "description" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'IMAGE';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "ctaText" TEXT DEFAULT 'Learn More';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "badge" TEXT DEFAULT 'SPONSORED';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER DEFAULT 15;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "skipOffsetSeconds" INTEGER DEFAULT 5;`);
      console.log('[ensureSchema] PostgreSQL User & Advertisement schema successfully verified & updated.');
    } else {
      // SQLite fallback: columns will already exist or silently ignore if duplicate
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN googleId TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN resetPasswordToken TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN resetPasswordExpires DATETIME;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN agencyName TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE StreamerProfile ADD COLUMN kycDetails TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE StreamerProfile ADD COLUMN agencyId TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN description TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN mediaType TEXT DEFAULT 'IMAGE';`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN videoUrl TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN ctaText TEXT DEFAULT 'Learn More';`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN badge TEXT DEFAULT 'SPONSORED';`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN durationSeconds INTEGER DEFAULT 15;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE Advertisement ADD COLUMN skipOffsetSeconds INTEGER DEFAULT 5;`);
      } catch {}
    }

    schemaEnsured = true;
  } catch (err: any) {
    console.warn('[ensureSchema] Notice during schema verification:', err.message);
  }
}
