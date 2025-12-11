export interface Base64Image {
  mimeType: string;
  data: string; // Base64 string without data:image/... prefix
}

export interface AnalysisResult {
  analysis: {
    sketch: string;
    dimensions: Record<string, {
      label: string;
      description: string;
      estimate: string; // "15cm"
    }>;
    materials: {
      primary: string;
      secondary?: string;
      location: string;
      description: string;
    };
  };
  seo: {
    titles: string[];
    tags: string[][]; // 2 sets of 13 tags
  };
}

export interface ImagePlan {
  angle: string;
  background: string;
  description: string;
}

export interface Task {
  id: string;
  userId: string;
  productName: string;
  productDescription: string;
  inputImages: Base64Image[];
  analysis: AnalysisResult;
  generatedImages: Base64Image[];
  createdAt: Date;
  vibe: string;
}

export type ErrorType = 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'UNKNOWN';

export type GeminiModel = 'flash' | 'pro' | 'auto';

export interface ModelSettings {
  analysisModel: GeminiModel;
  imageModel: GeminiModel;
  useCache: boolean;
}

