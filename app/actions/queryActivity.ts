"use server";

import { auth } from "@/auth";
import { queryActivity } from "@/lib/db";
import { Activity } from "@prisma/client";

export async function queryActivityAction(
  activityId: string
): Promise<Activity> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const activity = await queryActivity(session.user.id, activityId);
  if (!activity) {
    throw new Error("Activity not found");
  }

  return activity;
}
