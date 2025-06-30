import { PrismaClient } from "@prisma/client";

// This setup prevents Prisma from creating too many connections in a development environment.
// It creates a single, global instance of the PrismaClient and reuses it.

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma; 