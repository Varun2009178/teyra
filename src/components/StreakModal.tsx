"use client";

import Modal from "./Modal";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

export function StreakModal({ isOpen, onClose, streak }: StreakModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-2xl font-black text-orange-500 sm:text-3xl">
          You&apos;re on a roll!
        </h2>
        <div className="my-4 text-5xl font-black sm:text-6xl">🔥 {streak} 🔥</div>
        <p className="mt-4 text-base text-gray-600">
          That&apos;s {streak} days in a row of sustainable actions.
        </p>
        <p className="mt-2 text-base text-gray-600">Keep up the great work!</p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-purple-500 px-5 py-2 font-semibold text-white transition hover:bg-purple-600 sm:px-6"
          >
            Let&apos;s Go!
          </button>
        </div>
      </div>
    </Modal>
  );
} 