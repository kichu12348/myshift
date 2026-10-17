import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export function StatsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text variant="title">Stats</Text>
    </View>
  );
}

export default StatsScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
}));
