'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const TransitionProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

  // Skip transition animation for landing page and auth pages to prevent flickering
  const isLandingPage = pathname === '/' || pathname === '/landing'
  const isAuthPage = pathname.startsWith('/sign-')

  const variants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    enter: { 
      opacity: 1,
      y: 0,
      scale: 1
    },
    exit: { 
      opacity: 0,
      y: -20,
      scale: 0.98
    },
  }

  // For landing page and auth pages, render without animation to prevent conflicts and flickering
  if (isLandingPage || isAuthPage) {
    return <div className="h-full">{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default TransitionProvider 