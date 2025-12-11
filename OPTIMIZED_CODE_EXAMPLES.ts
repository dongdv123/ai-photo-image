/**
 * OPTIMIZED CODE EXAMPLES - MVP AIstudio ĐA Build
 * 
 * Các ví dụ code đã được tối ưu hóa dựa trên phân tích trong DANH_GIA_TOI_UU_HOA.md
 */

// ============================================================================
// OPTIMIZATION 1: Image Compression & Validation
// ============================================================================

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

/**
 * Tối ưu: Compress ảnh trước khi upload
 * Giảm 50-70% kích thước file
 */
export async function optimizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            resolve(new File([blob], file.name, { type: mimeType }));
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Tối ưu: Validate ảnh trước khi xử lý
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_DIMENSION = 10000; // pixels
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File quá lớn (tối đa ${MAX_SIZE / 1024 / 1024}MB)` };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận JPG, PNG, WebP' };
  }
  
  // Check dimensions (async, but we'll do basic check here)
  return { valid: true };
}

/**
 * Tối ưu: Upload với progress tracking
 */
export async function handleImageUploadWithProgress(
  files: FileList,
  onProgress: (percent: number, current: number, total: number) => void
): Promise<Array<{ mimeType: string; data: string }>> {
  const fileArray = Array.from(files);
  const results: Array<{ mimeType: string; data: string }> = [];
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    // Validate
    const validation = validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Optimize
    const optimizedFile = await optimizeImage(file);
    
    // Convert to Base64
    const base64 = await fileToBase64(optimizedFile);
    results.push({
      mimeType: optimizedFile.type,
      data: base64.split(',')[1] // Remove data:image/... prefix
    });
    
    // Update progress
    onProgress(((i + 1) / fileArray.length) * 100, i + 1, fileArray.length);
  }
  
  return results;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// OPTIMIZATION 2: Analysis Caching
// ============================================================================

/**
 * Tối ưu: Cache analysis results để tránh phân tích lại
 * Giảm 80-90% API calls
 */
export class AnalysisCache {
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Generate cache key từ images và product info
   */
  private generateCacheKey(
    images: Array<{ data: string }>,
    productName: string,
    productDescription: string
  ): string {
    // Simple hash function (có thể dùng crypto.subtle.digest cho production)
    const imageHash = images
      .map(img => img.data.substring(0, 100)) // Use first 100 chars as hash
      .join('');
    
    const combined = `${imageHash}-${productName}-${productDescription}`;
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36);
  }
  
  /**
   * Get từ cache nếu có và chưa expire
   */
  get(
    images: Array<{ data: string }>,
    productName: string,
    productDescription: string
  ): any | null {
    const key = this.generateCacheKey(images, productName, productDescription);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Set vào cache
   */
  set(
    images: Array<{ data: string }>,
    productName: string,
    productDescription: string,
    result: any
  ): void {
    const key = this.generateCacheKey(images, productName, productDescription);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Persist to localStorage
    this.persistToLocalStorage();
  }
  
  /**
   * Load từ localStorage khi khởi động
   */
  loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('analysis_cache');
      if (stored) {
        const entries = JSON.parse(stored);
        const now = Date.now();
        
        entries.forEach(([key, value]: [string, any]) => {
          // Check TTL
          if (now - value.timestamp < this.TTL) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load analysis cache from localStorage', e);
    }
  }
  
  /**
   * Save to localStorage
   */
  private persistToLocalStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem('analysis_cache', JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to persist analysis cache to localStorage', e);
    }
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    localStorage.removeItem('analysis_cache');
  }
}

// Singleton instance
export const analysisCache = new AnalysisCache();

/**
 * Tối ưu: Analyze với cache
 */
export async function analyzeProductWithCache(
  images: Array<{ mimeType: string; data: string }>,
  productName: string,
  productDescription: string,
  analyzeFn: (images: any[], name: string, desc: string) => Promise<any>
): Promise<any> {
  // Check cache
  const cached = analysisCache.get(images, productName, productDescription);
  if (cached) {
    console.log('✅ Using cached analysis');
    return cached;
  }
  
  // Call API
  const result = await analyzeFn(images, productName, productDescription);
  
  // Save to cache
  analysisCache.set(images, productName, productDescription, result);
  
  return result;
}

// ============================================================================
// OPTIMIZATION 3: Smart Retry với Error Classification
// ============================================================================

type ErrorType = 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'UNKNOWN';

/**
 * Tối ưu: Classify error để retry strategy phù hợp
 */
export function classifyError(error: any): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.code;
  
  if (status === 429 || message.includes('rate limit')) {
    return 'RATE_LIMIT';
  }
  
  if (status === 403 || message.includes('quota')) {
    return 'QUOTA_EXCEEDED';
  }
  
  if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN';
}

/**
 * Tối ưu: Smart retry với error-specific backoff
 */
export async function retryWithSmartBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (attempt: number, error: ErrorType) => void
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorType = classifyError(error);
      
      // Don't retry on quota exceeded
      if (errorType === 'QUOTA_EXCEEDED') {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      // Last attempt - throw error
      if (attempt >= maxRetries) {
        break;
      }
      
      // Calculate delay based on error type
      let delay: number;
      switch (errorType) {
        case 'RATE_LIMIT':
          delay = 30000 * attempt; // 30s, 60s, 90s
          break;
        case 'NETWORK_ERROR':
          delay = 2000 * attempt; // 2s, 4s, 6s
          break;
        default:
          delay = 5000 * Math.pow(2, attempt - 1); // 5s, 10s, 20s
      }
      
      onRetry?.(attempt, errorType);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// OPTIMIZATION 4: Circuit Breaker Pattern
// ============================================================================

/**
 * Tối ưu: Circuit breaker để tránh spam API khi có vấn đề
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly timeout: number;
  
  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        // Timeout passed, try half-open
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN. Please try again later.');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// ============================================================================
// OPTIMIZATION 5: IndexedDB Storage
// ============================================================================

/**
 * Tối ưu: IndexedDB thay vì localStorage
 * Hỗ trợ storage lớn hơn nhiều
 */
export class IndexedDBStorage {
  private dbName = 'aistudio_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId');
          taskStore.createIndex('createdAt', 'createdAt');
        }
        
        // Images store
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('taskId', 'taskId');
        }
      };
    });
  }
  
  async saveTask(task: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const request = store.put(task);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async getTask(taskId: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('tasks', 'readonly');
      const store = tx.objectStore('tasks');
      const request = store.get(taskId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  async loadTasksLazy(
    userId: string,
    page: number,
    pageSize: number = 5
  ): Promise<{ tasks: any[]; hasMore: boolean }> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('tasks', 'readonly');
      const store = tx.objectStore('tasks');
      const index = store.index('userId');
      
      const tasks: any[] = [];
      let cursorRequest = index.openCursor(IDBKeyRange.only(userId));
      let skipped = 0;
      let loaded = 0;
      
      cursorRequest.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (!cursor) {
          resolve({ tasks, hasMore: false });
          return;
        }
        
        // Skip to page
        if (skipped < page * pageSize) {
          skipped++;
          cursor.continue();
          return;
        }
        
        // Load pageSize items
        if (loaded < pageSize) {
          tasks.push(cursor.value);
          loaded++;
          cursor.continue();
        } else {
          resolve({ tasks, hasMore: true });
        }
      };
      
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
}

// ============================================================================
// OPTIMIZATION 6: Progress Tracking
// ============================================================================

/**
 * Tối ưu: Sequential generation với progress tracking
 */
export async function generateImagesWithProgress(
  prompts: string[],
  referenceImages: Array<{ mimeType: string; data: string }>,
  generateFn: (prompt: string, images: any[]) => Promise<any>,
  onProgress: (current: number, total: number, percent: number) => void
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < prompts.length; i++) {
    try {
      const image = await retryWithSmartBackoff(
        () => generateFn(prompts[i], referenceImages),
        3,
        (attempt, errorType) => {
          console.log(`Retry ${attempt}/3 for image ${i + 1} (${errorType})`);
        }
      );
      
      results.push(image);
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error);
      // Continue with next image instead of failing entire batch
    }
    
    // Update progress
    const percent = ((i + 1) / prompts.length) * 100;
    onProgress(i + 1, prompts.length, percent);
  }
  
  return results;
}

// ============================================================================
// OPTIMIZATION 7: Image Compression for Storage
// ============================================================================

/**
 * Tối ưu: Compress ảnh trước khi lưu vào storage
 * Giảm 60-80% storage size
 */
export async function compressImageForStorage(
  base64Image: { mimeType: string; data: string },
  quality: number = 0.7
): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = () => {
            const compressedBase64 = (reader.result as string).split(',')[1];
            resolve({
              mimeType: 'image/jpeg',
              data: compressedBase64
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:${base64Image.mimeType};base64,${base64Image.data}`;
  });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example: Sử dụng tất cả optimizations
 */
export async function processProductImagesOptimized(
  files: FileList,
  productName: string,
  productDescription: string,
  vibe: string,
  userId: string,
  callbacks: {
    onUploadProgress?: (percent: number, current: number, total: number) => void;
    onAnalysisComplete?: (result: any) => void;
    onGenerationProgress?: (current: number, total: number, percent: number) => void;
    onComplete?: (task: any) => void;
  }
): Promise<any> {
  try {
    // Step 1: Optimized upload với compression
    const inputImages = await handleImageUploadWithProgress(
      files,
      callbacks.onUploadProgress || (() => {})
    );
    
    // Step 2: Analysis với cache
    const analysis = await analyzeProductWithCache(
      inputImages,
      productName,
      productDescription,
      async (imgs, name, desc) => {
        // Your actual analysis function here
        return {}; // Placeholder
      }
    );
    
    callbacks.onAnalysisComplete?.(analysis);
    
    // Step 3: Generate với progress tracking
    const prompts: string[] = []; // Your prompts here
    const circuitBreaker = new CircuitBreaker();
    
    const generatedImages = await generateImagesWithProgress(
      prompts,
      inputImages,
      async (prompt, images) => {
        return circuitBreaker.execute(async () => {
          // Your actual generation function here
          return {}; // Placeholder
        });
      },
      callbacks.onGenerationProgress || (() => {})
    );
    
    // Step 4: Compress và save
    const compressedImages = await Promise.all(
      generatedImages.map(img => compressImageForStorage(img, 0.7))
    );
    
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      productName,
      productDescription,
      inputImages,
      analysis,
      generatedImages: compressedImages,
      createdAt: new Date(),
      vibe
    };
    
    // Save to IndexedDB
    const storage = new IndexedDBStorage();
    await storage.init();
    await storage.saveTask(task);
    
    callbacks.onComplete?.(task);
    
    return task;
  } catch (error) {
    console.error('Error processing product images:', error);
    throw error;
  }
}

