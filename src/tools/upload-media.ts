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

      // Optimize using sharp
      const optimized = await sharp(buffer).resize({ width: 1600 }).jpeg({ quality: 80 }).toBuffer();
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
