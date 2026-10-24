import { useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { SHIFT_SYSTEM_PRESETS, type ShiftSystemPresetId } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { haptics } from '@/services';
import { useRotationStore, useSettingsStore, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';
import { StepAppearance } from './components/StepAppearance';
import { StepReminders } from './components/StepReminders';
import { StepScheduleType } from './components/StepScheduleType';
import { StepShiftPreset } from './components/StepShiftPreset';
import type { SchedulePatternType } from './types';

export function OnboardingScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = useToday();

  const [step, setStep] = useState<number>(1);
  const [presetId, setPresetId] = useState<ShiftSystemPresetId>('12h-healthcare');
  const [scheduleType, setScheduleType] = useState<SchedulePatternType>('variable');
  const [selectedRotationOptionId, setSelectedRotationOptionId] = useState<string | null>(
    SHIFT_SYSTEM_PRESETS[0]?.rotationOptions[0]?.id ?? null,
  );
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const canNavigateBack = navigation.canGoBack();

  const handleSelectPreset = (newPresetId: ShiftSystemPresetId): void => {
    haptics.selection();
    setPresetId(newPresetId);
    const newPreset = SHIFT_SYSTEM_PRESETS.find((p) => p.id === newPresetId);
    if (newPreset !== undefined && newPreset.rotationOptions.length > 0) {
      setSelectedRotationOptionId(newPreset.rotationOptions[0]?.id ?? null);
    }
  };

  const handleSelectScheduleType = (newType: SchedulePatternType): void => {
    haptics.selection();
    setScheduleType(newType);
  };

  const handleSelectRotationOption = (optionId: string): void => {
    haptics.selection();
    setSelectedRotationOptionId(optionId);
  };

  const handleNextStep = (): void => {
    haptics.selection();
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = (): void => {
    haptics.selection();
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else if (canNavigateBack) {
      navigation.goBack();
    }
  };

  const handleSkip = async (): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({ onboardingCompleted: true });
    navigation.reset({ index: 0, routes: [{ name: ROOT_ROUTES.MAIN_TABS }] });
  };

  const handleFinish = async (): Promise<void> => {
    if (isFinishing) {
      return;
    }
    setIsFinishing(true);

    try {
      // 1. Apply selected shift templates preset
      await useTemplateStore.getState().applyTemplatePreset(presetId);

      // 2. If rotating schedule is chosen, create starter rotation anchored to today
      const currentPreset =
        SHIFT_SYSTEM_PRESETS.find((p) => p.id === presetId) ?? SHIFT_SYSTEM_PRESETS[0];
      const rotationOption = currentPreset?.rotationOptions.find(
        (opt) => opt.id === selectedRotationOptionId,
      );

      const isCustomRotation = scheduleType === 'rotation' && rotationOption?.isCustom === true;

      if (
        scheduleType === 'rotation' &&
        rotationOption !== undefined &&
        !rotationOption.isCustom &&
        rotationOption.pattern.length > 0
      ) {
        await useRotationStore.getState().createRotation({
          name: rotationOption.name,
          anchorDate: today,
          pattern: rotationOption.pattern,
          startDate: today,
          endDate: null,
          active: true,
        });
      }

      // 3. Mark onboarding completed in settings
      await useSettingsStore.getState().updateSettings({ onboardingCompleted: true });
      haptics.success();

      // 4. Transition to MainTabs (and open RotationWizard if custom rotation was chosen)
      navigation.reset({ index: 0, routes: [{ name: ROOT_ROUTES.MAIN_TABS }] });
      if (isCustomRotation) {
        navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD);
      }
    } finally {
      setIsFinishing(false);
    }
  };

  const progressPercentage = `${(step / 4) * 100}%` as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {step > 1 || canNavigateBack ? (
            <IconButton
              iconName="arrow-left"
              accessibilityLabel="Go back to previous step"
              onPress={handlePrevStep}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <View style={styles.stepIndicator}>
          <Text variant="caption" weight="semibold" tone="muted">
            {`Step ${step} of 4`}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TextButton
            label="Skip"
            tone="muted"
            onPress={() => void handleSkip()}
            accessibilityLabel="Skip onboarding setup"
          />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: progressPercentage }]} />
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <StepShiftPreset selectedPresetId={presetId} onSelectPreset={handleSelectPreset} />
        ) : null}

        {step === 2 ? (
          <StepScheduleType
            presetId={presetId}
            scheduleType={scheduleType}
            onSelectScheduleType={handleSelectScheduleType}
            selectedRotationOptionId={selectedRotationOptionId}
            onSelectRotationOptionId={handleSelectRotationOption}
          />
        ) : null}

        {step === 3 ? <StepAppearance /> : null}

        {step === 4 ? <StepReminders onFinish={handleFinish} isSubmitting={isFinishing} /> : null}
      </ScrollView>

      {/* Step Navigation Bar for Steps 1-3 */}
      {step < 4 ? (
        <View style={styles.bottomBar}>
          <Button
            label="Continue"
            variant="primary"
            onPress={handleNextStep}
            accessibilityLabel="Continue to next step"
          />
        </View>
      ) : null}
    </View>
  );
}

export default OnboardingScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  headerLeft: {
    width: theme.sizes.touchTarget,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: theme.sizes.touchTarget,
    alignItems: 'flex-end',
  },
  stepIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
}));
