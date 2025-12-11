# Tech Stack Khuyến Nghị - MVP AIstudio ĐA Build

## 🎯 Tổng Quan

Dựa trên phân tích hệ thống, đây là **khuyến nghị tech stack** để implement MVP AIstudio ĐA Build một cách tối ưu nhất.

---

## 🏆 Khuyến Nghị Chính: **React + TypeScript + Vite**

### ✅ Lý Do Chọn

1. **TypeScript**: Code mẫu đã dùng TypeScript → Dễ maintain và scale
2. **React**: UI phức tạp (upload, grid, pagination) → React phù hợp
3. **Vite**: Build tool nhanh, hỗ trợ tốt TypeScript
4. **Client-Side Only**: Không cần backend phức tạp

---

## 📦 Tech Stack Chi Tiết

### 🎨 **Frontend Framework**

#### ✅ **Option 1: React + TypeScript** (KHUYẾN NGHỊ)

```bash
# Tạo project
npm create vite@latest aistudio-app -- --template react-ts

# Dependencies
npm install
npm install @google/generative-ai          # Gemini API client
npm install idb                             # IndexedDB wrapper
npm install react-router-dom                # Routing (nếu cần)
npm install @tanstack/react-query          # Data fetching & caching
npm install zustand                         # State management (nhẹ)
npm install react-virtual                  # Virtual scrolling
```

**Ưu điểm:**
- ✅ TypeScript support tốt
- ✅ Ecosystem lớn, nhiều libraries
- ✅ Dễ tìm developers
- ✅ Performance tốt với React 18+
- ✅ Code splitting tự động

**Nhược điểm:**
- ⚠️ Bundle size lớn hơn một chút (nhưng có thể optimize)

#### ⚡ **Option 2: Next.js** (Nếu cần SSR/SEO)

```bash
npx create-next-app@latest aistudio-app --typescript
```

**Khi nào dùng:**
- Cần SEO tốt
- Cần server-side rendering
- Có backend API riêng

**Lưu ý:** Hệ thống này chủ yếu client-side → Next.js có thể overkill

#### 🚀 **Option 3: SvelteKit** (Nếu muốn nhẹ)

```bash
npm create svelte@latest aistudio-app
```

**Ưu điểm:**
- ✅ Bundle size nhỏ
- ✅ Performance tốt
- ✅ Syntax đơn giản

**Nhược điểm:**
- ⚠️ Ecosystem nhỏ hơn React
- ⚠️ Ít developers biết

---

### 🔧 **Core Libraries**

#### 1. **Gemini API Client**

```bash
npm install @google/generative-ai
```

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

// Phase 1: Analysis
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Phase 2: Image Generation
const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
```

**Tài liệu:** https://ai.google.dev/docs

#### 2. **IndexedDB Wrapper**

```bash
npm install idb
```

```typescript
import { openDB, DBPromise } from 'idb';

const db = await openDB('aistudio_db', 1, {
  upgrade(db) {
    db.createObjectStore('tasks', { keyPath: 'id' });
  }
});
```

**Tại sao:** IndexedDB API native phức tạp → `idb` wrapper đơn giản hơn nhiều

#### 3. **State Management**

**Option A: Zustand** (KHUYẾN NGHỊ - Nhẹ)

```bash
npm install zustand
```

```typescript
import create from 'zustand';

interface AppState {
  tasks: Task[];
  addTask: (task: Task) => void;
}

const useStore = create<AppState>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
}));
```

**Option B: React Query** (Nếu cần caching phức tạp)

```bash
npm install @tanstack/react-query
```

**Khi nào:** Cần cache API responses, background refetch, etc.

#### 4. **Image Processing**

**Canvas API** (Native - Không cần library)

```typescript
// Image compression - dùng Canvas API native
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
canvas.toBlob(...);
```

**Nếu cần advanced:** `browser-image-compression`

```bash
npm install browser-image-compression
```

#### 5. **Virtual Scrolling** (Cho danh sách lớn)

```bash
npm install react-virtual
```

```typescript
import { useVirtualizer } from 'react-virtual';

const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 300,
});
```

---

### 🎨 **UI Libraries** (Optional)

#### **Option 1: Tailwind CSS** (KHUYẾN NGHỊ)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Ưu điểm:**
- ✅ Utility-first, nhanh
- ✅ Bundle size nhỏ (với purge)
- ✅ Responsive dễ dàng

#### **Option 2: Material-UI / Mantine**

```bash
npm install @mui/material @emotion/react @emotion/styled
# hoặc
npm install @mantine/core @mantine/hooks
```

**Khi nào:** Cần components sẵn có (buttons, modals, etc.)

#### **Option 3: Shadcn/ui** (KHUYẾN NGHỊ nếu dùng Tailwind)

```bash
npx shadcn-ui@latest init
```

**Ưu điểm:**
- ✅ Copy-paste components
- ✅ Customizable hoàn toàn
- ✅ TypeScript support tốt

---

### 📦 **Build Tool**

#### **Vite** (KHUYẾN NGHỊ)

```bash
npm create vite@latest
```

**Ưu điểm:**
- ✅ Fast HMR (Hot Module Replacement)
- ✅ Build nhanh
- ✅ TypeScript support tốt
- ✅ Tree-shaking tự động

**Config mẫu (`vite.config.ts`):**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'gemini': ['@google/generative-ai'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
```

---

### 🗄️ **Storage**

#### **IndexedDB** (KHUYẾN NGHỊ)

```bash
npm install idb
```

**Tại sao:**
- ✅ Không giới hạn dung lượng (như localStorage)
- ✅ Async API
- ✅ Hỗ trợ transactions
- ✅ Index để query nhanh

**Fallback:** localStorage cho cache nhỏ (analysis cache)

---

### 🔐 **Environment Variables**

**`.env` file:**

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_APP_NAME=AIstudio
```

**Access trong code:**

```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

**Lưu ý:** Vite chỉ expose variables có prefix `VITE_`

---

## 🏗️ **Project Structure**

```
aistudio-app/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx          # Upload component
│   │   ├── ImageGrid.tsx            # Grid display
│   │   ├── TaskCard.tsx             # Task card component
│   │   ├── ProgressBar.tsx          # Progress indicator
│   │   └── Pagination.tsx           # Pagination controls
│   ├── services/
│   │   ├── geminiService.ts         # Gemini API calls
│   │   ├── imageService.ts          # Image processing
│   │   └── storageService.ts        # IndexedDB operations
│   ├── hooks/
│   │   ├── useImageUpload.ts        # Upload hook
│   │   ├── useImageGeneration.ts    # Generation hook
│   │   └── useTaskStorage.ts        # Storage hook
│   ├── utils/
│   │   ├── imageCompression.ts      # Compression utils
│   │   ├── cache.ts                 # Cache utilities
│   │   └── retry.ts                 # Retry logic
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── store/
│   │   └── useStore.ts              # Zustand store
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📋 **Package.json Mẫu**

```json
{
  "name": "aistudio-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@tanstack/react-query": "^5.0.0",
    "idb": "^8.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-virtual": "^2.10.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## 🚀 **Quick Start Guide**

### Bước 1: Tạo Project

```bash
# Tạo React + TypeScript project với Vite
npm create vite@latest aistudio-app -- --template react-ts

cd aistudio-app
npm install
```

### Bước 2: Install Dependencies

```bash
# Core dependencies
npm install @google/generative-ai idb zustand react-router-dom

# UI (optional)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Dev dependencies
npm install -D @types/node
```

### Bước 3: Setup Environment

```bash
# Tạo .env file
echo "VITE_GEMINI_API_KEY=your_key_here" > .env
```

### Bước 4: Copy Code

```bash
# Copy code từ CODE_STRUCTURE_EXAMPLE.ts và OPTIMIZED_CODE_EXAMPLES.ts
# Vào các file tương ứng trong src/services/
```

### Bước 5: Run

```bash
npm run dev
```

---

## 🎯 **So Sánh Các Options**

| Tiêu Chí | React + TS | Next.js | SvelteKit | Vue + TS |
|----------|-----------|---------|-----------|----------|
| **Learning Curve** | Trung bình | Cao | Thấp | Trung bình |
| **Ecosystem** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Bundle Size** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Phù hợp cho project này** | ✅ **Tốt nhất** | ⚠️ Overkill | ✅ Tốt | ✅ Tốt |

---

## 💡 **Khuyến Nghị Cuối Cùng**

### 🥇 **Stack Chính (KHUYẾN NGHỊ)**

```
React 18+ + TypeScript + Vite
├── @google/generative-ai    (Gemini API)
├── idb                      (IndexedDB)
├── zustand                  (State management)
├── react-virtual            (Virtual scrolling)
└── Tailwind CSS             (Styling)
```

### 🎨 **UI Framework**

- **Tailwind CSS** + **Shadcn/ui** (nếu cần components)
- Hoặc **Mantine** (nếu muốn components sẵn có)

### 📦 **Build & Deploy**

- **Build:** Vite
- **Deploy:** Vercel / Netlify (free, dễ setup)
- **CDN:** Cloudflare (optional, cho performance)

---

## 🔄 **Migration Path** (Nếu đã có code)

### Từ Vanilla JS → React

1. Tách logic thành hooks (`useImageUpload`, `useImageGeneration`)
2. Convert components thành React components
3. Migrate state sang Zustand
4. Giữ nguyên services (geminiService, storageService)

### Từ jQuery → React

1. Rewrite components từ đầu (nhanh hơn migrate)
2. Giữ lại business logic
3. Convert event handlers sang React events

---

## 📚 **Tài Liệu Tham Khảo**

- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Vite:** https://vitejs.dev
- **Gemini API:** https://ai.google.dev/docs
- **IndexedDB:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Zustand:** https://zustand-demo.pmnd.rs
- **Tailwind CSS:** https://tailwindcss.com

---

## ✅ **Checklist Setup**

- [ ] Tạo project với Vite
- [ ] Install dependencies
- [ ] Setup TypeScript config
- [ ] Setup Tailwind CSS (nếu dùng)
- [ ] Tạo `.env` với Gemini API key
- [ ] Copy code từ examples
- [ ] Setup IndexedDB
- [ ] Test image upload
- [ ] Test Gemini API connection
- [ ] Deploy lên Vercel/Netlify

---

**Kết luận:** **React + TypeScript + Vite** là lựa chọn tốt nhất cho project này vì:
- ✅ Type-safe với TypeScript
- ✅ Ecosystem lớn, dễ tìm libraries
- ✅ Performance tốt
- ✅ Dễ maintain và scale
- ✅ Phù hợp với client-side architecture

