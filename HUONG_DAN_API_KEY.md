# Hướng Dẫn Thêm Gemini API Key

## 🔑 Cách 1: Tạo File .env (KHUYẾN NGHỊ)

### Bước 1: Tạo file `.env` trong root directory

Tạo file `.env` ở cùng cấp với `package.json`:

```
aistudio-app/
├── .env          ← Tạo file này
├── package.json
├── src/
└── ...
```

### Bước 2: Thêm API key vào file `.env`

Mở file `.env` và thêm dòng sau:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Ví dụ:**
```env
VITE_GEMINI_API_KEY=AIzaSyAbc123xyz456def789ghi012jkl345mno
```

### Bước 3: Lấy Gemini API Key

1. Vào https://ai.google.dev/
2. Đăng nhập với Google account
3. Click "Get API Key" hoặc vào https://makersuite.google.com/app/apikey
4. Click "Create API Key"
5. Copy API key và paste vào file `.env`

### Bước 4: Restart Dev Server

**QUAN TRỌNG:** Sau khi thêm/chỉnh sửa file `.env`, bạn **PHẢI restart dev server**:

```bash
# Dừng server (Ctrl + C)
# Sau đó chạy lại
npm run dev
```

---

## 🔑 Cách 2: Hardcode Tạm Thời (Chỉ để test)

**⚠️ KHÔNG KHUYẾN NGHỊ** - Chỉ dùng để test nhanh, không commit lên Git!

Mở file `src/services/geminiService.ts` và thay dòng:

```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

Thành:

```typescript
const API_KEY = 'your_actual_api_key_here';
```

**Nhớ xóa sau khi test!**

---

## ✅ Kiểm Tra API Key Đã Hoạt Động

Sau khi thêm API key, mở browser console và kiểm tra:

1. Nếu thấy warning: `VITE_GEMINI_API_KEY is not set` → API key chưa được load
2. Nếu không có warning → API key đã được load thành công

---

## 🐛 Troubleshooting

### Lỗi: "VITE_GEMINI_API_KEY is not defined"

**Nguyên nhân:**
- File `.env` không tồn tại
- Variable không có prefix `VITE_`
- Chưa restart dev server sau khi tạo `.env`

**Giải pháp:**
1. Kiểm tra file `.env` có tồn tại không
2. Đảm bảo variable có prefix `VITE_`
3. Restart dev server: `npm run dev`

### Lỗi: "API key is not configured"

**Nguyên nhân:**
- API key rỗng hoặc không hợp lệ

**Giải pháp:**
1. Kiểm tra API key trong `.env` có đúng không
2. Copy lại API key từ Google AI Studio
3. Đảm bảo không có khoảng trắng thừa

### Lỗi: "API quota exceeded" hoặc "403"

**Nguyên nhân:**
- API key không có quyền truy cập Gemini API
- Quota đã hết

**Giải pháp:**
1. Kiểm tra API key có được enable Gemini API không
2. Kiểm tra quota trong Google Cloud Console
3. Tạo API key mới nếu cần

---

## 📝 File .env.example

File `.env.example` đã được tạo sẵn trong project. Bạn có thể:

1. Copy `.env.example` thành `.env`
2. Thay `your_gemini_api_key_here` bằng API key thực tế

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

---

## 🔒 Bảo Mật

**QUAN TRỌNG:**
- ✅ File `.env` đã được thêm vào `.gitignore` → Không commit lên Git
- ✅ Chỉ dùng `VITE_` prefix cho variables cần expose ra client
- ❌ KHÔNG hardcode API key trong code
- ❌ KHÔNG commit file `.env` lên Git

---

## 📍 Vị Trí File

```
aistudio-app/
├── .env                    ← File này (tạo mới)
├── .env.example            ← File mẫu (đã có)
├── .gitignore              ← Đã ignore .env
├── package.json
├── src/
│   └── services/
│       └── geminiService.ts ← Đọc từ đây
└── ...
```

---

## 🎯 Quick Start

```bash
# 1. Tạo file .env
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# 2. Hoặc copy từ example
cp .env.example .env
# Sau đó edit và thêm API key thực tế

# 3. Restart dev server
npm run dev
```

---

**Lưu ý:** API key sẽ được expose ra client-side (vì dùng `VITE_` prefix). Đây là bình thường cho Gemini API vì nó có rate limiting và quota protection.

