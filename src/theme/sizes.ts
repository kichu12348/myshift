import { StyleSheet } from 'react-native';

export interface SizeTokens {
  readonly touchTarget: number;
  readonly dayMarker: number;
  readonly selectedBorder: number;
  readonly hairline: number;
  readonly pillBarWidth: number;
  readonly shiftChip: number;
  readonly inputMinHeight: number;
  readonly backupInputMinHeight: number;
  readonly slotCardWidth: number;
  readonly sheetListMaxHeight: number;
  readonly iconBadge: number;
  readonly switchTrackWidth: number;
  readonly switchTrackHeight: number;
  readonly switchThumbSize: number;
  readonly settingsRowMinHeight: number;
  readonly settingsBadgeSize: number;
}

export const sizes: SizeTokens = {
  touchTarget: 44,
  dayMarker: 28,
  selectedBorder: 2,
  hairline: StyleSheet.hairlineWidth,
  pillBarWidth: 3,
  shiftChip: 20,
  inputMinHeight: 88,
  backupInputMinHeight: 140,
  slotCardWidth: 68,
  sheetListMaxHeight: 260,
  iconBadge: 44,
  switchTrackWidth: 52,
  switchTrackHeight: 30,
  switchThumbSize: 22,
  settingsRowMinHeight: 60,
  settingsBadgeSize: 40,
};
