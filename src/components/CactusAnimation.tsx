"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CactusState } from "@prisma/client";
import { motion } from "framer-motion";

interface CactusAnimationProps {
  state: CactusState;
  isCelebrating: boolean;
}

const cactusImages = {
  SAD: "/animations/cactus_sad.png",
  MEDIUM: "/animations/cactus_medium.png",
  HAPPY: "/animations/cactus_happy.png",
};

export default function CactusAnimation({ state, isCelebrating }: CactusAnimationProps) {
  // Fallback to MEDIUM if the state is somehow undefined
  const currentState = state || "MEDIUM";

  return (
    <motion.div
      className="relative h-full w-full flex items-center justify-center"
      animate={isCelebrating ? { scale: [1, 1.1, 1], y: [0, -15, 0] } : {}}
      transition={isCelebrating ? { duration: 0.5, ease: "easeInOut" } : {}}
    >
      <Image
        src={cactusImages[currentState]}
        alt={`${currentState} cactus`}
        width={300}
        height={300}
        priority
      />
    </motion.div>
  );
} 