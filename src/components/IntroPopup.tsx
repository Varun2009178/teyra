"use client";

import Modal from "./Modal";

interface IntroPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntroPopup({ isOpen, onClose }: IntroPopupProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome to your Dashboard! 🌵</h2>
        <p className="mt-4 text-gray-700">
          This is Mike, your motivation cactus! To make him happy, you need to
          complete your daily tasks.
          <br />
          <br />
          Click the button below to reveal your first set of challenges!
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