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
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: `${this.config.url}/wp-json`,
      auth: {
        username: this.config.username,
        password: this.config.appPassword,
      },
      headers: {
        'User-Agent': 'wordpress-mcp-server/0.1.0',
      },
    });
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
