"use client";

import { Prisma } from "@prisma/client";
import { useState } from "react";
import { updateTaskStatus } from "@/app/actions/tasks";
import Modal from "./Modal";
import { FaInfoCircle } from "react-icons/fa";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { motion } from "framer-motion";

type Task = Prisma.TaskGetPayload<{}>;

interface TaskItemProps {
  task: Task;
  onUpdateTask: (taskId: string, completed: boolean) => void;
}

export default function TaskItem({ task, onUpdateTask }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUndo = () => {
    onUpdateTask(task.id, false);
    setIsModalOpen(false);
  };

  const handleClick = () => {
    if (task.completed) {
      setIsModalOpen(true);
    } else {
      onUpdateTask(task.id, true);
    }
  };

  return (
    <>
      <motion.li
        layoutId={`task-item-${task.id}`}
        onClick={handleClick}
        className="flex w-full max-w-md cursor-pointer items-center gap-4 rounded-xl border-4 border-brand-dark-purple p-3 text-lg font-bold sm:p-4 sm:text-xl"
        animate={{
          backgroundColor: task.completed ? "#D1FAE5" : "#FEF3C7",
          opacity: task.completed ? 0.7 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border-2 border-brand-dark-purple sm:h-8 sm:w-8"
          style={{
            backgroundColor: task.completed ? "#8B5CF6" : "#FFFFFF",
          }}
        >
          {task.completed && (
            <motion.span
              className="font-sans text-xl text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              ✓
            </motion.span>
          )}
        </div>
        <span
          className="transition-colors"
          style={{
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#4B5563" : "#1F2937",
          }}
        >
          {task.title}
        </span>
        {task.description && (
          <Tippy content={task.description}>
            <span className="ml-auto cursor-help text-gray-400 hover:text-gray-600">
              <FaInfoCircle />
            </span>
          </Tippy>
        )}
      </motion.li>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center">
          <h2 className="text-xl font-bold sm:text-2xl">Undo Task?</h2>
          <p className="mt-2 text-base text-gray-600">
            Are you sure you want to mark this task as incomplete? This may
            affect your streak.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 transition hover:bg-gray-100 sm:px-6"
            >
              Cancel
            </button>
            <button
              onClick={handleUndo}
              className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 sm:px-6"
            >
              Undo Task
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 