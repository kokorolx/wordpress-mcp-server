#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config } from './config.js';
import { WordPressClient } from './wordpress-client.js';
import { readMarkdownTool } from './tools/read-markdown.js';
import { uploadMediaTool } from './tools/upload-media.js';
import { validatePostTool } from './tools/validate-post-data.js';
import { postToWordpressTool } from './tools/post-to-wordpress.js';
import { createCategoryTool } from './tools/create-category.js';
import { createTagTool } from './tools/create-tag.js';
import { getTaxonomiesTool } from './tools/get-taxonomies.js';
import { saveResearchDataTool } from './tools/save-research-data.js';
import { createBlogOutlineTool } from './tools/create-blog-outline.js';
import { saveBlogContentTool } from './tools/save-blog-content.js';
import { generateImagePromptsTool } from './tools/generate-image-prompts.js';
import { setSEOMetadataTool } from './tools/set-seo-metadata.js';
import { embedImagesInContentTool } from './tools/embed-images-in-content.js';
import { verifyBlogStructureTool } from './tools/verify-blog-structure.js';
import { createCompleteBlogTool } from './tools/create-complete-blog.js';

async function main() {
  const wpClient = new WordPressClient(config.wordpress);

  const server = new McpServer({
    name: config.mcpName,
    version: '1.0.0',
  });

  // Register Tools
  server.registerTool('read-markdown', {
    description: 'Read a markdown file from the filesystem',
    inputSchema: { path: z.string() }
  }, async (params) => {
    const res = await readMarkdownTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('upload-media', {
    description: 'Upload media to WordPress (local path or remote URL)',
    inputSchema: {
      items: z.array(z.object({
        source: z.string(),
        title: z.string().optional(),
        alt_text: z.string().optional(),
        caption: z.string().optional(),
        description: z.string().optional()
      })).optional(),
      source: z.string().optional()
    }
  }, async (params) => {
    const res = await uploadMediaTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('post-to-wordpress', {
    description: 'Create a post on WordPress and set SEO metadata',
    inputSchema: { post: z.any() }
  }, async (params) => {
    const res = await postToWordpressTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('create-category', {
    description: 'Create a new WordPress category (or return existing if duplicate)',
    inputSchema: { category: z.any() }
  }, async (params) => {
    const res = await createCategoryTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('create-tag', {
    description: 'Create a new WordPress tag (or return existing if duplicate)',
    inputSchema: { tag: z.any() }
  }, async (params) => {
    const res = await createTagTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('get-taxonomies', {
    description: 'Get categories or tags with optional search and minimal mode',
    inputSchema: {
      type: z.enum(['category', 'tag']),
      search: z.string().optional(),
      per_page: z.number().optional(),
      minimal: z.boolean().optional()
    }
  }, async (params: any) => {
    const res = await getTaxonomiesTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('save-research-data', {
    description: 'Store AI-generated research data for a blog topic',
    inputSchema: { topic: z.string(), researchData: z.any() }
  }, async (params: any) => {
    const res = await saveResearchDataTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('create-blog-outline', {
    description: 'Store AI-generated blog outline structure',
    inputSchema: { topic: z.string(), outlineData: z.any() }
  }, async (params: any) => {
    const res = await createBlogOutlineTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('save-blog-content', {
    description: 'Store AI-generated blog post content',
    inputSchema: { topic: z.string(), content: z.string() }
  }, async (params: any) => {
    const res = await saveBlogContentTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('generate-image-prompts', {
    description: 'Generate AI image prompts for blog featured and section images',
    inputSchema: {
      blogTitle: z.string(),
      sections: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
      style: z.enum(['professional', 'modern', 'minimalist', 'vibrant', 'technical']).optional()
    }
  }, async (params: any) => {
    const res = await generateImagePromptsTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('set-seo-metadata', {
    description: 'Set SEO metadata for a post (supports Yoast and RankMath)',
    inputSchema: { postId: z.number(), seo: z.any() }
  }, async (params: any) => {
    const res = await setSEOMetadataTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('embed-images-in-content', {
    description: 'Process content to upload and host images in WordPress',
    inputSchema: { content: z.string(), altPrefix: z.string().optional() }
  }, async (params: any) => {
    const res = await embedImagesInContentTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('verify-blog-structure', {
    description: 'Validate blog post structure, quality, and SEO readiness',
    inputSchema: { blog: z.any() }
  }, async (params: any) => {
    const res = await verifyBlogStructureTool(params);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool('create-complete-blog', {
    description: 'One-stop tool to create a complete blog post with all features',
    inputSchema: { input: z.any() }
  }, async (params: any) => {
    const res = await createCompleteBlogTool({...params, wpClient});
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WordPress MCP Server running on stdio');
}

main().catch(err => {
  console.error('Fatal error starting MCP server', err);
  process.exit(1);
});
