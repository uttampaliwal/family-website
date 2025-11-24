/**
 * 🎬 Animation Variants & Transitions
 *
 * Standardized Framer Motion animation variants for consistent
 * animations across the application.
 *
 * Usage:
 * ```tsx
 * import { fadeInUp, transitions } from '../utils/animations';
 *
 * <motion.div
 *   variants={fadeInUp}
 *   initial="initial"
 *   animate="animate"
 *   transition={transitions.base}
 * >
 *   Content
 * </motion.div>
 * ```
 */

import type { Variants, Transition } from "framer-motion";

// ===============================================
// 🌊 Fade Animations
// ===============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ===============================================
// 📐 Scale Animations
// ===============================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleInLarge: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ===============================================
// 📍 Slide Animations
// ===============================================

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ===============================================
// 🌀 Stagger Animations
// ===============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {},
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {},
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
  exit: {},
};

// Item to use with stagger containers
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const staggerItemSlide: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ===============================================
// ⏱️ Transition Presets
// ===============================================

export const transitions = {
  /** Fast transition - 150ms - For hover states */
  fast: {
    duration: 0.15,
    ease: "easeInOut",
  } as Transition,

  /** Base transition - 200ms - Most interactions */
  base: {
    duration: 0.2,
    ease: "easeInOut",
  } as Transition,

  /** Medium transition - 300ms - Modals, drawers */
  medium: {
    duration: 0.3,
    ease: "easeInOut",
  } as Transition,

  /** Slow transition - 500ms - Page transitions */
  slow: {
    duration: 0.5,
    ease: "easeInOut",
  } as Transition,

  /** Spring transition - Bouncy feel */
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  } as Transition,

  /** Gentle spring - Smooth bouncy feel */
  springGentle: {
    type: "spring",
    stiffness: 200,
    damping: 20,
  } as Transition,

  /** Button press */
  tap: {
    duration: 0.1,
    ease: "easeOut",
  } as Transition,
};

// ===============================================
// 🎯 Common Animation Configurations
// ===============================================

/**
 * Standard page transition configuration
 * Use for page-level animations
 */
export const pageTransition = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  variants: fadeInUp,
  transition: transitions.medium,
};

/**
 * Modal/Dialog transition configuration
 */
export const modalTransition = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  variants: scaleInCenter,
  transition: transitions.medium,
};

/**
 * Card hover animation
 */
export const cardHover = {
  whileHover: {
    y: -4,
    transition: transitions.fast,
  },
  whileTap: {
    scale: 0.98,
    transition: transitions.tap,
  },
};

/**
 * Button press animation
 */
export const buttonPress = {
  whileTap: {
    scale: 0.95,
    transition: transitions.tap,
  },
};

/**
 * Icon bounce animation
 */
export const iconBounce = {
  whileHover: {
    scale: 1.1,
    rotate: [0, -10, 10, -10, 0],
    transition: { duration: 0.5 },
  },
};

// ===============================================
// 🎨 Utility Functions
// ===============================================

/**
 * Create a custom stagger container with specific delay
 */
export const createStaggerContainer = (staggerDelay: number): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
  exit: {},
});

/**
 * Create a custom slide animation
 */
export const createSlide = (
  direction: "left" | "right" | "up" | "down",
  distance: number = 20,
): Variants => {
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const sign = direction === "left" || direction === "up" ? -1 : 1;

  return {
    initial: { opacity: 0, [axis]: sign * distance },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: -sign * distance },
  };
};

/**
 * Create a custom scale animation
 */
export const createScale = (initialScale: number = 0.9): Variants => ({
  initial: { opacity: 0, scale: initialScale },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: initialScale },
});
