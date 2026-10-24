import { useState, type ReactElement } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { parseBackupPayload, type BackupPayload } from '@/domain';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface RestoreBackupSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onRestore: (payload: BackupPayload) => Promise<void>;
}

export function RestoreBackupSheet({
  visible,
  onClose,
  onRestore,
}: RestoreBackupSheetProps): ReactElement {
  const styles = useStyles();

  const [jsonText, setJsonText] = useState<string>('');
  const [parsedPayload, setParsedPayload] = useState<BackupPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmedStepOne, setConfirmedStepOne] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleReset = (): void => {
    setJsonText('');
    setParsedPayload(null);
    setParseError(null);
    setConfirmedStepOne(false);
    setIsRestoring(false);
    setRestoreError(null);
  };

  const handleClose = (): void => {
    handleReset();
    onClose();
  };

  const handleValidate = (): void => {
    haptics.selection();
    try {
      const payload = parseBackupPayload(jsonText.trim());
      setParsedPayload(payload);
      setParseError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid backup JSON';
      setParseError(message);
      setParsedPayload(null);
    }
  };

  const handleExecuteRestore = async (): Promise<void> => {
    if (parsedPayload === null) {
      return;
    }

    haptics.warning();
    setIsRestoring(true);
    setRestoreError(null);

    try {
      await onRestore(parsedPayload);
      haptics.success();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Restore operation failed';
      setRestoreError(message);
      setIsRestoring(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} accessibilityLabel="Restore backup sheet">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="title" weight="semibold">
            Restore from Backup
          </Text>
          <Text variant="caption" tone="muted">
            Import shifts, templates, rotations, and preferences from a JSON backup.
          </Text>
        </View>

        {parsedPayload === null ? (
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={jsonText}
              onChangeText={(text) => {
                setJsonText(text);
                if (parseError !== null) {
                  setParseError(null);
                }
              }}
              placeholder='{"version": 1, "settings": {...}, ...}'
              placeholderTextColor={styles.placeholder.color}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="JSON backup payload input"
            />

            {parseError !== null ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} tone="danger" />
                <Text variant="caption" tone="danger" style={styles.errorText}>
                  {parseError}
                </Text>
              </View>
            ) : null}

            <Button
              label="Validate Backup"
              onPress={handleValidate}
              disabled={jsonText.trim().length === 0}
              accessibilityLabel="Validate backup JSON"
            />
          </View>
        ) : (
          <View style={styles.reviewSection}>
            <View style={styles.reviewCard}>
              <Text variant="body" weight="semibold">
                Backup Summary
              </Text>
              <Text variant="caption" tone="muted">
                Version {parsedPayload.version} • Exported{' '}
                {new Date(parsedPayload.exportedAt).toLocaleDateString()}
              </Text>
              <View style={styles.summaryList}>
                <Text variant="caption">• Templates: {parsedPayload.templates.length}</Text>
                <Text variant="caption">• Rotations: {parsedPayload.rotations.length}</Text>
                <Text variant="caption">• Exceptions: {parsedPayload.exceptions.length}</Text>
                <Text variant="caption">• Shifts: {parsedPayload.shifts.length}</Text>
              </View>
            </View>

            <View style={styles.warningCard}>
              <Icon name="alert-triangle" size={20} tone="danger" />
              <View style={styles.warningTextGroup}>
                <Text variant="bodySmall" weight="semibold" tone="danger">
                  Permanent Overwrite Warning
                </Text>
                <Text variant="caption" tone="danger">
                  Restoring will permanently replace all current shifts, templates, and rotations on
                  this device with the backup data.
                </Text>
              </View>
            </View>

            {restoreError !== null ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} tone="danger" />
                <Text variant="caption" tone="danger" style={styles.errorText}>
                  {restoreError}
                </Text>
              </View>
            ) : null}

            {!confirmedStepOne ? (
              <Button
                label="I Understand, Proceed to Overwrite"
                variant="secondary"
                onPress={() => {
                  haptics.selection();
                  setConfirmedStepOne(true);
                }}
                accessibilityLabel="Confirm overwrite step 1"
              />
            ) : (
              <Button
                label={isRestoring ? 'Restoring...' : 'Overwrite All Data & Restore'}
                variant="danger"
                disabled={isRestoring}
                onPress={() => void handleExecuteRestore()}
                accessibilityLabel="Overwrite all data and restore"
              />
            )}

            <TextButton
              label="Edit Backup JSON"
              onPress={() => {
                haptics.selection();
                setParsedPayload(null);
                setConfirmedStepOne(false);
              }}
              accessibilityLabel="Back to edit JSON"
            />
          </View>
        )}

        <View style={styles.footer}>
          <TextButton
            label="Cancel"
            onPress={handleClose}
            disabled={isRestoring}
            accessibilityLabel="Cancel restore"
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  scroll: {
    maxHeight: '100%',
  },
  container: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  inputSection: {
    gap: theme.spacing.md,
  },
  textInput: {
    minHeight: theme.sizes.backupInputMinHeight,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: theme.sizes.hairline,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.size.caption,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  reviewSection: {
    gap: theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: theme.sizes.hairline,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  summaryList: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  warningCard: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.danger,
    borderWidth: theme.sizes.hairline,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    alignItems: 'flex-start',
  },
  warningTextGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  errorText: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
}));
