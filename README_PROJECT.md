# AIstudio - AI Product Image Generator

React + TypeScript implementation của MVP AIstudio ĐA Build.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Tạo file `.env` trong root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Lấy Gemini API Key:**
1. Vào https://ai.google.dev/
2. Đăng nhập với Google account
3. Tạo API key mới
4. Copy vào file `.env`

### 3. Run Development Server

```bash
npm run dev
```

Mở browser tại `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Output sẽ ở trong thư mục `dist/`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ImageUpload.tsx
│   ├── ImageGrid.tsx
│   ├── TaskCard.tsx
│   └── ProgressBar.tsx
├── hooks/              # Custom React hooks
│   ├── useImageUpload.ts
│   ├── useImageGeneration.ts
│   └── useTaskStorage.ts
├── services/           # API & business logic
│   ├── geminiService.ts
│   └── storageService.ts
├── store/              # State management (Zustand)
│   └── useStore.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utility functions
│   ├── imageCompression.ts
│   ├── retry.ts
│   └── cache.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## ✨ Features

- ✅ **Image Upload** với compression (giảm 50-70% size)
- ✅ **Product Analysis** với Gemini Flash Vision
- ✅ **Image Generation** với multiple angles
- ✅ **Analysis Caching** (giảm 80-90% API calls)
- ✅ **Smart Retry** với error classification
- ✅ **IndexedDB Storage** (unlimited capacity)
- ✅ **Progress Tracking** cho UX tốt hơn
- ✅ **Pagination** cho task list

## 🔧 Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **IndexedDB (idb)** - Client-side storage
- **Gemini API** - AI image generation

## 📝 Usage

1. **Upload Images**: Click "Upload Images" và chọn 1-3 ảnh sản phẩm
2. **Fill Product Info**: Nhập tên và mô tả sản phẩm
3. **Set Vibe** (optional): Nhập mood/style mong muốn
4. **Process**: Click "Process Images" để bắt đầu
5. **View Results**: Xem ảnh đã generate trong task list

## 🐛 Troubleshooting

### Lỗi: "VITE_GEMINI_API_KEY is not defined"

- Kiểm tra file `.env` có tồn tại
- Đảm bảo variable có prefix `VITE_`
- Restart dev server sau khi thay đổi `.env`

### Lỗi: "IndexedDB is not available"

- Kiểm tra browser support (Chrome, Firefox, Safari đều hỗ trợ)
- Đảm bảo không chạy ở HTTP (cần HTTPS hoặc localhost)

### Lỗi: "Failed to generate image"

- Kiểm tra API key có đúng không
- Kiểm tra network connection
- Xem console để biết chi tiết lỗi

## 📚 Documentation

Xem các file documentation trong project root:
- `PHAN_TICH_HE_THONG.md` - Phân tích kiến trúc hệ thống
- `DANH_GIA_TOI_UU_HOA.md` - Đánh giá tối ưu hóa
- `TECH_STACK_KHUYEN_NGHI.md` - Khuyến nghị tech stack
- `SETUP_GUIDE.md` - Hướng dẫn setup chi tiết

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

**Lưu ý:** Nhớ add environment variable `VITE_GEMINI_API_KEY` trong dashboard!

## 📄 License

MIT

