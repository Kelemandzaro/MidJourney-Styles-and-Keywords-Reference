import { PDFDocument, PDFName, PDFFont, TextAlignment, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { DocumentSchema, DocElement, FieldElement, ImageElement, FontRef } from '../schema/types';
import { toPdfY, hexToRgb, svgRoundedRect } from './utils';

// Vite resolves these to hashed asset URLs at build time.
// Using woff (not woff2) for maximum fontkit compatibility.
import interRegularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import interBoldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import poppinsRegularUrl from '@fontsource/poppins/files/poppins-latin-400-normal.woff?url';
import poppinsBoldUrl from '@fontsource/poppins/files/poppins-latin-700-normal.woff?url';

// Matches the DOM renderer's CSS line-height on text elements.
const LINE_HEIGHT = 1.2;

// ── Helpers ──────────────────────────────────────────────────────────────────

const toRgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r, g, b);
};

async function fetchFontBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url} (${res.status})`);
  return res.arrayBuffer();
}

type FontMap = {
  bodyRegular: PDFFont;
  bodyBold: PDFFont;
  headingRegular: PDFFont;
  headingBold: PDFFont;
};

function resolveFont(fontRef: FontRef | undefined, weight: 'normal' | 'bold' | undefined, fonts: FontMap): PDFFont {
  if (fontRef === 'heading') {
    return weight === 'bold' ? fonts.headingBold : fonts.headingRegular;
  }
  return weight === 'bold' ? fonts.bodyBold : fonts.bodyRegular;
}

// ── Static-layer draw functions ───────────────────────────────────────────────

function drawRoundedRect(
  page: ReturnType<PDFDocument['addPage']>,
  el: { x: number; y: number; w: number; h: number; radius?: number; fill?: string; stroke?: string; strokeWidth?: number },
  pageH: number,
) {
  const r = el.radius ?? 0;
  // drawSvgPath internally applies scale(1, -1), so we pass DOM-space coordinates
  // with y set to the TOP of the element in PDF space: pageH - domY.
  page.drawSvgPath(svgRoundedRect(el.w, el.h, r), {
    x: el.x,
    y: pageH - el.y, // top of element in PDF Y-up space
    color: el.fill ? toRgb(el.fill) : undefined,
    borderColor: el.stroke ? toRgb(el.stroke) : undefined,
    borderWidth: el.strokeWidth ?? (el.stroke ? 0.75 : 0),
  });
}

function drawLine(
  page: ReturnType<PDFDocument['addPage']>,
  el: { x1: number; y1: number; x2: number; y2: number; stroke: string; width: number },
  pageH: number,
) {
  const color = toRgb(el.stroke);
  if (el.x1 === el.x2) {
    // Vertical: the DOM renders the stroke extending RIGHT from x1.
    const centerX = el.x1 + el.width / 2;
    page.drawLine({
      start: { x: centerX, y: pageH - el.y1 },
      end: { x: centerX, y: pageH - el.y2 },
      thickness: el.width,
      color,
    });
  } else {
    // Horizontal (or general): the DOM renders the stroke extending DOWN from y1.
    page.drawLine({
      start: { x: el.x1, y: pageH - el.y1 - el.width / 2 },
      end: { x: el.x2, y: pageH - el.y2 - el.width / 2 },
      thickness: el.width,
      color,
    });
  }
}

// Word-wrap content to fit maxW, honoring explicit newlines — mirrors how the
// DOM's block layout wraps the same text at the same width.
function wrapLines(content: string, font: PDFFont, size: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of content.split('\n')) {
    if (para === '') { lines.push(''); continue; }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      let fits = true;
      try {
        fits = font.widthOfTextAtSize(candidate, size) <= maxW;
      } catch {
        fits = true; // unmeasurable glyphs — don't wrap
      }
      if (fits || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

function measureWidth(font: PDFFont, text: string, size: number): number | null {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return null;
  }
}

function drawText(
  page: ReturnType<PDFDocument['addPage']>,
  el: { x: number; y: number; w: number; h: number; content: string; size: number; color: string; fontRef?: FontRef; weight?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right' },
  fonts: FontMap,
  pageH: number,
) {
  const font = resolveFont(el.fontRef, el.weight, fonts);
  const size = el.size;
  const color = toRgb(el.color);
  const lineH = size * LINE_HEIGHT;

  let lines = wrapLines(el.content, font, size, el.w);

  // The DOM box has overflow:hidden — drop lines that fall fully outside it.
  const maxLines = Math.max(1, Math.floor(el.h / lineH));
  if (lines.length > maxLines) lines = lines.slice(0, maxLines);

  // Vertically center the line block, matching CSS flex centering.
  const blockH = lines.length * lineH;
  const blockTop = el.y + (el.h - blockH) / 2;

  // Baseline within each line box, from CSS half-leading:
  // baselineFromTop = (lineH - (ascent + descent)) / 2 + ascent
  let ascent: number, fullH: number;
  try {
    fullH = font.heightAtSize(size, { descender: true });
    ascent = font.heightAtSize(size, { descender: false });
  } catch {
    fullH = size;
    ascent = size * 0.8;
  }
  const baselineFromLineTop = (lineH - fullH) / 2 + ascent;

  lines.forEach((line, i) => {
    if (!line) return;
    let textX = el.x;
    if (el.align === 'center' || el.align === 'right') {
      const tw = measureWidth(font, line, size);
      if (tw !== null) {
        textX = el.align === 'center' ? el.x + (el.w - tw) / 2 : el.x + el.w - tw;
      }
    }
    const lineTopDom = blockTop + i * lineH;
    page.drawText(line, {
      x: textX,
      y: pageH - (lineTopDom + baselineFromLineTop),
      size,
      font,
      color,
    });
  });
}

// ── AcroForm fields (interactive layer) ──────────────────────────────────────

const ALIGN_MAP = {
  left: TextAlignment.Left,
  center: TextAlignment.Center,
  right: TextAlignment.Right,
} as const;

// Viewers inset field text by borderWidth + 1pt when rendering; the editor
// preview pads by widgetStyle.padding. Shrink the (invisible) widget rect so
// the viewer's own inset lands the typed text exactly where the preview shows it.
const VIEWER_TEXT_INSET = 1;

function widgetRect(el: FieldElement, pageH: number, insetVertical: boolean) {
  const pad = el.widgetStyle.padding ?? 8;
  const inset = Math.max(0, pad - VIEWER_TEXT_INSET);
  const insetX = Math.min(inset, el.w / 2 - 1);
  const insetY = insetVertical ? Math.min(inset, el.h / 2 - 1) : 0;
  return {
    x: el.x + insetX,
    y: toPdfY(el.y, el.h, pageH) + insetY,
    width: el.w - insetX * 2,
    height: el.h - insetY * 2,
  };
}

// Delete the auto-generated appearance stream so the widget is truly transparent
// (no white fill covering the static box). Without AP, viewers render the field
// from its properties only — absent MK/BG → transparent background.
function makeWidgetsTransparent(field: { acroField: { getWidgets(): Array<{ dict: { delete(name: PDFName): void } }> } }) {
  for (const widget of field.acroField.getWidgets()) {
    widget.dict.delete(PDFName.of('AP'));
  }
}

function addFormField(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  el: FieldElement,
  fonts: FontMap,
  pageH: number,
  usedNames: Set<string>,
) {
  const form = pdfDoc.getForm();
  const font = resolveFont(el.widgetStyle.fontRef, undefined, fonts);
  const textColor = toRgb(el.widgetStyle.color);

  // Field names must be unique across the document or pdf-lib throws.
  let name = el.name || 'field';
  for (let i = 2; usedNames.has(name); i++) name = `${el.name || 'field'}_${i}`;
  usedNames.add(name);

  if (el.fieldType === 'checkbox') {
    // Real check box: keep its appearance stream (it draws the check mark),
    // but make the box itself transparent — the static layer draws the box.
    const checkBox = form.createCheckBox(name);
    checkBox.addToPage(page, {
      x: el.x,
      y: toPdfY(el.y, el.h, pageH),
      width: el.w,
      height: el.h,
      textColor, // check-mark color
      backgroundColor: undefined,
      borderColor: undefined,
      borderWidth: 0,
    });
    if (el.required) checkBox.enableRequired();
    return;
  }

  if (el.fieldType === 'dropdown') {
    const dropdown = form.createDropdown(name);
    dropdown.addOptions(el.options ?? []);
    dropdown.addToPage(page, {
      ...widgetRect(el, pageH, false),
      font,
      textColor,
      borderWidth: 0,
      // Explicit undefined keeps /MK background absent — otherwise pdf-lib
      // defaults to white and viewers repaint the box white on user input.
      backgroundColor: undefined,
      borderColor: undefined,
    });
    // setFontSize needs the /DA entry that addToPage creates.
    dropdown.setFontSize(el.widgetStyle.size);
    if (el.required) dropdown.enableRequired();
    makeWidgetsTransparent(dropdown);
    return;
  }

  // All remaining types (text, textarea, date, signature, currency, number)
  // are text fields; textarea gets multiline.
  const textField = form.createTextField(name);
  if (el.fieldType === 'textarea') textField.enableMultiline();
  if (el.widgetStyle.align && el.widgetStyle.align !== 'left') {
    textField.setAlignment(ALIGN_MAP[el.widgetStyle.align]);
  }

  textField.addToPage(page, {
    ...widgetRect(el, pageH, el.fieldType === 'textarea'),
    font,
    textColor,
    // No border/background — the static layer provides the visible box.
    borderWidth: 0,
    // Explicit undefined keeps /MK background absent — otherwise pdf-lib
    // defaults to white and viewers repaint the box white on user input.
    backgroundColor: undefined,
    borderColor: undefined,
  });

  // setFontSize needs the /DA entry that addToPage creates.
  textField.setFontSize(el.widgetStyle.size);
  if (el.required) textField.enableRequired();
  makeWidgetsTransparent(textField);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generatePDF(schema: DocumentSchema): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load and embed fonts — same files the browser renders via @font-face.
  const [interRegBytes, interBoldBytes, poppinsRegBytes, poppinsBoldBytes] = await Promise.all([
    fetchFontBytes(interRegularUrl),
    fetchFontBytes(interBoldUrl),
    fetchFontBytes(poppinsRegularUrl),
    fetchFontBytes(poppinsBoldUrl),
  ]);

  const fonts: FontMap = {
    bodyRegular: await pdfDoc.embedFont(interRegBytes),
    bodyBold: await pdfDoc.embedFont(interBoldBytes),
    headingRegular: await pdfDoc.embedFont(poppinsRegBytes),
    headingBold: await pdfDoc.embedFont(poppinsBoldBytes),
  };

  // Document metadata
  pdfDoc.setTitle(schema.meta.title);
  pdfDoc.setCreator('FormCraft — Fillable PDF Builder');

  const usedNames = new Set<string>();

  for (const pageSchema of schema.pages) {
    const { w: pageW, h: pageH } = schema.meta.pageSize;
    const page = pdfDoc.addPage([pageW, pageH]);

    // Two-pass rendering:
    // Pass 1 — static layer (rects, text, lines, field boxes)
    // Pass 2 — interactive layer (transparent AcroForm widgets)

    const fieldElements: FieldElement[] = [];

    for (const el of pageSchema.elements) {
      renderStaticElement(page, el, fonts, pageH, fieldElements);
    }

    // Pass 2: add AcroForm widgets on top of static boxes
    for (const el of fieldElements) {
      addFormField(pdfDoc, page, el, fonts, pageH, usedNames);
    }
  }

  // Don't regenerate field appearances on save — we deliberately delete the
  // AP streams of text/dropdown widgets so the static layer shows through.
  return pdfDoc.save({ updateFieldAppearances: false });
}

function renderStaticElement(
  page: ReturnType<PDFDocument['addPage']>,
  el: DocElement,
  fonts: FontMap,
  pageH: number,
  fieldQueue: FieldElement[],
) {
  switch (el.type) {
    case 'rect':
      drawRoundedRect(page, el, pageH);
      break;

    case 'text':
      drawText(page, el, fonts, pageH);
      break;

    case 'line':
      drawLine(page, el, pageH);
      break;

    case 'field':
      // Draw the visible styled box in the static layer.
      drawRoundedRect(
        page,
        {
          x: el.x,
          y: el.y,
          w: el.w,
          h: el.h,
          radius: el.boxStyle.radius,
          fill: el.boxStyle.fill,
          stroke: el.boxStyle.stroke,
          strokeWidth: 0.75,
        },
        pageH,
      );
      // Queue the transparent widget for the interactive layer pass.
      fieldQueue.push(el);
      break;

    case 'image':
      drawImagePlaceholder(page, el, fonts, pageH);
      break;
  }
}

function drawImagePlaceholder(
  page: ReturnType<PDFDocument['addPage']>,
  el: ImageElement,
  fonts: FontMap,
  pageH: number,
) {
  // Matches the DOM placeholder: #F0F4FF fill, 2px (1.5pt) dashed #A8B8E8 border, 4px (3pt) radius.
  page.drawSvgPath(svgRoundedRect(el.w, el.h, 3), {
    x: el.x,
    y: pageH - el.y,
    borderColor: toRgb('#A8B8E8'),
    borderWidth: 1.5,
    borderDashArray: [3, 3],
    color: toRgb('#F0F4FF'),
  });

  const label = el.label ?? 'IMAGE';
  const size = 6.75; // DOM label is 9px
  const font = fonts.bodyBold;
  const tw = measureWidth(font, label, size) ?? label.length * size * 0.55;
  page.drawText(label, {
    x: el.x + (el.w - tw) / 2,
    y: toPdfY(el.y, el.h, pageH) + el.h / 2 - size / 2,
    size,
    font,
    color: toRgb('#A8B8E8'),
  });
}
