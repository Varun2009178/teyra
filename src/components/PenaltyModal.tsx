"use client";

import Modal from "@/components/Modal";
import { FaExclamationTriangle } from "react-icons/fa";

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PenaltyModal({ isOpen, onClose }: PenaltyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <FaExclamationTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Oh no!</h2>
        <p className="mt-2 text-gray-600">
          Because you had incomplete tasks from yesterday, Mike the cactus is feeling a bit sad today.
        </p>
        <p className="mt-1 text-gray-600">
          Complete your new tasks to cheer him up!
        </p>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-yellow-500 px-6 py-2 font-semibold text-white transition hover:bg-yellow-600"
          >
            I'll do my best!
          </button>
        </div>
      </div>
    </Modal>
  );
} 