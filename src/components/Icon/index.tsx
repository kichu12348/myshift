import type { ReactElement } from 'react';
import { Feather, type FeatherIconName } from '@react-native-vector-icons/feather';
import type { TextTone } from '@/components/Text';
import { useTheme } from '@/theme';

export type IconSize = 16 | 20 | 24;
export type IconName = FeatherIconName;

export interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  readonly tone?: TextTone;
  readonly accessibilityLabel?: string;
}

export function Icon({
  name,
  size = 20,
  tone = 'text',
  accessibilityLabel,
}: IconProps): ReactElement {
  const { theme } = useTheme();

  const color =
    tone === 'muted'
      ? theme.colors.textMuted
      : tone === 'accent'
        ? theme.colors.accent
        : tone === 'danger'
          ? theme.colors.danger
          : tone === 'onAccent'
            ? theme.colors.onAccent
            : theme.colors.text;

  const isAccessible = accessibilityLabel !== undefined && accessibilityLabel.length > 0;

  return (
    <Feather
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={isAccessible ? 'image' : undefined}
      accessibilityElementsHidden={!isAccessible}
      importantForAccessibility={isAccessible ? 'yes' : 'no-hide-descendants'}
      aria-hidden={!isAccessible}
    />
  );
}
