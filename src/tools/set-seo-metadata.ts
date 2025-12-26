import { WordPressClient } from '../wordpress-client.js';
import { SEOData, YoastSEOData, RankMathSEOData } from '../types.js';
import { MCPError } from '../utils/errors.js';

export const setSEOMetadataTool = async (params: {
  wpClient: WordPressClient;
  postId: number;
  seo: SEOData
}) => {
  try {
    const { wpClient, postId, seo } = params;
    const meta: Record<string, any> = {};

    if (seo.plugin === 'yoast') {
      const d = seo.data as YoastSEOData;
      if (d.title) meta._yoast_wpseo_title = d.title;
      if (d.metaDescription) meta._yoast_wpseo_metadesc = d.metaDescription;
      if (d.focusKeyword) meta._yoast_wpseo_focuskw = d.focusKeyword;
      if (d.metaRobotsNoindex) meta._yoast_wpseo_meta_robots_noindex = d.metaRobotsNoindex;
      if (d.metaRobotsNofollow) meta._yoast_wpseo_meta_robots_nofollow = d.metaRobotsNofollow;
      if (d.canonicalUrl) meta._yoast_wpseo_canonical = d.canonicalUrl;
      if (d.opengraphTitle) meta._yoast_wpseo_opengraph_title = d.opengraphTitle;
      if (d.opengraphDescription) meta._yoast_wpseo_opengraph_description = d.opengraphDescription;
      if (d.opengraphImage) meta._yoast_wpseo_opengraph_image = d.opengraphImage;
      if (d.twitterTitle) meta._yoast_wpseo_twitter_title = d.twitterTitle;
      if (d.twitterDescription) meta._yoast_wpseo_twitter_description = d.twitterDescription;
      if (d.twitterImage) meta._yoast_wpseo_twitter_image = d.twitterImage;
    } else {
      const d = seo.data as RankMathSEOData;
      if (d.title) meta.rank_math_title = d.title;
      if (d.description) meta.rank_math_description = d.description;
      if (d.focusKeyword) meta.rank_math_focus_keyword = d.focusKeyword;
      if (d.robotsIndex) meta.rank_math_robots = d.robotsIndex;
      if (d.canonicalUrl) meta.rank_math_canonical = d.canonicalUrl;
      if (d.ogTitle) meta.rank_math_facebook_title = d.ogTitle;
      if (d.ogDescription) meta.rank_math_facebook_description = d.ogDescription;
      if (d.ogImage) meta.rank_math_facebook_image = d.ogImage;
    }

    await wpClient.updatePostMeta(postId, meta);

    return {
      success: true,
      fields: Object.keys(meta),
      message: `SEO metadata set successfully for post ${postId}`
    };
  } catch (err: any) {
    throw new MCPError('set_seo_metadata_error', 'Failed to set SEO metadata', { original: err?.message });
  }
};

export type SetSEOMetadataInput = { postId: number; seo: SEOData };
