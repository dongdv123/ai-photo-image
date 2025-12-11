import { GoogleGenerativeAI } from '@google/generative-ai';
import { Base64Image, AnalysisResult, ImagePlan, GeminiModel } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Please add it to .env file');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * Get Gemini API information
 */
export function getGeminiAPIInfo() {
  const apiKey = API_KEY || '';
  const apiKeyPrefix = apiKey.substring(0, 10);
  const hasApiKey = !!apiKey;
  
  return {
    provider: 'Google Generative AI',
    package: '@google/generative-ai',
    apiEndpoint: 'https://generativelanguage.googleapis.com',
    apiKeyConfigured: hasApiKey,
    apiKeyPrefix: hasApiKey ? `${apiKeyPrefix}...` : 'Not configured',
    availableModels: {
      analysis: [
        { name: 'gemini-2.5-flash', description: 'Fast, cost-effective', cost: 'Low' },
        { name: 'gemini-2.5-pro', description: 'Higher quality', cost: 'Medium-High' },
        { name: 'gemini-1.5-flash', description: 'Previous generation', cost: 'Low' },
        { name: 'gemini-1.5-pro', description: 'Previous generation pro', cost: 'Medium' }
      ],
      image: [
        { name: 'gemini-2.5-flash-image', description: 'Image generation model', cost: 'Medium' }
      ]
    },
    sdkVersion: '0.21.0', // From package.json
    documentation: 'https://ai.google.dev/docs'
  };
}

/**
 * Log current API configuration
 */
export function logAPIConfiguration() {
  const info = getGeminiAPIInfo();
  console.group('🔍 Gemini API Configuration');
  console.log('Provider:', info.provider);
  console.log('Package:', info.package);
  console.log('SDK Version:', info.sdkVersion);
  console.log('API Endpoint:', info.apiEndpoint);
  console.log('API Key:', info.apiKeyConfigured ? `✅ Configured (${info.apiKeyPrefix})` : '❌ Not configured');
  console.log('Available Models:', info.availableModels);
  console.log('Documentation:', info.documentation);
  console.groupEnd();
  return info;
}

/**
 * Get model name from GeminiModel type
 */
function getModelName(model: GeminiModel, type: 'analysis' | 'image'): string {
  if (model === 'auto') {
    // Auto: Use flash for cost optimization
    return type === 'analysis' ? 'gemini-2.5-flash' : 'gemini-2.5-flash-image';
  }
  
  if (model === 'flash') {
    return type === 'analysis' ? 'gemini-2.5-flash' : 'gemini-2.5-flash-image';
  }
  
  if (model === 'pro') {
    return type === 'analysis' ? 'gemini-2.5-pro' : 'gemini-2.5-flash-image'; // Image gen only supports flash-image
  }
  
  return 'gemini-2.5-flash';
}

// Phase 1: Analysis Prompt Template
const ANALYST_PROMPT_TEMPLATE = `
Analyze the product in the provided images and generate Etsy SEO content.

Product information: 
- Description: {PRODUCT_DESCRIPTION}

Part 1: Product Analysis

Geometric Sketch: Synthesize information from all provided images to create a simple geometric sketch text description. Focus on basic shapes, proportions, and key structural elements.

Dimensions: Identify key dimensions. Label them (a, b, c...), describe their purpose, and estimate in 'cm'.

Materials: Identify primary materials, their location on the product, and detailed description (texture, finish, color).

Part 2: Etsy SEO Generation

Create 2 SEO-optimized Etsy titles (Capitalize First Letter of Each Word).

Create 2 sets of 13 tags (lowercase, comma-separated).

Output Format: Strict JSON schema:
{
  "analysis": {
    "sketch": "...",
    "dimensions": {
      "a": {
        "label": "...",
        "description": "...",
        "estimate": "..."
      }
    },
    "materials": {
      "primary": "...",
      "location": "...",
      "description": "..."
    }
  },
  "seo": {
    "titles": ["...", "..."],
    "tags": [["...", "..."], ["...", "..."]]
  }
}
`;

// Phase 2: Studio Photographer Prompt Template
const STUDIO_PHOTOGRAPHER_PROMPT_TEMPLATE = `
Task: Create a professional marketing photo.

Product Description: {PRODUCT_DESCRIPTION}

Input: Use provided images as reference.
{REFERENCE_IMAGES_INSTRUCTION}

Core Requirement: RECREATE the product in a completely new photograph that reflects the product description.

Angle: {ANGLE}

Background: {BACKGROUND}

!!! CRITICALLY IMPORTANT REQUIREMENTS !!!

DO NOT EDIT: Do not cut/paste. Create 100% new image.

MAINTAIN INTEGRITY: Preserves logos, colors, details perfectly.

VIBE & MOOD: The overall mood and atmosphere must be "{VIBE}". This vibe should be clearly visible in:
- Color palette (warm tones for cozy, cool tones for professional, vibrant for energetic)
- Lighting style (soft for cozy, bright for professional, dramatic for luxury)
- Background elements and textures
- Overall composition and feeling

Product Details (from Analysis):
- Basic Shape: {SKETCH}
- Key Materials: {MATERIALS}

Lighting: Professional studio lighting with natural shadows that matches the "{VIBE}" vibe.

Composition: Follow rule of thirds, ensure product is the focal point. The composition should enhance the "{VIBE}" mood.

Style: The image style must clearly convey "{VIBE}" - make it unmistakable and consistent throughout.
`;

/**
 * Parse JSON từ AI response
 */
function parseAnalysisResponse(responseText: string): AnalysisResult {
  try {
    // Thử parse JSON trực tiếp
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate structure
      if (parsed.analysis && parsed.seo) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse JSON from response:', e);
  }
  
  // Fallback: Tìm JSON trong code blocks
  const codeBlockMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.analysis && parsed.seo) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse JSON from code block:', e);
    }
  }
  
  // Try to extract partial data if possible
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Return partial data if available
      return {
        analysis: parsed.analysis || {
          sketch: 'Unable to extract',
          dimensions: {},
          materials: {
            primary: 'Unknown',
            location: '',
            description: ''
          }
        },
        seo: parsed.seo || {
          titles: [],
          tags: []
        }
      };
    }
  } catch (e) {
    console.warn('Failed to extract partial JSON:', e);
  }
  
  // Fallback cuối: Return default structure
  console.error('Failed to parse analysis response. Raw text:', responseText.substring(0, 500));
  throw new Error('Failed to parse analysis response. Please try again.');
}

/**
 * Phase 1: Analyze product và generate SEO
 */
export async function analyzeProductAndGenerateSeo(
  images: Base64Image[],
  productName: string,
  productDescription: string,
  modelType: GeminiModel = 'auto'
): Promise<AnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = ANALYST_PROMPT_TEMPLATE
    .replace('{PRODUCT_DESCRIPTION}', productDescription);
  
  const modelName = getModelName(modelType, 'analysis');
  console.log(`🔍 Using model: ${modelName} (${modelType} mode)`);
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const parts = [
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    })),
    { text: prompt }
  ];
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }]
  });
  
  const response = await result.response;
  
  // Check for errors in response
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates in API response');
  }
  
  // Check finish reason
  const finishReason = candidates[0].finishReason;
  if (finishReason && finishReason !== 'STOP') {
    const safetyRatings = candidates[0].safetyRatings || [];
    const blockedReasons = safetyRatings
      .filter((r: any) => r.probability === 'HIGH' || r.probability === 'MEDIUM')
      .map((r: any) => r.category);
    
    if (blockedReasons.length > 0) {
      throw new Error(`Content blocked due to safety concerns: ${blockedReasons.join(', ')}`);
    }
    
    throw new Error(`Analysis stopped: ${finishReason}`);
  }
  
  const text = response.text();
  
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from API');
  }
  
  return parseAnalysisResponse(text);
}

/**
 * Phase 2: Generate image
 */
export async function generateProductImage(
  prompt: string,
  referenceImages: Base64Image[],
  modelType: GeminiModel = 'auto'
): Promise<Base64Image> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const modelName = getModelName(modelType, 'image');
  console.log(`🎨 Using image model: ${modelName} (${modelType} mode)`);
  console.log(`📡 API: Google Generative AI SDK (@google/generative-ai)`);
  console.log(`🌐 Endpoint: https://generativelanguage.googleapis.com`);
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const parts = [
    ...referenceImages.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    })),
    { text: prompt }
  ];
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }]
  });
  
  const response = await result.response;
  
  // Extract image from response
  // Gemini API returns images in response.candidates[0].content.parts[]
  // Each part can be either text or inlineData (for images)
  const candidates = response.candidates;
  
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates in API response');
  }
  
  // Check for finish reason
  const finishReason = candidates[0].finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`Image generation stopped: ${finishReason}`);
  }
  
  const responseParts = candidates[0].content?.parts;
  if (!responseParts || responseParts.length === 0) {
    throw new Error('No parts in API response');
  }
  
  // Find image part (inlineData)
  const imagePart = responseParts.find((part: any) => part.inlineData);
  
  if (imagePart?.inlineData) {
    const imageData = imagePart.inlineData;
    return {
      mimeType: imageData.mimeType || 'image/png',
      data: imageData.data
    };
  }
  
  // If no image found, log response for debugging
  console.error('Response structure:', JSON.stringify(response, null, 2));
  throw new Error('Failed to extract image from response - no inlineData found in parts');
}

/**
 * Create image generation plan với số lượng tùy chỉnh
 */
export function createImageGenerationPlan(count: number = 4): ImagePlan[] {
  const allPlans: ImagePlan[] = [
    {
      angle: 'straight-on front view',
      background: 'clean white studio background',
      description: 'Professional front-facing product shot'
    },
    {
      angle: 'side profile view',
      background: 'minimalist gray gradient',
      description: 'Side view showcasing product depth'
    },
    {
      angle: '45-degree perspective',
      background: 'lifestyle setting with natural elements',
      description: 'Dynamic angled view'
    },
    {
      angle: 'top-down overhead view',
      background: 'marble surface with soft shadows',
      description: 'Flat lay composition'
    },
    {
      angle: 'close-up detail view',
      background: 'dramatic lighting',
      description: 'Highlight texture and material details'
    },
    {
      angle: 'three-quarter view',
      background: 'soft focus background',
      description: 'Showcasing product from multiple angles'
    }
  ];
  
  // Trả về số lượng plan được yêu cầu (tối đa số plan có sẵn)
  return allPlans.slice(0, Math.min(count, allPlans.length));
}

/**
 * Construct prompts từ plan
 */
export function constructPromptsFromPlan(
  plan: ImagePlan[],
  analysis: AnalysisResult,
  vibe: string,
  productName: string, // Kept for function signature but not used in prompt
  productDescription: string,
  referenceImageCount: number = 1
): string[] {
  // Tạo instruction về ảnh reference dựa trên số lượng
  let referenceInstruction = '';
  if (referenceImageCount === 1) {
    referenceInstruction = 'The first image is the primary reference. Use it as the main source for product details, structure, and appearance.';
  } else if (referenceImageCount > 1) {
    referenceInstruction = `IMPORTANT: The FIRST image is the PRIMARY/MAIN reference image. Use it as the dominant source for product structure, main features, and core appearance. The additional ${referenceImageCount - 1} image(s) should be merged/blended into the primary image to add supplementary details, alternative angles, or complementary features. Prioritize the primary image while incorporating relevant elements from the additional images.`;
  }

  return plan.map(item => {
    const materialsText = JSON.stringify(analysis.analysis.materials);
    
    return STUDIO_PHOTOGRAPHER_PROMPT_TEMPLATE
      .replace('{PRODUCT_DESCRIPTION}', productDescription)
      .replace('{REFERENCE_IMAGES_INSTRUCTION}', referenceInstruction)
      .replace('{ANGLE}', item.angle)
      .replace('{BACKGROUND}', item.background)
      .replace(/{VIBE}/g, vibe) // Replace all occurrences of VIBE
      .replace('{SKETCH}', analysis.analysis.sketch)
      .replace('{MATERIALS}', materialsText);
  });
}

