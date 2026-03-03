/**
 * Storage abstraction for file uploads. Implementations: local disk, S3, etc.
 * Use for: logos, attachments, user uploads.
 */

export interface StorageResult {
  key: string;
  url: string;
  size?: number;
}

export interface StorageDriver {
  upload(buffer: Buffer, key: string, options?: { contentType?: string }): Promise<StorageResult>;
  getUrl(key: string): Promise<string> | string;
  delete(key: string): Promise<void>;
}

/**
 * Local driver: stores under a base path; URL is path-based. Replace with S3 driver in production.
 */
export function createLocalDriver(basePath: string, baseUrl: string): StorageDriver {
  return {
    async upload(buffer: Buffer, key: string): Promise<StorageResult> {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const fullPath = path.join(basePath, key);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
      return { key, url: `${baseUrl}/${key}`, size: buffer.length };
    },
    getUrl(key: string): string {
      return `${baseUrl}/${key}`;
    },
    async delete(key: string): Promise<void> {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.unlink(path.join(basePath, key)).catch(() => {});
    },
  };
}

/** Default: no-op driver until storage is configured. */
export const storage: StorageDriver = {
  async upload(): Promise<StorageResult> {
    throw new Error("Storage not configured; set STORAGE_DRIVER and paths or use S3");
  },
  getUrl(): string {
    return "";
  },
  async delete(): Promise<void> {},
};
