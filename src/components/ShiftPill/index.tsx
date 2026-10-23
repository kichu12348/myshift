import type { ReactElement } from 'react';
import { View } from 'react-native';
import {
  DEFAULT_SHIFT_ICON,
  isShiftIconName,
} from '@/constants';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import {
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';

export interface ShiftPillProps {
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isOff: boolean;
  readonly isOvernight?: boolean;
}

/**
 * Visual pill representing a single shift assignment.
 * Renders in compact form for calendar cells and lists.
 */
export function ShiftPill({
  name,
  icon,
  color,
  isOff,
  isOvernight = false,
}: ShiftPillProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const iconName = isShiftIconName(icon) ? icon : DEFAULT_SHIFT_ICON;

  const resolvedColor = resolveShiftColor(color, theme.mode);
  const workingShiftStyle = {
    backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
    borderLeftWidth: theme.sizes.pillBarWidth,
    borderLeftColor: resolvedColor,
  };

  const accessibilityLabel = isOff
    ? `${name}, Off`
    : isOvernight
      ? `${name}, overnight`
      : name;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        isOff ? styles.offContainer : workingShiftStyle,
      ]}
    >
      <Icon
        name={iconName}
        size={16}
        tone={isOff ? 'muted' : 'text'}
      />
      <Text
        variant="caption"
        tone={isOff ? 'muted' : 'text'}
        numberOfLines={1}
        style={styles.nameText}
      >
        {name}
      </Text>
      {!isOff && isOvernight ? (
        <Text
          variant="caption"
          tone="muted"
          tabularNums
          style={styles.overnightMarker}
        >
          +1
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    overflow: 'hidden',
  },
  offContainer: {
    backgroundColor: theme.colors.surface,
  },
  nameText: {
    flex: 1,
  },
  overnightMarker: {
    flexShrink: 0,
  },
}));
