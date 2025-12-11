import { useState } from 'react';
import { Base64Image, AnalysisResult, GeminiModel } from '../types';
import { analyzeProductAndGenerateSeo, generateProductImage, createImageGenerationPlan, constructPromptsFromPlan } from '../services/geminiService';
import { retryWithSmartBackoff } from '../utils/retry';
import { analysisCache } from '../utils/cache';

export function useImageGeneration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Base64Image[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<GeminiModel>('auto');
  const [imageCount, setImageCount] = useState<number>(4);
  const [useParallel, setUseParallel] = useState<boolean>(true);

  const analyzeProduct = async (
    images: Base64Image[],
    productName: string,
    productDescription: string,
    modelTypeParam?: GeminiModel,
    useCache: boolean = true
  ) => {
    const effectiveModelType = modelTypeParam || modelType;
    setIsAnalyzing(true);
    setError(null);
    // Clear previous generated images when starting new analysis
    setGeneratedImages([]);

    try {
      // Check cache first (if enabled)
      if (useCache && effectiveModelType === 'auto') {
        const cached = analysisCache.get(images, productName, productDescription);
        if (cached) {
          console.log(`✅ Using cached analysis (saved API request) - Model: ${effectiveModelType}`);
          setAnalysis(cached);
          return cached;
        }
      }

      // Call API with selected model
      console.log(`📊 Analyzing product with model: ${effectiveModelType}`);
      const result = await analyzeProductAndGenerateSeo(images, productName, productDescription, effectiveModelType);
      
      // Save to cache
      analysisCache.set(images, productName, productDescription, result);
      
      setAnalysis(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze product';
      setError(errorMsg);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateImages = async (
    images: Base64Image[],
    analysis: AnalysisResult,
    productName: string,
    productDescription: string,
    vibe: string,
    imageCountParam?: number,
    useParallelParam?: boolean
  ) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const effectiveImageCount = imageCountParam || imageCount;
      const effectiveUseParallel = useParallelParam !== undefined ? useParallelParam : useParallel;
      
      // Create plan với số lượng ảnh được chọn
      const plan = createImageGenerationPlan(effectiveImageCount);
      const prompts = constructPromptsFromPlan(plan, analysis, vibe, productName, productDescription, images.length);

      setGenerationProgress({ current: 0, total: prompts.length });

      const shouldUseParallel = effectiveUseParallel && prompts.length > 2;
      console.log(`🖼️ Generating ${prompts.length} images with model: ${modelType} (${shouldUseParallel ? 'PARALLEL' : 'SEQUENTIAL'})`);
      console.log(`📸 Using ${images.length} reference image(s) - ${images.length > 1 ? 'merged together' : 'single image'}`);

      let results: Base64Image[] = [];

      if (shouldUseParallel) {
        // Parallel generation - tất cả ảnh reference được merge và gửi cùng lúc
        const imagePromises = prompts.map((prompt, index) =>
          retryWithSmartBackoff(
            () => generateProductImage(prompt, images, modelType), // Tất cả ảnh reference được merge
            3,
            (attempt, errorType) => {
              console.log(`Retry ${attempt}/3 for image ${index + 1} (${errorType}) - Model: ${modelType}`);
            }
          ).then(image => {
            console.log(`✅ Generated image ${index + 1}/${prompts.length}`);
            return { index, image };
          })
          .catch(err => {
            console.error(`❌ Failed to generate image ${index + 1}:`, err);
            return { index, image: null, error: err };
          })
        );

        const settledResults = await Promise.allSettled(imagePromises);

        const orderedResults: Array<{ index: number; image: Base64Image | null }> = [];
        settledResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            orderedResults.push(result.value);
          } else {
            console.error(`Promise rejected for image ${i + 1}:`, result.reason);
            orderedResults.push({ index: i, image: null });
          }
        });

        orderedResults.sort((a, b) => a.index - b.index);
        results = orderedResults
          .filter(item => item.image !== null)
          .map(item => item.image!);

        // Check if we got any results
        if (results.length === 0) {
          throw new Error('Failed to generate any images. Please check your API key and try again.');
        }

        console.log(`✅ Successfully generated ${results.length}/${prompts.length} images`);
        setGenerationProgress({ current: prompts.length, total: prompts.length });
      } else {
        // Sequential generation - tất cả ảnh reference được merge và gửi cùng lúc
        for (let i = 0; i < prompts.length; i++) {
          try {
            const image = await retryWithSmartBackoff(
              () => generateProductImage(prompts[i], images, modelType), // Tất cả ảnh reference được merge
              3,
              (attempt, errorType) => {
                console.log(`Retry ${attempt}/3 for image ${i + 1} (${errorType}) - Model: ${modelType}`);
              }
            );

            console.log(`✅ Generated image ${i + 1}/${prompts.length}`);
            results.push(image);
          } catch (err: any) {
            console.error(`❌ Failed to generate image ${i + 1}:`, err);
            // Continue with next image instead of failing entire batch
          }

          // Update progress
          setGenerationProgress({ current: i + 1, total: prompts.length });
        }

        // Check if we got any results
        if (results.length === 0) {
          throw new Error('Failed to generate any images. Please check your API key and try again.');
        }

        console.log(`✅ Successfully generated ${results.length}/${prompts.length} images`);
      }

      setGeneratedImages(results);
      return results;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate images';
      setError(errorMsg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setGeneratedImages([]);
    setGenerationProgress({ current: 0, total: 0 });
    setError(null);
  };

  return {
    isAnalyzing,
    isGenerating,
    analysis,
    generatedImages,
    generationProgress,
    error,
    modelType,
    setModelType,
    imageCount,
    setImageCount,
    useParallel,
    setUseParallel,
    analyzeProduct,
    generateImages,
    reset,
  };
}

