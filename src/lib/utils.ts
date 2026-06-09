import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Coerce a possibly-NaN / non-finite number to a safe finite value. */
export function safeNumber(n: number, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}
