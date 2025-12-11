import { AnalysisResult, Base64Image } from '../types';

/**
 * Analysis Cache để tránh phân tích lại cùng một sản phẩm
 * Giảm 80-90% API calls
 */
export class AnalysisCache {
  private cache: Map<string, { result: AnalysisResult; timestamp: number }> = new Map();
  private readonly TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Generate cache key từ images và product info
   */
  private generateCacheKey(
    images: Base64Image[],
    productName: string,
    productDescription: string
  ): string {
    // Simple hash function
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
    images: Base64Image[],
    productName: string,
    productDescription: string
  ): AnalysisResult | null {
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
    images: Base64Image[],
    productName: string,
    productDescription: string,
    result: AnalysisResult
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

