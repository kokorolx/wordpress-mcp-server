import { Storage } from '../utils/storage.js';
import { MCPError } from '../utils/errors.js';

export const saveBlogContentTool = async (params: {
  topic: string;
  content: string;
}) => {
  try {
    const { topic, content } = params;
    const id = topic.toLowerCase().replace(/\s+/g, '_');

    await Storage.save('content', id, { topic, content, timestamp: new Date().toISOString() });

    return {
      success: true,
      id: id,
      message: `Content for "${topic}" saved successfully`
    };
  } catch (err: any) {
    throw new MCPError('save_content_error', 'Failed to save blog content', { original: err?.message });
  }
};

export type SaveBlogContentInput = { topic: string; content: string };
