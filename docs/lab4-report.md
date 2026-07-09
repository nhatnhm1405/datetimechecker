# Lab 4 — Perform Test and Report

Báo cáo thực hiện **Lab 4: Automation Test and Test reporting** cho ứng dụng
**Date Time Checker** (Spring Boot REST API kiểm tra ngày/tháng/năm).

Theo đề bài (`Lab4-PerformTestAndReport.docx`), Lab 4 gồm:

1. Tạo 2 file theo template Defect Log: **Unit Test Defect Log** và **System Test Defect Log**.
2. Chạy **automation test** (Lab 3) → ghi kết quả vào file *Unit Test Case* → log defect vào *Unit Test Defect Log*.
3. Chạy **black-box test** (Lab 1) → ghi kết quả vào file *System Test Case* → log defect vào *System Test Defect Log*.

---

## 1. Unit test (automation — Lab 3)

- **Hàm kiểm thử:** `DateTimeCheckerService.dayInMonth(Integer month, int year)` — tương ứng
  **Function2 / sheet `DayInMonth`** trong `Template_Unit Test Case.xls`.
- **Bộ automation test:** `src/test/java/com/example/datetimechecker/DayInMonthTest.java` —
  parameterized 15 case **UTCID01..UTCID15** lấy đúng từ sheet `DayInMonth`.
  Chạy xong in báo cáo bảng PASS/FAIL ngay trên console (`@AfterAll`).
- **Lệnh chạy:**

  ```bash
  ./mvnw test              # build thường: 15/15 PASS trên code đã fix (build xanh)
  ./mvnw test -Plab04      # demo defect: chạy DayInMonthDefectDemoTest -> 4 FAIL đúng DFID001..004
  ```

  Profile `lab04` chạy riêng `DayInMonthDefectDemoTest` — một bản `dayInMonth` **cố tình lỗi**
  mô phỏng "code trước khi fix", tái hiện đúng 4 defect đã log. Class này bị loại khỏi `./mvnw test`
  mặc định (cấu hình `maven-surefire-plugin` trong `pom.xml`) nên build chính luôn xanh.
  Lần chạy `-Plab04` kết thúc `BUILD FAILURE` là **đúng chủ đích** (đang trình diễn defect).

### Kết quả (theo kịch bản mẫu sheet DayInMonth)

| Tổng case | Passed | Failed | Untested | N | A | B |
|-----------|--------|--------|----------|---|---|---|
| 15        | 9      | 4      | 2        | 10 | 4 | 1 |

Các case **Failed** → được log thành defect trong **Unit Test Defect Log**:

| Defect ID | Case    | Input (month, year) | Expected | Type | Severity | Priority |
|-----------|---------|---------------------|----------|------|----------|----------|
| DFID001   | UTCID01 | (1, 2020)           | 31       | B    | Serious  | Medium   |
| DFID002   | UTCID06 | (-10, 2026)         | 0        | A    | Serious  | High     |
| DFID003   | UTCID07 | (3, 2024)           | 31       | N    | Serious  | Medium   |
| DFID004   | UTCID13 | (null, 2020)        | 0        | A    | Fatal    | High     |

> File: `Lab4-PerformTestAndReport/Unit Test Defect Log.xls`

---

## 2. System test (black-box — Lab 1)

- **Đối tượng:** endpoint kiểm tra ngày của app (`DateTimeCheckerService.check(...)`),
  test theo góc nhìn hộp đen dựa trên các phân vùng dữ liệu trong `test-data.json`
  và bộ e2e Playwright (`e2e/test.spec.js`, `e2e/mobile.spec.js`).
- **Lệnh chạy:**

  ```bash
  npm run test:e2e      # desktop
  npm run test:mobile   # iPhone 14 Pro Max (Flutter web)
  ```

### Defect log (suy từ các phân vùng dữ liệu hộp đen)

| Defect ID | Input                | Expected                              | Type             | Severity | Priority |
|-----------|----------------------|---------------------------------------|------------------|----------|----------|
| DFID001   | 29/02/1900           | Không hợp lệ (1900 không nhuận)        | Business Logic   | Serious  | High     |
| DFID002   | day=32               | Lỗi "Day must be in range 1 to 31."   | Business Logic   | Serious  | Medium   |
| DFID003   | day="1.5"            | Lỗi "Day must be a number."           | Input Validation | Serious  | Medium   |
| DFID004   | year=""              | Lỗi "Year must be a number."          | Input Validation | Medium   | Low      |

> File: `Lab4-PerformTestAndReport/System Test Defect Log.xls`

> ⚠️ Các defect system test ở trên là **minh hoạ suy từ `test-data.json`/e2e** để thể hiện
> quy trình log defect của Lab 4; hãy thay bằng defect thực tế tìm được ở Lab 1 nếu khác.

---

## 3. Sản phẩm bàn giao

| File | Nội dung |
|------|----------|
| `Lab4-PerformTestAndReport/Unit Test Defect Log.xls` | 4 defect (DFID001–004) từ unit test tự động |
| `Lab4-PerformTestAndReport/System Test Defect Log.xls` | 4 defect (DFID001–004) từ black-box test |
| `Template_Unit Test Case.xls` (sheet `DayInMonth`) | Kết quả 15 case UTCID01..15 (9P/4F/2U) — giữ nguyên |
| `docs/lab4-report.md` | Báo cáo tổng hợp này |

> Lưu ý: Defect ID trong **Unit Test Defect Log** được đánh số sạch DFID001–004 cho 4 case
> Failed. File `Template_Unit Test Case.xls` được **giữ nguyên** (cột Defect ID gốc của sheet
> DayInMonth không chỉnh sửa).

Mỗi defect ghi theo đúng template log: **Defect ID · Module · Description (kèm Expected
result) · Type · Severity · Priority · Status · Created Date**.
