import { WordPressClient } from '../wordpress-client.js';
import { CategoryData, CategoryResult } from '../types.js';
import { MCPError } from '../utils/errors.js';

export const createCategoryTool = async (params: { wpClient: WordPressClient; category: CategoryData }) => {
  try {
    const { wpClient, category } = params;

    // Check if category already exists
    const existing = await wpClient.findCategoryByName(category.name);
    if (existing) {
      return {
        created: false,
        category: existing,
        message: `Category "${category.name}" already exists`
      };
    }

    // Create new category
    const result = await wpClient.createCategory(category);
    return {
      created: true,
      category: result,
      message: `Category "${result.name}" created successfully`
    };
  } catch (err: any) {
    throw new MCPError('create_category_error', 'Failed to create category', { original: err?.message });
  }
};

export type CreateCategoryInput = { category: CategoryData };
export type CreateCategoryOutput = {
  created: boolean;
  category: CategoryResult;
  message: string;
};
