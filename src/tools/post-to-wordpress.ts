import { WordPressClient } from '../wordpress-client.js';
import { PostData, PostCreationResult } from '../types.js';
import { MCPError } from '../utils/errors.js';

export const postToWordpressTool = async (params: { wpClient: WordPressClient; post: PostData }) => {
  try {
    const { wpClient, post } = params;
    const payload: any = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status || 'draft',
      categories: post.categories,
      tags: post.tags,
      featured_media: post.featuredMedia,
    };

    const created = await wpClient.createPost(payload);

    // Support new unified SEO field
    if (post.seo) {
      const { setSEOMetadataTool } = await import('./set-seo-metadata.js');
      await setSEOMetadataTool({ wpClient, postId: created.id, seo: post.seo });
    }
    // Legacy support for yoast field
    else if (post.yoast) {
      const meta: Record<string, any> = {};
      if (post.yoast.title) meta['_yoast_wpseo_title'] = post.yoast.title;
      if (post.yoast.metaDescription) meta['_yoast_wpseo_metadesc'] = post.yoast.metaDescription;
      if (post.yoast.focusKeyword) meta['_yoast_wpseo_focuskw'] = post.yoast.focusKeyword;
      if (post.yoast.metaRobotsNoindex) meta['_yoast_wpseo_meta-robots-noindex'] = post.yoast.metaRobotsNoindex;
      if (post.yoast.metaRobotsNofollow) meta['_yoast_wpseo_meta-robots-nofollow'] = post.yoast.metaRobotsNofollow;

      await wpClient.updatePostMeta(created.id, meta);
    }

    return created as PostCreationResult;
  } catch (err: any) {
    throw new MCPError('post_creation_error', 'Failed to create post on WordPress', { original: err?.message });
  }
};

export type PostToWordpressInput = {post: PostData};
export type PostToWordpressOutput = PostCreationResult;
