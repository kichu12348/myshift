/**
 * Represents a calendar date in YYYY-MM-DD format.
 * Plain string must not be used for dates in the domain.
 */
export type LocalDate = `${number}-${number}-${number}`;

/**
 * Represents a 24-hour time of day in HH:mm format.
 * Plain string must not be used for times of day in the domain.
 */
export type TimeOfDay = `${number}:${number}`;
