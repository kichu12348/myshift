import { StyleSheet } from 'react-native';

export interface SizeTokens {
  readonly touchTarget: number;
  readonly dayMarker: number;
  readonly selectedBorder: number;
  readonly hairline: number;
  readonly size1: number;
  readonly pillBarWidth: number;
  readonly shiftChip: number;
  readonly inputMinHeight: number;
  readonly backupInputMinHeight: number;
  readonly slotCardWidth: number;
  readonly sheetListMaxHeight: number;
  readonly sheetListExpandedMaxHeight: number;
  readonly iconBadge: number;
  readonly iconBadgeMedium: number;
  readonly iconBadgeSmall: number;
  readonly templateDot: number;
  readonly segmentedControlHeight: number;
  readonly segmentedTrackPadding: number;
  readonly accessoryMaxWidth: number;
  readonly rowTextMinWidth: number;
  readonly switchTrackWidth: number;
  readonly switchTrackHeight: number;
  readonly switchThumbSize: number;
  readonly settingsRowMinHeight: number;
  readonly settingsBadgeSize: number;
  readonly tabBarMinHeight: number;
  readonly tabItemMinHeight: number;
  readonly tabItemGap: number;
  readonly tabBarHeight: number;
  readonly gridGap: number;
  readonly cellPadding: number;
  readonly pillPaddingCompact: number;
  readonly pillGapCompact: number;
  readonly compactPillHeight: number;
  readonly compactIconSize: 10;
  readonly iconSizeSmall: 16;
  readonly iconSizeMedium: 22;
  readonly dayBadgeDot: number;
  readonly dayNumberCircle: number;
  readonly underlineHeight: number;
  readonly sheetHandleWidth: number;
  readonly sheetHandleHeight: number;
  readonly sheetCloseThreshold: number;
  readonly reminderChipHeight: number;
  readonly shiftBlockGap: number;
  readonly shiftBlockTopHeight: number;
  readonly shiftBlockBottomHeight: number;
  readonly shiftBlockRadius: number;
  readonly fabSize: number;
  readonly headerPillHeight: number;
  readonly shiftBlockPaddingVertical: number;
  readonly shiftBlockMarginBottom: number;
  readonly fabIconSize: 20;
  readonly progressBarHeight: number;
  readonly statCardMinHeight: number;
}

export const sizes: SizeTokens = {
  touchTarget: 44,
  dayMarker: 28,
  selectedBorder: 2,
  size1: 1,
  hairline: StyleSheet.hairlineWidth,
  pillBarWidth: 3,
  shiftChip: 20,
  inputMinHeight: 88,
  backupInputMinHeight: 140,
  slotCardWidth: 68,
  sheetListMaxHeight: 260,
  sheetListExpandedMaxHeight: 460,
  iconBadge: 42,
  iconBadgeMedium: 44,
  iconBadgeSmall: 36,
  templateDot: 12,
  segmentedControlHeight: 34,
  segmentedTrackPadding: 2,
  accessoryMaxWidth: 140,
  rowTextMinWidth: 110,
  switchTrackWidth: 52,
  switchTrackHeight: 30,
  switchThumbSize: 22,
  settingsRowMinHeight: 60,
  settingsBadgeSize: 40,
  tabBarMinHeight: 56,
  tabItemMinHeight: 48,
  tabItemGap: 2,
  tabBarHeight: 52,
  gridGap: 2,
  cellPadding: 2,
  pillPaddingCompact: 3,
  pillGapCompact: 2,
  compactPillHeight: 18,
  compactIconSize: 10,
  iconSizeSmall: 16,
  iconSizeMedium: 22,
  dayBadgeDot: 5,
  dayNumberCircle: 22,
  underlineHeight: 2,
  sheetHandleWidth: 36,
  sheetHandleHeight: 4,
  sheetCloseThreshold: 75,
  reminderChipHeight: 24,
  shiftBlockGap: 1,
  shiftBlockTopHeight: 20,
  shiftBlockBottomHeight: 16,
  shiftBlockRadius: 5,
  fabSize: 52,
  headerPillHeight: 36,
  shiftBlockPaddingVertical: 3,
  shiftBlockMarginBottom: 2,
  fabIconSize: 20,
  progressBarHeight: 6,
  statCardMinHeight: 84,
};
