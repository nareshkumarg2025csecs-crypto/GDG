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
    logoSrc = '/favicon.png',
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
        fallback.src = '/gdg-logo-icon1.png';
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
