import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format doctor name with "Dr." prefix, avoiding duplication.
 * If name already starts with "Dr"/"Dr."/"Dr " (case-insensitive), returns as-is.
 * Otherwise, prepends "Dr. ".
 */
export function formatDoctorName(name: string): string {
  if (!name) return '';
  return /^dr\.?\s*/i.test(name) ? name : `Dr. ${name}`;
}
