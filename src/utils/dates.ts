/**
 * Validates an ISO 8601 date string and returns a Date object, or null if invalid.
 */
export function parseISODate(value: string): Date | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validates that a string is a valid ISO 8601 date.
 */
export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

/**
 * Converts a Date to an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parses a date string or returns null. Accepts ISO 8601 format.
 */
export function parseDateOrNull(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = parseISODate(value);
  return date ? toISOString(date) : null;
}

/**
 * Validates all date-string fields in an args object.
 * Throws if any specified field contains an invalid date string.
 * Skips undefined/null values (those are valid — they mean "no date" or "clear date").
 */
export function validateDateArgs(args: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    const value = args[field];
    if (typeof value === "string" && !isValidISODate(value)) {
      throw new Error(`Invalid date for '${field}': ${value}`);
    }
  }
}
