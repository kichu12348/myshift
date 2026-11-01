import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import type { StatsScope } from '@/domain';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface StatsScopeToggleProps {
  readonly scope: StatsScope;
  readonly onChange: (scope: StatsScope) => void;
}

interface ScopeOption {
  readonly value: StatsScope;
  readonly label: string;
  readonly accessibilityLabel: string;
}

const SCOPE_OPTIONS: ReadonlyArray<ScopeOption> = [
  {
    value: 'to-date',
    label: 'Up to Now',
    accessibilityLabel: 'Calculate stats up to now',
  },
  {
    value: 'full-month',
    label: 'Full Month',
    accessibilityLabel: 'Calculate stats for full month',
  },
];

/**
 * Segmented control toggle switching stats scope between 'Up to Now' (Month to Date)
 * and 'Full Month'.
 */
export function StatsScopeToggle({ scope, onChange }: StatsScopeToggleProps): ReactElement {
  const styles = useStyles();

  const handleSelect = (nextScope: StatsScope): void => {
    if (nextScope !== scope) {
      haptics.selection();
      onChange(nextScope);
    }
  };

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Statistics scope" style={styles.track}>
      {SCOPE_OPTIONS.map((option) => {
        const isSelected = option.value === scope;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.accessibilityLabel}
            onPress={() => handleSelect(option.value)}
            hitSlop={styles.hitSlop}
            style={[styles.segment, isSelected ? styles.segmentActive : styles.segmentInactive]}
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
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.segmentedTrackPadding,
  },
  segment: {
    flex: 1,
    minHeight: theme.sizes.segmentedControlHeight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: theme.colors.accent,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
