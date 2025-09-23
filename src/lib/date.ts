/**
 * Converts a YYYY-MM-DD string into a Date object at local midnight without
 * applying UTC offsets that `Date.parse` would normally introduce.
 *
 * @param input - Date string in the format YYYY-MM-DD.
 * @returns A Date instance at local midnight or null if the input is invalid.
 */
export function toLocalDate(input?: string | null): Date | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Ensure the produced date matches the provided components to avoid overflow.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
