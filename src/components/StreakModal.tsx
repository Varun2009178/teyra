"use client";

import Modal from "./Modal";

// hahahah

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

export function StreakModal({ isOpen, onClose, streak }: StreakModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center">
        <h2 className="text-3xl font-bold text-brand-dark-green">
          You are on a roll!
        </h2>
        <p className="mt-2 text-lg text-gray-700">
          That is {streak} days in a row of sustainable actions.
        </p>
        <div className="my-8 text-7xl">
          🔥
        </div>
          <button
            onClick={onClose}
          className="mt-6 rounded-lg border-2 border-black bg-brand-yellow px-6 py-2 font-bold text-black"
          >
          Let us Go!
          </button>
      </div>
    </Modal>
  );
} 