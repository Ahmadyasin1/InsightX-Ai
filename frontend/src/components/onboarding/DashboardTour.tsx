"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "insightx-dashboard-tour-v1";

const TOUR_STEPS = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Navigation Hub",
      description: "Access all platform features from this sidebar — investigations, evidence, timeline, AI chat, and reports.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='stats']",
    popover: {
      title: "Mission Control Stats",
      description: "Real-time metrics for your investigations, evidence files, active alerts, and AI-generated reports.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='ai-engine']",
    popover: {
      title: "12 AI Models Online",
      description: "All 12 specialized AI models are running — object detection, tracking, transcription, anomaly detection, and reasoning.",
      side: "left" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='investigations']",
    popover: {
      title: "Your Investigations",
      description: "Create and manage forensic investigations. Each case can hold multiple video evidence files with full AI analysis.",
      side: "top" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='quick-actions']",
    popover: {
      title: "Quick Actions",
      description: "Jump straight to uploading evidence, chatting with AI, generating reports, or viewing timelines.",
      side: "left" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='copilot']",
    popover: {
      title: "AI Copilot",
      description: "Your persistent AI assistant — ask anything about the platform, get help, or navigate features instantly.",
      side: "left" as const,
      align: "start" as const,
    },
  },
];

export function DashboardTour() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (seen) return;

    const timer = setTimeout(() => {
      started.current = true;
      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.65)",
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: "insightx-tour-popover",
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Start Investigating ✓",
        steps: TOUR_STEPS,
        onDestroyed: () => localStorage.setItem(TOUR_KEY, "1"),
      });
      driverObj.drive();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export function restartDashboardTour() {
  localStorage.removeItem(TOUR_KEY);
  window.location.reload();
}
