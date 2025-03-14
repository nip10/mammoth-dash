/**
 * Generates a random color suitable for player mammoths
 * Returns a hex color string
 */
export function generateRandomColor(): string {
  const colors = [
    "#FF5733", // Orange-red
    "#33FF57", // Green
    "#3357FF", // Blue
    "#F3FF33", // Yellow
    "#FF33F3", // Pink
    "#33FFF3", // Cyan
    "#8333FF", // Purple
    "#FF8333"  // Orange
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generates a unique ID with a given prefix
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formats time in milliseconds to a MM:SS.mmm format
 */
export function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, amount: number): number {
  return (1 - amount) * start + amount * end;
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the distance between two 3D points
 */
export function distance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Gets the query parameters from the URL
 */
export function getQueryParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Easing functions for animations
 */
export const easing = {
  // Acceleration from zero velocity
  easeInQuad: (t: number): number => t * t,
  // Deceleration to zero velocity
  easeOutQuad: (t: number): number => t * (2 - t),
  // Acceleration until halfway, then deceleration
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Bouncing effect
  easeOutBounce: (t: number): number => {
    if (t < (1/2.75)) {
      return 7.5625 * t * t;
    } else if (t < (2/2.75)) {
      return 7.5625 * (t -= (1.5/2.75)) * t + 0.75;
    } else if (t < (2.5/2.75)) {
      return 7.5625 * (t -= (2.25/2.75)) * t + 0.9375;
    } else {
      return 7.5625 * (t -= (2.625/2.75)) * t + 0.984375;
    }
  }
};