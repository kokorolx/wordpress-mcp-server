import { WordPressClient } from '../wordpress-client.js';
import { MediaResult } from '../types.js';
import { MCPError } from '../utils/errors.js';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

export const embedImagesInContentTool = async (params: {
  content: string;
  wpClient: WordPressClient;
  altPrefix?: string;
}) => {
  try {
    const { content, wpClient, altPrefix = '' } = params;
    let processedContent = content;
    const mediaIds: number[] = [];
    const mediaResults: MediaResult[] = [];

    // Regex for markdown images: ![alt](url)
    const mdImageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;

    // We use a temp map to avoid multiple uploads of same image in same content
    const uploadMap = new Map<string, MediaResult>();

    while ((match = mdImageRegex.exec(content)) !== null) {
      const [fullMatch, alt, source] = match;

      if (uploadMap.has(source)) {
        const res = uploadMap.get(source)!;
        processedContent = processedContent.replace(fullMatch, `![${alt || res.alt_text}](${res.source_url})`);
        continue;
      }

      try {
        let buffer: Buffer;
        let filename = path.basename(source.split('?')[0]) || 'image.jpg';

        if (/^https?:\/\//.test(source)) {
          // If it's already a WordPress-like URL or we don't want to re-upload remote images
          // maybe skip if it's already remote. But usually we want to "host" images.
          buffer = await downloadToBuffer(source);
        } else {
          buffer = await fs.promises.readFile(source);
        }

        const optimized = await sharp(buffer).resize({ width: 1600 }).jpeg({ quality: 80 }).toBuffer();
        const res = await wpClient.uploadMediaFromBuffer(optimized, filename, 'image/jpeg', {
          alt_text: altPrefix ? `${altPrefix} ${alt}`.trim() : alt
        });

        uploadMap.set(source, res);
        mediaIds.push(res.id);
        mediaResults.push(res);
        processedContent = processedContent.replace(fullMatch, `![${alt || res.alt_text}](${res.source_url})`);
      } catch (e) {
        console.error(`Failed to process image ${source}:`, e);
      }
    }

    // HTML image tags: <img src="..." alt="..." />
    const htmlImageRegex = /<img.*?src=["'](.*?)["'].*?alt=["'](.*?)["'].*?>/g;
    // ... potentially more complex parsing if needed ...

    return {
      processedContent,
      mediaIds,
      mediaResults
    };
  } catch (err: any) {
    throw new MCPError('embed_images_error', 'Failed to process content images', { original: err?.message });
  }
};

export type EmbedImagesInContentInput = { content: string; altPrefix?: string };
