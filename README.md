# WordPress MCP Server

This MCP server provides a comprehensive suite of tools for AI-driven content creation and clinical WordPress management. It supports advanced features like research persistence, automated image hosting, unified SEO (Yoast/RankMath), and one-click complete blog publishing.

## Prerequisites

- **Node.js**: v24 or higher
- **WordPress**: A site with the REST API enabled and Application Passwords configured.

## Installation

1. Copy `.env.example` to `.env` and set your WordPress credentials.
2. Install dependencies:

```bash
cd wordpress-mcp-server
npm install
```

## Build

```bash
npm run build
```

### Quick Start (npx)
You can run the server directly using `npx` with inline configuration:

```bash
env WORDPRESS_URL=https://your-site.com \
    WORDPRESS_USERNAME=your-username \
    WORDPRESS_APP_PASSWORD=your-app-password \
    npx wordpress-mcp-server
```

### Local Deployment
- Development (requires ts-node):
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm run build
  npm start
  ```

### Docker Deployment
The project includes a multi-stage Docker build for optimized hosting.

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Tools

### 📁 Taxonomy Management
- `create-category`: Create or find categories with hierarchical support.
- `create-tag`: Create or find tags.
- `get-taxonomies`: Optimized taxonomies retrieval (minimal mode available).

### 🖼 Media & Images
- `upload-media`: Batch upload media with titles, alt text, and captions.
- `generate-image-prompts`: Generate structured AI image prompts based on content.
- `embed-images-in-content`: Auto-upload and host images referenced in markdown.

### 📝 Content Orchestration
- `read-markdown`: Read local markdown files.
- `save-research-data` / `create-blog-outline` / `save-blog-content`: Persistent storage for AI brainstorming stages.
- `verify-blog-structure`: Pre-publish validation for SEO and quality.
- `post-to-wordpress`: Create post with unified SEO support.
- `create-complete-blog`: The orchestrator that handles the entire lifecycle in one go.

### 🔍 Search & SEO
- `set-seo-metadata`: Supports both **Yoast SEO** and **RankMath** plugins.

## Environment Variables

Key configuration options in `.env`:
- `SEO_PLUGIN`: Choose preferred plugin (`yoast` or `rankmath`).
- `AUTO_GENERATE_FEATURED_IMAGE`: Control automation settings.
- `PROCESS_CONTENT_IMAGES`: Toggle automated image hosting.

See `.env.example` for the full list.

## Technical Details

- Built with `@modelcontextprotocol/sdk` v1.25.1.
- Uses `McpServer` high-level API.
- Implements `NodeNext` ESM module resolution.
- Uses WordPress Application Passwords for authentication.
