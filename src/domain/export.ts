import { epochToTimeOfDay, isLocalDate, isTimeOfDay } from './dates';
import {
  isFinanceRuleType,
  isFinanceValueMode,
  isPayCycleLengthUnit,
} from './finance';
import { computeShiftDurationMinutes } from './stats';
import type {
  AppSettings,
  BackupPayload,
  CreateBackupData,
  FinanceTemplate,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  PayCycleProfile,
  ResolvedShift,
  Rotation,
  RotationException,
  Shift,
  ShiftTemplate,
} from './types';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) {
    return false;
  }

  const {
    remindersEnabled,
    defaultMinutesBefore,
    themeMode,
    weekStart,
    timeFormat,
    onboardingCompleted,
    hapticsEnabled,
  } = value;

  if (typeof remindersEnabled !== 'boolean') {
    return false;
  }
  if (!isFiniteNumberArray(defaultMinutesBefore)) {
    return false;
  }
  if (themeMode !== 'auto' && themeMode !== 'light' && themeMode !== 'dark') {
    return false;
  }
  if (weekStart !== 0 && weekStart !== 1) {
    return false;
  }
  if (timeFormat !== '12h' && timeFormat !== '24h') {
    return false;
  }
  if (typeof onboardingCompleted !== 'boolean') {
    return false;
  }
  if (typeof hapticsEnabled !== 'boolean') {
    return false;
  }

  return true;
}

function isShiftTemplate(value: unknown): value is ShiftTemplate {
  if (!isRecord(value)) {
    return false;
  }

  const {
    id,
    name,
    icon,
    color,
    startTime,
    endTime,
    breakMinutes,
    hourlyRate,
    isOff,
    reminderOverride,
    archivedAt,
  } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (typeof name !== 'string') {
    return false;
  }
  if (typeof icon !== 'string') {
    return false;
  }
  if (typeof color !== 'string' || !isHexColor(color)) {
    return false;
  }
  if (typeof startTime !== 'string' || !isTimeOfDay(startTime)) {
    return false;
  }
  if (typeof endTime !== 'string' || !isTimeOfDay(endTime)) {
    return false;
  }
  if (typeof breakMinutes !== 'number' || !Number.isFinite(breakMinutes)) {
    return false;
  }
  if (hourlyRate !== null && (typeof hourlyRate !== 'number' || !Number.isFinite(hourlyRate))) {
    return false;
  }
  if (typeof isOff !== 'boolean') {
    return false;
  }
  if (reminderOverride !== null && !isFiniteNumberArray(reminderOverride)) {
    return false;
  }
  if (archivedAt !== null && (typeof archivedAt !== 'number' || !Number.isFinite(archivedAt))) {
    return false;
  }

  return true;
}

function isRotation(value: unknown): value is Rotation {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, anchorDate, pattern, startDate, endDate, active } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (typeof name !== 'string') {
    return false;
  }
  if (typeof anchorDate !== 'string' || !isLocalDate(anchorDate)) {
    return false;
  }
  if (
    !Array.isArray(pattern) ||
    pattern.length === 0 ||
    !pattern.every((entry) => entry === null || typeof entry === 'string')
  ) {
    return false;
  }
  if (typeof startDate !== 'string' || !isLocalDate(startDate)) {
    return false;
  }
  if (endDate !== null && (typeof endDate !== 'string' || !isLocalDate(endDate))) {
    return false;
  }
  if (typeof active !== 'boolean') {
    return false;
  }

  return true;
}

function isRotationException(value: unknown): value is RotationException {
  if (!isRecord(value)) {
    return false;
  }

  const { rotationId, date, kind, templateId } = value;

  if (typeof rotationId !== 'string' || rotationId.length === 0) {
    return false;
  }
  if (typeof date !== 'string' || !isLocalDate(date)) {
    return false;
  }
  if (kind !== 'skip' && kind !== 'replace') {
    return false;
  }
  if (templateId !== null && (typeof templateId !== 'string' || templateId.length === 0)) {
    return false;
  }

  return true;
}

function isShift(value: unknown): value is Shift {
  if (!isRecord(value)) {
    return false;
  }

  const {
    id,
    date,
    templateId,
    name,
    icon,
    color,
    isOff,
    startsAt,
    endsAt,
    breakMinutes,
    notes,
    source,
    rotationId,
    reminderOverride,
    createdAt,
    updatedAt,
  } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (typeof date !== 'string' || !isLocalDate(date)) {
    return false;
  }
  if (templateId !== null && typeof templateId !== 'string') {
    return false;
  }
  if (typeof name !== 'string') {
    return false;
  }
  if (typeof icon !== 'string') {
    return false;
  }
  if (typeof color !== 'string' || !isHexColor(color)) {
    return false;
  }
  if (typeof isOff !== 'boolean') {
    return false;
  }
  if (typeof startsAt !== 'number' || !Number.isFinite(startsAt)) {
    return false;
  }
  if (typeof endsAt !== 'number' || !Number.isFinite(endsAt)) {
    return false;
  }
  if (typeof breakMinutes !== 'number' || !Number.isFinite(breakMinutes)) {
    return false;
  }
  if (typeof notes !== 'string') {
    return false;
  }
  if (source !== 'manual' && source !== 'rotation_override') {
    return false;
  }
  if (rotationId !== null && typeof rotationId !== 'string') {
    return false;
  }
  if (reminderOverride !== null && !isFiniteNumberArray(reminderOverride)) {
    return false;
  }
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
    return false;
  }
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
    return false;
  }

  return true;
}

function isPayCycleProfile(value: unknown): value is PayCycleProfile {
  if (!isRecord(value)) {
    return false;
  }

  const { isConfigured, paydayDayOfMonth, anchorPaydayDate, cycleLengthUnit, cycleLengthDays } =
    value;

  if (typeof isConfigured !== 'boolean') {
    return false;
  }
  if (
    typeof paydayDayOfMonth !== 'number' ||
    !Number.isInteger(paydayDayOfMonth) ||
    paydayDayOfMonth < 1 ||
    paydayDayOfMonth > 31
  ) {
    return false;
  }
  if (
    typeof anchorPaydayDate !== 'string' ||
    (anchorPaydayDate.length > 0 && !isLocalDate(anchorPaydayDate))
  ) {
    return false;
  }
  if (!isPayCycleLengthUnit(cycleLengthUnit)) {
    return false;
  }
  if (
    typeof cycleLengthDays !== 'number' ||
    !Number.isInteger(cycleLengthDays) ||
    cycleLengthDays < 1
  ) {
    return false;
  }

  return true;
}

function isFinanceTemplate(value: unknown): value is FinanceTemplate {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, category, valueMode, value: amount, icon, color, sortOrder, isActive } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (typeof name !== 'string') {
    return false;
  }
  if (!isFinanceRuleType(category)) {
    return false;
  }
  if (!isFinanceValueMode(valueMode)) {
    return false;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return false;
  }
  if (typeof icon !== 'string') {
    return false;
  }
  if (typeof color !== 'string' || !isHexColor(color)) {
    return false;
  }
  if (typeof sortOrder !== 'number' || !Number.isFinite(sortOrder)) {
    return false;
  }
  if (typeof isActive !== 'boolean') {
    return false;
  }

  return true;
}

function isMonthlyFinanceConfig(value: unknown): value is MonthlyFinanceConfig {
  if (!isRecord(value)) {
    return false;
  }

  const {
    monthKey,
    customStartDate,
    customEndDate,
    periodStartDate,
    periodEndDate,
    manualGrossOverride,
    notes,
  } = value;

  if (typeof monthKey !== 'string' || monthKey.length === 0) {
    return false;
  }
  if (
    customStartDate !== null &&
    (typeof customStartDate !== 'string' || !isLocalDate(customStartDate))
  ) {
    return false;
  }
  if (
    customEndDate !== null &&
    (typeof customEndDate !== 'string' || !isLocalDate(customEndDate))
  ) {
    return false;
  }
  if (
    periodStartDate !== undefined &&
    periodStartDate !== null &&
    (typeof periodStartDate !== 'string' || !isLocalDate(periodStartDate))
  ) {
    return false;
  }
  if (
    periodEndDate !== undefined &&
    periodEndDate !== null &&
    (typeof periodEndDate !== 'string' || !isLocalDate(periodEndDate))
  ) {
    return false;
  }
  if (
    manualGrossOverride !== null &&
    (typeof manualGrossOverride !== 'number' || !Number.isFinite(manualGrossOverride))
  ) {
    return false;
  }
  if (typeof notes !== 'string') {
    return false;
  }

  return true;
}

function isMonthlyFinanceEntry(value: unknown): value is MonthlyFinanceEntry {
  if (!isRecord(value)) {
    return false;
  }

  const {
    id,
    monthKey,
    templateId,
    name,
    category,
    valueMode,
    value: amount,
    icon,
    color,
    sortOrder,
    isPaid,
  } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (typeof monthKey !== 'string' || monthKey.length === 0) {
    return false;
  }
  if (templateId !== null && typeof templateId !== 'string') {
    return false;
  }
  if (typeof name !== 'string') {
    return false;
  }
  if (!isFinanceRuleType(category)) {
    return false;
  }
  if (!isFinanceValueMode(valueMode)) {
    return false;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return false;
  }
  if (typeof icon !== 'string') {
    return false;
  }
  if (typeof color !== 'string' || !isHexColor(color)) {
    return false;
  }
  if (typeof sortOrder !== 'number' || !Number.isFinite(sortOrder)) {
    return false;
  }
  if (typeof isPaid !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Escapes an individual field per RFC-4180 rules:
 * If the field contains comma, quote, or newline, it is enclosed in double quotes
 * and internal double quotes are doubled.
 */
function escapeCsvField(field: string): string {
  if (field.includes('"') || field.includes(',') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generates RFC-4180 compliant CSV text from a list of resolved shifts.
 * Header: Date,Name,Start,End,BreakMinutes,NetHours,Origin,Notes
 */
export function shiftsToCsv(shifts: ReadonlyArray<ResolvedShift>): string {
  const header = [
    'Date',
    'Name',
    'Start',
    'End',
    'BreakMinutes',
    'NetHours',
    'Origin',
    'Notes',
  ].join(',');

  const rows = shifts.map((shift) => {
    const duration = computeShiftDurationMinutes(shift);
    const start = shift.isOff ? '' : epochToTimeOfDay(shift.startsAt);
    const end = shift.isOff ? '' : epochToTimeOfDay(shift.endsAt);
    const breakMinutes = shift.isOff ? 0 : Math.max(0, shift.breakMinutes);
    const netHours = Math.round((duration.netMinutes / 60) * 100) / 100;

    return [
      escapeCsvField(shift.date),
      escapeCsvField(shift.name),
      escapeCsvField(start),
      escapeCsvField(end),
      escapeCsvField(String(breakMinutes)),
      escapeCsvField(String(netHours)),
      escapeCsvField(shift.origin),
      escapeCsvField(shift.notes),
    ].join(',');
  });

  return [header, ...rows].join('\r\n');
}

/**
 * Serializes a versioned JSON backup with pretty 2-space indentation.
 */
export function createBackupPayload(data: CreateBackupData): string {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: data.exportedAt,
    settings: data.settings,
    templates: data.templates,
    rotations: data.rotations,
    exceptions: data.exceptions,
    shifts: data.shifts,
    ...(data.payCycleProfile !== undefined ? { payCycleProfile: data.payCycleProfile } : {}),
    ...(data.financeTemplates !== undefined ? { financeTemplates: data.financeTemplates } : {}),
    ...(data.monthlyConfigs !== undefined ? { monthlyConfigs: data.monthlyConfigs } : {}),
    ...(data.monthlyEntries !== undefined ? { monthlyEntries: data.monthlyEntries } : {}),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Parses and strictly validates a JSON backup payload.
 * Throws a descriptive Error if the JSON is malformed or any entity fails type guards.
 */
export function parseBackupPayload(rawJson: string): BackupPayload {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    throw new Error('Invalid backup payload: empty input');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON syntax';
    throw new Error(`Invalid backup payload: malformed JSON (${message})`, { cause: err });
  }

  if (!isRecord(parsed)) {
    throw new Error('Invalid backup payload: root must be a JSON object');
  }

  if (parsed['version'] !== 1) {
    throw new Error(
      `Invalid backup payload: unsupported version '${String(parsed['version'])}' (expected 1)`,
    );
  }

  const exportedAt = parsed['exportedAt'];
  if (typeof exportedAt !== 'number' || !Number.isFinite(exportedAt)) {
    throw new Error('Invalid backup payload: missing or invalid "exportedAt" timestamp');
  }

  const settings = parsed['settings'];
  if (!isAppSettings(settings)) {
    throw new Error('Invalid backup payload: invalid or malformed "settings" object');
  }

  const templates = parsed['templates'];
  if (!Array.isArray(templates) || !templates.every(isShiftTemplate)) {
    throw new Error(
      'Invalid backup payload: "templates" must be an array of valid ShiftTemplate objects',
    );
  }

  const rotations = parsed['rotations'];
  if (!Array.isArray(rotations) || !rotations.every(isRotation)) {
    throw new Error(
      'Invalid backup payload: "rotations" must be an array of valid Rotation objects',
    );
  }

  const exceptions = parsed['exceptions'];
  if (!Array.isArray(exceptions) || !exceptions.every(isRotationException)) {
    throw new Error(
      'Invalid backup payload: "exceptions" must be an array of valid RotationException objects',
    );
  }

  const shifts = parsed['shifts'];
  if (!Array.isArray(shifts) || !shifts.every(isShift)) {
    throw new Error('Invalid backup payload: "shifts" must be an array of valid Shift objects');
  }

  let payCycleProfile: PayCycleProfile | undefined;
  if ('payCycleProfile' in parsed && parsed['payCycleProfile'] !== undefined) {
    if (!isPayCycleProfile(parsed['payCycleProfile'])) {
      throw new Error('Invalid backup payload: invalid or malformed "payCycleProfile" object');
    }
    payCycleProfile = parsed['payCycleProfile'];
  }

  let financeTemplates: ReadonlyArray<FinanceTemplate> | undefined;
  if ('financeTemplates' in parsed && parsed['financeTemplates'] !== undefined) {
    if (
      !Array.isArray(parsed['financeTemplates']) ||
      !parsed['financeTemplates'].every(isFinanceTemplate)
    ) {
      throw new Error(
        'Invalid backup payload: "financeTemplates" must be an array of valid FinanceTemplate objects',
      );
    }
    financeTemplates = parsed['financeTemplates'];
  }

  let monthlyConfigs: ReadonlyArray<MonthlyFinanceConfig> | undefined;
  if ('monthlyConfigs' in parsed && parsed['monthlyConfigs'] !== undefined) {
    if (
      !Array.isArray(parsed['monthlyConfigs']) ||
      !parsed['monthlyConfigs'].every(isMonthlyFinanceConfig)
    ) {
      throw new Error(
        'Invalid backup payload: "monthlyConfigs" must be an array of valid MonthlyFinanceConfig objects',
      );
    }
    monthlyConfigs = parsed['monthlyConfigs'];
  }

  let monthlyEntries: ReadonlyArray<MonthlyFinanceEntry> | undefined;
  if ('monthlyEntries' in parsed && parsed['monthlyEntries'] !== undefined) {
    if (
      !Array.isArray(parsed['monthlyEntries']) ||
      !parsed['monthlyEntries'].every(isMonthlyFinanceEntry)
    ) {
      throw new Error(
        'Invalid backup payload: "monthlyEntries" must be an array of valid MonthlyFinanceEntry objects',
      );
    }
    monthlyEntries = parsed['monthlyEntries'];
  }

  return {
    version: 1,
    exportedAt,
    settings,
    templates,
    rotations,
    exceptions,
    shifts,
    ...(payCycleProfile !== undefined ? { payCycleProfile } : {}),
    ...(financeTemplates !== undefined ? { financeTemplates } : {}),
    ...(monthlyConfigs !== undefined ? { monthlyConfigs } : {}),
    ...(monthlyEntries !== undefined ? { monthlyEntries } : {}),
  };
}
