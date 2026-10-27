import type { ReactElement } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Feather, type FeatherIconName } from '@react-native-vector-icons/feather';
import type { TextTone } from '@/components/Text';
import { useTheme } from '@/theme';

export type IconSize = 10 | 12 | 16 | 20 | 22 | 24;
export type IconName = FeatherIconName;

export interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize | undefined;
  readonly tone?: TextTone | undefined;
  readonly color?: string | undefined;
  readonly style?: StyleProp<TextStyle> | undefined;
  readonly accessibilityLabel?: string | undefined;
}

export function Icon({
  name,
  size = 20,
  tone = 'text',
  color: explicitColor,
  style,
  accessibilityLabel,
}: IconProps): ReactElement {
  const { theme } = useTheme();

  const color =
    explicitColor ??
    (tone === 'muted'
      ? theme.colors.textMuted
      : tone === 'accent'
        ? theme.colors.accent
        : tone === 'danger'
          ? theme.colors.danger
          : tone === 'onAccent'
            ? theme.colors.onAccent
            : tone === 'warning'
              ? theme.colors.warning
              : tone === 'secondary'
                ? theme.colors.secondary
                : theme.colors.text);

  const isAccessible = accessibilityLabel !== undefined && accessibilityLabel.length > 0;

  return (
    <Feather
      name={name}
      size={size}
      color={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={isAccessible ? 'image' : undefined}
      accessibilityElementsHidden={!isAccessible}
      importantForAccessibility={isAccessible ? 'yes' : 'no-hide-descendants'}
      aria-hidden={!isAccessible}
    />
  );
}
