# Lab 4 — Unit Test Defect Report

Báo cáo phần **Unit test (automation — Lab 3)** của Lab 4 cho ứng dụng
**Date Time Checker**, tương ứng file `Lab4-PerformTestAndReport/Unit Test Defect Log.xls`.

## 1. Đối tượng kiểm thử

- **Hàm kiểm thử:** `DateTimeCheckerService.dayInMonth(Integer month, int year)` — tương ứng
  **Function2 / sheet `DayInMonth`** trong `Template_Unit Test Case.xls`.
- **Bộ automation test:** `src/test/java/com/example/datetimechecker/DayInMonthTest.java` —
  parameterized 15 case **UTCID01..UTCID15** lấy đúng từ sheet `DayInMonth`.
  Chạy xong in báo cáo bảng PASS/FAIL ngay trên console (`@AfterAll`).

## 2. Lệnh chạy

```bash
./mvnw test              # build thường: 15/15 PASS trên code đã fix (build xanh)
./mvnw test -Plab04      # demo defect: chạy 15 case -> 11 PASS / 4 FAIL đúng DFID001..004
```

Profile `lab04` chạy `UnitTestDefect` — một bản `dayInMonth` **cố tình lỗi** mô phỏng
"code trước khi fix", chạy đủ 15 case UTCID01..15 và tái hiện đúng 4 defect đã log. Class này
bị loại khỏi `./mvnw test` mặc định (cấu hình `maven-surefire-plugin` trong `pom.xml`) nên build
chính luôn xanh. Lần chạy `-Plab04` kết thúc `BUILD FAILURE` là **đúng chủ đích** (4 test fail
thật để minh chứng defect).

> Lưu ý: `./mvnw test -Plab04` chạy cả `UnitTestDefect` và `SystemTestDefect` (xem
> [System Test Defect Report](system-test-defect-report.md)) → tổng 30 case, 8 FAIL.

## 3. Kết quả demo (`./mvnw test -Plab04`)

| Tổng case | Passed | Failed |
|-----------|--------|--------|
| 15        | 11     | 4      |

4 case **Failed** → được log thành defect trong **Unit Test Defect Log**:

| Defect ID | Case    | Input (month, year) | Expected | Type | Severity | Priority |
|-----------|---------|---------------------|----------|------|----------|----------|
| DFID001   | UTCID01 | (1, 2020)           | 31       | N    | Serious  | Medium   |
| DFID002   | UTCID06 | (-10, 2026)         | 0        | A    | Serious  | High     |
| DFID003   | UTCID03 | (3, 2024)           | 31       | N    | Serious  | Medium   |
| DFID004   | UTCID08 | (null, 2020)        | 0        | A    | Fatal    | High     |

Mỗi defect ghi theo đúng template log: **Defect ID · Module · Description (kèm Expected result)
· Type · Severity · Priority · Status · Created Date**.

## 4. Sản phẩm bàn giao

| File | Nội dung |
|------|----------|
| `Lab4-PerformTestAndReport/Unit Test Defect Log.xls` | 4 defect (DFID001–004) từ unit test tự động |
| `src/test/java/com/example/datetimechecker/UnitTestDefect.java` | Demo tái hiện 4 defect (profile `lab04`) |
| `Template_Unit Test Case.xls` (sheet `DayInMonth`) | Kết quả 15 case UTCID01..15 — **giữ nguyên** |

> Defect ID trong Unit Test Defect Log được đánh số sạch DFID001–004. File
> `Template_Unit Test Case.xls` **giữ nguyên** (cột Defect ID gốc của sheet DayInMonth không sửa).
