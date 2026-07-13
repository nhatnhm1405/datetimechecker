# AI-Assisted Testing với Gemini API

Tính năng này gọi **Gemini API thật** để phân tích service, UI và test hiện tại, sau
đó sinh các scenario rủi ro cao thành một file Playwright. Key chỉ được đọc ở máy
local từ `.env`, không được gửi xuống browser và `.env` đã nằm trong `.gitignore`.

## Cấu hình

Sao chép `.env.example` thành `.env`, rồi thay placeholder:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

Tạo API key tại Google AI Studio: <https://aistudio.google.com/app/apikey>.

## Sinh và chạy test

App cần chạy tại `http://localhost:8081`:

```bash
./mvnw spring-boot:run
```

Ở terminal khác, gọi Gemini và chạy ngay suite vừa sinh:

```bash
npm run test:ai
```

Hoặc tách hai bước để review trước khi chạy:

```bash
npm run ai:generate
npm run test:ai:generated
```

Trên Windows, Playwright tự dùng Microsoft Edge nếu có. Có thể ép browser channel
khác bằng biến môi trường `PLAYWRIGHT_CHANNEL`.

AI suite dùng console reporter riêng: mỗi scenario chỉ hiện tên ngắn, trạng thái và
thời gian; cuối run có tổng kết pass/fail. Chi tiết risk vẫn nằm trong annotation của
test và trong `e2e/ai-generated.spec.js`.

Gemini trả structured JSON theo schema cố định. Script kiểm tra kiểu dữ liệu và tên
trùng trước khi ghi `e2e/ai-generated.spec.js`. File sinh ra bị Git ignore vì mỗi lần
có thể khác nhau; `e2e/ai-assisted.spec.js` vẫn là regression suite ổn định đã được
con người duyệt.

Có thể đổi model bằng `GEMINI_MODEL`. Khi API lỗi, script dừng với status/message từ
Gemini và không ghi đè suite đã sinh trước đó.
