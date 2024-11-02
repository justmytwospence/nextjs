import { auth } from "@/auth";
import { queryUserRoutes } from "@/lib/db";
import RoutesClient from "./client";

export default async function RoutesPage() {
  const session = await auth();
  const initialRoutes = await queryUserRoutes(session);

  return <RoutesClient initialRoutes={initialRoutes} />;
}