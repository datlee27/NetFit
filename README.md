# NetFit - AI-Powered Personal Fitness & Nutrition Training System

**NetFit** là hệ thống quản lý tập luyện thể hình, lập kế hoạch dinh dưỡng cá nhân hóa và kết nối Huấn luyện viên (PT) thông minh, tích hợp công nghệ AI (Gemini / Groq LLM) giúp tối ưu hóa lộ trình sức khỏe cho từng người dùng.

---

## 🌟 Chức Năng Chính (Key Features)

### 👤 1. Dành Cho Hội Viên (Member)
- **Đăng ký & Đăng nhập**: Hỗ trợ đăng nhập Email/Mật khẩu & Google OAuth 2.0. Có tính năng quên mật khẩu xác thực qua Email OTP.
- **Lộ trình tập luyện AI (AI Workout Plan)**: Tự động đề xuất lịch tập phù hợp với mục tiêu (tăng cơ, giảm mỡ, tăng thể lực).
- **Kế hoạch dinh dưỡng (Nutrition Plan)**: Tính toán TDEE/BMR, phân bổ Macros (Carb, Protein, Fat) và gợi ý thực đơn hàng ngày.
- **AI Fitness Assistant**: Trợ lý AI tư vấn bài tập, chế độ ăn uống 24/7.
- **Thuê Huấn luyện viên (PT Booking)**: Tìm kiếm PT, đặt lịch hẹn và theo dõi tiến độ tập luyện cùng PT.
- **Thanh toán trực tuyến**: Tích hợp cổng thanh toán **PayOS** chuyển khoản ngân hàng QR Code mượt mà.

### 🏋️‍♂️ 2. Dành Cho Huấn Luyện Viên (PT)
- **Quản lý lịch dạy (Schedule Management)**: Đặt khung giờ rảnh, quản lý ca dạy.
- **Quản lý học viên (Client Management)**: Đóng góp lộ trình tập luyện riêng cho từng học viên.
- **Thư viện nội dung (Content Library)**: Tạo và nộp yêu cầu đóng góp bài tập mẫu cho Admin duyệt.

### 🛡️ 3. Dành Cho Quản Trị Viên (Admin)
- **Quản lý hệ thống**: Quản lý tài khoản Member, PT, gói dịch vụ (Product Packages).
- **Duyệt bài tập (Exercise Requests)**: Phê duyệt các đóng góp bài tập từ PT.
- **Báo cáo & Thống kê**: Theo dõi doanh thu, lịch đặt và hiệu suất nền tảng.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Backend**: .NET 9.0 Web API, Entity Framework Core (Pomelo MySQL), SignalR (Realtime), JWT Auth, MailKit/Gmail SMTP, PayOS SDK, Cloudinary.
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Chakra UI, Framer Motion, Axios, Zustand, SWR, Lucide Icons.
- **Database**: MySQL 8.0 (Docker hoặc Native MySQL Server).
- **AI Service**: Python FastAPI / Google Gemini API & Groq LLM (`llama-3.3-70b-versatile`).

---

## 🚀 Hướng Dẫn Chạy Dự Án (How to Run)

### 📋 Yêu cầu tiền đề (Prerequisites)
- **.NET 9.0 SDK**: [Tải tại đây](https://dotnet.microsoft.com/download/dotnet/9.0) (Kiểm tra bằng `dotnet --version`)
- **Node.js**: v18+ và `npm` (Kiểm tra bằng `node -v`)
- **MySQL Server**: 8.0+ hoặc Docker Desktop

---

### 🗄️ 1. Khởi Tạo Database (MySQL)

#### **Cách A: Dùng Docker Compose (Khuyên dùng - Nhanh nhất)**
1. Đảm bảo Docker Desktop đang chạy.
2. Mở terminal tại thư mục gốc của dự án và chạy:
   ```bash
   docker-compose up -d
   ```
   *(Container MySQL sẽ tự động chạy trên Port `3307`, khởi tạo database `FitnessProject` và nạp dữ liệu từ file `data/fitness.sql`)*

#### **Cách B: Dùng MySQL Server Cài Trên Máy Local**
1. Mở MySQL Workbench / DataGrip / DBeaver và tạo database mới:
   ```sql
   CREATE DATABASE FitnessProject;
   ```
2. Import dữ liệu từ file `data/fitness.sql` vào database `FitnessProject`.
3. (Nếu nâng cấp tính năng OTP) Chạy thêm script `data/Add_EmailOTP_Table.sql` hoặc file `migration_patch.sql`.
4. Cập nhật chuỗi kết nối trong `backend/src/FitnessTrainingSystem.WebApi/appsettings.json` hoặc `backend/.env`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Port=3306;Database=FitnessProject;User=root;Password=YOUR_MYSQL_PASSWORD;"
   }
   ```

---

### ⚙️ 2. Khởi Chạy Backend (.NET 9 Web API)

1. Mở terminal và chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Restore và Build dự án:
   ```bash
   dotnet restore
   dotnet build
   ```
3. Khởi chạy server API:
   ```bash
   cd src/FitnessTrainingSystem.WebApi
   dotnet run --urls "http://localhost:5007"
   ```
4. Server Backend sẽ chạy tại: `http://localhost:5007` (Swagger API Document: `http://localhost:5007/swagger`).

---

### 💻 3. Khởi Chạy Frontend (React + Vite)

1. Mở terminal mới và chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Kiểm tra file cấu hình môi trường `frontend/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=916356717531-klok2ck49pggi156ockpp72f5s5mkf3i.apps.googleusercontent.com
   VITE_API_URL=/api
   ```
4. Khởi chạy giao diện phát triển (Dev Server):
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập: [http://localhost:5173/](http://localhost:5173/)

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
NetFit/
├── backend/                             # Nguồn code Backend (.NET 9 Web API)
│   ├── FitnessTrainingSystem.sln
│   └── src/
│       ├── FitnessTrainingSystem.Domain/        # Domain Models, Entities
│       ├── FitnessTrainingSystem.Infrastructure/ # EF Core DB Context, Repositories, External Services
│       └── FitnessTrainingSystem.WebApi/        # Controllers, Middleware, SignalR Hubs
├── frontend/                            # Nguồn code Frontend (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                         # Gọi API Backend
│   │   ├── components/                  # UI Components tái sử dụng
│   │   ├── features/                    # Logic & giao diện theo tính năng (workout, pt, admin...)
│   │   ├── pages/                       # Trang (Admin, PT, Member, Public)
│   │   └── store/                       # Quản lý State toàn cục (Zustand)
│   ├── package.json
│   └── vite.config.ts
├── data/                                # File khởi tạo SQL Database (fitness.sql)
├── fitness-ai-service/                  # Tích hợp AI Service
├── docker-compose.yml                   # Cấu hình container MySQL
└── README.md                            # Tài liệu dự án
```

---

## 🤝 Đóng Góp & Phát Triển (Contributing)

1. Clone repository về máy:
   ```bash
   git clone https://github.com/datlee27/NetFit.git
   cd NetFit
   ```
2. Tạo nhánh tính năng mới:
   ```bash
   git checkout -b feature/ten-tinh-nang
   ```
3. Commit và đẩy code lên repository:
   ```bash
   git add .
   git commit -m "feat: mo ta tinh nang moi"
   git push origin feature/ten-tinh-nang
   ```

---
*Chúc team phát triển dự án thành công! 🚀*
