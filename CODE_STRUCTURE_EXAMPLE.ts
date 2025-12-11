/**
 * CODE STRUCTURE EXAMPLE - MVP AIstudio ĐA Build
 * 
 * Đây là cấu trúc code mẫu minh họa cách hoạt động của hệ thống
 * Dựa trên phân tích chi tiết trong PHAN_TICH_HE_THONG.md
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Base64Image {
  mimeType: string;
  data: string; // Base64 string without data:image/... prefix
}

interface AnalysisResult {
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

interface ImagePlan {
  angle: string;
  background: string;
  description: string;
}

interface Task {
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

// ============================================================================
// PHASE 1: THE ANALYST - Prompt Template
// ============================================================================

const ANALYST_PROMPT_TEMPLATE = `
Analyze the product in the provided images and generate Etsy SEO content.

Product information: 
- Name: {PRODUCT_NAME}
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

// ============================================================================
// PHASE 2: THE STUDIO PHOTOGRAPHER - Prompt Template
// ============================================================================

const STUDIO_PHOTOGRAPHER_PROMPT_TEMPLATE = `
Task: Create a professional marketing photo for "{PRODUCT_NAME}".

Input: Use provided images as reference.

Core Requirement: RECREATE the product in a completely new photograph.

Angle: {ANGLE}

Background: {BACKGROUND} {VIBE}

Additional Product Info (Dữ liệu từ Giai đoạn 1):

Basic Shape: {SKETCH}

Key Materials: {MATERIALS}

!!! CRITICALLY IMPORTANT REQUIREMENTS !!!

DO NOT EDIT: Do not cut/paste. Create 100% new image.

MAINTAIN INTEGRITY: Preserves logos, colors, details perfectly.

VIBE: The mood "{VIBE}" must be unmistakable.

Lighting: Professional studio lighting with natural shadows.

Composition: Follow rule of thirds, ensure product is the focal point.
`;

// ============================================================================
// STEP 1: INGESTION - Image Upload & Base64 Encoding
// ============================================================================

/**
 * Chuyển đổi FileList thành Base64Image[]
 */
async function handleImageUpload(files: FileList): Promise<Base64Image[]> {
  const fileArray = Array.from(files);
  
  const base64Promises = fileArray.map((file): Promise<Base64Image> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove data:image/... prefix, chỉ lấy Base64 data
        const base64Data = result.split(',')[1];
        
        resolve({
          mimeType: file.type,
          data: base64Data
        });
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      
      reader.readAsDataURL(file);
    });
  });
  
  return Promise.all(base64Promises);
}

// ============================================================================
// STEP 2: SEMANTIC EXTRACTION - Product Analysis
// ============================================================================

/**
 * Phân tích sản phẩm và tạo SEO content
 * Sử dụng Gemini Flash Vision model
 */
async function analyzeProductAndGenerateSeo(
  images: Base64Image[],
  productName: string,
  productDescription: string
): Promise<AnalysisResult> {
  
  // Build prompt từ template
  const prompt = ANALYST_PROMPT_TEMPLATE
    .replace('{PRODUCT_NAME}', productName)
    .replace('{PRODUCT_DESCRIPTION}', productDescription);
  
  // Prepare parts for Gemini API
  const parts = [
    // Images as inlineData
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    })),
    // Text prompt
    { text: prompt }
  ];
  
  // Call Gemini API (pseudocode - cần implement Gemini client)
  const response = await geminiClient.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ]
  });
  
  // Extract JSON from response
  const responseText = response.text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from AI response');
  }
  
  const analysisResult: AnalysisResult = JSON.parse(jsonMatch[0]);
  
  return analysisResult;
}

// ============================================================================
// STEP 3: PLANNING & CONSTRUCTION - Create Image Generation Plan
// ============================================================================

/**
 * Tạo kế hoạch chụp ảnh với các góc độ chuẩn
 */
function createImageGenerationPlan(): ImagePlan[] {
  return [
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
    }
  ];
}

/**
 * Xây dựng prompts từ kế hoạch và dữ liệu phân tích
 */
function constructPromptsFromPlan(
  plan: ImagePlan[],
  analysis: AnalysisResult,
  vibe: string,
  productName: string
): string[] {
  
  return plan.map(item => {
    const materialsText = JSON.stringify(analysis.analysis.materials);
    
    return STUDIO_PHOTOGRAPHER_PROMPT_TEMPLATE
      .replace('{PRODUCT_NAME}', productName)
      .replace('{ANGLE}', item.angle)
      .replace('{BACKGROUND}', item.background)
      .replace('{VIBE}', vibe)
      .replace('{SKETCH}', analysis.analysis.sketch)
      .replace('{MATERIALS}', materialsText);
  });
}

// ============================================================================
// STEP 4: GENERATION LOOP - Image Generation with Retry
// ============================================================================

/**
 * Sinh ảnh với cơ chế retry và exponential backoff
 */
async function generateFinalImages(
  prompts: string[],
  referenceImages: Base64Image[]
): Promise<Base64Image[]> {
  
  const imagePromises = prompts.map(async (prompt, index): Promise<Base64Image> => {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        // Prepare parts for Gemini Image API
        const parts = [
          ...referenceImages.map(img => ({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data
            }
          })),
          { text: prompt }
        ];
        
        // Call Gemini Image Generation API
        const response = await geminiClient.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [
            {
              role: 'user',
              parts: parts
            }
          ]
        });
        
        // Extract image from response (pseudocode)
        const imageData = extractImageFromResponse(response);
        
        return {
          mimeType: 'image/png',
          data: imageData,
        };
        
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw new Error(
            `Failed to generate image ${index} after ${maxRetries} attempts: ${error}`
          );
        }
        
        // Exponential Backoff: 5s, 10s, 20s
        const delayMs = 5000 * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        console.warn(`Retry ${retries}/${maxRetries} for image ${index} after ${delayMs}ms`);
      }
    }
    
    throw new Error(`Unexpected exit from retry loop for image ${index}`);
  });
  
  // Generate all images in parallel
  return Promise.all(imagePromises);
}

/**
 * Helper function để extract image từ Gemini response
 * (Cần implement dựa trên Gemini API response format)
 */
function extractImageFromResponse(response: any): string {
  // Pseudocode - cần implement dựa trên actual API response
  // Ví dụ: response.candidates[0].content.parts[0].inlineData.data
  return response.imageData || '';
}

// ============================================================================
// STEP 5: STORAGE & SHOWCASE - Save and Display
// ============================================================================

/**
 * Lưu task vào localStorage
 */
function saveTaskToStorage(task: Task, isCommunity: boolean = false): void {
  const key = isCommunity 
    ? 'community_tasks' 
    : `user_tasks_${task.userId}`;
  
  const existingTasks = loadTasksFromStorage(key);
  const updatedTasks = [...existingTasks, task];
  
  localStorage.setItem(key, JSON.stringify(updatedTasks));
}

/**
 * Load tasks từ localStorage
 */
function loadTasksFromStorage(key: string): Task[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/**
 * Main function - Orchestrate toàn bộ quy trình
 */
async function processProductImages(
  files: FileList,
  productName: string,
  productDescription: string,
  vibe: string,
  userId: string
): Promise<Task> {
  
  try {
    // Step 1: Ingestion
    console.log('Step 1: Converting images to Base64...');
    const inputImages = await handleImageUpload(files);
    
    // Step 2: Semantic Extraction
    console.log('Step 2: Analyzing product...');
    const analysis = await analyzeProductAndGenerateSeo(
      inputImages,
      productName,
      productDescription
    );
    
    // Step 3: Planning & Construction
    console.log('Step 3: Creating image generation plan...');
    const plan = createImageGenerationPlan();
    const prompts = constructPromptsFromPlan(plan, analysis, vibe, productName);
    
    // Step 4: Generation
    console.log('Step 4: Generating images...');
    const generatedImages = await generateFinalImages(prompts, inputImages);
    
    // Step 5: Storage
    console.log('Step 5: Saving task...');
    const task: Task = {
      id: generateId(),
      userId,
      productName,
      productDescription,
      inputImages,
      analysis,
      generatedImages,
      createdAt: new Date(),
      vibe
    };
    
    // Save to both personal and community
    saveTaskToStorage(task, false); // Personal
    saveTaskToStorage(task, true);  // Community
    
    console.log('✅ Process completed successfully!');
    return task;
    
  } catch (error) {
    console.error('❌ Error processing product images:', error);
    throw error;
  }
}

/**
 * Helper function để generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// UI COMPONENT EXAMPLE - Community History with Pagination
// ============================================================================

/**
 * Component hiển thị lịch sử cộng đồng với pagination
 * (React example - có thể adapt sang framework khác)
 */
/*
function CommunityHistory() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  useEffect(() => {
    // Load tasks từ localStorage
    const communityTasks = loadTasksFromStorage('community_tasks');
    setTasks(communityTasks);
  }, []);
  
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return tasks.slice(start, end);
  }, [tasks, currentPage]);
  
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  
  return (
    <div className="community-history">
      <h2>Community Gallery</h2>
      
      <div className="image-grid">
        {paginatedTasks.map(task => (
          <div key={task.id} className="task-card">
            <h3>{task.productName}</h3>
            <div className="generated-images">
              {task.generatedImages.map((img, idx) => (
                <img 
                  key={idx}
                  src={`data:${img.mimeType};base64,${img.data}`}
                  alt={`${task.productName} - Image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          
          <span>
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
*/

// ============================================================================
// EXPORT
// ============================================================================

export {
  handleImageUpload,
  analyzeProductAndGenerateSeo,
  createImageGenerationPlan,
  constructPromptsFromPlan,
  generateFinalImages,
  saveTaskToStorage,
  loadTasksFromStorage,
  processProductImages,
  type Base64Image,
  type AnalysisResult,
  type ImagePlan,
  type Task
};

