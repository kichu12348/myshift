export const ROOT_ROUTES = {
  MAIN_TABS: 'MainTabs',
} as const;

export const TAB_ROUTES = {
  CALENDAR: 'Calendar',
  STATS: 'Stats',
  SETTINGS: 'Settings',
} as const;

export type RootRouteName = (typeof ROOT_ROUTES)[keyof typeof ROOT_ROUTES];
export type TabRouteName = (typeof TAB_ROUTES)[keyof typeof TAB_ROUTES];
