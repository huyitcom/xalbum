import { toJpeg, getFontEmbedCSS } from 'html-to-image';
import { setDpiInJpegDataUrl } from './imageUtils';

export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

/**
 * Downloads a data URL as a file in the browser
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports a single canvas element as high-res 300 DPI JPEG (5906 x 4134 for 50x35cm, 8268 x 4134 for 70x35cm)
 */
export async function captureCanvasAs300DpiJpeg(
  element: HTMLElement,
  aspectRatio: string = '50:35',
  bgColor: string = '#ffffff'
): Promise<string> {
  // Ensure all web fonts are completely loaded into the DOM before snapshotting
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    // Ignore font loading inspection errors
  }

  const normalizedRatio = aspectRatio.replace('x', ':');
  const targetWidth =
    normalizedRatio === '70:35' || normalizedRatio === '2:1'
      ? 8268 // 70x35cm at 300 DPI
      : 5906; // 50x35cm at 300 DPI
  const elemWidth = element.offsetWidth || 820;
  const pixelRatio = Math.max(1, targetWidth / elemWidth);

  let fontEmbedCSS: string | undefined;
  try {
    fontEmbedCSS = await getFontEmbedCSS(element);
  } catch (err) {
    console.warn('Could not embed external font CSS in canvas capture:', err);
  }

  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  let rawDataUrl: string;
  try {
    rawDataUrl = await toJpeg(element, {
      pixelRatio,
      quality: 0.96,
      backgroundColor: bgColor || '#ffffff',
      fontEmbedCSS,
      imagePlaceholder: transparentPixel,
    });
  } catch (err) {
    console.warn('First toJpeg attempt failed, trying again without fontEmbedCSS...', err);
    try {
      rawDataUrl = await toJpeg(element, {
        pixelRatio,
        quality: 0.96,
        backgroundColor: bgColor || '#ffffff',
        imagePlaceholder: transparentPixel,
      });
    } catch (finalErr: any) {
      console.error('Final toJpeg attempt failed:', finalErr);
      throw new Error(`Lỗi render ảnh HTML: ${finalErr?.message || 'Không xác định'}`);
    }
  }

  return setDpiInJpegDataUrl(rawDataUrl, 300);
}
