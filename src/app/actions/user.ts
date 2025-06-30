"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function markPopupAsSeen(popupType: "intro" | "streak" | "completion") {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }
    const userId = session.user.id;

    const data: { [key: string]: boolean } = {};
    if (popupType === "intro") data.hasSeenIntroPopup = true;
    if (popupType === "streak") data.hasSeenStreakPopup = true;
    if (popupType === "completion") data.hasSeenCompletionPopup = true;

    await prisma.user.update({
        where: { id: userId },
        data,
    });

    revalidatePath("/dashboard");
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/"); // Revalidate the homepage after deletion
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Failed to delete account." };
  }
} 