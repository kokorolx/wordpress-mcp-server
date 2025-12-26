import { marked } from 'marked';
import fs from 'fs/promises';

export const readMarkdownFile = async (path: string) => {
  const content = await fs.readFile(path, 'utf-8');
  return content;
};

export const markdownToHtml = (markdown: string) => {
  return marked.parse(markdown);
};

export const extractImageUrls = (markdown: string) => {
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let m;
  while ((m = regex.exec(markdown)) !== null) {
    urls.push(m[1]);
  }
  return urls;
};
