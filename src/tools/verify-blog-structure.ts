import { MCPError } from '../utils/errors.js';

export interface BlogData {
  title: string;
  content: string;
  seo?: {
    metaDescription?: string;
    focusKeyword?: string;
  };
  categories?: string[];
  tags?: string[];
  featuredMedia?: number | string;
}

export const verifyBlogStructureTool = async (params: { blog: BlogData }) => {
  try {
    const { blog } = params;
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title checks
    if (!blog.title) {
      errors.push('Title is missing');
      score -= 50;
    } else {
      if (blog.title.length < 30) warnings.push('Title is quite short (less than 30 chars)');
      if (blog.title.length > 60) warnings.push('Title is quite long (over 60 chars)');
    }

    // Content checks
    if (!blog.content) {
      errors.push('Content is missing');
      score -= 50;
    } else {
      const wordCount = blog.content.split(/\s+/).length;
      if (wordCount < 300) warnings.push(`Content is thin (${wordCount} words). Recommended > 600.`);

      // Heading hierarchy check
      const h2Count = (blog.content.match(/^## /gm) || []).length;
      if (h2Count < 2) suggestions.push('Consider adding more H2 subheadings for better structure');

      // HTML check if it looks like HTML
      if (blog.content.includes('<') && blog.content.includes('>') && !blog.content.includes('</')) {
        warnings.push('Content contains HTML tags that might not be closed correctly');
      }
    }

    // SEO checks
    if (blog.seo) {
      if (!blog.seo.metaDescription) {
        warnings.push('Meta description is missing');
        score -= 5;
      } else {
        if (blog.seo.metaDescription.length < 120) suggestions.push('Meta description is short, try to use 150-160 characters');
      }

      if (blog.seo.focusKeyword && blog.content && !blog.content.toLowerCase().includes(blog.seo.focusKeyword.toLowerCase())) {
        warnings.push(`Focus keyword "${blog.seo.focusKeyword}" not found in content`);
        score -= 5;
      }
    }

    // Taxonomies
    if (!blog.categories || blog.categories.length === 0) {
      warnings.push('No categories assigned');
      score -= 5;
    }
    if (!blog.tags || blog.tags.length < 3) {
      suggestions.push('Add at least 3-5 tags for better discoverability');
    }

    // Media
    if (!blog.featuredMedia) {
      warnings.push('Featured image is missing');
      score -= 10;
    }

    return {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      errors,
      warnings,
      suggestions,
      details: {
        wordCount: blog.content ? blog.content.split(/\s+/).length : 0,
        hasSEO: !!blog.seo,
        categoryCount: blog.categories?.length || 0,
        tagCount: blog.tags?.length || 0
      }
    };
  } catch (err: any) {
    throw new MCPError('verify_blog_error', 'Failed to verify blog structure', { original: err?.message });
  }
};
