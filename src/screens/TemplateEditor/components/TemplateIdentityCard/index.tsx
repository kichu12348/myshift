import type { ReactElement } from 'react';
import { TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { makeStyles, useTheme } from '@/theme';

export interface TemplateIdentityCardProps {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly nameError?: string | undefined;
  readonly isOff: boolean;
  readonly onToggleOff: (isOff: boolean) => void;
}

export function TemplateIdentityCard({
  name,
  onChangeName,
  nameError,
  isOff,
  onToggleOff,
}: TemplateIdentityCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        IDENTITY
      </Text>

      <View style={styles.card}>
        <View style={styles.nameRow}>
          <Text variant="body" weight="semibold" style={styles.label}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="e.g. Day, Night, Early"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            accessibilityLabel="Template name"
          />
        </View>

        {nameError !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {nameError}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.offRow}>
          <View style={styles.offLeft}>
            <View style={styles.coffeeBadge}>
              <Icon name="coffee" size={20} tone="accent" />
            </View>
            <View style={styles.offMeta}>
              <Text variant="body" weight="semibold">
                Day Off / Non-Working
              </Text>
              <Text variant="caption" tone="muted">
                Mark as an all-day rest or leave template
              </Text>
            </View>
          </View>

          <Switch
            value={isOff}
            onValueChange={onToggleOff}
            accessibilityLabel="Off shift template toggle"
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    gap: theme.spacing.sm,
  },
  label: {
    minWidth: theme.sizes.rowTextMinWidth,
  },
  input: {
    flex: 1,
    // minHeight: theme.sizes.touchTarget,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: theme.sizes.size1,
    borderRadius: theme.radius.md,
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  offRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    gap: theme.spacing.md,
  },
  offLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  coffeeBadge: {
    width: theme.sizes.iconBadgeSmall,
    height: theme.sizes.iconBadgeSmall,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offMeta: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}));
