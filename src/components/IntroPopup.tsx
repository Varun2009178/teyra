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
        <h2 className="text-2xl font-black text-gray-800 sm:text-3xl">
          Welcome to Teyra!
        </h2>
        <p className="mt-4 text-base text-gray-600">
          This is Mike, your personal accountability cactus. Your goal is to
          keep him happy by completing daily sustainable tasks.
        </p>
        <p className="mt-4 text-base text-gray-600">
          If you miss a day, Mike gets sad. Don&apos;t make Mike sad.
        </p>
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