import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Account } from "@prisma/client";

export async function queryUserAccount(
  userId: string,
  accountProvider: string
): Promise<Account | null> {
  baseLogger.debug(`Querying ${accountProvider} account for user ${userId}`);
  return await prisma.account
    .findUnique({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        },
      },
    })
}

export async function deleteUserAccount(
  userId: string,
  accountProvider: string
): Promise<Account> {
  baseLogger.debug(`Deleting ${accountProvider} account for user ${userId}`);
  return await prisma.account
    .delete({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        },
      },
    })
}
