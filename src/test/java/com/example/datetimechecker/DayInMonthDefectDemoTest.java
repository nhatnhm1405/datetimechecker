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
 * DEMO DEFECT — Lab 4 (Perform Test and Report).
 *
 * <p>Class này CHỈ chạy qua profile {@code lab04}:</p>
 * <pre>./mvnw test -Plab04</pre>
 * <p>Nó bị loại khỏi lần chạy {@code ./mvnw test} bình thường (cấu hình surefire trong pom.xml),
 * nên build chính luôn xanh (xem {@link DayInMonthTest} — 15/15 PASS trên code thật).</p>
 *
 * <p>Mục đích: tái hiện đúng 4 defect đã ghi trong <b>Unit Test Defect Log.xls</b>
 * (DFID001..DFID004). Class dùng một bản {@code dayInMonth} <b>CỐ TÌNH LỖI</b>
 * mô phỏng "code trước khi fix" để 4 case fail thật, khớp mô tả defect.
 * Bản đúng nằm ở {@code DateTimeCheckerService.dayInMonth(...)} và đã pass toàn bộ.</p>
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DayInMonthDefectDemoTest {

    // ===== Bản dayInMonth CỐ TÌNH LỖI (mô phỏng code chứa bug) =====
    // Bảng số ngày SAI ở tháng 1 và tháng 3 (đúng phải là 31) -> DFID001, DFID003.
    private static final int[] BUGGY_DAYS =
            {0, 30, 28, 30, 30, 31, 30, 31, 31, 30, 31, 30, 31};

    private static int buggyDayInMonth(Integer month, int year) {
        // DFID002 & DFID004: chỉ chặn cận trên, THIẾU kiểm tra null và month < 1
        if (month != null && month > 12) return 0;
        if (month == null) return -1;   // xử lý sai null  -> trả -1 (đúng phải 0)
        if (month < 1) return -1;       // xử lý sai tháng âm -> trả -1 (đúng phải 0)
        if (month == 2) return isLeap(year) ? 29 : 28;
        return BUGGY_DAYS[month];        // tháng 1 & 3 trả 30 thay vì 31
    }

    private static boolean isLeap(int y) {
        if (y % 400 == 0) return true;
        if (y % 100 == 0) return false;
        return y % 4 == 0;
    }

    private record R(String dfid, String month, int year, int expected, int actual) {
        boolean passed() { return expected == actual; }
    }

    private static final List<R> RESULTS = new ArrayList<>();

    /** 4 case ứng với 4 defect trong Unit Test Defect Log. */
    static Stream<Arguments> defectCases() {
        return Stream.of(
                Arguments.of("DFID001", (Integer) 1,     2020, 31), // tháng 1 phải có 31 ngày
                Arguments.of("DFID002", (Integer) (-10), 2026, 0),  // tháng âm -> 0
                Arguments.of("DFID003", (Integer) 3,     2024, 31), // tháng 3 phải có 31 ngày
                Arguments.of("DFID004", (Integer) null,  2020, 0)   // month=null -> 0
        );
    }

    @Order(1)
    @ParameterizedTest(name = "{0}: dayInMonth(month={1}, year={2}) phải = {3}")
    @MethodSource("defectCases")
    @DisplayName("Lab4 Defect Demo - DFID001..DFID004 (kỳ vọng FAIL trên bản code lỗi)")
    void demo(String dfid, Integer month, int year, int expected) {
        int actual = buggyDayInMonth(month, year);
        RESULTS.add(new R(dfid, String.valueOf(month), year, expected, actual));

        assertEquals(expected, actual,
                () -> dfid + " FAIL: dayInMonth(month=" + month + ", year=" + year
                        + ") expected " + expected + " but buggy code returned " + actual);
    }

    @AfterAll
    static void report() {
        RESULTS.sort((a, b) -> a.dfid().compareTo(b.dfid()));
        long failed = RESULTS.stream().filter(r -> !r.passed()).count();

        StringBuilder sb = new StringBuilder();
        String line = "+----------+--------+-------+----------+--------+--------+";
        sb.append('\n');
        sb.append("======== LAB4 DEFECT DEMO: DayInMonth (buggy version) ========\n");
        sb.append(line).append('\n');
        sb.append(String.format("| %-8s | %-6s | %-5s | %-8s | %-6s | %-6s |%n",
                "DefectID", "Month", "Year", "Expected", "Actual", "Result"));
        sb.append(line).append('\n');
        for (R r : RESULTS) {
            sb.append(String.format("| %-8s | %-6s | %-5d | %-8d | %-6d | %-6s |%n",
                    r.dfid(), r.month(), r.year(), r.expected(), r.actual(),
                    r.passed() ? "PASS" : "FAIL"));
        }
        sb.append(line).append('\n');
        sb.append(String.format("Total: %d defect case | FAIL: %d (matches Unit Test Defect Log)%n",
                RESULTS.size(), failed));
        sb.append("==============================================================\n");

        System.out.println(sb);
    }
}
