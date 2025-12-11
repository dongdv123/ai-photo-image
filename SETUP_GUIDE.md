# Hướng Dẫn Setup Project - MVP AIstudio ĐA Build

## 🚀 Quick Start (5 phút)

### Bước 1: Tạo Project

```bash
# Tạo React + TypeScript project với Vite
npm create vite@latest aistudio-app -- --template react-ts

cd aistudio-app
```

### Bước 2: Install Dependencies

```bash
# Install tất cả dependencies từ package.json.example
npm install @google/generative-ai idb zustand react-router-dom react-virtual
npm install -D tailwindcss postcss autoprefixer @types/node
```

Hoặc copy `package.json.example` thành `package.json` và chạy:

```bash
npm install
```

### Bước 3: Setup Environment Variables

```bash
# Tạo file .env
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

**Lấy Gemini API Key:**
1. Vào https://ai.google.dev/
2. Đăng nhập với Google account
3. Tạo API key mới
4. Copy vào file `.env`

### Bước 4: Setup Tailwind CSS (Optional)

```bash
# Init Tailwind
npx tailwindcss init -p
```

**Cập nhật `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Thêm vào `src/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Bước 5: Copy Code Structure

Tạo các thư mục và file:

```bash
mkdir -p src/{components,services,hooks,utils,types,store}
```

**Copy code từ:**
- `CODE_STRUCTURE_EXAMPLE.ts` → `src/services/geminiService.ts`
- `OPTIMIZED_CODE_EXAMPLES.ts` → `src/services/optimizedServices.ts`
- Tạo components từ code examples

### Bước 6: Run Development Server

```bash
npm run dev
```

Mở browser tại `http://localhost:5173`

---

## 📁 Cấu Trúc Project Hoàn Chỉnh

```
aistudio-app/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx
│   │   ├── ImageGrid.tsx
│   │   ├── TaskCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Pagination.tsx
│   ├── services/
│   │   ├── geminiService.ts          # Gemini API calls
│   │   ├── imageService.ts           # Image processing
│   │   └── storageService.ts         # IndexedDB operations
│   ├── hooks/
│   │   ├── useImageUpload.ts
│   │   ├── useImageGeneration.ts
│   │   └── useTaskStorage.ts
│   ├── utils/
│   │   ├── imageCompression.ts
│   │   ├── cache.ts
│   │   └── retry.ts
│   ├── types/
│   │   └── index.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🔧 Configuration Files

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
})
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `.env.example`

```env
# Gemini API Key
VITE_GEMINI_API_KEY=your_api_key_here

# App Config
VITE_APP_NAME=AIstudio
VITE_MAX_IMAGE_SIZE=10485760
VITE_CACHE_TTL=604800000
```

### `.gitignore`

```
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

---

## 🧪 Testing Setup

### Install Testing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

---

## 🚀 Deployment

### Option 1: Vercel (KHUYẾN NGHỊ)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Hoặc connect GitHub repo:**
1. Push code lên GitHub
2. Vào https://vercel.com
3. Import project
4. Add environment variable `VITE_GEMINI_API_KEY`
5. Deploy!

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

---

## ✅ Checklist Setup

- [ ] Node.js 18+ installed
- [ ] Project created với Vite
- [ ] Dependencies installed
- [ ] `.env` file created với API key
- [ ] Tailwind CSS setup (nếu dùng)
- [ ] Code structure created
- [ ] Gemini API tested
- [ ] IndexedDB tested
- [ ] Build successful (`npm run build`)
- [ ] Deployed (optional)

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@google/generative-ai'"

```bash
npm install @google/generative-ai
```

### Lỗi: "VITE_GEMINI_API_KEY is not defined"

- Kiểm tra file `.env` có tồn tại
- Đảm bảo variable có prefix `VITE_`
- Restart dev server sau khi thay đổi `.env`

### Lỗi: "IndexedDB is not available"

- Kiểm tra browser support (Chrome, Firefox, Safari đều hỗ trợ)
- Đảm bảo không chạy ở HTTP (cần HTTPS hoặc localhost)

### Lỗi: "CORS error"

- Gemini API không có CORS issue
- Nếu có, kiểm tra API key có đúng không

---

## 📚 Next Steps

1. ✅ Setup xong → Đọc `TECH_STACK_KHUYEN_NGHI.md`
2. ✅ Copy code từ `CODE_STRUCTURE_EXAMPLE.ts`
3. ✅ Implement optimizations từ `OPTIMIZED_CODE_EXAMPLES.ts`
4. ✅ Test từng feature
5. ✅ Deploy!

---

**Happy Coding! 🎉**

