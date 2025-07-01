"use client";

import { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@prisma/client";

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, completed: boolean) => void;
}

export default function TaskList({ tasks, onUpdateTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg bg-gray-100 p-4">
        <p className="text-center text-gray-600">
          No tasks for this day. New tasks will be generated on your next daily
          refresh!
        </p>
      </div>
    );
  }

  return (
    <motion.ul
      className="flex w-full flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onUpdateTask={onUpdateTask} />
        ))}
      </AnimatePresence>
    </motion.ul>
  );
} 