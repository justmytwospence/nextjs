import { auth } from "@/auth";
import { queryUserRoutes } from "@/lib/db";
import RoutesClient from "./client";
import { createSessionLogger } from "@/lib/logger";

export default async function RoutesPage() {
  const session = await auth();
  const sessionLogger = createSessionLogger(session);
  const initialRoutes = await queryUserRoutes(session);
  sessionLogger.info('Found routes', initialRoutes);

  return <RoutesClient initialRoutes={initialRoutes} />;
}