# Phân Tích Hệ Thống: MVP AIstudio ĐA Build

## Tổng Quan Kiến Trúc

Hệ thống MVP AIstudio ĐA Build là một ứng dụng AI hai giai đoạn được thiết kế để:
- **Phân tích sản phẩm** từ hình ảnh đầu vào
- **Tạo ra các bức ảnh marketing chuyên nghiệp** ở nhiều góc độ khác nhau

---

## 1. System Prompt Architecture (Kiến Trúc Câu Lệnh Hệ Thống)

### Đặc Điểm Nổi Bật

Hệ thống **KHÔNG sử dụng một System Prompt duy nhất**, mà áp dụng chiến lược **"Two-Phase Prompt Engineering"** với hai vai trò AI riêng biệt:

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT                            │
│  (1-3 hình ảnh sản phẩm + tên + mô tả)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  PHASE 1: THE ANALYST  │
        │  (gemini-2.5-flash)    │
        │  - Phân tích sản phẩm  │
        │  - Trích xuất DNA       │
        │  - Tạo SEO content      │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   JSON OUTPUT          │
        │   - sketch (hình khối) │
        │   - materials (chất liệu)│
        │   - seo (từ khóa)      │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  PHASE 2: THE STUDIO   │
        │  PHOTOGRAPHER          │
        │  (gemini-2.5-flash-image)│
        │  - Tạo ảnh mới         │
        │  - Nhiều góc độ        │
        └────────────────────────┘
```

---

### Giai Đoạn 1: Prompt Phân Tích & SEO (The Analyst)

#### Nhiệm Vụ Chính
Đóng vai **chuyên gia sản phẩm** để "số hóa" hình ảnh đầu vào thành dữ liệu văn bản có cấu trúc.

#### Prompt Template (trong `geminiService.ts`)

```typescript
const ANALYST_PROMPT = `
Analyze the product in the provided images and generate Etsy SEO content.

Product information: 
- Name: [User Input]
- Description: [User Input]

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
    "dimensions": {...},
    "materials": {...}
  },
  "seo": {
    "titles": [...],
    "tags": [...]
  }
}
`;
```

#### Mục Đích Chiến Lược

1. **Ép buộc JSON Output**: Đảm bảo AI trả về dữ liệu có cấu trúc, dễ parse và xử lý.

2. **Trích xuất "DNA" sản phẩm**:
   - **Sketch**: Mô tả hình học cơ bản (VD: "A cylindrical glass bottle with a silver screw cap")
   - **Materials**: Chất liệu chi tiết (VD: "Translucent amber glass", "Matte aluminum")
   - **Dimensions**: Kích thước và tỷ lệ

3. **Grounding Data**: Dữ liệu này sẽ được sử dụng ở Giai đoạn 2 để **ngăn chặn AI hallucination** (vẽ sai sản phẩm).

---

### Giai Đoạn 2: Prompt Sinh Ảnh (The Studio Photographer)

#### Nhiệm Vụ Chính
Đóng vai **nhiếp ảnh gia studio**, sử dụng dữ liệu từ Giai đoạn 1 để chụp lại sản phẩm ở góc độ mới.

#### Prompt Template (Được lắp ghép động)

```typescript
const STUDIO_PHOTOGRAPHER_PROMPT = `
Task: Create a professional marketing photo for "[Product Name]".

Input: Use provided images as reference.

Core Requirement: RECREATE the product in a completely new photograph.

Angle: [Ví dụ: straight-on front view / side profile view / 45-degree perspective...]

Background: [Mô tả bối cảnh Studio hoặc Lifestyle] + [Vibe người dùng nhập]

Additional Product Info (Dữ liệu từ Giai đoạn 1):

Basic Shape: [Chèn dữ liệu Sketch từ Phase 1]

Key Materials: [Chèn dữ liệu Materials từ Phase 1]

!!! CRITICALLY IMPORTANT REQUIREMENTS !!!

DO NOT EDIT: Do not cut/paste. Create 100% new image.

MAINTAIN INTEGRITY: Preserves logos, colors, details perfectly.

VIBE: The mood "[Vibe]" must be unmistakable.

Lighting: Professional studio lighting with natural shadows.

Composition: Follow rule of thirds, ensure product is the focal point.
`;
```

#### Kỹ Thuật Prompt Engineering

1. **Grounding Technique**:
   - Đưa lại thông tin "Sketch" và "Materials" vào prompt
   - Giúp AI không bị "ảo giác" và vẽ sai sản phẩm
   - Đảm bảo tính nhất quán về hình dạng và chất liệu

2. **Constraint-Based Approach**:
   - Các luật cấm rõ ràng: "Do not edit", "Do not cut/paste"
   - Giúp AI hiểu đây là tác vụ **Generation** (vẽ lại) chứ không phải **Editing** (chỉnh sửa)
   - Kết quả: Ánh sáng và bóng đổ tự nhiên hơn

3. **Dynamic Prompt Construction**:
   - Góc chụp được thay đổi động
   - Vibe được người dùng tùy chỉnh
   - Background được điều chỉnh theo context

---

## 2. Chi Tiết Cơ Chế Hoạt Động (Operational Mechanism)

### Luồng Dữ Liệu 5 Bước

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Tiếp Nhận & Mã Hóa (Ingestion)                      │
│ - User upload 1-3 ảnh                                       │
│ - FileReader → Base64 encoding                              │
│ - Chuẩn bị cho Gemini API (inlineData)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Thấu Hiểu Sản Phẩm (Semantic Extraction)           │
│ - analyzeProductAndGenerateSeo()                            │
│ - Gửi ảnh Base64 + Prompt Giai đoạn 1                       │
│ - Model: gemini-2.5-flash                                   │
│ - Output: JSON (sketch, materials, seo)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Lập Kế Hoạch Chụp (Planning & Construction)        │
│ - createImageGenerationPlan()                               │
│   → Định nghĩa góc chụp chuẩn (Front, Side, Top-down...)   │
│ - constructPromptsFromPlan()                                │
│   → Trộn: Angle + Vibe + Analysis Data                      │
│ - Output: 4+ Prompts hoàn chỉnh                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Sinh Ảnh Song Song & Retry (Generation Loop)        │
│ - generateFinalImages()                                     │
│ - Gửi request đến gemini-2.5-flash-image                    │
│ - Fail-safe: Retry với Exponential Backoff                  │
│   → Chờ 5s → Thử lại → Tối đa 3 lần                         │
│ - Output: Base64 của ảnh mới                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: Lưu Trữ & Hiển Thị (Storage & Showcase)             │
│ - Lưu vào userTasks (cá nhân)                               │
│ - Lưu vào allTasks (cộng đồng)                              │
│ - localStorage/IndexedDB (persistence)                      │
│ - Hiển thị Grid + Pagination (5 items/trang)                │
└─────────────────────────────────────────────────────────────┘
```

---

### Bước 1: Tiếp Nhận & Mã Hóa (Ingestion)

#### Quy Trình

```typescript
// Pseudocode
function handleImageUpload(files: FileList) {
  const base64Promises = Array.from(files).map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1]; // Remove data:image/... prefix
        resolve({
          mimeType: file.type,
          data: base64
        });
      };
      reader.readAsDataURL(file);
    });
  });
  
  return Promise.all(base64Promises);
}
```

#### Lý Do Sử Dụng Base64

- **Gemini API yêu cầu**: Nhận input trực tiếp là dữ liệu nhị phân (`inlineData`) thay vì đường dẫn URL
- **Ưu điểm**: 
  - Không cần server upload
  - Dữ liệu được gửi trực tiếp trong request
  - Bảo mật tốt hơn (không expose URL công khai)

---

### Bước 2: Thấu Hiểu Sản Phẩm (Semantic Extraction)

#### Hàm Chính: `analyzeProductAndGenerateSeo`

```typescript
async function analyzeProductAndGenerateSeo(
  images: Base64Image[],
  productName: string,
  productDescription: string
): Promise<AnalysisResult> {
  
  const prompt = ANALYST_PROMPT
    .replace('[User Input]', productName)
    .replace('[User Input]', productDescription);
  
  const response = await geminiClient.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          ...images.map(img => ({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data
            }
          })),
          { text: prompt }
        ]
      }
    ]
  });
  
  // Parse JSON từ response
  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}
```

#### Output Structure

```typescript
interface AnalysisResult {
  analysis: {
    sketch: string;           // "A cylindrical glass bottle with..."
    dimensions: {
      [key: string]: {
        label: string;
        description: string;
        estimate: string;     // "15cm"
      }
    };
    materials: {
      primary: string;        // "Translucent amber glass"
      secondary: string;      // "Matte aluminum"
      location: string;
      description: string;
    };
  };
  seo: {
    titles: string[];         // 2 titles
    tags: string[][];         // 2 sets of 13 tags
  };
}
```

#### Tại Sao Bước Này Quan Trọng?

**Vấn đề không có bước này:**
- Khi yêu cầu AI "vẽ sản phẩm ở góc nghiêng", nó có thể:
  - Vẽ sai chất liệu (thay đổi từ glass sang plastic)
  - Đổi hình dạng nắp chai (từ screw cap sang flip cap)
  - Thay đổi màu sắc logo

**Giải pháp với bước này:**
- AI được "grounding" với dữ liệu chính xác về hình dạng và chất liệu
- Kết quả nhất quán và chính xác hơn

---

### Bước 3: Lập Kế Hoạch Chụp (Planning & Construction)

#### Hàm 1: `createImageGenerationPlan`

```typescript
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
```

#### Hàm 2: `constructPromptsFromPlan`

```typescript
function constructPromptsFromPlan(
  plan: ImagePlan[],
  analysis: AnalysisResult,
  vibe: string,
  productName: string
): string[] {
  
  return plan.map(item => {
    return STUDIO_PHOTOGRAPHER_PROMPT
      .replace('[Product Name]', productName)
      .replace('[Ví dụ: ...]', item.angle)
      .replace('[Mô tả bối cảnh...]', item.background)
      .replace('[Vibe người dùng nhập]', vibe)
      .replace('[Chèn dữ liệu Sketch...]', analysis.analysis.sketch)
      .replace('[Chèn dữ liệu Materials...]', 
        JSON.stringify(analysis.analysis.materials));
  });
}
```

#### Kết Quả

Tạo ra **4 (hoặc nhiều hơn) câu Prompt hoàn chỉnh**, mỗi câu dành riêng cho một bức ảnh đầu ra với:
- Góc chụp khác nhau
- Background khác nhau
- Nhưng cùng một sản phẩm (nhờ grounding data)

---

### Bước 4: Sinh Ảnh Song Song & Retry (Generation Loop)

#### Hàm Chính: `generateFinalImages`

```typescript
async function generateFinalImages(
  prompts: string[],
  referenceImages: Base64Image[]
): Promise<Base64Image[]> {
  
  const imagePromises = prompts.map(async (prompt, index) => {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const response = await geminiClient.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [
            {
              role: 'user',
              parts: [
                ...referenceImages.map(img => ({
                  inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                  }
                })),
                { text: prompt }
              ]
            }
          ]
        });
        
        // Extract image from response
        const imageData = extractImageFromResponse(response);
        return {
          mimeType: 'image/png',
          data: imageData,
          index: index
        };
        
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Failed to generate image ${index} after ${maxRetries} attempts`);
        }
        
        // Exponential Backoff: 5s, 10s, 20s
        await new Promise(resolve => 
          setTimeout(resolve, 5000 * Math.pow(2, retries - 1))
        );
      }
    }
  });
  
  return Promise.all(imagePromises);
}
```

#### Cơ Chế Fail-Safe

**Vấn đề:**
- Sinh ảnh tốn nhiều tài nguyên
- AI có thể từ chối request (rate limit, content policy)
- Lỗi mạng có thể xảy ra

**Giải pháp:**
- **Retry Loop**: Thử lại tối đa 3 lần
- **Exponential Backoff**: Chờ 5s → 10s → 20s trước mỗi lần thử lại
- **Error Handling**: Báo lỗi rõ ràng nếu thất bại hoàn toàn

---

### Bước 5: Lưu Trữ & Hiển Thị (Storage & Showcase)

#### Cấu Trúc Dữ Liệu

```typescript
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

interface AppState {
  userTasks: Task[];      // Cá nhân
  allTasks: Task[];       // Cộng đồng
}
```

#### Lưu Trữ

**1. Cá nhân (`userTasks`):**
- Chỉ hiển thị cho người dùng hiện tại
- Lưu vào localStorage với key: `user_tasks_${userId}`

**2. Cộng đồng (`allTasks`):**
- Hiển thị cho tất cả người dùng
- Lưu vào localStorage với key: `community_tasks`
- Hoặc IndexedDB nếu dữ liệu lớn

**3. Persistence:**
```typescript
// Save to localStorage
function saveTasks(tasks: Task[], key: string) {
  localStorage.setItem(key, JSON.stringify(tasks));
}

// Load from localStorage
function loadTasks(key: string): Task[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}
```

#### Hiển Thị

**Component: `CommunityHistory`**

```typescript
function CommunityHistory({ tasks }: { tasks: Task[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return tasks.slice(start, end);
  }, [tasks, currentPage]);
  
  return (
    <div>
      <Grid images={paginatedTasks} />
      <Pagination 
        current={currentPage}
        total={Math.ceil(tasks.length / itemsPerPage)}
        onChange={setCurrentPage}
      />
    </div>
  );
}
```

**Thuật toán Pagination:**
- Chia mảng lớn thành các trang nhỏ (5 items/trang)
- Giảm tải render khi danh sách cộng đồng quá dài
- Cải thiện performance và UX

---

## 3. Tóm Tắt Luồng Dữ Liệu

```
Ảnh gốc (1-3 files)
    ↓
[FileReader] → Base64 encoding
    ↓
[Gemini Flash Vision] → Phân tích sản phẩm
    ↓
JSON Output (Sketch + Materials + SEO)
    ↓
[Prompt Engineer Logic] → Tạo 4+ Prompts chi tiết
    ↓
[Gemini Image Generation] → Sinh ảnh song song
    ↓
4 Ảnh kết quả (Base64)
    ↓
[Storage] → localStorage/IndexedDB
    ↓
[Display] → Grid + Pagination
```

---

## 4. Điểm Mạnh Của Kiến Trúc

### ✅ Ưu Điểm

1. **Grounding Technique**: Ngăn chặn AI hallucination bằng cách cung cấp dữ liệu chính xác về sản phẩm
2. **Two-Phase Approach**: Tách biệt phân tích và sinh ảnh giúp kiểm soát tốt hơn
3. **Fail-Safe Mechanism**: Retry với exponential backoff đảm bảo độ tin cậy
4. **Scalable Storage**: Pagination giúp xử lý danh sách lớn
5. **User Experience**: Không cần server upload, mọi thứ chạy trên client

### ⚠️ Hạn Chế

1. **Base64 Overhead**: Dữ liệu Base64 lớn hơn ~33% so với binary
2. **localStorage Limit**: Giới hạn ~5-10MB, có thể cần IndexedDB cho dữ liệu lớn
3. **Rate Limiting**: Gemini API có giới hạn request, cần xử lý cẩn thận
4. **Cost**: Mỗi lần sinh ảnh tốn phí API, cần optimize số lượng request

---

## 5. Khuyến Nghị Cải Tiến

1. **Caching Strategy**: Cache kết quả phân tích để tránh phân tích lại cùng một sản phẩm
2. **Image Compression**: Nén ảnh trước khi lưu vào localStorage
3. **Progressive Loading**: Load ảnh theo từng batch thay vì tất cả cùng lúc
4. **Error Recovery**: Lưu trạng thái tạm thời để có thể resume khi lỗi
5. **Analytics**: Track số lượng request, thời gian xử lý để optimize

---

## Kết Luận

Hệ thống MVP AIstudio ĐA Build là một kiến trúc thông minh kết hợp:
- **Prompt Engineering** tinh vi với hai giai đoạn riêng biệt
- **Grounding Technique** để đảm bảo tính chính xác
- **Fail-Safe Mechanism** để đảm bảo độ tin cậy
- **Client-Side Processing** để đảm bảo privacy và tốc độ

Kiến trúc này có thể được áp dụng cho nhiều ứng dụng AI khác yêu cầu độ chính xác cao và khả năng kiểm soát tốt.

