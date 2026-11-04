import type { ReactElement } from 'react';
import { TextInput, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles, useTheme } from '@/theme';

export interface FinanceTemplateIdentityCardProps {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly icon: string;
  readonly error?: string | undefined;
}

export function FinanceTemplateIdentityCard({
  name,
  onChangeName,
  icon,
  error,
}: FinanceTemplateIdentityCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" weight="semibold">
        Name
      </Text>
      <View style={[styles.inputBox, error !== undefined && styles.inputBoxError]}>
        <Icon name={icon as IconName} size={18} tone="muted" />
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Rent, Income Tax"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={onChangeName}
          accessibilityLabel="Template name"
        />
      </View>
      {error !== undefined ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  inputBox: {
    height: theme.sizes.inputBoxHeight,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inputBoxError: {
    borderColor: theme.colors.error,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
    paddingVertical: 0,
  },
}));

