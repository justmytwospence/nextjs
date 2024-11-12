
import { auth } from "@/auth";
import SettingsClient from "./settings.client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <SettingsClient session={session} />;
}