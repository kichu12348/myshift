import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface SegmentedOption<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly accessibilityLabel?: string;
}

export interface InlineSegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
  readonly showDivider?: boolean;
}

export function InlineSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
  showDivider: isDividerVisible = true,
}: InlineSegmentedControlProps<T>): ReactElement {
  const styles = useStyles();

  const handleSelect = (optionValue: T): void => {
    if (optionValue !== value) {
      haptics.selection();
      onChange(optionValue);
    }
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.track}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const prevIsSelected = index > 0 && options[index - 1]?.value === value;
        const showDivider = index > 0 && isDividerVisible;

        return (
          <View key={option.value} style={styles.optionContainer}>
            {showDivider ? (
              <View
                style={[
                  styles.divider,
                  (prevIsSelected || isSelected) && { backgroundColor: 'transparent' },
                ]}
              />
            ) : null}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              onPress={() => handleSelect(option.value)}
              hitSlop={styles.hitSlop}
              style={[styles.option, isSelected ? styles.optionActive : styles.optionInactive]}
            >
              <Text
                variant="caption"
                weight="semibold"
                tone={isSelected ? 'onAccent' : 'muted'}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: theme.sizes.hairline,
    height: theme.spacing.md,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  option: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: theme.colors.accent,
  },
  optionInactive: {
    backgroundColor: 'transparent',
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
