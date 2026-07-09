# Lab 4 — System Test Defect Report

Báo cáo phần **System test (black-box — Lab 1)** của Lab 4 cho ứng dụng
**Date Time Checker**, tương ứng file `Lab4-PerformTestAndReport/System Test Defect Log.xls`.

## 1. Đối tượng kiểm thử

- **Đối tượng:** chức năng kiểm tra ngày của app (`DateTimeCheckerService.check(day, month, year)`),
  test theo góc nhìn hộp đen (black-box) dựa trên các phân vùng dữ liệu trong `test-data.json`
  và bộ e2e Playwright (`e2e/test.spec.js`, `e2e/mobile.spec.js`).

## 2. Lệnh chạy

```bash
npm run test:e2e         # desktop
npm run test:mobile      # iPhone 14 Pro Max (Flutter web)
./mvnw test -Plab04      # demo defect: chạy 15 case -> 11 PASS / 4 FAIL đúng DFID001..004
```

Profile `lab04` chạy `SystemTestDefect` — một bản `check()` **cố tình lỗi** (chấp nhận input đáng
lẽ phải báo lỗi), chạy 15 case black-box và tái hiện đúng 4 defect đã log. Class này bị loại khỏi
`./mvnw test` mặc định nên build chính luôn xanh. Lần chạy `-Plab04` kết thúc `BUILD FAILURE` là
**đúng chủ đích** (4 test fail thật để minh chứng defect).

> Lưu ý: `./mvnw test -Plab04` chạy cả `SystemTestDefect` và `UnitTestDefect` (xem
> [Unit Test Defect Report](unit-test-defect-report.md)) → tổng 30 case, 8 FAIL.

## 3. Kết quả demo (`./mvnw test -Plab04`)

| Tổng case | Passed | Failed |
|-----------|--------|--------|
| 15        | 11     | 4      |

4 case **Failed** → được log thành defect trong **System Test Defect Log**:

| Defect ID | Case    | Input (day, month, year) | Expected                              | Type             | Severity | Priority |
|-----------|---------|--------------------------|---------------------------------------|------------------|----------|----------|
| DFID001   | UTCID01 | (29, 2, 1900)            | Không hợp lệ (1900 không nhuận)        | Business Logic   | Serious  | High     |
| DFID002   | UTCID03 | (32, 1, 2000)            | Lỗi "Day must be in range 1 to 31."   | Business Logic   | Serious  | Medium   |
| DFID003   | UTCID06 | (1.5, 1, 2000)           | Lỗi "Day must be a number."           | Input Validation | Serious  | Medium   |
| DFID004   | UTCID08 | (1, 1, "")               | Lỗi "Year must be a number."          | Input Validation | Medium   | Low      |

Mỗi defect ghi theo đúng template log: **Defect ID · Module · Description (kèm Expected result)
· Type · Severity · Priority · Status · Created Date**.

> ⚠️ Các defect system test ở trên là **minh hoạ suy từ `test-data.json`/e2e** để thể hiện quy
> trình log defect của Lab 4; hãy thay bằng defect thực tế tìm được ở Lab 1 nếu khác.

## 4. Sản phẩm bàn giao

| File | Nội dung |
|------|----------|
| `Lab4-PerformTestAndReport/System Test Defect Log.xls` | 4 defect (DFID001–004) từ black-box test |
| `src/test/java/com/example/datetimechecker/SystemTestDefect.java` | Demo tái hiện 4 defect (profile `lab04`) |
