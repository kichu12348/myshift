import { useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { makeStyles, useTheme } from '@/theme';

export interface GrossPayEditModalProps {
  readonly visible: boolean;
  readonly currentGross: number;
  readonly isManualOverride: boolean;
  readonly autoGrossPay: number;
  readonly onSaveOverride: (amount: number) => void;
  readonly onSyncFromShifts: () => void;
  readonly onNavigateTemplates?: (() => void) | undefined;
  readonly onClose: () => void;
}

export function GrossPayEditModal({
  visible,
  currentGross,
  isManualOverride,
  autoGrossPay,
  onSaveOverride,
  onSyncFromShifts,
  onNavigateTemplates,
  onClose,
}: GrossPayEditModalProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();
  const [value, setValue] = useState(() => (currentGross > 0 ? String(currentGross) : ''));

  const handleSave = (): void => {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onSaveOverride(parsed);
      onClose();
    }
  };

  const handleSync = (): void => {
    onSyncFromShifts();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Dismiss modal" />
        <View style={styles.container}>
          <Text variant="title" weight="semibold">
            Edit Gross Earnings
          </Text>
          <Text variant="caption" tone="muted">
            Set a manual gross pay amount or sync automatically from logged shifts.
          </Text>

          <View style={styles.inputContainer}>
            <Text variant="body" weight="semibold" tone="muted">
              $
            </Text>
            <TextInput
              style={styles.input}
              placeholder={String(autoGrossPay)}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
              accessibilityLabel="Gross earnings amount"
            />
          </View>

          <View style={styles.buttonGroup}>
            <Button label="Save Override" variant="primary" onPress={handleSave} />
            {isManualOverride ? (
              <Button label="Sync from Shifts" variant="secondary" onPress={handleSync} />
            ) : null}
            {onNavigateTemplates !== undefined ? (
              <TextButton
                label="Adjust Hourly Rates in Templates"
                tone="accent"
                onPress={() => {
                  onClose();
                  onNavigateTemplates();
                }}
              />
            ) : null}
            <TextButton label="Cancel" tone="muted" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dismissArea: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxWidth: theme.sizes.timeModalMaxWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    height: theme.sizes.touchTarget,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.semibold,
  },
  buttonGroup: {
    gap: theme.spacing.xs,
  },
}));
