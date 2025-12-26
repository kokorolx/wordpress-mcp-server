export interface WordPressConfig {
  url: string;
  username: string;
  appPassword: string;
}

export interface MediaResult {
  id: number;
  url: string;
  source_url: string;
  title: string;
  alt_text: string;
  caption: string;
  description: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, {
      file: string;
      width: number;
      height: number;
      mime_type: string;
      source_url: string;
    }>;
  };
}

export type MediaUploadResult = Pick<MediaResult, 'id' | 'url'>;

// Taxonomy (Category/Tag) types
export interface TaxonomyBase {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryData {
  name: string;
  slug?: string;
  description?: string;
  parent?: number;
}

export interface CategoryResult extends TaxonomyBase {
  description: string;
  parent: number;
  count: number;
  link: string;
}

export interface TagData {
  name: string;
  slug?: string;
  description?: string;
}

export interface TagResult extends TaxonomyBase {
  description: string;
  count: number;
  link: string;
}

export interface TaxonomyMinimal {
  id: number;
  name: string;
}

export interface YoastSEOData {
  title?: string;
  metaDescription?: string;
  focusKeyword?: string;
  metaRobotsNoindex?: '0' | '1';
  metaRobotsNofollow?: '0' | '1';
  canonicalUrl?: string;
  breadcrumbTitle?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCardType?: 'summary' | 'summary_large_image';
}

export interface RankMathSEOData {
  title?: string;
  description?: string;
  focusKeyword?: string;
  robotsIndex?: 'index' | 'noindex';
  robotsFollow?: 'follow' | 'nofollow';
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCardType?: 'summary' | 'summary_large_image';
}

export type SEOData = { plugin: 'yoast'; data: YoastSEOData } | { plugin: 'rankmath'; data: RankMathSEOData };

export interface PostData {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: number[];
  tags?: number[];
  featuredMedia?: number;
  yoast?: YoastSEOData; // Legacy support
  seo?: SEOData;
}

export interface PostCreationResult {
  id: number;
  link: string;
}
