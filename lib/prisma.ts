import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Client for long-running transactions
export const longPrisma = new PrismaClient({
  transactionOptions: {
    timeout: 300000, // 5 minutes
  },
});