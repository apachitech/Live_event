export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  fields?: Record<string, string>;
}

export interface StorageProvider {
  name: string;
  generatePresignedUpload(
    key: string,
    contentType: string,
    isPublic?: boolean
  ): Promise<PresignedUploadResult>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
