"use client";

import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

export default function PricingPlans() {
  const ballRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 10, stiffness: 80, restDelta: 0.0001 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    const handlePointerMove = ({ clientX, clientY }) => {
      if (!ballRef.current) return;
      const el = ballRef.current;
      const rect = el.getBoundingClientRect();
      x.set(clientX - rect.width / 2);
      y.set(clientY - rect.height / 2);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [x, y]);

  return (
    <section>
      {/* Floating Ball Animation (hidden on small screens) */}
      <motion.div
        ref={ballRef}
        style={{
          width: 80,
          height: 80,
          backgroundColor: "#ff0088",
          borderRadius: "50%",
          x: springX,
          y: springY,
        }}
        className="hidden md:block fixed top-0 left-0 z-50 opacity-10 pointer-events-none blur-3xl mix-blend-multiply"
      />
    </section>
  );
}
