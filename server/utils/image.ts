
import sharp from 'sharp';

const MAX_WIDTH = 800; // Resize large images
const QUALITY = 80;    // WebP quality

/**
 * Optimizes a Base64 image string:
 * 1. Decodes Base64
 * 2. Resizes to max width (preserving aspect ratio)
 * 3. Converts to WebP
 * 4. Returns optimized Base64 string
 */
export async function optimizeImage(base64String: string): Promise<string> {
    // Check if it's already a URL (start with http/https) or too short
    if (!base64String || base64String.startsWith('http') || base64String.length < 100) {
        return base64String;
    }

    try {
        // Remove data URI prefix if present (e.g. "data:image/jpeg;base64,")
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;

        if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Try assuming raw base64 if no prefix
            buffer = Buffer.from(base64String, 'base64');
        }

        // Process with Sharp
        const processedBuffer = await sharp(buffer)
            .rotate() // Auto-orient based on EXIF
            .resize(MAX_WIDTH, null, {
                withoutEnlargement: true, // Don't scale up small images
                fit: 'inside'
            })
            .webp({ quality: QUALITY })
            .toBuffer();

        // Return as Base64 Data URI
        return `data:image/webp;base64,${processedBuffer.toString('base64')}`;
    } catch (error) {
        console.error("Image optimization failed:", error);
        // Return original if optimization fails to avoid data loss
        return base64String;
    }
}
