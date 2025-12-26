import { Storage } from '../utils/storage.js';
import { MCPError } from '../utils/errors.js';

export interface OutlineSection {
  heading: string;
  level: 'h2' | 'h3';
  contentPoints: string[];
  wordCount?: number;
  imagePrompt?: string;
  subsections?: OutlineSection[];
}

export interface OutlineData {
  title: string;
  sections: OutlineSection[];
  seo: {
    metaDescription: string;
    focusKeyword: string;
    keywords: string[];
  };
  categories: string[];
  tags: string[];
}

export const createBlogOutlineTool = async (params: {
  topic: string;
  outlineData: OutlineData;
}) => {
  try {
    const { topic, outlineData } = params;
    const id = topic.toLowerCase().replace(/\s+/g, '_');

    await Storage.save('outline', id, outlineData);

    return {
      success: true,
      id: id,
      message: `Outline for "${outlineData.title}" processed successfully`
    };
  } catch (err: any) {
    throw new MCPError('create_outline_error', 'Failed to process blog outline', { original: err?.message });
  }
};

export type CreateBlogOutlineInput = { topic: string; outlineData: OutlineData };
