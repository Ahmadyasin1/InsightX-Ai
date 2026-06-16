"use client";

import { useEffect } from "react";

/** Subtle cursor glow trail for premium feel */
export function CursorGlow() {
  useEffect(() => {
    const dot = document.createElement("div");
    dot.style.cssText = `
      position: fixed; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      pointer-events: none; z-index: 9999; transform: translate(-50%, -50%);
      transition: opacity 0.3s; opacity: 0; mix-blend-mode: normal;
    `;
    document.body.appendChild(dot);

    const move = (e: MouseEvent) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.opacity = "1";
    };
    const leave = () => { dot.style.opacity = "0"; };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      dot.remove();
    };
  }, []);

  return null;
}

/** Magnetic hover effect for buttons with .btn-magnetic class */
export function MagneticButtons() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".btn-magnetic, .btn-primary, .btn-secondary") as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".btn-magnetic, .btn-primary, .btn-secondary").forEach(el => {
        if (el !== target) { el.style.transform = ""; }
      });
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      target.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return null;
}
