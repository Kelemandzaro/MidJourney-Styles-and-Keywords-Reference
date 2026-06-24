// Scale factor: PostScript points → CSS pixels (96 DPI screen vs 72 DPI PostScript)
export const PT_TO_PX = 96 / 72; // 1.333…

export const ptToPx = (pt: number): number => pt * PT_TO_PX;

// Y-flip: DOM origin is top-left (Y down), PDF origin is bottom-left (Y up).
// pageHeight and elementHeight are both in points.
export const toPdfY = (domY: number, elementHeight: number, pageHeight: number): number =>
  pageHeight - domY - elementHeight;

// Parse a CSS hex color string to 0–1 RGB components.
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
};

// SVG path for a rounded rectangle in top-left-origin (SVG/DOM) coordinate space.
// pdf-lib's drawSvgPath flips Y internally (scale 1,-1), so pass DOM coords directly.
export const svgRoundedRect = (w: number, h: number, r: number): string => {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr <= 0) return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  return [
    `M ${cr} 0`,
    `L ${w - cr} 0`,
    `Q ${w} 0 ${w} ${cr}`,
    `L ${w} ${h - cr}`,
    `Q ${w} ${h} ${w - cr} ${h}`,
    `L ${cr} ${h}`,
    `Q 0 ${h} 0 ${h - cr}`,
    `L 0 ${cr}`,
    `Q 0 0 ${cr} 0`,
    'Z',
  ].join(' ');
};
