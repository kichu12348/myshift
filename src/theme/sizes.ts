import { StyleSheet } from 'react-native';

export interface SizeTokens {
  readonly touchTarget: number;
  readonly dayMarker: number;
  readonly selectedBorder: number;
  readonly hairline: number;
}

export const sizes: SizeTokens = {
  touchTarget: 44,
  dayMarker: 28,
  selectedBorder: 2,
  hairline: StyleSheet.hairlineWidth,
};
