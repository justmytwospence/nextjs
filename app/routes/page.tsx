import { auth } from "@/auth";
import { queryUserRoutes } from "@/lib/db";
import RoutesClient from "./client";
import { baseLogger } from "@/lib/logger";

export default async function RoutesPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const initialRoutes = await queryUserRoutes(session.user.id);
  baseLogger.info(`Found ${initialRoutes.length} routes`);

  return <RoutesClient initialRoutes={initialRoutes} />;
}