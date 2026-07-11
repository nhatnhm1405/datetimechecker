# AI-Assisted Testing — Playwright MCP + Cline

Tài liệu này hướng dẫn dùng **Playwright MCP** kết hợp **Cline** (VS Code) để AI tự
động **sinh test (test generation)** và **tự chữa test khi UI đổi (self-healing)**
cho phần web desktop. Mobile automation của project đã chuyển sang BrowserStack real
iPhone Safari (`e2e/browserstack-mobile.js`).

Mô hình:

```
VS Code
  └─ Cline (MCP client)  ──── API key: Gemini (hoặc DeepSeek)
         └─ Playwright MCP server (@playwright/mcp)
                 └─ điều khiển Chromium → app tại http://localhost:8081
```

Không tốn thêm chi phí công cụ: dự án đã có Playwright, MCP server chạy qua `npx`,
Cline miễn phí và dùng chính key Gemini/DeepSeek của bạn.

---

## 1. Cài đặt (1 lần)

Playwright MCP server đã được thêm vào `devDependencies` (`@playwright/mcp`).

1. Cài extension **Cline** trong VS Code (Marketplace → tìm "Cline").
2. Cài trình duyệt cho Playwright nếu chưa có:
   ```bash
   npx playwright install chromium
   ```

## 2. Nối API key (Gemini hoặc DeepSeek) vào Cline

1. Mở Cline (icon robot ở thanh bên trái) → **Settings** (⚙).
2. **API Provider**:
   - **Gemini** — dán Gemini API key, chọn model `gemini-2.0-flash` (hoặc `gemini-2.5-flash`).
     Nên dùng Gemini cho việc điều khiển trình duyệt vì hỗ trợ vision (đọc ảnh canvas).
   - **DeepSeek** — dán DeepSeek API key, chọn `deepseek-chat`. Rẻ, mạnh về suy luận
     nhưng không có vision → hợp sinh/chữa test dựa trên DOM hơn là canvas Flutter.

> Không commit API key lên git. Nhập trực tiếp trong Cline (lưu trong máy), đừng để trong repo.

## 3. Đăng ký Playwright MCP server trong Cline

Cline lưu cấu hình MCP ở file `cline_mcp_settings.json` (mở qua Cline → **MCP Servers**
→ **Configure MCP Servers**). Dán khối JSON **thuần** (không comment) sau vào mục `mcpServers`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"]
    }
  }
}
```

- `playwright` — điều khiển trình duyệt desktop (test trang `/`).

Sau khi lưu, Cline sẽ hiện server với danh sách tool (`browser_navigate`, `browser_click`,
`browser_type`, `browser_snapshot`...). Bật (enable) chúng.

## 4. Chạy app trước khi test

MCP điều khiển trình duyệt thật nên app phải đang chạy:

```bash
./mvnw spring-boot:run
# hoặc: docker compose up --build app
```

Kiểm tra: http://localhost:8081 và http://localhost:8081/mobile/index.html

---

## 5. Dùng — Test generation bằng ngôn ngữ tự nhiên

Trong khung chat Cline, ra lệnh (tiếng Việt được). Ví dụ cho **web desktop**:

> Dùng MCP server `playwright`, mở http://localhost:8081, nhập day=29, month=2,
> year=2000, bấm nút kiểm tra. Đọc kết quả trên trang. Sau đó sinh cho tôi một file
> Playwright test `e2e/ai-generated.spec.js` kiểm tra case này là ngày hợp lệ, theo
> đúng style của `e2e/test.spec.js`.

AI sẽ tự thao tác trình duyệt qua MCP (bạn xem được từng bước), rồi ghi file spec.
Chạy lại bằng bộ lệnh có sẵn:

```bash
npx playwright test e2e/ai-generated.spec.js
```

## 6. Self-healing — tự chữa test khi UI đổi

Khi đổi giao diện làm test fail (đổi label nút, đổi id ô input...), đưa log lỗi cho Cline:

> Chạy `npx playwright test e2e/test.spec.js` báo lỗi selector không tìm thấy nút.
> Dùng MCP server `playwright` mở lại http://localhost:8081, chụp snapshot DOM để tìm
> selector đúng của nút kiểm tra bây giờ, rồi sửa lại selector trong `e2e/test.spec.js`
> cho đúng. Chạy lại để xác nhận pass.

AI dùng `browser_snapshot` đọc DOM/accessibility tree hiện tại → tìm phần tử tương ứng
→ vá selector → chạy lại. Đó là "self-healing" thủ công có kiểm soát (bạn duyệt diff
trước khi lưu).

---

## 7. Lưu ý & giới hạn

- **App Flutter Web dùng CanvasKit** → không có input DOM ổn định cho mobile. Mobile
  automation chính thức chuyển sang BrowserStack real device smoke/API validation.
- **MCP điều khiển trình duyệt thật** → luôn bật app trước, và chỉ trỏ vào localhost.
- **Luôn review diff AI sinh ra** trước khi commit. AI sinh test nhanh nhưng có thể
  assert sai hoặc lệch style; đối chiếu với `e2e/test.spec.js`.
- **Không đưa API key vào repo.** Key nhập trong Cline, lưu cục bộ.
- Bộ dữ liệu test dùng chung vẫn là `test-data.json` (sinh từ `generate-test-data.js`).
  Khi nhờ AI thêm case, ưu tiên bảo nó lấy dữ liệu từ đây để nhất quán với các lớp test khác.
