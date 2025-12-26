import { z } from 'zod';
import { marked } from 'marked';

export const convertMarkdownTool = async (params: { markdown: string }) => {
  const html = await marked(params.markdown);
  return { html };
};
