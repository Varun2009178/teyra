import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })

  // Add middleware for better error handling
  client.$use(async (params, next) => {
    try {
      const result = await next(params)
      return result
    } catch (error: any) {
      console.error(`Prisma Error: ${error.message}`)
      // Attempt reconnection if it's a connection error
      if (error.code === 'P1001' || error.code === 'P1002') {
        await client.$disconnect()
        await client.$connect()
      }
      throw error
    }
  })

  return client
}

const prisma = globalForPrisma.prisma ?? getPrismaClient()

// Ensure the client is properly initialized in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma 