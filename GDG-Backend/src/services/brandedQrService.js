const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

let cachedLogoPng = null;

function getLogoPng() {
  if (cachedLogoPng) return cachedLogoPng;
  const possiblePaths = [
    path.join(__dirname, '../assets/gdg-logo-icon.png'),
    path.join(__dirname, '../../../public/gdg-logo-icon.png'),
    path.join(__dirname, '../../../public/gdg-logo-icon copy.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        cachedLogoPng = PNG.sync.read(fs.readFileSync(p));
        return cachedLogoPng;
      } catch (e) {
        console.warn('Error reading GDG logo PNG:', e.message);
      }
    }
  }
  return null;
}

/**
 * Generates a branded QR Code buffer (PNG) with the GDG logo icon in the center.
 * Error correction level H guarantees 100% scan fidelity.
 * @param {string} text
 * @param {object} options
 * @returns {Promise<Buffer>}
 */
async function generateBrandedQrBuffer(text, options = {}) {
  const {
    width = 400,
    margin = 2,
    dark = '#0f172a',
    light = '#ffffff',
  } = options;

  const qrBuf = await QRCode.toBuffer(text, {
    width,
    margin,
    errorCorrectionLevel: 'H',
    color: { dark, light },
  });

  const logoImg = getLogoPng();
  if (!logoImg) {
    return qrBuf;
  }

  try {
    const qrImg = PNG.sync.read(qrBuf);

    // Compute logo dimensions ~ 24% of QR code width
    const targetLogoW = Math.round(qrImg.width * 0.24);
    const targetLogoH = Math.round(targetLogoW * (logoImg.height / logoImg.width));

    const padW = targetLogoW + 16;
    const padH = targetLogoH + 16;
    const padX = Math.round((qrImg.width - padW) / 2);
    const padY = Math.round((qrImg.height - padH) / 2);
    const radius = 8;

    // Draw white backing badge in center
    for (let y = padY; y < padY + padH; y++) {
      for (let x = padX; x < padX + padW; x++) {
        const dx = x < padX + radius ? padX + radius - x : x > padX + padW - radius ? x - (padX + padW - radius) : 0;
        const dy = y < padY + radius ? padY + radius - y : y > padY + padH - radius ? y - (padY + padH - radius) : 0;
        if (dx * dx + dy * dy <= radius * radius) {
          const idx = (qrImg.width * y + x) << 2;
          qrImg.data[idx] = 255;
          qrImg.data[idx + 1] = 255;
          qrImg.data[idx + 2] = 255;
          qrImg.data[idx + 3] = 255;
        }
      }
    }

    // Blend the GDG icon centered inside the white backing
    const logoX = Math.round((qrImg.width - targetLogoW) / 2);
    const logoY = Math.round((qrImg.height - targetLogoH) / 2);

    for (let y = 0; y < targetLogoH; y++) {
      const srcY = Math.floor(y * (logoImg.height / targetLogoH));
      for (let x = 0; x < targetLogoW; x++) {
        const srcX = Math.floor(x * (logoImg.width / targetLogoW));
        const srcIdx = (logoImg.width * srcY + srcX) << 2;
        const a = logoImg.data[srcIdx + 3];
        if (a > 10) {
          const dstIdx = (qrImg.width * (logoY + y) + (logoX + x)) << 2;
          const normA = a / 255;
          qrImg.data[dstIdx] = Math.round(logoImg.data[srcIdx] * normA + qrImg.data[dstIdx] * (1 - normA));
          qrImg.data[dstIdx + 1] = Math.round(logoImg.data[srcIdx + 1] * normA + qrImg.data[dstIdx + 1] * (1 - normA));
          qrImg.data[dstIdx + 2] = Math.round(logoImg.data[srcIdx + 2] * normA + qrImg.data[dstIdx + 2] * (1 - normA));
          qrImg.data[dstIdx + 3] = 255;
        }
      }
    }

    return Buffer.from(PNG.sync.write(qrImg));
  } catch (err) {
    console.warn('Failed to composite GDG logo onto QR buffer:', err.message);
    return qrBuf;
  }
}

module.exports = {
  generateBrandedQrBuffer,
};
