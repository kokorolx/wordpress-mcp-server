import { MCPError } from '../utils/errors.js';

export const generateImagePromptsTool = async (params: {
  blogTitle: string;
  sections?: Array<{ title: string; description: string }>;
  style?: 'professional' | 'modern' | 'minimalist' | 'vibrant' | 'technical';
}) => {
  try {
    const { blogTitle, sections, style = 'professional' } = params;

    // In a real scenario, this might involve some AI logic,
    // but here we are providing a tool for the AI assistant to call
    // to structure its own prompt generation.

    const styleDescriptions = {
      professional: 'Clean, corporate, trust-building, high-quality photography or realistic 3D render',
      modern: 'Sleek, trendy, using gradients and contemporary design elements',
      minimalist: 'Simple, spacious, focused on a single concept, neutral colors',
      vibrant: 'High energy, bold colors, dynamic composition',
      technical: 'Schematic-inspired, detailed, showing internal workings or code'
    };

    const chosenStyle = styleDescriptions[style];

    const featuredImage = {
      prompt: `${chosenStyle} featured image for a blog post titled "${blogTitle}". Concept: evocative of the main theme, visually striking, 16:9 aspect ratio.`,
      altText: `Featured image for ${blogTitle}`,
      suggestedPlacement: 'featured'
    };

    const sectionImages = (sections || []).map(section => ({
      sectionTitle: section.title,
      prompt: `${chosenStyle} illustrative image for section "${section.title}". Focus on: ${section.description}. 3:2 aspect ratio.`,
      altText: `Illustration for ${section.title}`,
      suggestedPlacement: `after_${section.title.toLowerCase().replace(/\s+/g, '_')}`
    }));

    return {
      success: true,
      style: style,
      featuredImage,
      sectionImages
    };
  } catch (err: any) {
    throw new MCPError('generate_image_prompts_error', 'Failed to generate image prompts', { original: err?.message });
  }
};

export type GenerateImagePromptsInput = {
  blogTitle: string;
  sections?: Array<{ title: string; description: string }>;
  style?: 'professional' | 'modern' | 'minimalist' | 'vibrant' | 'technical';
};
