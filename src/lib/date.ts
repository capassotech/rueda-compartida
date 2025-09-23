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

/**
 * Combines a YYYY-MM-DD string and an HH:MM(:SS) string into a Date instance
 * using the local timezone without applying UTC offsets.
 *
 * @param dateInput - Date string in the format YYYY-MM-DD.
 * @param timeInput - Time string in the format HH:MM or HH:MM:SS.
 * @returns A Date instance representing the combined local date and time, or
 * null if either value is invalid.
 */
export function toLocalDateTime(
  dateInput?: string | null,
  timeInput?: string | null,
): Date | null {
  const date = toLocalDate(dateInput);
  if (!date || !timeInput) {
    return null;
  }

  const trimmed = timeInput.trim();
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;

  if (
    [hours, minutes, seconds].some((value) => Number.isNaN(value)) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    0,
  );

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result;
}

type DateTimeFields = {
  date?: string | null;
  time?: string | null;
};

/**
 * Produces a local departure date for a ride-like object using its date and
 * time fields.
 */
export function getLocalDepartureDate({
  date,
  time,
}: DateTimeFields): Date | null {
  return toLocalDateTime(date, time);
}
