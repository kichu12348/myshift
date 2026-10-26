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
  readonly iconBadge: number;
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
  iconBadge: 42,
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
};
