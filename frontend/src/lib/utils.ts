import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse API datetime strings as UTC (backend sends UTC without always appending Z). */
export function parseApiDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (!date) return new Date();
  const normalized = date.endsWith("Z") || date.includes("+") ? date : `${date}Z`;
  const parsed = parseISO(normalized);
  return isValid(parsed) ? parsed : new Date(date);
}

export function formatDate(date: string | Date): string {
  return format(parseApiDate(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(parseApiDate(date), "MMM d, yyyy · h:mm a");
}

export function formatRelative(date: string | Date): string {
  const d = parseApiDate(date);
  const seconds = (Date.now() - d.getTime()) / 1000;
  if (seconds >= 0 && seconds < 60) return "Just now";
  if (seconds < 0 && seconds > -60) return "Just now";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getRiskColor(risk?: string | null): string {
  switch (risk?.toLowerCase()) {
    case "critical": return "text-red-400";
    case "high": return "text-orange-400";
    case "medium": return "text-yellow-400";
    case "low": return "text-green-400";
    default: return "text-muted";
  }
}

export function getRiskBadgeClass(risk?: string | null): string {
  switch (risk?.toLowerCase()) {
    case "critical": return "badge-critical";
    case "high": return "badge-high";
    case "medium": return "badge-medium";
    case "low": return "badge-low";
    default: return "badge-low";
  }
}

export function getIncidentScoreColor(score: number): string {
  if (score >= 75) return "#EF4444";
  if (score >= 50) return "#F97316";
  if (score >= 25) return "#EAB308";
  return "#22C55E";
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
