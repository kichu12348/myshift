import { fireEvent, screen } from '@testing-library/react-native';
import { RestoreBackupSheet } from './index';
import { renderWithProviders } from '@/testing';
import { createBackupPayload, type CreateBackupData } from '@/domain';

describe('RestoreBackupSheet', () => {
  const sampleBackupData: CreateBackupData = {
    settings: {
      themeMode: 'dark',
      weekStart: 1,
      timeFormat: '24h',
      remindersEnabled: true,
      defaultMinutesBefore: [60, 30, 15],
    },
    templates: [],
    rotations: [],
    exceptions: [],
    shifts: [],
    exportedAt: 1729759999000,
  };

  const validJson = createBackupPayload(sampleBackupData);

  it('renders input and validates valid backup JSON', async () => {
    const onRestore = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await renderWithProviders(
      <RestoreBackupSheet visible={true} onClose={onClose} onRestore={onRestore} />,
    );

    const input = screen.getByLabelText('JSON backup payload input');
    await fireEvent.changeText(input, validJson);

    const validateButton = screen.getByLabelText('Validate backup JSON');
    await fireEvent.press(validateButton);

    // After validation, summary and warning should appear
    expect(screen.getByText('Backup Summary')).toBeTruthy();
    expect(screen.getByText('Permanent Overwrite Warning')).toBeTruthy();
    expect(screen.getByLabelText('Confirm overwrite step 1')).toBeTruthy();
  });

  it('requires two-step danger confirmation before executing onRestore', async () => {
    const onRestore = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await renderWithProviders(
      <RestoreBackupSheet visible={true} onClose={onClose} onRestore={onRestore} />,
    );

    const input = screen.getByLabelText('JSON backup payload input');
    await fireEvent.changeText(input, validJson);

    const validateButton = screen.getByLabelText('Validate backup JSON');
    await fireEvent.press(validateButton);

    // Step 1: Click "I Understand, Proceed to Overwrite"
    const stepOneButton = screen.getByLabelText('Confirm overwrite step 1');
    await fireEvent.press(stepOneButton);

    // Step 2: Dangerous button "Overwrite All Data & Restore" appears
    const dangerButton = screen.getByLabelText('Overwrite all data and restore');
    expect(dangerButton).toBeTruthy();
    expect(onRestore).not.toHaveBeenCalled();

    // Clicking step 2 executes restore and closes
    await fireEvent.press(dangerButton);
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        exportedAt: 1729759999000,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error message when invalid JSON is entered', async () => {
    const onRestore = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await renderWithProviders(
      <RestoreBackupSheet visible={true} onClose={onClose} onRestore={onRestore} />,
    );

    const input = screen.getByLabelText('JSON backup payload input');
    await fireEvent.changeText(input, '{"invalid": true}');

    const validateButton = screen.getByLabelText('Validate backup JSON');
    await fireEvent.press(validateButton);

    expect(screen.getByText(/Invalid backup payload/)).toBeTruthy();
    expect(onRestore).not.toHaveBeenCalled();
  });
});
