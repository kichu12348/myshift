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

  it('resolves named presets and aliases for both light and dark modes', () => {
    expect(resolveShiftColor('amber', 'light')).toBe('#F59E0B');
    expect(resolveShiftColor('amber', 'dark')).toBe('#D9A441');

    expect(resolveShiftColor('blue', 'light')).toBe('#5B7DB1');
    expect(resolveShiftColor('blue', 'dark')).toBe('#7F9CC8');

    expect(resolveShiftColor('emerald', 'light')).toBe('#10B981');
    expect(resolveShiftColor('emerald', 'dark')).toBe('#6FB394');

    expect(resolveShiftColor('slate', 'light')).toBe('#94A3B8');
    expect(resolveShiftColor('slate', 'dark')).toBe('#8D98A8');
  });

  it('normalizes hex strings without leading hash', () => {
    expect(resolveShiftColor('10B981', 'light')).toBe('#10B981');
    expect(resolveShiftColor('10B981', 'dark')).toBe('#6FB394');
  });

  it('falls back safely when color string is empty or invalid', () => {
    expect(resolveShiftColor('', 'light')).toBe('#F59E0B');
    expect(resolveShiftColor('', 'dark')).toBe('#D9A441');
  });
});
