export type FontWeight = '400' | '600';
export type TabularNumsVariant = ['tabular-nums'];

export interface TypographyTokens {
  readonly size: {
    readonly caption: number;
    readonly bodySmall: number;
    readonly body: number;
    readonly title: number;
    readonly display: number;
  };
  readonly weight: {
    readonly regular: FontWeight;
    readonly semibold: FontWeight;
  };
  readonly fontVariant: {
    readonly tabularNums: TabularNumsVariant;
  };
}

export const typography: TypographyTokens = {
  size: {
    caption: 12,
    bodySmall: 14,
    body: 16,
    title: 20,
    display: 28,
  },
  weight: {
    regular: '400',
    semibold: '600',
  },
  fontVariant: {
    tabularNums: ['tabular-nums'],
  },
};
