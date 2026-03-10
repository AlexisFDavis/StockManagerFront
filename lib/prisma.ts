// Nota: Este archivo requiere que ejecutes 'npx prisma generate' después de instalar las dependencias
// El error de TypeScript desaparecerá una vez que Prisma genere el cliente
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
