import { baseLogger } from "@/lib/logger";
import type { Account } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function queryUserAccount(
  userId: string,
  accountProvider: string
): Promise<Account> {
  try {
    baseLogger.info(`Querying ${accountProvider} account for user ${userId}`);
    const account = await prisma.account.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        }
      },
    })
    if (!account) {
      baseLogger.warn("No account found", { provider: accountProvider });
      throw new Error(`No ${accountProvider} account found for this user`);
    }
    baseLogger.info(`Found ${accountProvider} account for user ${userId} with access token ${account.access_token}`);
    return account;
  } catch {
    throw new Error(`No ${accountProvider} account found for this user`);
  };
}

export async function deleteUserAccount(
  userId: string,
  accountProvider: string
): Promise<void> {
  try {
    baseLogger.info(`Deleting ${accountProvider} account for user ${userId}`);
    await prisma.account.delete({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        }
      }
    });
    baseLogger.info(`Deleted ${accountProvider} account for user ${userId}`);
  } catch (error) {
    throw error;
  }
}