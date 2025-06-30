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
        <h2 className="text-2xl font-bold">
          You're on a {streak}-day streak! 🔥
        </h2>
        <p className="mt-2 text-gray-600">
          Complete at least one task every day to keep your streak going. See
          how many days you can keep it up!
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white transition hover:bg-purple-600"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </Modal>
  );
} 