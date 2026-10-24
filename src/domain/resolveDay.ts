import type { LocalDate } from './types/dates';
import type { Rotation, RotationException } from './types/rotation';
import type { Shift } from './types/shift';
import type { ShiftTemplate } from './types/template';
import type { ResolvedShift } from './types/resolvedShift';
import { addDays, compareLocalDates, daysBetween, getOffShiftTimes, getShiftTimes } from './dates';
import { getRotationEntryForDate } from './rotation';

export interface ResolveIssue {
  readonly rotationId: string;
  readonly date: LocalDate;
  readonly templateId: string;
  readonly reason: 'template_missing';
}

export interface ResolveDayInput {
  readonly rotations: ReadonlyArray<Rotation>;
  readonly exceptions: ReadonlyArray<RotationException>;
  readonly manualShifts: ReadonlyArray<Shift>;
  readonly templatesById: ReadonlyMap<string, ShiftTemplate>;
}

export interface ResolvedDay {
  readonly shifts: ResolvedShift[];
  readonly issues: ResolveIssue[];
}

function compareRotations(a: Rotation, b: Rotation): number {
  const dateComp = compareLocalDates(a.startDate, b.startDate);
  if (dateComp !== 0) {
    return dateComp;
  }
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

function sortRotations(rotations: ReadonlyArray<Rotation>): Rotation[] {
  return [...rotations].sort(compareRotations);
}

function mapStoredShiftToResolved(shift: Shift): ResolvedShift {
  return {
    id: shift.id,
    date: shift.date,
    templateId: shift.templateId,
    name: shift.name,
    icon: shift.icon,
    color: shift.color,
    isOff: shift.isOff,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    breakMinutes: shift.breakMinutes,
    notes: shift.notes,
    origin: shift.source,
    rotationId: shift.rotationId,
    reminderOverride: shift.reminderOverride,
  };
}

function generateVirtualShift(
  rotationId: string,
  date: LocalDate,
  template: ShiftTemplate,
): ResolvedShift {
  const times = template.isOff
    ? getOffShiftTimes(date)
    : getShiftTimes(date, template.startTime, template.endTime);

  return {
    id: `rotation:${rotationId}:${date}`,
    date,
    templateId: template.id,
    name: template.name,
    icon: template.icon,
    color: template.color,
    isOff: template.isOff,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    breakMinutes: template.breakMinutes,
    notes: '',
    origin: 'rotation',
    rotationId,
    reminderOverride: template.reminderOverride,
  };
}

function compareResolvedShifts(a: ResolvedShift, b: ResolvedShift): number {
  if (a.startsAt !== b.startsAt) {
    return a.startsAt - b.startsAt;
  }
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

function evaluateRotationForDate(
  rotation: Rotation,
  date: LocalDate,
  exceptions: ReadonlyArray<RotationException>,
  templatesById: ReadonlyMap<string, ShiftTemplate>,
  hasOverride: boolean,
): {
  shift: ResolvedShift | null;
  issue: ResolveIssue | null;
} {
  const lookup = getRotationEntryForDate(rotation, date);
  if (lookup.kind !== 'template') {
    return { shift: null, issue: null };
  }

  const exception = exceptions.find((ex) => ex.rotationId === rotation.id && ex.date === date);

  let chosenTemplateId: string | null = lookup.templateId;
  if (exception !== undefined) {
    if (exception.kind === 'skip') {
      chosenTemplateId = null;
    } else if (exception.kind === 'replace') {
      chosenTemplateId = exception.templateId;
    }
  }

  if (chosenTemplateId === null) {
    return { shift: null, issue: null };
  }

  const template = templatesById.get(chosenTemplateId);
  if (template === undefined) {
    return {
      shift: null,
      issue: {
        rotationId: rotation.id,
        date,
        templateId: chosenTemplateId,
        reason: 'template_missing',
      },
    };
  }

  if (hasOverride) {
    return { shift: null, issue: null };
  }

  return {
    shift: generateVirtualShift(rotation.id, date, template),
    issue: null,
  };
}

function resolveDayCore(
  date: LocalDate,
  dayStoredShifts: ReadonlyArray<Shift>,
  sortedRotations: ReadonlyArray<Rotation>,
  exceptions: ReadonlyArray<RotationException>,
  templatesById: ReadonlyMap<string, ShiftTemplate>,
): ResolvedDay {
  const resolvedStoredShifts: ResolvedShift[] = dayStoredShifts.map(mapStoredShiftToResolved);

  const generatedShifts: ResolvedShift[] = [];
  const issues: ResolveIssue[] = [];

  for (const rotation of sortedRotations) {
    const hasOverride = dayStoredShifts.some(
      (s) => s.source === 'rotation_override' && s.rotationId === rotation.id,
    );

    const evaluated = evaluateRotationForDate(
      rotation,
      date,
      exceptions,
      templatesById,
      hasOverride,
    );

    if (evaluated.issue !== null) {
      issues.push(evaluated.issue);
    }
    if (evaluated.shift !== null) {
      generatedShifts.push(evaluated.shift);
    }
  }

  const allShifts: ResolvedShift[] = [...resolvedStoredShifts, ...generatedShifts];
  allShifts.sort(compareResolvedShifts);

  return {
    shifts: allShifts,
    issues,
  };
}

/**
 * Resolves all shifts and any issues for a specific date by merging stored shifts
 * (manual and rotation overrides) and generated shifts from active rotations.
 *
 * Rules, in this order:
 * a. Stored shifts: take every stored shift whose date equals `date`. Map each to a
 *    ResolvedShift with origin = its source.
 * b. Generated shifts: for each rotation (processed in deterministic order: by startDate, then id),
 *    call getRotationEntryForDate.
 *    - "inactive" or "blank": nothing generated.
 *    - "template": look for an exception with the same rotationId and date.
 *      kind "skip" means nothing is generated.
 *      kind "replace" means use the exception's templateId instead (if that is null, nothing is generated).
 *      Otherwise use the pattern's templateId.
 *    - If the chosen template id is not in templatesById, generate nothing and add a ResolveIssue
 *      with reason "template_missing". Never throw and never fail silently.
 *    - If a stored shift on this date has source "rotation_override" and the same rotationId,
 *      it REPLACES that rotation's generated shift for this date: do not generate it.
 *    - Build the generated shift from the template: name, icon, color, breakMinutes, reminderOverride,
 *      isOff, templateId from the template; date = date; notes = ""; rotationId = rotation.id.
 *      Times: if template.isOff use getOffShiftTimes(date), otherwise getShiftTimes(date, startTime, endTime)
 *      (an overnight shift ends the next calendar date automatically).
 * c. Stored manual shifts (source "manual") are always kept in addition to generated shifts;
 *    several shifts on one day are normal.
 * d. Sort the final list by startsAt ascending, then by id for a stable order.
 *
 * Never mutates any input.
 */
export function resolveDay(date: LocalDate, input: ResolveDayInput): ResolvedDay {
  const dayStoredShifts = input.manualShifts.filter((s) => s.date === date);
  const sortedRotations = sortRotations(input.rotations);

  return resolveDayCore(
    date,
    dayStoredShifts,
    sortedRotations,
    input.exceptions,
    input.templatesById,
  );
}

/**
 * Resolves all shifts and issues across a date range [from, to] inclusive.
 *
 * Returns an entry for every date from `from` to `to` inclusive (empty map if `to` is before `from`).
 * For efficiency, groups stored shifts by date once up front instead of filtering the whole array
 * for every day. It gives exactly the same results as calling resolveDay for each date.
 *
 * Never mutates any input.
 */
export function resolveRange(
  from: LocalDate,
  to: LocalDate,
  input: ResolveDayInput,
): Map<LocalDate, ResolvedDay> {
  const result = new Map<LocalDate, ResolvedDay>();

  if (compareLocalDates(from, to) > 0) {
    return result;
  }

  const shiftsByDate = new Map<LocalDate, Shift[]>();
  for (const shift of input.manualShifts) {
    const existing = shiftsByDate.get(shift.date);
    if (existing !== undefined) {
      existing.push(shift);
    } else {
      shiftsByDate.set(shift.date, [shift]);
    }
  }

  const sortedRotations = sortRotations(input.rotations);
  const totalDays = daysBetween(from, to);

  for (let i = 0; i <= totalDays; i += 1) {
    const date = addDays(from, i);
    const dayStoredShifts = shiftsByDate.get(date) ?? [];
    const resolvedDay = resolveDayCore(
      date,
      dayStoredShifts,
      sortedRotations,
      input.exceptions,
      input.templatesById,
    );
    result.set(date, resolvedDay);
  }

  return result;
}
