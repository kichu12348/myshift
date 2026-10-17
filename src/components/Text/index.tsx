import type { ReactElement } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { makeStyles } from '@/theme';

export type TextVariant = 'caption' | 'bodySmall' | 'body' | 'title' | 'display';
export type TextTone = 'text' | 'muted' | 'accent' | 'danger' | 'onAccent';
export type TextWeight = 'regular' | 'semibold';

export interface TextProps extends RNTextProps {
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly weight?: TextWeight;
  readonly tabularNums?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'text',
  weight = 'regular',
  tabularNums = false,
  style,
  allowFontScaling = true,
  ...restProps
}: TextProps): ReactElement {
  const styles = useStyles();

  const variantStyle =
    variant === 'caption'
      ? styles.variantCaption
      : variant === 'bodySmall'
        ? styles.variantBodySmall
        : variant === 'title'
          ? styles.variantTitle
          : variant === 'display'
            ? styles.variantDisplay
            : styles.variantBody;

  const toneStyle =
    tone === 'muted'
      ? styles.toneMuted
      : tone === 'accent'
        ? styles.toneAccent
        : tone === 'danger'
          ? styles.toneDanger
          : tone === 'onAccent'
            ? styles.toneOnAccent
            : styles.toneText;

  const weightStyle = weight === 'semibold' ? styles.weightSemibold : styles.weightRegular;

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      style={[
        styles.base,
        variantStyle,
        toneStyle,
        weightStyle,
        tabularNums && styles.tabularNums,
        style,
      ]}
      {...restProps}
    />
  );
}

const useStyles = makeStyles((theme) => ({
  base: {
    fontFamily: undefined,
  },
  // Variants
  variantCaption: {
    fontSize: theme.typography.size.caption,
  },
  variantBodySmall: {
    fontSize: theme.typography.size.bodySmall,
  },
  variantBody: {
    fontSize: theme.typography.size.body,
  },
  variantTitle: {
    fontSize: theme.typography.size.title,
  },
  variantDisplay: {
    fontSize: theme.typography.size.display,
  },
  // Tones
  toneText: {
    color: theme.colors.text,
  },
  toneMuted: {
    color: theme.colors.textMuted,
  },
  toneAccent: {
    color: theme.colors.accent,
  },
  toneDanger: {
    color: theme.colors.danger,
  },
  toneOnAccent: {
    color: theme.colors.onAccent,
  },
  // Weights
  weightRegular: {
    fontWeight: theme.typography.weight.regular,
  },
  weightSemibold: {
    fontWeight: theme.typography.weight.semibold,
  },
  // Tabular Numerals
  tabularNums: {
    fontVariant: theme.typography.fontVariant.tabularNums,
  },
}));
