"use client";

import { signOut } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";

export default function SignOutButton() {
  const handleSignOut = () => {
    // Clear local storage flags before signing out
    localStorage.removeItem("hasSeenIntroPopup");
    localStorage.removeItem("tasksRevealedOnce");
    localStorage.removeItem("streakModalSeen");
    localStorage.removeItem("cactusIntroSeen"); // Just in case
    signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-lg bg-pink-400 px-4 py-2 font-semibold text-white transition hover:bg-pink-500"
    >
      <FaSignOutAlt />
      <span>Sign Out</span>
    </button>
  );
} 