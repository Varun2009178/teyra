"use client";

import Modal from "@/components/Modal";
import { FaArrowUp } from "react-icons/fa";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newState: 'MEDIUM' | 'HAPPY';
}

export function LevelUpModal({ isOpen, onClose, newState }: LevelUpModalProps) {
  const messages = {
    MEDIUM: {
      title: "Mike is feeling better!",
      body: "Thanks to you, Mike is no longer sad. Keep completing tasks to make him truly happy!",
      button: "Let's keep going!"
    },
    HAPPY: {
      title: "You did it! Mike is HAPPY!",
      body: "This is the highest level of happiness! You're a sustainability superstar. Keep up the great work to maintain this mood.",
      button: "Awesome!"
    }
  }

  const content = messages[newState];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <FaArrowUp className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">{content.title}</h2>
        <p className="mt-2 text-gray-600">{content.body}</p>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-green-500 px-6 py-2 font-semibold text-white transition hover:bg-green-600"
          >
            {content.button}
          </button>
        </div>
      </div>
    </Modal>
  );
} 