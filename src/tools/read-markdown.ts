import { readMarkdownFile } from '../utils/markdown-parser.js';
import { MCPError } from '../utils/errors.js';

export const readMarkdownTool = async (params: {path: string}) => {
  try {
    const content = await readMarkdownFile(params.path);
    return { ok: true, content };
  } catch (err: any) {
    throw new MCPError('read_markdown_error', 'Failed to read markdown file', { original: err?.message });
  }
};

export type ReadMarkdownInput = {path: string};
export type ReadMarkdownOutput = {content: string};
