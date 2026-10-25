import QRCode from 'qrcode';

export interface BrandedQrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  logoSrc?: string;
}

/**
 * Generates a high-resolution branded QR Code Data URL with the official GDG logo icon
 * centered with a clean protective white backing pill.
 *
 * Uses Error Correction Level 'H' (30% redundancy) so the QR code scans reliably and instantly.
 */
export async function generateBrandedQrDataUrl(
  text: string,
  options: BrandedQrOptions = {}
): Promise<string> {
  const {
    width = 400,
    margin = 2,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
    logoSrc = '/gdg-logo-icon.webp',
  } = options;

  if (typeof document === 'undefined') {
    // Server-side fallback if invoked outside browser
    try {
      return await QRCode.toDataURL(text, {
        width,
        margin,
        errorCorrectionLevel: 'H',
        color: { dark: darkColor, light: lightColor },
      });
    } catch {
      return await QRCode.toDataURL(text, {
        width,
        margin,
        errorCorrectionLevel: 'M',
        color: { dark: darkColor, light: lightColor },
      });
    }
  }

  // 1. Draw base QR code onto offscreen canvas with fallback on large payloads
  const canvas = document.createElement('canvas');
  let allowLogo = false;

  try {
    await QRCode.toCanvas(canvas, text, {
      width,
      margin,
      errorCorrectionLevel: 'H',
      color: { dark: darkColor, light: lightColor },
    });
    allowLogo = true;
  } catch {
    try {
      await QRCode.toCanvas(canvas, text, {
        width,
        margin,
        errorCorrectionLevel: 'Q',
        color: { dark: darkColor, light: lightColor },
      });
      allowLogo = true;
    } catch {
      await QRCode.toCanvas(canvas, text, {
        width,
        margin,
        errorCorrectionLevel: 'M',
        color: { dark: darkColor, light: lightColor },
      });
      allowLogo = false;
    }
  }

  const ctx = canvas.getContext('2d');
  if (!ctx || !allowLogo) {
    return canvas.toDataURL('image/png');
  }

  // 2. Load the GDG logo icon
  try {
    const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback to secondary logo if primary fails
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.onload = () => resolve(fallback);
        fallback.onerror = (err) => reject(err);
        fallback.src = '/gdg-logo-icon1.webp';
      };
      img.src = logoSrc;
    });

    // 3. Compute central placement
    // Logo width ~ 24% of QR canvas width
    const targetW = Math.round(width * 0.24);
    const targetH = Math.round(targetW * (logoImg.height / logoImg.width));

    // Protective backing pill to ensure adjacent QR modules don't touch the icon
    const padW = targetW + Math.round(width * 0.04);
    const padH = targetH + Math.round(width * 0.04);
    const padX = Math.round((width - padW) / 2);
    const padY = Math.round((width - padH) / 2);
    const cornerRadius = Math.round(padH * 0.25);

    ctx.save();

    // Subtle drop shadow behind the backing badge
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = Math.round(width * 0.015);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // Draw white backing badge
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(padX, padY, padW, padH, cornerRadius);
    } else {
      ctx.rect(padX, padY, padW, padH);
    }
    ctx.fill();

    // Reset shadow for crisp border and logo
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Crisp subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Draw GDG logo icon centered inside the badge
    const logoX = Math.round((width - targetW) / 2);
    const logoY = Math.round((width - targetH) / 2);
    ctx.drawImage(logoImg, logoX, logoY, targetW, targetH);

    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Could not composite GDG logo onto QR code; falling back to clean QR:', err);
    return canvas.toDataURL('image/png');
  }
}

export interface EventShareCardOptions {
  qrDataUrl: string;
  title: string;
  category?: string;
  date?: string;
  venue?: string;
  description?: string;
  url: string;
}

interface MarkdownToken {
  text: string;
  isBold?: boolean;
  isLink?: boolean;
  isCode?: boolean;
  isHeader?: boolean;
}

function parseMarkdownLineTokens(line: string, isHeader = false): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // 1. Markdown link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({
        text: linkMatch[1],
        isLink: true,
        isBold: true,
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 2. Bold / Italic / Bold-Italic: ***text***, **text**, *text*, ___text___, __text__, _text_
    const boldItalicMatch = remaining.match(/^(\*{1,3}|_{1,3})([^\*_]+?)\1/);
    if (boldItalicMatch) {
      tokens.push({
        text: boldItalicMatch[2],
        isBold: true,
        isHeader,
      });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 3. Inline code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({
        text: codeMatch[1],
        isCode: true,
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 4. Bare URL: https://... or http://...
    const urlMatch = remaining.match(/^https?:\/\/[^\s)]+/);
    if (urlMatch) {
      tokens.push({
        text: urlMatch[0],
        isLink: true,
      });
      remaining = remaining.slice(urlMatch[0].length);
      continue;
    }

    // 5. Plain text up to next special syntax trigger
    let nextSpecialIdx = -1;
    const triggers = ['[', '*', '_', '`', 'http://', 'https://'];
    for (const trig of triggers) {
      const idx = remaining.indexOf(trig);
      if (idx !== -1 && (nextSpecialIdx === -1 || idx < nextSpecialIdx)) {
        nextSpecialIdx = idx;
      }
    }

    if (nextSpecialIdx === -1) {
      const clean = remaining.replace(/[*_`]/g, '');
      if (clean) tokens.push({ text: clean, isBold: isHeader, isHeader });
      break;
    } else if (nextSpecialIdx === 0) {
      // Discard stray formatting symbols (*, _, `) so they are NEVER shown in raw form
      if (remaining[0] === '*' || remaining[0] === '_' || remaining[0] === '`') {
        remaining = remaining.slice(1);
      } else {
        tokens.push({ text: remaining[0], isBold: isHeader, isHeader });
        remaining = remaining.slice(1);
      }
    } else {
      const clean = remaining.slice(0, nextSpecialIdx).replace(/[*_`]/g, '');
      if (clean) tokens.push({ text: clean, isBold: isHeader, isHeader });
      remaining = remaining.slice(nextSpecialIdx);
    }
  }

  // Merge adjacent plain tokens
  const merged: MarkdownToken[] = [];
  for (const t of tokens) {
    if (!t.text) continue;
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Boolean(prev.isBold) === Boolean(t.isBold) &&
      Boolean(prev.isLink) === Boolean(t.isLink) &&
      Boolean(prev.isCode) === Boolean(t.isCode) &&
      Boolean(prev.isHeader) === Boolean(t.isHeader)
    ) {
      prev.text += t.text;
    } else {
      merged.push({ ...t });
    }
  }

  return merged.length > 0 ? merged : [{ text: line.replace(/[*_`]/g, ''), isBold: isHeader, isHeader }];
}

function drawVisualLine(
  ctx: CanvasRenderingContext2D,
  words: { word: string; isBold?: boolean; isLink?: boolean; isCode?: boolean; isHeader?: boolean }[],
  x: number,
  y: number,
  normalFont: string,
  boldFont: string,
  headerFont: string,
  codeFont: string,
  normalColor: string,
  boldColor: string,
  linkColor: string,
  codeColor: string
) {
  let drawX = x;
  ctx.save();
  ctx.textBaseline = 'top';

  for (const w of words) {
    if (w.isHeader) {
      ctx.font = headerFont;
      ctx.fillStyle = boldColor;
    } else if (w.isCode) {
      ctx.font = codeFont;
      ctx.fillStyle = codeColor;
    } else if (w.isLink) {
      ctx.font = boldFont;
      ctx.fillStyle = linkColor;
    } else if (w.isBold) {
      ctx.font = boldFont;
      ctx.fillStyle = boldColor;
    } else {
      ctx.font = normalFont;
      ctx.fillStyle = normalColor;
    }

    ctx.fillText(w.word, drawX, y);
    const wordWidth = ctx.measureText(w.word).width;

    // Draw crisp, bright cyan underline under links
    if (w.isLink && w.word.trim()) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(drawX, y + 14);
      ctx.lineTo(drawX + wordWidth, y + 14);
      ctx.stroke();
    }

    drawX += wordWidth;
  }

  ctx.restore();
}

function renderMarkdownOnCanvas(
  ctx: CanvasRenderingContext2D,
  markdown: string,
  startX: number,
  startY: number,
  maxWidth: number,
  maxY: number
) {
  const normalFont = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const boldFont = 'bold 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const headerFont = 'bold 12.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const codeFont = '11.5px monospace, system-ui';

  const normalColor = '#CBD5E1';
  const boldColor = '#FFFFFF';
  const bulletColor = '#60A5FA';
  const linkColor = '#38BDF8';
  const codeColor = '#FDE047';

  const lineH = 19;
  let curY = startY;

  const rawLines = markdown.split(/\r?\n/);

  for (let lIdx = 0; lIdx < rawLines.length; lIdx++) {
    const rawLine = rawLines[lIdx].trimEnd();

    // Stop if remaining vertical space is insufficient
    if (curY + lineH > maxY) {
      break;
    }

    // Paragraph blank line
    if (!rawLine.trim()) {
      curY += 5;
      continue;
    }

    // Heading format (e.g. ## Rewards or # Title or **Header Line**)
    let isHeader = false;
    let cleanLine = rawLine;
    if (/^#{1,6}\s+/.test(rawLine)) {
      isHeader = true;
      cleanLine = rawLine.replace(/^#{1,6}\s+/, '');
      curY += 2;
    } else if (/^(🎁|📋|🚨|📌|⚡|🎯|💡|✨)\s+/.test(rawLine)) {
      // Emojis starting a section title get header emphasis
      isHeader = true;
      curY += 1;
    } else if (cleanLine.startsWith('**') && cleanLine.endsWith('**') && cleanLine.length >= 4) {
      isHeader = true;
    }

    // List item format: matches bullets (- , * , • ) AND numbered lists (1. , 1) , 5.RSVP with or without space)
    // IMPORTANT: * requires trailing whitespace (* ) so that **bold** lines are NOT treated as bullets!
    let isNumberedList = false;
    let isBulletList = false;
    let markerSymbol = '';

    const listMatch = cleanLine.match(/^(\s*)([-•]\s+|\*(?!\*)\s+|•\s*|\d+[\.\)]\s*)(.*)$/);
    if (listMatch) {
      const rawMarker = listMatch[2].trim();
      cleanLine = listMatch[3].trimStart();

      if (rawMarker === '-' || rawMarker === '*' || rawMarker === '•') {
        isBulletList = true;
        markerSymbol = '•';
      } else if (/^\d+/.test(rawMarker)) {
        isNumberedList = true;
        markerSymbol = rawMarker.endsWith('.') || rawMarker.endsWith(')') ? rawMarker : `${rawMarker}.`;
      } else {
        isBulletList = true;
        markerSymbol = rawMarker;
      }
    }

    // Indentation width for proper alignment
    let indentX = 0;
    if (isNumberedList) {
      indentX = 22; // Clean spacing for "1. ", "5. ", "10. "
    } else if (isBulletList) {
      indentX = 16;
    }

    const availableW = maxWidth - indentX;

    // Draw list marker vertically aligned with the text baseline on the SAME line
    if (isNumberedList) {
      ctx.save();
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = bulletColor;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(markerSymbol, startX, curY);
      ctx.restore();
    } else if (isBulletList) {
      ctx.save();
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = bulletColor;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(markerSymbol, startX + 1, curY);
      ctx.restore();
    }

    // Parse tokens (bold, link, code, normal)
    const tokens = parseMarkdownLineTokens(cleanLine, isHeader);

    interface CanvasWord {
      word: string;
      isBold?: boolean;
      isLink?: boolean;
      isCode?: boolean;
      isHeader?: boolean;
    }
    const words: CanvasWord[] = [];
    tokens.forEach((t) => {
      // Split on spaces to enable natural word wrapping while preserving token styling
      const parts = t.text.split(/(\s+)/);
      parts.forEach((p) => {
        if (p) {
          words.push({
            word: p,
            isBold: t.isBold,
            isLink: t.isLink,
            isCode: t.isCode,
            isHeader: isHeader,
          });
        }
      });
    });

    let currentLineWords: CanvasWord[] = [];
    let currentLineW = 0;

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const w = words[wIdx];

      // Never start a new visual line with whitespace
      if (currentLineWords.length === 0 && /^\s+$/.test(w.word)) {
        continue;
      }

      ctx.font = w.isHeader ? headerFont : w.isCode ? codeFont : (w.isBold || w.isLink) ? boldFont : normalFont;
      const wWidth = ctx.measureText(w.word).width;

      if (currentLineW + wWidth > availableW && currentLineWords.length > 0 && !/^\s+$/.test(w.word)) {
        const isLastAllowed = curY + lineH * 2 > maxY;
        if (isLastAllowed && (wIdx < words.length - 1 || lIdx < rawLines.length - 1)) {
          currentLineWords.push({ word: '..', isBold: false });
        }

        drawVisualLine(
          ctx,
          currentLineWords,
          startX + indentX,
          curY,
          normalFont,
          boldFont,
          headerFont,
          codeFont,
          normalColor,
          boldColor,
          linkColor,
          codeColor
        );
        curY += lineH;

        if (isLastAllowed) {
          return;
        }

        currentLineWords = [];
        currentLineW = 0;

        if (/^\s+$/.test(w.word)) continue;
      }

      currentLineWords.push(w);
      currentLineW += wWidth;
    }

    if (currentLineWords.length > 0 && curY + lineH <= maxY) {
      drawVisualLine(
        ctx,
        currentLineWords,
        startX + indentX,
        curY,
        normalFont,
        boldFont,
        headerFont,
        codeFont,
        normalColor,
        boldColor,
        linkColor,
        codeColor
      );
      curY += lineH;
    }
  }
}

/**
 * Formats a clean, professional display URL without raw localhost or developer ports.
 * e.g. "http://localhost:8081/events/xyz" -> "gdgrec.dev/events/xyz"
 */
export function formatCleanDisplayUrl(rawUrl: string): string {
  if (!rawUrl) return 'gdgrec.dev/events';
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      /^192\.168\./.test(parsed.hostname) ||
      /^10\./.test(parsed.hostname)
    ) {
      return `gdgrec.dev${parsed.pathname}`.replace(/\/$/, '');
    }
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

/**
 * Universal cross-platform base64 Data URL to native File converter.
 * 100% reliable across iOS Safari, Android Chrome, and in-app webviews.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Universal cross-platform image download trigger that works reliably on iOS Safari,
 * Android Chrome, mobile webviews, and desktop browsers.
 */
export function triggerImageDownload(dataUrl: string, filename: string): void {
  try {
    const file = dataUrlToFile(dataUrl, filename);
    const blobUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 500);
  }
}

/**
 * Helper to safely draw rounded rectangles on any browser canvas (including older mobile WebViews)
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

/**
 * Generates an ultra-premium VIP Event Pass card with Google ambient auroras,
 * official GDG logo, event title, date & time, location, 4-5 line description,
 * ticket stub perforations, and elevated QR showcase.
 */
export async function generateEventShareCardDataUrl(
  options: EventShareCardOptions
): Promise<string> {
  const { qrDataUrl, title, category, date, venue, description, url } = options;
  if (typeof document === 'undefined') return qrDataUrl;

  const width = 760;
  const height = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrDataUrl;

  // 1. Deep Space Obsidian Canvas Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#070913');
  bgGrad.addColorStop(0.5, '#0B1120');
  bgGrad.addColorStop(1, '#05070D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Google Ambient Aurora Glows
  // Blue Aurora (Top Left)
  const blueGlow = ctx.createRadialGradient(90, 90, 20, 90, 90, 360);
  blueGlow.addColorStop(0, 'rgba(66, 133, 244, 0.32)');
  blueGlow.addColorStop(0.6, 'rgba(66, 133, 244, 0.06)');
  blueGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = blueGlow;
  ctx.fillRect(0, 0, width, height);

  // Red Aurora (Top Right)
  const redGlow = ctx.createRadialGradient(width - 90, 140, 20, width - 90, 140, 340);
  redGlow.addColorStop(0, 'rgba(234, 67, 53, 0.25)');
  redGlow.addColorStop(0.6, 'rgba(234, 67, 53, 0.05)');
  redGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = redGlow;
  ctx.fillRect(0, 0, width, height);

  // Yellow Aurora (Bottom Left)
  const yellowGlow = ctx.createRadialGradient(100, height - 140, 20, 100, height - 140, 320);
  yellowGlow.addColorStop(0, 'rgba(251, 188, 4, 0.18)');
  yellowGlow.addColorStop(0.6, 'rgba(251, 188, 4, 0.03)');
  yellowGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = yellowGlow;
  ctx.fillRect(0, 0, width, height);

  // Green Aurora (Bottom Right)
  const greenGlow = ctx.createRadialGradient(width - 100, height - 120, 20, width - 100, height - 120, 360);
  greenGlow.addColorStop(0, 'rgba(52, 168, 83, 0.22)');
  greenGlow.addColorStop(0.6, 'rgba(52, 168, 83, 0.04)');
  greenGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = greenGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Card Geometry & Ticket Perforations
  const pad = 28;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const cardR = 28;
  const notchY = 575;
  const notchR = 18;

  // Main Card Body (Dark Obsidian Glass)
  ctx.save();
  ctx.fillStyle = '#0F172A';
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  // Subtle Metallic Gradient Border
  const strokeGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  strokeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  strokeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  strokeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.14)');
  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = 1.5;
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();
  ctx.restore();

  // Cut Ticket Stub Side Notches
  ctx.save();
  ctx.fillStyle = '#070913';
  // Left notch cutout
  ctx.beginPath();
  ctx.arc(cardX, notchY, notchR, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right notch cutout
  ctx.beginPath();
  ctx.arc(cardX + cardW, notchY, notchR, Math.PI / 2, -Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Dashed Ticket Perforation Line
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + notchR + 14, notchY);
  ctx.lineTo(cardX + cardW - notchR - 14, notchY);
  ctx.stroke();
  ctx.restore();

  // Ticket Perforation Metallic Micro-Badge
  const dividerBadgeText = '✦ OFFICIAL COMMUNITY EVENT PASS ✦';
  ctx.save();
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  const badgeMetrics = ctx.measureText(dividerBadgeText);
  const badgeW = badgeMetrics.width + 24;
  const badgeH = 22;
  const badgeX = (width - badgeW) / 2;
  const badgeY = notchY - badgeH / 2;

  ctx.fillStyle = '#0F172A';
  drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 11);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 11);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dividerBadgeText, width / 2, notchY);
  ctx.restore();

  // 4. Glowing 4-Color Google Ribbon Across Top
  const stripeColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
  const stripeW = cardW / stripeColors.length;
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();
  stripeColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(cardX + i * stripeW, cardY, stripeW, 6);
  });
  ctx.restore();

  // 5. Header Branding Section - Load Official GDG Logo Image
  const logoSize = 34;
  const logoX = cardX + 28;
  const logoY = cardY + 28;

  try {
    const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.onload = () => resolve(fallback);
        fallback.onerror = reject;
        fallback.src = '/gdg-logo-icon.png';
      };
      img.src = '/gdg-logo-icon.webp';
    });
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  } catch (err) {
    console.warn('Could not load official GDG logo image:', err);
  }

  // Organization Header Text
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('GOOGLE DEVELOPER GROUPS', logoX + logoSize + 14, logoY + 2);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('On Campus · Rajalakshmi Engineering College', logoX + logoSize + 14, logoY + 18);
  ctx.restore();

  // Category Pill Badge (Top Right)
  if (category) {
    ctx.save();
    const cleanCategory = `✦ ${category.toUpperCase()}`;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const catMetrics = ctx.measureText(cleanCategory);
    const catPillW = catMetrics.width + 22;
    const catPillH = 28;
    const catPillX = cardX + cardW - 28 - catPillW;
    const catPillY = cardY + 28;

    ctx.fillStyle = 'rgba(66, 133, 244, 0.15)';
    drawRoundedRectPath(ctx, catPillX, catPillY, catPillW, catPillH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(66, 133, 244, 0.45)';
    ctx.lineWidth = 1;
    drawRoundedRectPath(ctx, catPillX, catPillY, catPillW, catPillH, 14);
    ctx.stroke();

    ctx.fillStyle = '#93C5FD';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanCategory, catPillX + catPillW / 2, catPillY + catPillH / 2);
    ctx.restore();
  }

  // 6. Event Title (Bold, High Contrast, Dynamic Multi-Line Wrapping)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const titleWords = (title || 'Google Developer Community Event').split(' ');
  const maxTitleW = cardW - 56;
  let titleLine = '';
  let titleY = cardY + 86;
  const titleLineH = 38;
  let titleLinesDrawn = 0;

  for (let n = 0; n < titleWords.length; n++) {
    const testLine = titleLine + titleWords[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTitleW && n > 0) {
      ctx.fillText(titleLine.trim(), cardX + 28, titleY);
      titleLine = titleWords[n] + ' ';
      titleY += titleLineH;
      titleLinesDrawn++;
      if (titleLinesDrawn >= 3) {
        let remaining = titleWords.slice(n).join(' ');
        while (ctx.measureText(remaining + '...').width > maxTitleW && remaining.length > 0) {
          remaining = remaining.substring(0, remaining.length - 1);
        }
        titleLine = remaining + '... ';
        break;
      }
    } else {
      titleLine = testLine;
    }
  }
  if (titleLine.trim()) {
    ctx.fillText(titleLine.trim(), cardX + 28, titleY);
    titleY += titleLineH;
  }
  ctx.restore();

  // 7. Event Metadata Chips Row (Date & Time, Location, Verified Pass)
  const chipsY = titleY + 8;
  let chipStartX = cardX + 28;

  const drawChip = (iconText: string, labelText: string, accentColor = '#38BDF8') => {
    ctx.save();
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(`${iconText} ${labelText}`).width;
    const pillW = textWidth + 24;
    const pillH = 32;

    if (chipStartX + pillW > cardX + cardW - 28) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundedRectPath(ctx, chipStartX, chipsY, pillW, pillH, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    drawRoundedRectPath(ctx, chipStartX, chipsY, pillW, pillH, 16);
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = accentColor;
    ctx.fillText(iconText, chipStartX + 12, chipsY + pillH / 2);

    ctx.fillStyle = '#E2E8F0';
    const iconW = ctx.measureText(iconText).width + 6;
    ctx.fillText(labelText, chipStartX + 12 + iconW, chipsY + pillH / 2);
    ctx.restore();

    chipStartX += pillW + 10;
  };

  // Only show date & time chip if added and not empty/TBA
  const hasValidDate = Boolean(date && !/TBA/i.test(date) && date.trim().length > 0);
  if (hasValidDate && date) {
    drawChip('📅', date, '#60A5FA');
  }

  // Location / Venue chip
  if (venue && venue.trim().length > 0) {
    drawChip('📍', venue, '#F87171');
  }


  // 8. Event Description Section (Fills all remaining space in top section with rendered markdown)
  if (description && description.trim()) {
    const descStartY = chipsY + 40;
    const descMaxY = notchY - 24;
    renderMarkdownOnCanvas(
      ctx,
      description.trim(),
      cardX + 28,
      descStartY,
      cardW - 56,
      descMaxY
    );
  }

  // 9. Elevated High-Contrast QR Code Stage
  const qrBoxSize = 360;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 605;

  ctx.save();
  // Deep Soft Drop Shadow for QR Stage
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;

  // Pure White Stage with rounded corners
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRectPath(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
  ctx.fill();
  ctx.restore();

  // Draw QR Image Centered Inside White Stage
  try {
    const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrDataUrl;
    });

    const qrPadding = 18;
    ctx.drawImage(
      qrImg,
      qrBoxX + qrPadding,
      qrBoxY + qrPadding,
      qrBoxSize - qrPadding * 2,
      qrBoxSize - qrPadding * 2
    );
  } catch (err) {
    console.warn('Could not draw QR code onto pass card:', err);
  }

  // 10. CTA & Clean Display URL Section Below QR Code
  const ctaY = qrBoxY + qrBoxSize + 28;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Primary Scan Instruction
  ctx.fillStyle = '#FDE047'; // Amber Gold
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('SCAN WITH CAMERA OR SCANNER TO ENTER', width / 2, ctaY);
  ctx.restore();

  // Clean Production Display URL (Pill Badge)
  const displayUrl = formatCleanDisplayUrl(url);
  ctx.save();
  ctx.font = 'bold 12px monospace, system-ui';
  const urlMetrics = ctx.measureText(displayUrl);
  const urlPillW = Math.min(urlMetrics.width + 36, cardW - 56);
  const urlPillH = 30;
  const urlPillX = (width - urlPillW) / 2;
  const urlPillY = ctaY + 24;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
  drawRoundedRectPath(ctx, urlPillX, urlPillY, urlPillW, urlPillH, 15);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.30)';
  ctx.lineWidth = 1;
  drawRoundedRectPath(ctx, urlPillX, urlPillY, urlPillW, urlPillH, 15);
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayUrl, width / 2, urlPillY + urlPillH / 2);
  ctx.restore();

  // 11. Official Footer Watermark
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748B';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Google Developer Groups on Campus · Rajalakshmi Engineering College', width / 2, urlPillY + 38);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

