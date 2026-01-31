# Money Expense - Quản lý tài chính gia đình

Ứng dụng quản lý chi tiêu và thu nhập dành cho gia đình, xây dựng bằng Next.js 14, hỗ trợ responsive trên mobile.

## Tính năng

- 🔐 **Đăng nhập Google** - Chỉ cho phép email được cấu hình trước
- 📊 **Dashboard** - Tổng quan tài chính tháng hiện tại
- 💰 **Quản lý giao dịch** - Thêm/sửa/xóa thu chi
- 📁 **Quản lý danh mục** - Thêm danh mục tùy chỉnh ngoài mặc định
- 📈 **Thống kê** - Biểu đồ theo tháng/năm, phân tích theo danh mục
- 🤖 **Trợ lý AI** - Chatbot nhập giao dịch bằng ngôn ngữ tự nhiên

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** > **Credentials**
4. Tạo **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy **Client ID** và **Client Secret**

### 3. Cấu hình môi trường

Cập nhật file `.env`:

```env
DATABASE_URL="file:./dev.db"

# NextAuth - Tạo secret bằng: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email được phép đăng nhập (phân cách bằng dấu phẩy)
ALLOWED_EMAILS="your-email@gmail.com,spouse-email@gmail.com"

# Google Gemini AI - Lấy từ https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Khởi tạo database

```bash
npx prisma migrate dev
```

### 5. Chạy ứng dụng

```bash
npm run dev
```

Truy cập http://localhost:3000

## Sử dụng Chatbot AI

Chatbot được hỗ trợ bởi **Google Gemini AI** để hiểu ngôn ngữ tự nhiên tiếng Việt:

### Chi tiêu
- "Ăn trưa 50k"
- "Đổ xăng 200 nghìn"
- "Mua sắm shopee 500k"
- "Hôm qua đi grab 35k"
- "Tiền điện 300000 đồng"

### Thu nhập
- "Nhận lương 15 triệu"
- "Thưởng tết 5tr"
- "Bán đồ được 2m"

### Hỗ trợ ngày
- "Hôm qua ăn phở 50k"
- "Hôm kia mua cafe 30k"

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite với Prisma ORM
- **Auth**: NextAuth.js v5 (Google OAuth)
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Cấu trúc thư mục

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── categories/           # API danh mục
│   │   ├── transactions/         # API giao dịch
│   │   ├── statistics/           # API thống kê
│   │   └── chatbot/              # API chatbot
│   ├── dashboard/                # Trang tổng quan
│   ├── transactions/             # Trang giao dịch
│   ├── categories/               # Trang danh mục
│   ├── statistics/               # Trang thống kê
│   ├── chatbot/                  # Trang chatbot
│   └── login/                    # Trang đăng nhập
├── components/                   # React components
├── contexts/                     # React contexts
├── lib/                          # Utilities (auth, prisma)
└── types/                        # TypeScript types
```

## License

MIT