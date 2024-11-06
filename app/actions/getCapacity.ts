"use server";

import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type Capacity = {
  shortTerm: {
    remaining: number;
    total: number;
    windowSeconds: number;
  };
  daily: {
    remaining: number;
    total: number;
  };
};

export async function getStravaCapacity(): Promise<Capacity> {
  noStore();

  const windowSeconds = 15;
  const shortTermLimit = 100;
  const dailyLimit = 1000;

  const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0);

  const [recentQueries, dailyQueries] = await Promise.all([
    prisma.apiQuery.count({
      where: {
        provider: 'strava',
        createdAt: {
          gte: fifteenSecondsAgo
        }
      }
    }),
    prisma.apiQuery.count({
      where: {
        provider: 'strava',
        createdAt: {
          gte: startOfDay
        }
      }
    })
  ]);

  return {
    shortTerm: {
      remaining: Math.max(0, shortTermLimit - recentQueries),
      total: shortTermLimit,
      windowSeconds: windowSeconds,
    },
    daily: {
      remaining: Math.max(0, dailyLimit - dailyQueries),
      total: dailyLimit,
    }
  };
}
