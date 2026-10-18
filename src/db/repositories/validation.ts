import { isLocalDate, isTimeOfDay, type LocalDate, type TimeOfDay } from '@/domain';
import { DataIntegrityError } from '../errors';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Validates whether a given string is a 6-digit hex color formatted as #RRGGBB.
 */
export function isHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

/**
 * Validates whether a value is an array of finite numbers.
 */
export function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

/**
 * Validates whether a value is an array of strings or nulls (rotation pattern).
 */
export function isRotationPatternArray(
  value: unknown,
): value is Array<string | null> {
  return (
    Array.isArray(value) &&
    value.every((item) => item === null || typeof item === 'string')
  );
}

/**
 * Validates whether a value belongs to a specific string enum list.
 */
export function isEnumMember<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function validateLocalDate(
  date: string,
  table: string,
  rowId: string,
): LocalDate {
  if (!isLocalDate(date)) {
    throw new DataIntegrityError(table, rowId, `Invalid local date: ${date}`);
  }
  return date;
}

export function validateNullableLocalDate(
  date: string | null | undefined,
  table: string,
  rowId: string,
): LocalDate | null {
  if (date === null || date === undefined) {
    return null;
  }
  return validateLocalDate(date, table, rowId);
}

export function validateTimeOfDay(
  time: string,
  table: string,
  rowId: string,
): TimeOfDay {
  if (!isTimeOfDay(time)) {
    throw new DataIntegrityError(table, rowId, `Invalid time of day: ${time}`);
  }
  return time;
}

export function validateHexColor(
  color: string,
  table: string,
  rowId: string,
): string {
  if (!isHexColor(color)) {
    throw new DataIntegrityError(table, rowId, `Invalid hex color: ${color}`);
  }
  return color;
}

export function validateNumberArray(
  value: unknown,
  table: string,
  rowId: string,
  fieldName: string,
): number[] {
  if (!isNumberArray(value)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Field '${fieldName}' must be an array of numbers`,
    );
  }
  return value;
}

export function validateNullableNumberArray(
  value: unknown,
  table: string,
  rowId: string,
  fieldName: string,
): number[] | null {
  if (value === null || value === undefined) {
    return null;
  }
  return validateNumberArray(value, table, rowId, fieldName);
}

export function validateRotationPattern(
  value: unknown,
  table: string,
  rowId: string,
): Array<string | null> {
  if (!isRotationPatternArray(value)) {
    throw new DataIntegrityError(
      table,
      rowId,
      'Rotation pattern must be an array of string or null',
    );
  }
  return value;
}

export function validateEnumMember<T extends string>(
  value: unknown,
  allowed: readonly T[],
  table: string,
  rowId: string,
  fieldName: string,
): T {
  if (!isEnumMember(value, allowed)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Field '${fieldName}' has invalid enum value: ${String(value)}`,
    );
  }
  return value;
}
