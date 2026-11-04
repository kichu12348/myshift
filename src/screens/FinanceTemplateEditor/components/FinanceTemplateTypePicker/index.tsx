import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { FinanceRuleType } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

export interface FinanceTemplateTypePickerProps {
  readonly category: FinanceRuleType;
  readonly onChangeCategory: (category: FinanceRuleType) => void;
}

interface TypeSegment {
  readonly label: string;
  readonly value: FinanceRuleType;
  readonly icon: IconName;
}

const TYPE_SEGMENTS: readonly TypeSegment[] = [
  { label: 'Tax', value: 'tax', icon: 'percent' },
  { label: 'Bill', value: 'expense', icon: 'home' },
  { label: 'Cost', value: 'remittance', icon: 'tag' },
  { label: 'Other', value: 'savings', icon: 'more-horizontal' },
];

export function FinanceTemplateTypePicker({
  category,
  onChangeCategory,
}: FinanceTemplateTypePickerProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const handleSelect = (val: FinanceRuleType): void => {
    haptics.selection();
    onChangeCategory(val);
  };

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" weight="semibold">
        Type
      </Text>
      <View style={styles.segmentContainer}>
        {TYPE_SEGMENTS.map((seg) => {
          const isSelected = category === seg.value;
          return (
            <Pressable
              key={seg.value}
              accessibilityRole="button"
              accessibilityLabel={`${seg.label} type`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelect(seg.value)}
              style={[styles.segment, isSelected && styles.segmentSelected]}
              hitSlop={styles.hitSlop}
            >
              <Icon
                name={seg.icon}
                size={16}
                color={isSelected ? theme.colors.onAccent : theme.colors.textMuted}
              />
              <Text
                variant="caption"
                weight={isSelected ? 'semibold' : 'regular'}
                style={isSelected ? styles.onAccentText : styles.mutedText}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  segmentContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.pillPaddingCompact,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: theme.sizes.typeSegmentHeight,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  segmentSelected: {
    backgroundColor: theme.colors.primary,
  },
  onAccentText: {
    color: theme.colors.onAccent,
  },
  mutedText: {
    color: theme.colors.textMuted,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));

