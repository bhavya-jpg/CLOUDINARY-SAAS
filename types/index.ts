export interface Video {
  id: string;
  title: string;
  description: string;
  publicId: string;
  originalSize: number;
  compressedSize: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  
  // AI-powered preview and quality options
  aiPreviewUrl?: string; // AI-generated preview with key moments
  thumbnailUrl?: string; // Optimized thumbnail
  highQualityUrl?: string; // High-quality compressed version
  originalQualityUrl?: string; // Original quality version
  keyMoments?: string[]; // Array of timestamps for key moments
  compressionRatio?: number; // Compression ratio (0-1)
  previewDuration?: number; // Duration of AI preview in seconds
}
