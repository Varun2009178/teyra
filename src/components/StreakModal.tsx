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
        <h2 className="text-3xl font-black text-orange-500">
          You&apos;re on a roll!
        </h2>
        <div className="my-4 text-6xl font-black">🔥 {streak} 🔥</div>
        <p className="mt-4 text-gray-600">
          That&apos;s {streak} days in a row of sustainable actions.
        </p>
        <p className="mt-2 text-gray-600">Keep up the great work!</p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white transition hover:bg-purple-600"
          >
            Let&apos;s Go!
          </button>
        </div>
      </div>
    </Modal>
  );
} 