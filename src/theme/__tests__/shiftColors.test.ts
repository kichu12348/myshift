import { resolveShiftColor, shiftColorPresets } from '@/theme';

describe('theme/resolveShiftColor', () => {
  it('returns same color in light mode for preset colors', () => {
    const amberPreset = shiftColorPresets.find((p) => p.name === 'Amber');
    expect(amberPreset).toBeDefined();
    if (amberPreset) {
      expect(resolveShiftColor(amberPreset.light, 'light')).toBe(amberPreset.light);
    }
  });

  it('maps preset light color to soft dark color in dark mode', () => {
    const steelBluePreset = shiftColorPresets.find((p) => p.name === 'Steel blue');
    expect(steelBluePreset).toBeDefined();
    if (steelBluePreset) {
      expect(resolveShiftColor(steelBluePreset.light, 'dark')).toBe(steelBluePreset.dark);
    }
  });

  it('handles case-insensitivity when matching preset colors', () => {
    const steelBluePreset = shiftColorPresets.find((p) => p.name === 'Steel blue');
    expect(steelBluePreset).toBeDefined();
    if (steelBluePreset) {
      expect(resolveShiftColor(steelBluePreset.light.toLowerCase(), 'dark')).toBe(
        steelBluePreset.dark,
      );
      expect(resolveShiftColor(steelBluePreset.light.toUpperCase(), 'dark')).toBe(
        steelBluePreset.dark,
      );
    }
  });

  it('leaves custom colors unchanged in both light and dark mode', () => {
    const customColor = '#123456';
    expect(resolveShiftColor(customColor, 'light')).toBe(customColor);
    expect(resolveShiftColor(customColor, 'dark')).toBe(customColor);
  });
});
