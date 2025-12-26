import { z } from 'zod';
import { MCPError } from '../utils/errors.js';
import { PostData } from '../types.js';

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'publish', 'pending']).optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featuredMedia: z.number().optional(),
  images: z.array(z.object({src: z.string(), alt: z.string().optional()})).optional(),
  yoast: z.object({
    title: z.string().optional(),
    metaDescription: z.string().optional(),
    focusKeyword: z.string().optional(),
    metaRobotsNoindex: z.union([z.literal('0'), z.literal('1')]).optional(),
    metaRobotsNofollow: z.union([z.literal('0'), z.literal('1')]).optional(),
  }).optional(),
});

export const validatePostTool = async (input: Partial<PostData>) => {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    throw new MCPError('validation_error', 'Post data validation failed', {errors: parsed.error.format()});
  }
  return parsed.data as PostData;
};

export type ValidatePostInput = Partial<PostData>;
export type ValidatePostOutput = PostData;
