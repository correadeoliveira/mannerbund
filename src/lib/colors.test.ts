import { describe, expect, it } from 'vitest';
import { accessibleAccent, contrastRatio } from './colors';

describe('accessible custom community accents', () => {
  it('preserves an accessible accent and derives readable ink from black and dark colors', () => {
    expect(accessibleAccent('#00DADB')).toBe('#00DADB');
    for (const color of ['#000000', '#011A21', '#01313F', '#C4007E', '#FFFFFF']) {
      const ink = accessibleAccent(color);
      expect(contrastRatio(ink, '#01313F')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink, '#013B4A')).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('uses a valid readable fallback for malformed imported colors', () => {
    expect(contrastRatio(accessibleAccent('invalid'), '#01313F')).toBeGreaterThanOrEqual(4.5);
  });
});
