import { randomUUID } from 'expo-crypto';

/**
 * Generates a unique RFC4122 v4 UUID string.
 * Centralized ID generator for entity IDs across the application.
 */
export function createId(): string {
  return randomUUID();
}
