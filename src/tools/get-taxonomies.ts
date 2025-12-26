import { WordPressClient } from '../wordpress-client.js';
import { CategoryResult, TagResult, TaxonomyMinimal } from '../types.js';
import { MCPError } from '../utils/errors.js';

export const getTaxonomiesTool = async (params: {
  wpClient: WordPressClient;
  type: 'category' | 'tag';
  search?: string;
  per_page?: number;
  minimal?: boolean;
}) => {
  try {
    const { wpClient, type, search, per_page = 100, minimal = true } = params;

    if (type === 'category') {
      const categories = await wpClient.getCategories({ search, per_page, minimal });
      return {
        type: 'category',
        count: categories.length,
        items: categories
      };
    } else {
      const tags = await wpClient.getTags({ search, per_page, minimal });
      return {
        type: 'tag',
        count: tags.length,
        items: tags
      };
    }
  } catch (err: any) {
    throw new MCPError('get_taxonomies_error', 'Failed to fetch taxonomies', { original: err?.message });
  }
};

export type GetTaxonomiesInput = {
  type: 'category' | 'tag';
  search?: string;
  per_page?: number;
  minimal?: boolean;
};

export type GetTaxonomiesOutput = {
  type: 'category' | 'tag';
  count: number;
  items: CategoryResult[] | TagResult[] | TaxonomyMinimal[];
};
