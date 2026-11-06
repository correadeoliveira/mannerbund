const FALLBACK = '#B68A4D';
function rgb(hex: string): number[] {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : FALLBACK;
  return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
}
function luminance(hex: string): number {
  const channels = rgb(hex).map((n) => {
    const s = n / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
/** Keep the stored brand color intact; derive an accessible ink for dark surfaces. */
export function accessibleAccent(color: string, background = '#24241E'): string {
  const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : FALLBACK;
  if (contrastRatio(safe, background) >= 4.5) return safe;
  const source = rgb(safe),
    target = rgb('#E9E2D3');
  for (let step = 1; step <= 100; step++) {
    const value =
      '#' +
      source
        .map((v, i) =>
          Math.round(v + ((target[i] - v) * step) / 100)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    if (contrastRatio(value, background) >= 4.5) return value;
  }
  return '#E9E2D3';
}
