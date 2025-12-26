import { WordPressClient } from '../wordpress-client.js';
import { TagData, TagResult } from '../types.js';
import { MCPError } from '../utils/errors.js';

export const createTagTool = async (params: { wpClient: WordPressClient; tag: TagData }) => {
  try {
    const { wpClient, tag } = params;

    // Check if tag already exists
    const existing = await wpClient.findTagByName(tag.name);
    if (existing) {
      return {
        created: false,
        tag: existing,
        message: `Tag "${tag.name}" already exists`
      };
    }

    // Create new tag
    const result = await wpClient.createTag(tag);
    return {
      created: true,
      tag: result,
      message: `Tag "${result.name}" created successfully`
    };
  } catch (err: any) {
    throw new MCPError('create_tag_error', 'Failed to create tag', { original: err?.message });
  }
};

export type CreateTagInput = { tag: TagData };
export type CreateTagOutput = {
  created: boolean;
  tag: TagResult;
  message: string;
};
