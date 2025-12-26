import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.mcp_storage');

export class Storage {
  private static async ensureDir() {
    try {
      await fs.access(STORAGE_DIR);
    } catch {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
  }

  static async save(type: string, id: string, data: any) {
    await this.ensureDir();
    const filePath = path.join(STORAGE_DIR, `${type}_${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  static async load(type: string, id: string) {
    try {
      const filePath = path.join(STORAGE_DIR, `${type}_${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  static async list(type: string) {
    await this.ensureDir();
    const files = await fs.readdir(STORAGE_DIR);
    return files
      .filter(f => f.startsWith(`${type}_`))
      .map(f => f.replace(`${type}_`, '').replace('.json', ''));
  }
}
