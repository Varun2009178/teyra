"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { deleteAccount } from "@/app/actions/user";
import { signOut } from "next-auth/react";
import Modal from "@/components/Modal";
import type { Session } from "next-auth";

export default function SettingsPageClient({ session }: { session: Session }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const result = await deleteAccount();
    if (result.success) {
      // Sign out and redirect to home page
      await signOut({ callbackUrl: "/" });
    } else {
      setError(result.error || "Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 p-4 pt-24 sm:p-8 sm:pt-28">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
            <h1 className="text-4xl font-black text-gray-800 sm:text-5xl">
              Settings
            </h1>
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Profile Information</h2>
                <div className="mt-4 flex items-center gap-4">
                  <Image
                    src={session.user.image ?? "/default-avatar.png"}
                    alt="User avatar"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-bold text-lg">{session.user.name}</p>
                    <p className="text-gray-600">{session.user.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                <div className="mt-4 rounded-lg border-2 border-red-500 p-4">
                  <p className="font-semibold">Delete Your Account</p>
                  <p className="mt-1 text-sm text-gray-600">
                    This action is irreversible. All your data, including tasks, streaks, and progress, will be permanently deleted.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Are you absolutely sure?</h2>
          <p className="mt-2 text-gray-600">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </p>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2 font-semibold text-gray-800 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 