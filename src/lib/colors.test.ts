import { describe, expect, it } from 'vitest';
import { accessibleAccent, contrastRatio } from './colors';

describe('accessible custom community accents', () => {
  it('preserves an accessible accent and derives readable ink from black and dark colors', () => {
    expect(accessibleAccent('#B68A4D')).toBe('#B68A4D');
    for (const color of ['#000000', '#171713', '#002200', '#A97468', '#FFFFFF']) {
      const ink = accessibleAccent(color);
      expect(contrastRatio(ink, '#24241E')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink, '#1F2119')).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('uses a valid readable fallback for malformed imported colors', () => {
    expect(contrastRatio(accessibleAccent('invalid'), '#24241E')).toBeGreaterThanOrEqual(4.5);
  });
});
