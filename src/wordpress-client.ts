import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import {
  WordPressConfig,
  MediaUploadResult,
  MediaResult,
  PostCreationResult,
  CategoryData,
  CategoryResult,
  TagData,
  TagResult,
  TaxonomyMinimal
} from './types.js';

export class WordPressClient {
  private axios: AxiosInstance;
  public readonly config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
    const axiosConfig: any = {
      baseURL: `${this.config.url}/wp-json`,
      headers: {
        'User-Agent': 'wordpress-mcp-server/0.1.0',
      },
    };

    if (this.config.username && this.config.appPassword) {
      axiosConfig.auth = {
        username: this.config.username,
        password: this.config.appPassword,
      };
    }

    this.axios = axios.create(axiosConfig);
  }

  private async getAuthToken(): Promise<string> {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token is required for GraphQL operations');
    }

    if (!this.config.graphQlUrl) {
      throw new Error('GraphQL URL is required for GraphQL operations');
    }

    const mutation = `
      mutation RefreshAuthToken($refreshToken: String!) {
        refreshJwtAuthToken(input: {jwtRefreshToken: $refreshToken}) {
          authToken
        }
      }
    `;

    try {
      const response = await axios.post(
        this.config.graphQlUrl,
        {
          query: mutation,
          variables: { refreshToken: this.config.refreshToken },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data.refreshJwtAuthToken.authToken;
    } catch (error: any) {
      throw new Error(`Failed to refresh auth token: ${error.message}`);
    }
  }

  async createPostGraphQL(data: any): Promise<PostCreationResult> {
    if (!this.config.graphQlUrl) {
      throw new Error('GraphQL URL is not configured');
    }

    const authToken = await this.getAuthToken();

    // Convert REST API data format to GraphQL input format
    // Note: This is a basic mapping, might need adjustment based on specific schema
    const input: any = {
      title: data.title,
      content: data.content,
      status: data.status ? data.status.toUpperCase() : 'DRAFT',
    };

    if (data.excerpt) input.excerpt = data.excerpt;

    // Handle integer IDs for categories and tags
    if (data.categories && Array.isArray(data.categories)) {
      input.categories = {
        nodes: data.categories.map((id: number) => ({ databaseId: id })),
      };
    }

    if (data.tags && Array.isArray(data.tags)) {
      input.tags = {
        nodes: data.tags.map((id: number) => ({ databaseId: id })),
      };
    }

    if (data.featured_media) {
      input.featuredImage = {
        node: { databaseId: data.featured_media },
      };
    }

    // Support for SEO fields (Yoast/RPGraphQL)
    if (data.seo) {
       // Check if it's Yoast or minimal format
       const seoData = data.seo.data || data.seo;

       input.seo = {
         title: seoData.title,
         metaDesc: seoData.metaDescription || seoData.description,
         focuskw: seoData.focusKeyword,
         canonical: seoData.canonicalUrl,
         metaRobotsNoindex: seoData.metaRobotsNoindex === '1' ? 'noindex' : undefined,
         metaRobotsNofollow: seoData.metaRobotsNofollow === '1' ? 'nofollow' : undefined,
         opengraphTitle: seoData.opengraphTitle || seoData.ogTitle,
         opengraphDescription: seoData.opengraphDescription || seoData.ogDescription,
         opengraphImage: { mediaItem: { url: seoData.opengraphImage || seoData.ogImage } },
         twitterTitle: seoData.twitterTitle,
         twitterDescription: seoData.twitterDescription,
         twitterImage: { mediaItem: { url: seoData.twitterImage } },
       };

       // Remove undefined keys
       Object.keys(input.seo).forEach(key => input.seo[key] === undefined && delete input.seo[key]);
    }

    // Support for Unified SEO field mapping if present in data
    // The data passed here is 'payload' from post-to-wordpress.ts which might not have 'seo' directly if it was constructed for REST
    // But we might need to change how data is passed if we want to support SEO via GraphQL mutations aka 'updateSEO' or similar extensions.
    // For now, let's Stick to core post creation.

    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          post {
            databaseId
            link
            # If we need to verify status etc.
          }
        }
      }
    `;

    try {
      const response = await axios.post(
        this.config.graphQlUrl,
        {
          query: mutation,
          variables: { input },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      const post = response.data.data.createPost.post;
      return {
        id: post.databaseId,
        link: post.link,
      };
    } catch (error: any) {
      throw new Error(`Failed to create post via GraphQL: ${error.message}`);
    }
  }

  async runGraphQL(query: string, variables?: any): Promise<any> {
    if (!this.config.graphQlUrl) {
      throw new Error('GraphQL URL is not configured');
    }

    const authToken = await this.getAuthToken();

    try {
      const response = await axios.post(
        this.config.graphQlUrl,
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to run GraphQL query: ${error.message}`);
    }
  }

  /**
   * Upload media to WordPress. Accepts local file path or buffer with filename
   */
  async uploadMediaFromFile(filePath: string, metadata?: { title?: string; alt_text?: string; caption?: string; description?: string }, mimeType?: string): Promise<MediaResult> {
    const filename = path.basename(filePath);
    const stream = fs.createReadStream(filePath);
    const headers: any = {
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    };
    if (mimeType) headers['Content-Type'] = mimeType;

    const res = await this.axios.post('/wp/v2/media', stream, { headers });

    // If metadata provided, update the media object
    if (metadata && Object.keys(metadata).length > 0) {
      return this.updateMedia(res.data.id, metadata);
    }

    return res.data;
  }

  async uploadMediaFromBuffer(buffer: Buffer, filename: string, mimeType: string, metadata?: { title?: string; alt_text?: string; caption?: string; description?: string }): Promise<MediaResult> {
    const headers: any = {
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
      'Content-Type': mimeType,
    };
    const res = await this.axios.post('/wp/v2/media', buffer, { headers });

    // If metadata provided, update the media object
    if (metadata && Object.keys(metadata).length > 0) {
      return this.updateMedia(res.data.id, metadata);
    }

    return res.data;
  }

  async updateMedia(mediaId: number, data: { title?: string; alt_text?: string; caption?: string; description?: string }): Promise<MediaResult> {
    const res = await this.axios.post(`/wp/v2/media/${mediaId}`, data);
    return res.data;
  }

  async createPost(data: any): Promise<PostCreationResult> {
    const res = await this.axios.post('/wp/v2/posts', data);
    return { id: res.data.id, link: res.data.link };
  }

  async updatePostMeta(postId: number, meta: Record<string, any>) {
    // WordPress REST API requires updating post meta via /wp/v2/posts/<id> with meta field
    const res = await this.axios.post(`/wp/v2/posts/${postId}`, { meta });
    return res.data;
  }

  async updatePost(postId: number, data: any): Promise<PostCreationResult> {
    const res = await this.axios.post(`/wp/v2/posts/${postId}`, data);
    return { id: res.data.id, link: res.data.link };
  }

  async findPostBySlug(slug: string): Promise<PostCreationResult | null> {
    const res = await this.axios.get('/wp/v2/posts', { params: { slug, context: 'edit' } });
    if (res.data && res.data.length > 0) {
      return { id: res.data[0].id, link: res.data[0].link };
    }
    return null;
  }

  // Category management
  async createCategory(data: CategoryData): Promise<CategoryResult> {
    const res = await this.axios.post('/wp/v2/categories', data);
    return {
      id: res.data.id,
      name: res.data.name,
      slug: res.data.slug,
      description: res.data.description,
      parent: res.data.parent,
      count: res.data.count,
      link: res.data.link
    };
  }

  async getCategories(params?: { search?: string; per_page?: number; minimal?: boolean }): Promise<CategoryResult[] | TaxonomyMinimal[]> {
    const queryParams: any = {
      per_page: params?.per_page || 100,
    };
    if (params?.search) queryParams.search = params.search;

    const res = await this.axios.get('/wp/v2/categories', { params: queryParams });

    if (params?.minimal) {
      return res.data.map((cat: any) => ({ id: cat.id, name: cat.name }));
    }

    return res.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parent: cat.parent,
      count: cat.count,
      link: cat.link
    }));
  }

  async findCategoryByName(name: string): Promise<CategoryResult | null> {
    const res = await this.axios.get('/wp/v2/categories', { params: { search: name } });
    const exactMatch = res.data.find((cat: any) => cat.name.toLowerCase() === name.toLowerCase());

    if (!exactMatch) return null;

    return {
      id: exactMatch.id,
      name: exactMatch.name,
      slug: exactMatch.slug,
      description: exactMatch.description,
      parent: exactMatch.parent,
      count: exactMatch.count,
      link: exactMatch.link
    };
  }

  // Tag management
  async createTag(data: TagData): Promise<TagResult> {
    const res = await this.axios.post('/wp/v2/tags', data);
    return {
      id: res.data.id,
      name: res.data.name,
      slug: res.data.slug,
      description: res.data.description,
      count: res.data.count,
      link: res.data.link
    };
  }

  async getTags(params?: { search?: string; per_page?: number; minimal?: boolean }): Promise<TagResult[] | TaxonomyMinimal[]> {
    const queryParams: any = {
      per_page: params?.per_page || 100,
    };
    if (params?.search) queryParams.search = params.search;

    const res = await this.axios.get('/wp/v2/tags', { params: queryParams });

    if (params?.minimal) {
      return res.data.map((tag: any) => ({ id: tag.id, name: tag.name }));
    }

    return res.data.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      count: tag.count,
      link: tag.link
    }));
  }

  async findTagByName(name: string): Promise<TagResult | null> {
    const res = await this.axios.get('/wp/v2/tags', { params: { search: name } });
    const exactMatch = res.data.find((tag: any) => tag.name.toLowerCase() === name.toLowerCase());

    if (!exactMatch) return null;

    return {
      id: exactMatch.id,
      name: exactMatch.name,
      slug: exactMatch.slug,
      description: exactMatch.description,
      count: exactMatch.count,
      link: exactMatch.link
    };
  }
}
