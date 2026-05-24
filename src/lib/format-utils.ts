/**
 * Formats a raw role string (e.g., "OPERATIONS_MANAGER") into a human-readable title (e.g., "Operations Manager")
 */
export function formatRole(role: string): string {
  if (!role) return "";
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a UTC date cleanly without timezone shifting (e.g., "18 May 2026")
 */
export function formatUTCDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a UTC date to a short month-day string (e.g., "18 May")
 */
export function formatUTCDateShort(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  return `${day} ${month}`;
}
