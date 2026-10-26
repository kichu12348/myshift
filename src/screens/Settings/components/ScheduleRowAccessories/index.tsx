import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import {
  selectRotations,
  selectTemplates,
  useRotationStore,
  useTemplateStore,
} from '@/store';
import { makeStyles } from '@/theme';

export function TemplatePreviewAccessory(): ReactElement {
  const templates = useTemplateStore(selectTemplates);
  const styles = useStyles();

  const activeTemplates = templates.filter((t) => t.archivedAt === null);

  return (
    <View style={styles.templatePreviewContainer}>
      <Text variant="bodySmall" tone="muted" tabularNums>
        {`${activeTemplates.length} active`}
      </Text>
    </View>
  );
}

export function RotationPreviewAccessory(): ReactElement {
  const rotations = useRotationStore(selectRotations);
  const templates = useTemplateStore(selectTemplates);
  const styles = useStyles();

  const activeRotation = rotations.find((r) => r.active) ?? rotations[0];

  const summary = useMemo((): string => {
    if (!activeRotation || !activeRotation.active || activeRotation.pattern.length === 0) {
      return 'None';
    }

    return `${activeRotation.pattern.length} shifts`;
  }, [activeRotation, templates]);

  return (
    <Text
      variant="bodySmall"
      tone="muted"
      numberOfLines={1}
      ellipsizeMode="tail"
      style={styles.rotationSummary}
    >
      {summary}
    </Text>
  );
}

const useStyles = makeStyles((theme) => ({
  templatePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  templateDot: {
    width: theme.sizes.templateDot,
    height: theme.sizes.templateDot,
    borderRadius: theme.radius.full,
  },
  rotationSummary: {
    maxWidth: theme.sizes.accessoryMaxWidth,
  },
  reminderBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  reminderBadge: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
}));
