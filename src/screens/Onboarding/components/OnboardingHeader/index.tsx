import type { ReactElement } from 'react';
import { View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { makeStyles } from '@/theme';

const STEP_ARRAY = [1, 2, 3, 4] as const;

export interface OnboardingHeaderProps {
  readonly step: number;
  readonly canNavigateBack: boolean;
  readonly onPrevStep: () => void;
  readonly onSkip: () => void;
}

export function OnboardingHeader({
  step,
  canNavigateBack,
  onPrevStep,
  onSkip,
}: OnboardingHeaderProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {step > 1 || canNavigateBack ? (
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Go back to previous step"
            onPress={onPrevStep}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={styles.indicatorGroup}>
        <View style={styles.dotRow}>
          {STEP_ARRAY.map((s) => {
            const isActive = s === step;
            const isDone = s < step;
            const dotStyle = isActive
              ? styles.dotActive
              : isDone
                ? styles.dotDone
                : styles.dotUpcoming;

            return <View key={`step-dot-${s}`} style={[styles.dotBase, dotStyle]} />;
          })}
        </View>
        <Text variant="caption" weight="semibold" tone="muted" style={styles.srText}>
          {`Step ${step} of 4`}
        </Text>
      </View>

      <View style={styles.headerRight}>
        <TextButton
          label="Skip"
          tone="muted"
          onPress={onSkip}
          accessibilityLabel="Skip onboarding setup"
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    height: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  indicatorGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dotBase: {
    height: theme.sizes.onboardingStepDotHeight,
    borderRadius: theme.radius.full,
  },
  dotActive: {
    width: theme.sizes.onboardingStepDotActiveWidth,
    backgroundColor: theme.colors.accent,
  },
  dotDone: {
    width: theme.sizes.onboardingStepDotWidth,
    backgroundColor: theme.colors.success,
  },
  dotUpcoming: {
    width: theme.sizes.onboardingStepDotWidth,
    backgroundColor: theme.colors.surfaceRaised,
  },
  srText: {
    fontSize: theme.typography.size.micro,
    lineHeight: theme.typography.lineHeight.micro,
  },
  placeholder: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
  },
}));
