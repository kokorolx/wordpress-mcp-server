import axios from 'axios';
import sharp from 'sharp';
import { MCPError } from '../utils/errors.js';
import { WordPressClient } from '../wordpress-client.js';
import path from 'path';
import fs from 'fs';
import { MediaResult } from '../types.js';

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

export interface UploadMediaItem {
  source: string;
  title?: string;
  alt_text?: string;
  caption?: string;
  description?: string;
}

export const uploadMediaTool = async (params: {
  items?: UploadMediaItem[];
  source?: string; // Legacy support
  wpClient: WordPressClient
}) => {
  try {
    const { items, source, wpClient } = params;

    // Normalize input to array of items
    const uploadItems: UploadMediaItem[] = items || [];
    if (source && uploadItems.length === 0) {
      uploadItems.push({ source });
    }

    if (uploadItems.length === 0) {
      throw new Error('No media sources provided');
    }

    const results: MediaResult[] = [];

    for (const item of uploadItems) {
      let buffer: Buffer;
      const { source: itemSource, ...metadata } = item;
      let filename = path.basename(itemSource.split('?')[0]);

      if (/^https?:\/\//.test(itemSource)) {
        buffer = await downloadToBuffer(itemSource);
      } else {
        buffer = await fs.promises.readFile(itemSource);
      }

      // Optimize using Tinify if API key present
      const { config } = await import('../config.js');
      if (config.tinypng.apiKey) {
        try {
          const tinify = await import('tinify');
          tinify.default.key = config.tinypng.apiKey!;
          const tinifyResult = await tinify.default.fromBuffer(buffer).toBuffer();
          buffer = Buffer.from(tinifyResult);
          // We don't resize with sharp if using tinify to avoid double processing,
          // or we could chain them. For now, let's respect the user's wish for "optimization"
          // If resizing is critical, we should use sharp BEFORE tinify or use tinify resizing.
          // Assuming optimization is the priority here.
        } catch (optimizeErr) {
          console.error(`Failed to optimize image ${filename} with Tinify:`, optimizeErr);
          // Fallback to original buffer (or proceed to sharp if we want consistent resizing)
        }
      }

      // Resize/Format using sharp regardless (ensure consistent size/format)
      // If already optimized by tinify, this might re-encode, so ideally we check.
      // But preserving specific width (1600) is important.
      const optimized = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      const mime = 'image/jpeg';

      const res = await wpClient.uploadMediaFromBuffer(
        optimized,
        filename || 'image.jpg',
        mime,
        metadata
      );
      results.push(res);
    }

    return uploadItems.length === 1 ? results[0] : { count: results.length, items: results };
  } catch (err: any) {
    throw new MCPError('upload_media_error', 'Failed to upload media', { original: err?.message });
  }
};

export type UploadMediaInput = { items?: UploadMediaItem[]; source?: string };
export type UploadMediaOutput = MediaResult | { count: number; items: MediaResult[] };
