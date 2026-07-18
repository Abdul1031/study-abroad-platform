import { useCallback, useRef, type RefObject } from 'react';
import {
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-driven motion primitives for the dashboard & landing storytelling
// sections. All hooks respect prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sticky section pinning with scroll progress.
 *
 * Wrap a tall section (e.g. `h-[300vh]`) and pin an inner `sticky top-0 h-screen`
 * child; `progress` runs 0→1 across the whole section so you can drive any
 * animation from it via `useTransform`.
 *
 * ```tsx
 * const { sectionRef, progress } = useStickyPinProgress();
 * const x = useTransform(progress, [0, 1], ['0%', '-66%']);
 * return (
 *   <section ref={sectionRef} className="relative h-[300vh]">
 *     <div className="sticky top-0 flex h-screen items-center overflow-hidden">
 *       <motion.div style={{ x }} className="flex gap-6">{cards}</motion.div>
 *     </div>
 *   </section>
 * );
 * ```
 */
export function useStickyPinProgress(): {
  sectionRef: RefObject<HTMLElement>;
  progress: MotionValue<number>;
} {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  // Spring-smooth the raw progress so pinned animations feel fluid, not tied
  // 1:1 to scroll-wheel steps.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  return { sectionRef, progress };
}

/**
 * Scroll-linked parallax for a single element: returns a `y` MotionValue that
 * drifts by ±`distance` px as the element crosses the viewport.
 */
export function useParallax(distance = 48): {
  ref: RefObject<HTMLDivElement>;
  y: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [distance, -distance]
  );
  return { ref, y };
}

/**
 * Magnetic hover physics — the element leans toward the pointer with a
 * critically-damped spring and snaps back on leave.
 *
 * ```tsx
 * const magnetic = useMagneticHover(12);
 * <motion.button
 *   style={{ x: magnetic.x, y: magnetic.y }}
 *   onPointerMove={magnetic.onPointerMove}
 *   onPointerLeave={magnetic.onPointerLeave}
 * />
 * ```
 */
export function useMagneticHover(strength = 12): {
  x: MotionValue<number>;
  y: MotionValue<number>;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
} {
  const prefersReducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 300, damping: 20, mass: 0.5 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (prefersReducedMotion) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      rawX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * strength * 2);
      rawY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * strength * 2);
    },
    [prefersReducedMotion, rawX, rawY, strength]
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, onPointerMove, onPointerLeave };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stagger-reveal variants — apply to a list container + items with
// `whileInView` so grids cascade in as they scroll into the viewport.
//
// ```tsx
// <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible"
//            viewport={{ once: true, margin: '-60px' }}>
//   {items.map((item) => <motion.li key={item.id} variants={staggerItem} />)}
// </motion.ul>
// ```
// ─────────────────────────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 130, damping: 19 },
  },
};
