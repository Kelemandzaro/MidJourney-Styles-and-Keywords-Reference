import { PDFDocument, PDFName, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { DocumentSchema, DocElement, FieldElement, ImageElement, FontRef } from '../schema/types';
import { toPdfY, hexToRgb, svgRoundedRect } from './utils';

// Vite resolves these to hashed asset URLs at build time.
// Using woff (not woff2) for maximum fontkit compatibility.
import interRegularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import interBoldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import poppinsBoldUrl from '@fontsource/poppins/files/poppins-latin-700-normal.woff?url';

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
  headingBold: PDFFont;
};

function resolveFont(fontRef: FontRef | undefined, weight: 'normal' | 'bold' | undefined, fonts: FontMap): PDFFont {
  if (fontRef === 'heading') return fonts.headingBold;
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
  // pdf-lib draws lines centered on the given Y; offset by half the thickness.
  const centerY = pageH - el.y1 - el.width / 2;
  page.drawLine({
    start: { x: el.x1, y: centerY },
    end: { x: el.x2, y: centerY },
    thickness: el.width,
    color: toRgb(el.stroke),
  });
}

function drawText(
  page: ReturnType<PDFDocument['addPage']>,
  el: { x: number; y: number; w: number; h: number; content: string; size: number; color: string; fontRef?: FontRef; weight?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right' },
  fonts: FontMap,
  pageH: number,
) {
  const font = resolveFont(el.fontRef, el.weight, fonts);
  const size = el.size;

  // Vertically center text within the bounding box.
  // Baseline offset: (box height - size) / 2 gives approximate centering.
  // We add a small descender offset (≈0.2 * size) to center the visual cap height.
  const baselineY = toPdfY(el.y, el.h, pageH) + (el.h - size) / 2 + size * 0.18;

  let textX = el.x;
  if (el.align === 'center') {
    try {
      const textWidth = font.widthOfTextAtSize(el.content, size);
      textX = el.x + (el.w - textWidth) / 2;
    } catch {
      textX = el.x + el.w / 2;
    }
  } else if (el.align === 'right') {
    try {
      const textWidth = font.widthOfTextAtSize(el.content, size);
      textX = el.x + el.w - textWidth;
    } catch {
      textX = el.x;
    }
  }

  page.drawText(el.content, {
    x: textX,
    y: baselineY,
    size,
    font,
    color: toRgb(el.color),
  });
}

// ── AcroForm field (interactive layer) ───────────────────────────────────────

function addFormField(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  el: FieldElement,
  fonts: FontMap,
  pageH: number,
) {
  const form = pdfDoc.getForm();
  const font = resolveFont(el.widgetStyle.fontRef, undefined, fonts);

  // PDF Y for the BOTTOM-LEFT of the widget (standard AcroForm coords).
  const widgetY = toPdfY(el.y, el.h, pageH);

  const textField = form.createTextField(el.name);

  if (el.placeholder) {
    // Store placeholder as default value (some viewers show it as hint)
    // We don't set it as the actual text value so fields appear empty by default.
  }

  // pdf-lib's FieldAppearanceOptions doesn't expose fontSize; set it separately.
  textField.setFontSize(el.widgetStyle.size);

  textField.addToPage(page, {
    x: el.x,
    y: widgetY,
    width: el.w,
    height: el.h,
    font,
    textColor: toRgb(el.widgetStyle.color),
    // No border — the static layer provides the visible box.
    borderWidth: 0,
    // No background — transparent so the static layer shows through.
    // (pdf-lib will generate an AP stream; we remove it below.)
  });

  if (el.required) {
    textField.enableRequired();
  }

  // Remove the auto-generated appearance stream so the widget is truly transparent
  // (no white fill covering the static box). Without AP, viewers render the field
  // from its properties only — absent MK/BG → transparent background.
  const widgets = textField.acroField.getWidgets();
  for (const widget of widgets) {
    widget.dict.delete(PDFName.of('AP'));
    // Ensure no background in the appearance characteristics dict.
    try {
      const mk = widget.getOrCreateAppearanceCharacteristics();
      mk.setBackgroundColor(undefined as unknown as Parameters<typeof mk.setBackgroundColor>[0]);
    } catch {
      // setBackgroundColor(undefined) may throw depending on pdf-lib version; that's fine.
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generatePDF(schema: DocumentSchema): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load and embed fonts — same files the browser renders via @font-face.
  const [interRegBytes, interBoldBytes, poppinsBoldBytes] = await Promise.all([
    fetchFontBytes(interRegularUrl),
    fetchFontBytes(interBoldUrl),
    fetchFontBytes(poppinsBoldUrl),
  ]);

  const fonts: FontMap = {
    bodyRegular: await pdfDoc.embedFont(interRegBytes),
    bodyBold: await pdfDoc.embedFont(interBoldBytes),
    headingBold: await pdfDoc.embedFont(poppinsBoldBytes),
  };

  // Document metadata
  pdfDoc.setTitle(schema.meta.title);
  pdfDoc.setCreator('Fillable PDF Form Builder — Phase 0');

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
      addFormField(pdfDoc, page, el, fonts, pageH);
    }
  }

  return pdfDoc.save();
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
      drawImagePlaceholder(page, el, pageH);
      break;
  }
}

function drawImagePlaceholder(page: ReturnType<PDFDocument['addPage']>, el: ImageElement, pageH: number) {
  const pdfY = toPdfY(el.y, el.h, pageH);
  page.drawSvgPath(svgRoundedRect(el.w, el.h, 4), {
    x: el.x,
    y: pageH - el.y,
    borderColor: rgb(0.66, 0.72, 0.91),
    borderWidth: 1,
    color: rgb(0.94, 0.96, 1),
  });
  // "LOGO" label
  page.drawText(el.label ?? 'IMAGE', {
    x: el.x + el.w / 2 - 12,
    y: pdfY + el.h / 2 - 4,
    size: 8,
    color: rgb(0.66, 0.72, 0.91),
  });
}
