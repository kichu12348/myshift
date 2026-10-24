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
};
