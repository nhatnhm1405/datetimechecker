package com.example.datetimechecker;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit Test Defect — Lab 4 (Perform Test and Report).
 *
 * <p>Class này CHỈ chạy qua profile {@code lab04}:</p>
 * <pre>./mvnw test -Plab04</pre>
 * <p>Bị loại khỏi lần chạy {@code ./mvnw test} bình thường (cấu hình surefire trong pom.xml),
 * nên build chính luôn xanh (xem {@link DayInMonthTest} — 15/15 PASS trên code thật).</p>
 *
 * <p>Chạy 15 case, dùng một bản {@code dayInMonth} <b>CỐ TÌNH LỖI</b> (mô phỏng "code trước
 * khi fix"). Kết quả <b>11 PASS / 4 FAIL</b>, đúng 4 defect trong <b>Unit Test Defect Log.xls</b>:</p>
 * <ul>
 *   <li>DFID001 — dayInMonth(month=1,  year=2020) phải = 31 (tháng 1 có 31 ngày)</li>
 *   <li>DFID002 — dayInMonth(month=-10, year=2026) phải = 0  (tháng âm, ngoài [1..12])</li>
 *   <li>DFID003 — dayInMonth(month=3,  year=2024) phải = 31 (tháng 3 có 31 ngày)</li>
 *   <li>DFID004 — dayInMonth(month=null,year=2020) phải = 0  (month=null)</li>
 * </ul>
 * <p>Bản đúng nằm ở {@code DateTimeCheckerService.dayInMonth(...)}. Lần chạy này kết thúc
 * {@code BUILD FAILURE} là ĐÚNG CHỦ ĐÍCH — 4 test fail thật để minh chứng defect.</p>
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UnitTestDefect {

    // ===== Bản dayInMonth CỐ TÌNH LỖI (mô phỏng code chứa bug) =====
    // Bảng số ngày SAI ở tháng 1 và tháng 3 (đúng phải là 31) -> DFID001, DFID003.
    private static final int[] BUGGY_DAYS =
            {0, 30, 28, 30, 30, 31, 30, 31, 31, 30, 31, 30, 31};

    private static int buggyDayInMonth(Integer month, int year) {
        if (month == null) return -1;             // DFID004: không xử lý null -> trả -1 (đúng phải 0)
        if (month < 1 || month > 12) return -1;   // DFID002: không xử lý ngoài range -> -1 (đúng phải 0)
        if (month == 2) return isLeap(year) ? 29 : 28;
        return BUGGY_DAYS[month];                  // DFID001 & DFID003: tháng 1 & 3 trả 30
    }

    private static boolean isLeap(int y) {
        if (y % 400 == 0) return true;
        if (y % 100 == 0) return false;
        return y % 4 == 0;
    }

    private record R(String utcid, String month, int year, int expected, int actual) {
        boolean passed() { return expected == actual; }
    }

    private static final List<R> RESULTS = new ArrayList<>();

    /**
     * 15 case: 4 case gắn dfid (kỳ vọng FAIL, khớp Unit Test Defect Log) + 11 case hợp lệ (PASS).
     * Chỉ có DUY NHẤT 1 case month=null (UTCID08 = DFID004).
     */
    static Stream<Arguments> cases() {
        return Stream.of(
                Arguments.of("UTCID01", "DFID001", (Integer) 1,     2020, 31), // FAIL: tháng 1
                Arguments.of("UTCID02", "",        (Integer) 2,     2021, 28),
                Arguments.of("UTCID03", "DFID003", (Integer) 3,     2024, 31), // FAIL: tháng 3
                Arguments.of("UTCID04", "",        (Integer) 4,     2023, 30),
                Arguments.of("UTCID05", "",        (Integer) 2,     2000, 29),
                Arguments.of("UTCID06", "DFID002", (Integer) (-10), 2026, 0),  // FAIL: tháng âm
                Arguments.of("UTCID07", "",        (Integer) 2,     1900, 28),
                Arguments.of("UTCID08", "DFID004", (Integer) null,  2020, 0),  // FAIL: month=null
                Arguments.of("UTCID09", "",        (Integer) 5,     2023, 31),
                Arguments.of("UTCID10", "",        (Integer) 6,     2023, 30),
                Arguments.of("UTCID11", "",        (Integer) 7,     2023, 31),
                Arguments.of("UTCID12", "",        (Integer) 2,     2024, 29),
                Arguments.of("UTCID13", "",        (Integer) 9,     2023, 30),
                Arguments.of("UTCID14", "",        (Integer) 11,    2023, 30),
                Arguments.of("UTCID15", "",        (Integer) 12,    2023, 31)
        );
    }

    @Order(1)
    @ParameterizedTest(name = "{0}: dayInMonth(month={2}, year={3}) = {4}")
    @MethodSource("cases")
    @DisplayName("Unit Test Defect - 15 case (11 PASS / 4 FAIL)")
    void run(String utcid, String dfid, Integer month, int year, int expected) {
        int actual = buggyDayInMonth(month, year);
        RESULTS.add(new R(utcid, String.valueOf(month), year, expected, actual));

        String tag = dfid.isEmpty() ? utcid : utcid + "/" + dfid;
        assertEquals(expected, actual,
                () -> tag + " FAIL: dayInMonth(month=" + month + ", year=" + year
                        + ") expected " + expected + " but buggy code returned " + actual);
    }

    @AfterAll
    static void report() {
        RESULTS.sort((a, b) -> a.utcid().compareTo(b.utcid()));
        long passed = RESULTS.stream().filter(R::passed).count();
        long failed = RESULTS.size() - passed;

        StringBuilder sb = new StringBuilder();
        String line = "+----------+--------+-------+----------+--------+--------+";
        sb.append('\n');
        sb.append("============ UNIT TEST DEFECT: DayInMonth(month, year) ============\n");
        sb.append(line).append('\n');
        sb.append(String.format("| %-8s | %-6s | %-5s | %-8s | %-6s | %-6s |%n",
                "UTCID", "Month", "Year", "Expected", "Actual", "Result"));
        sb.append(line).append('\n');
        for (R r : RESULTS) {
            sb.append(String.format("| %-8s | %-6s | %-5d | %-8d | %-6d | %-6s |%n",
                    r.utcid(), r.month(), r.year(), r.expected(), r.actual(),
                    r.passed() ? "PASS" : "FAIL"));
        }
        sb.append(line).append('\n');
        sb.append(String.format("Total: %d cases | PASS: %d | FAIL: %d%n",
                RESULTS.size(), passed, failed));
        sb.append("==================================================================\n");

        System.out.println(sb);
    }
}
