/**
 * Error thrown when a database row fails domain validation or structural integrity checks.
 * Never silently skipped or auto-fixed; caught and logged by callers.
 */
export class DataIntegrityError extends Error {
  readonly table: string;
  readonly rowId: string;
  readonly reason: string;

  constructor(table: string, rowId: string, reason: string) {
    super(`Data integrity error in table '${table}' (row id: '${rowId}'): ${reason}`);
    this.name = 'DataIntegrityError';
    this.table = table;
    this.rowId = rowId;
    this.reason = reason;
  }
}
