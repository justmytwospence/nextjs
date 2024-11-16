export const revalidate = 3600;

import { auth } from "@/auth";
import { queryUserRoutes } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { redirect } from "next/navigation";
import RoutesGrid from "./routes-grid";

export default async function RoutesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const routes = await queryUserRoutes(session.user.id);
  baseLogger.info(`Found ${routes.length} routes`);
  return <RoutesGrid routes={routes} />;
}
