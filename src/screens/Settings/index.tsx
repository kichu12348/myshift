import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import { makeStyles } from '@/theme';

export function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text variant="title" style={styles.title}>
        Settings
      </Text>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD)}
          accessibilityRole="button"
          accessibilityLabel="Shift rotations"
        >
          <View style={styles.rowLeft}>
            <Icon name="repeat" size={20} tone="muted" />
            <Text variant="body" tone="text" style={styles.rowLabel}>
              Shift Rotations
            </Text>
          </View>
          <Icon name="chevron-right" size={20} tone="muted" />
        </Pressable>

        <View style={styles.rowDivider} />

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST)}
          accessibilityRole="button"
          accessibilityLabel="Shift templates"
        >
          <View style={styles.rowLeft}>
            <Icon name="layers" size={20} tone="muted" />
            <Text variant="body" tone="text" style={styles.rowLabel}>
              Shift Templates
            </Text>
          </View>
          <Icon name="chevron-right" size={20} tone="muted" />
        </Pressable>
      </View>
    </View>
  );
}

export default SettingsScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    marginVertical: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowLabel: {
    fontSize: theme.typography.size.body,
  },
  rowDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },
}));
