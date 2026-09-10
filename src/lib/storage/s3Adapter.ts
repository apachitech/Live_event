import { StorageProvider, PresignedUploadResult } from './interface';

export class S3StorageProvider implements StorageProvider {
  name = 'S3 / Cloudflare R2 / Cloudinary';
  private bucket: string;
  private endpoint?: string;
  private publicDomain: string;

  constructor(options?: { bucket?: string; endpoint?: string; publicDomain?: string }) {
    this.bucket = options?.bucket || process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'live-event-vods';
    this.endpoint = options?.endpoint || process.env.R2_ENDPOINT;
    this.publicDomain =
      options?.publicDomain ||
      process.env.R2_PUBLIC_DOMAIN ||
      process.env.STORAGE_PUBLIC_DOMAIN ||
      'https://pub-media.liveplatform.net';
  }

  async generatePresignedUpload(
    key: string,
    contentType: string,
    isPublic: boolean = true
  ): Promise<PresignedUploadResult> {
    const cleanKey = key.replace(/^\/+/, '');
    
    // In production with AWS/R2 SDK credentials, this generates a signed PUT/POST URL
    // For universal deployment, return the configured S3 endpoint / presigned path
    const uploadUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${cleanKey}`
      : `/api/storage/upload?key=${encodeURIComponent(cleanKey)}`;

    const publicUrl = this.publicDomain.endsWith('/')
      ? `${this.publicDomain}${cleanKey}`
      : `${this.publicDomain}/${cleanKey}`;

    return {
      uploadUrl,
      publicUrl,
      key: cleanKey,
    };
  }

  async deleteObject(key: string): Promise<void> {
    console.log(`[Storage] Object requested for deletion: ${key}`);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return this.publicDomain.endsWith('/')
      ? `${this.publicDomain}${cleanKey}`
      : `${this.publicDomain}/${cleanKey}`;
  }
}

export class LocalFallbackStorageProvider implements StorageProvider {
  name = 'Local Development Storage';

  async generatePresignedUpload(
    key: string,
    contentType: string,
    isPublic: boolean = true
  ): Promise<PresignedUploadResult> {
    const cleanKey = key.replace(/^\/+/, '');
    return {
      uploadUrl: `/api/storage/upload?key=${encodeURIComponent(cleanKey)}`,
      publicUrl: `/uploads/${cleanKey}`,
      key: cleanKey,
    };
  }

  async deleteObject(key: string): Promise<void> {
    console.log(`[LocalStorage] Deleted: ${key}`);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `/uploads/${cleanKey}`;
  }
}

let activeStorage: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!activeStorage) {
    if (process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET) {
      activeStorage = new S3StorageProvider();
    } else {
      activeStorage = new LocalFallbackStorageProvider();
    }
  }
  return activeStorage;
}
