import { Base64Image } from '../types';

/**
 * Download image to user's device
 */
export function downloadImage(image: Base64Image, filename?: string): void {
  try {
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.data}`;
    link.download = filename || `image-${Date.now()}.${getFileExtension(image.mimeType)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error('Failed to download image');
  }
}

/**
 * Download all images as a ZIP (or individually if ZIP not available)
 */
export function downloadAllImages(images: Base64Image[], baseFilename: string = 'images'): void {
  images.forEach((img, index) => {
    setTimeout(() => {
      downloadImage(img, `${baseFilename}-${index + 1}.${getFileExtension(img.mimeType)}`);
    }, index * 100); // Small delay to prevent browser blocking multiple downloads
  });
}

/**
 * Copy image to clipboard
 */
export async function copyImageToClipboard(image: Base64Image): Promise<void> {
  try {
    // Convert base64 to blob
    const response = await fetch(`data:${image.mimeType};base64,${image.data}`);
    const blob = await response.blob();
    
    // Copy to clipboard using Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({
        [image.mimeType]: blob
      })
    ]);
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    // Fallback: try to copy as data URL (may not work in all browsers)
    try {
      await navigator.clipboard.writeText(`data:${image.mimeType};base64,${image.data}`);
      throw new Error('Image copied as text. Some applications may not support this format.');
    } catch (fallbackError) {
      throw new Error('Failed to copy image to clipboard. Please use download instead.');
    }
  }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeMap[mimeType] || 'png';
}

