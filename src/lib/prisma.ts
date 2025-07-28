// Instance Prisma Client pour l'application
import { PrismaClient } from '@prisma/client';

// Singleton pattern pour éviter de créer plusieurs instances en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;