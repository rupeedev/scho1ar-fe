import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string into a human-readable date and time
 * @param dateString - ISO date string
 * @returns Object with formatted date and time
 */
export function formatDate(dateString: string) {
  if (!dateString) return { date: '-', time: '-' };
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return { date: 'Invalid Date', time: '-' };
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Format date as "Apr 16, 2025"
  const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  
  // Format time as "9:51:03 PM"
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  return { date: formattedDate, time: formattedTime };
}

/**
 * Format a currency value
 * @param value - The numeric value to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a percentage value
 * @param value - The numeric value to format (0.1 = 10%)
 * @param includeSign - Whether to include the % sign
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, includeSign: boolean = true) {
  const percentage = value * 100;
  const formatted = percentage.toFixed(2);
  return includeSign ? `${formatted}%` : formatted;
}
