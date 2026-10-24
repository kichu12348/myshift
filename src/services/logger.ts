declare const __DEV__: boolean;

export interface Logger {
  readonly debug: (message: string, data?: unknown) => void;
  readonly info: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
}

function formatLogData(data: unknown): unknown {
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }
  return data;
}

function isTestEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env !== undefined &&
    process.env['NODE_ENV'] === 'test' &&
    process.env['ENABLE_TEST_LOGS'] !== 'true'
  );
}

/**
 * Creates a scoped logger for a specific module or component tag.
 * Standard format: `[tag] message` with optional structured payload.
 */
export function createLogger(tag: string): Logger {
  const prefix = `[${tag}]`;

  return {
    debug(message: string, data?: unknown): void {
      if (isTestEnvironment()) {
        return;
      }
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        if (data !== undefined) {
          console.debug(`${prefix} ${message}`, formatLogData(data));
        } else {
          console.debug(`${prefix} ${message}`);
        }
      }
    },
    info(message: string, data?: unknown): void {
      if (isTestEnvironment()) {
        return;
      }
      if (data !== undefined) {
        console.info(`${prefix} ${message}`, formatLogData(data));
      } else {
        console.info(`${prefix} ${message}`);
      }
    },
    warn(message: string, data?: unknown): void {
      if (isTestEnvironment()) {
        return;
      }
      if (data !== undefined) {
        console.warn(`${prefix} ${message}`, formatLogData(data));
      } else {
        console.warn(`${prefix} ${message}`);
      }
    },
    error(message: string, data?: unknown): void {
      if (isTestEnvironment()) {
        return;
      }
      if (data !== undefined) {
        console.error(`${prefix} ${message}`, formatLogData(data));
      } else {
        console.error(`${prefix} ${message}`);
      }
    },
  };
}
