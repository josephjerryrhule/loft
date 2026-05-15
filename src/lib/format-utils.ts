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
