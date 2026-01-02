import { WordPressClient } from '../wordpress-client.js';
import { PostData, PostCreationResult } from '../types.js';
import { MCPError } from '../utils/errors.js';

import { marked } from 'marked';
import { config } from '../config.js';

export const postToWordpressTool = async (params: { wpClient: WordPressClient; post: PostData }) => {
  try {
    const { wpClient, post } = params;

    // Process Content (Markdown -> HTML)
    let finalContent = post.content;
    if (config.postDefaults.contentType === 'markdown') {
      finalContent = await marked(post.content);
    }

    // Enforce Draft Mode if Preview Required
    let finalStatus = post.status || 'draft';
    if (config.postDefaults.requirePreview && finalStatus === 'publish') {
      console.log('Force status to draft because preview is required');
      finalStatus = 'draft';
    }

    // Determine if we are creating or updating
    let postId: number | undefined = post.id;
    let isUpdate = false;

    if (!postId && post.slug) {
      const existing = await wpClient.findPostBySlug(post.slug);
      if (existing) {
        postId = existing.id;
        isUpdate = true;
      }
    } else if (postId) {
      isUpdate = true;
    }

    // Process Featured Media
    // Ensure featured_media is a number (ID)
    let featuredMediaId: number | undefined;
    if (post.featuredMedia) {
      if (typeof post.featuredMedia === 'number') {
        featuredMediaId = post.featuredMedia;
      } else if (typeof post.featuredMedia === 'object' && (post.featuredMedia as any).id) {
        featuredMediaId = (post.featuredMedia as any).id;
      }
    }


    const payload: any = {
      title: post.title,
      content: finalContent,
      excerpt: post.excerpt,
      status: finalStatus,
      categories: post.categories,
      tags: post.tags,
      featured_media: featuredMediaId,
      seo: post.seo || post.yoast // Pass SEO data for GraphQL
    };

    let result: PostCreationResult;

    if (isUpdate && postId) {
      console.error(`Updating existing post ${postId}`);
      // For now, we only support REST updates as per the task "use graphql to create post"
      // If we wanted to support GraphQL updates we would need to implement updatePostGraphQL
      result = await wpClient.updatePost(postId, payload);
    } else {
      // Use GraphQL if configured
      if (wpClient.config.graphQlUrl && wpClient.config.refreshToken) {
        console.error('Creating post via GraphQL'); // console.error shows up in MCP logs usually
        result = await wpClient.createPostGraphQL(payload);
      } else {
        result = await wpClient.createPost(payload);
      }
    }

    // Support new unified SEO field
    // We always call this because createPostGraphQL does NOT handle SEO (schema limitation)
    if (post.seo) {
      const { setSEOMetadataTool } = await import('./set-seo-metadata.js');
      await setSEOMetadataTool({ wpClient, postId: result.id, seo: post.seo });
    }
    // Legacy support for yoast field
    else if (post.yoast) {
      const meta: Record<string, any> = {};
      if (post.yoast.title) meta['_yoast_wpseo_title'] = post.yoast.title;
      if (post.yoast.metaDescription) meta['_yoast_wpseo_metadesc'] = post.yoast.metaDescription;
      if (post.yoast.focusKeyword) meta['_yoast_wpseo_focuskw'] = post.yoast.focusKeyword;
      if (post.yoast.metaRobotsNoindex) meta['_yoast_wpseo_meta-robots-noindex'] = post.yoast.metaRobotsNoindex;
      if (post.yoast.metaRobotsNofollow) meta['_yoast_wpseo_meta-robots-nofollow'] = post.yoast.metaRobotsNofollow;

      await wpClient.updatePostMeta(result.id, meta);
    }

    return result as PostCreationResult;
  } catch (err: any) {
    throw new MCPError('post_creation_error', 'Failed to create post on WordPress', { original: err?.message });
  }
};

export type PostToWordpressInput = {post: PostData};
export type PostToWordpressOutput = PostCreationResult;
