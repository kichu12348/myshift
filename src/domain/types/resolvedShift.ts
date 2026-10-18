import type { Shift } from './shift';

export type ShiftOrigin = 'manual' | 'rotation_override' | 'rotation';

/**
 * A resolved shift for calendar presentation, reports, and reminder scheduling.
 * Contains all fields of Shift except source, createdAt, and updatedAt, plus origin.
 *
 * Shifts that come from a rotation and are not stored in the database ("virtual" shifts)
 * use origin "rotation" and the id `rotation:<rotationId>:<date>`.
 * Note: this id format is also used as the reminder key for virtual shifts later.
 */
export interface ResolvedShift
  extends Omit<Shift, 'source' | 'createdAt' | 'updatedAt'> {
  readonly origin: ShiftOrigin;
}
