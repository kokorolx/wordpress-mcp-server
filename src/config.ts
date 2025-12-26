import dotenv from 'dotenv';
import { z } from 'zod';
import { WordPressConfig } from './types.js';

dotenv.config();

const envSchema = z.object({
  WORDPRESS_URL: z.string().url(),
  WORDPRESS_USERNAME: z.string(),
  WORDPRESS_APP_PASSWORD: z.string(),
  MCP_SERVER_NAME: z.string().optional().default('wordpress-mcp'),
  SEO_PLUGIN: z.enum(['yoast', 'rankmath']).optional().default('yoast'),
  AUTO_GENERATE_FEATURED_IMAGE: z.string().optional().default('true'),
  PROCESS_CONTENT_IMAGES: z.string().optional().default('true'),
  DEFAULT_POST_STATUS: z.enum(['draft', 'publish', 'pending']).optional().default('draft'),
  AUTO_GENERATE_EXCERPT: z.string().optional().default('true'),
  WORDPRESS_CONTENT_TYPE: z.enum(['markdown', 'html']).optional().default('markdown'),
  REQUIRE_PREVIEW_APPROVAL: z.string().optional().default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const config = {
  wordpress: {
    url: parsed.data.WORDPRESS_URL.replace(/\/$/, ''),
    username: parsed.data.WORDPRESS_USERNAME,
    appPassword: parsed.data.WORDPRESS_APP_PASSWORD,
  },
  mcpName: parsed.data.MCP_SERVER_NAME,
  seoPlugin: parsed.data.SEO_PLUGIN,
  images: {
    autoGenerateFeatured: parsed.data.AUTO_GENERATE_FEATURED_IMAGE === 'true',
    processContentImages: parsed.data.PROCESS_CONTENT_IMAGES === 'true',
  },
  postDefaults: {
    status: parsed.data.DEFAULT_POST_STATUS,
    autoExcerpt: parsed.data.AUTO_GENERATE_EXCERPT === 'true',
    contentType: parsed.data.WORDPRESS_CONTENT_TYPE || 'markdown', // 'markdown' | 'html'
    requirePreview: parsed.data.REQUIRE_PREVIEW_APPROVAL !== 'false', // Default to true for safety
  }
};
