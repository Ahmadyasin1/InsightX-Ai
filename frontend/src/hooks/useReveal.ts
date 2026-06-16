"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/** Reliable reveal — always shows above-fold content after mount; scroll-reveals the rest. */
export function useReveal(aboveFold = false) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return { ref, visible: aboveFold ? mounted || inView : inView || mounted };
}
