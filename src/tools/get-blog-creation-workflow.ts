
export const getBlogCreationWorkflowTool = async () => {
  return {
    steps: [
      {
        step: 1,
        name: 'Research',
        tool: 'save-research-data',
        description: 'Gather information and key points for the blog topic.'
      },
      {
        step: 2,
        name: 'Outline',
        tool: 'create-blog-outline',
        description: 'Create a structured outline based on the research.'
      },
      {
        step: 3,
        name: 'Content Draft',
        tool: 'save-blog-content',
        description: 'Write the blog content in Markdown format.'
      },
      {
        step: 4,
        name: 'Images',
        tools: ['generate-image-prompts', 'upload-media'],
        description: 'Generate prompts for images, create them (external), and upload them to WordPress via upload-media (optimizes automatically).'
      },
      {
        step: 5,
        name: 'Conversion',
        tool: 'convert-markdown-to-html',
        description: 'Convert the Markdown content to HTML for WordPress.'
      },
      {
        step: 6,
        name: 'Publish/Update',
        tool: 'post-to-wordpress',
        description: 'Create a new post or update an existing one using ID or Slug. SEO metadata will be applied automatically.'
      }
    ]
  };
};
