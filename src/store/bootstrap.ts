import { DEFAULT_SHIFT_TEMPLATES } from '@/constants';
import { repositories } from '@/db';
import { createLogger } from '@/services';
import { useRotationStore } from './rotationStore';
import { useSettingsStore } from './settingsStore';
import { useTemplateStore } from './templateStore';

const logger = createLogger('store:bootstrap');

/**
 * Initializes app state on startup.
 *
 * Execution order:
 * 1. Seeds default shift templates if shift_templates table is empty
 * 2. Loads app settings (or inserts defaults if first launch)
 * 3. Loads all shift templates (including archived ones)
 * 4. Loads all rotations
 *
 * If any step fails, logs the error and throws a readable Error.
 * Idempotent: calling it multiple times will not duplicate records.
 */
export async function initializeStores(): Promise<void> {
  logger.info('Initializing application stores...');

  try {
    const seeded = await repositories.templates.seedIfEmpty(DEFAULT_SHIFT_TEMPLATES);
    if (seeded) {
      logger.info('Seeded default shift templates (Day, Night, Off)');
    } else {
      logger.info('Shift templates already exist; skipping seed');
    }

    await useSettingsStore.getState().loadSettings();
    const settingsState = useSettingsStore.getState();
    if (settingsState.status === 'error') {
      throw new Error(settingsState.error ?? 'Failed to load app settings');
    }

    await useTemplateStore.getState().loadTemplates();
    const templateState = useTemplateStore.getState();
    if (templateState.status === 'error') {
      throw new Error(templateState.error ?? 'Failed to load shift templates');
    }

    await useRotationStore.getState().loadRotations();
    const rotationState = useRotationStore.getState();
    if (rotationState.status === 'error') {
      throw new Error(rotationState.error ?? 'Failed to load rotations');
    }

    logger.info('Store initialization complete');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown startup error';
    logger.error('Startup store initialization failed', err);
    throw new Error(`Startup store initialization failed: ${message}`, { cause: err });
  }
}
