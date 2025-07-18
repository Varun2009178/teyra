"use client";

import { motion, MotionValue, useScroll, useTransform } from "motion/react";
import { ComponentPropsWithoutRef, FC, ReactNode, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: string;
  onScrollProgress?: (progress: number) => void;
}

export const TextReveal: FC<TextRevealProps> = ({
  children,
  className,
  onScrollProgress,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 50%", "end 50%"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      if (onScrollProgress) {
        onScrollProgress(latest);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, onScrollProgress]);

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string");
  }

  const words = children.split(" ");

  return (
    <div 
      ref={ref}
      className={cn("min-h-[150vh]", className)}
    >
      <div className="sticky top-1/2 -translate-y-1/2">
        <span className="flex flex-wrap justify-center p-5 text-2xl font-bold text-black/20 dark:text-white/20 md:p-8 md:text-3xl lg:p-10 lg:text-4xl xl:text-5xl">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
        </span>
      </div>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="xl:lg-3 relative mx-1 lg:mx-1.5">
      <span className="absolute opacity-30">{children}</span>
      <motion.span
        style={{ opacity }}
        className="text-black dark:text-white"
      >
        {children}
      </motion.span>
    </span>
  );
};
