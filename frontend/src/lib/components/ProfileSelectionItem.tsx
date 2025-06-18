"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileSelectionItemProps {
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  icon?: string; // Optional icon like the emojis used
}

export const ProfileSelectionItem: React.FC<ProfileSelectionItemProps> = ({
  value,
  label,
  isSelected,
  onSelect,
  icon,
}) => {
  return (
    <motion.div
      onClick={() => onSelect(value)}
      className={cn(
        "flex items-center w-full p-4 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 ease-in-out",
        "bg-[#1c1c1c] border-neutral-800 hover:border-neutral-700", // Default state
        isSelected && "bg-emerald-700/30 border-emerald-600 ring-2 ring-emerald-500/70" // Selected state
      )}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {icon && <span className="mr-3 text-lg">{icon}</span>}
      <span 
        className={cn(
            "flex-grow text-neutral-200",
            isSelected && "text-emerald-50"
        )}
      >
        {label}
      </span>
      {/* Optional: Add a visual indicator for selection, like a checkmark, if desired */}
      {/* {isSelected && <CheckIcon className="w-5 h-5 text-emerald-400 ml-auto" />} */}
    </motion.div>
  );
}; 