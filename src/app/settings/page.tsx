import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SettingsPageClient session={session} />;
} 