import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// تحميل متغيرات البيئة من ملف .env مع تجاوز المتغيرات الموجودة
config({ override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db