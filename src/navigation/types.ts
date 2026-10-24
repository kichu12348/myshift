import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { LocalDate, ResolvedShift } from '@/domain';
import type { ROOT_ROUTES, TAB_ROUTES } from '@/constants/routes';

export type TabParamList = {
  readonly [TAB_ROUTES.CALENDAR]: undefined;
  readonly [TAB_ROUTES.STATS]: undefined;
  readonly [TAB_ROUTES.SETTINGS]: undefined;
};

export type RootStackParamList = {
  readonly [ROOT_ROUTES.MAIN_TABS]: NavigatorScreenParams<TabParamList>;
  readonly [ROOT_ROUTES.SHIFT_EDITOR]: {
    readonly date: LocalDate;
    readonly shift?: ResolvedShift | undefined;
  };
  readonly [ROOT_ROUTES.TEMPLATE_LIST]: undefined;
  readonly [ROOT_ROUTES.TEMPLATE_EDITOR]: {
    readonly templateId?: string | undefined;
  };
  readonly [ROOT_ROUTES.ROTATION_WIZARD]:
    | {
        readonly rotationId?: string | undefined;
      }
    | undefined;
  readonly [ROOT_ROUTES.REMINDER_SETTINGS]: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
