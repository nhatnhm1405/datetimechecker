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
 * System Test Defect — Lab 4 (Perform Test and Report).
 *
 * <p>Class này CHỈ chạy qua profile {@code lab04}:</p>
 * <pre>./mvnw test -Plab04</pre>
 * <p>Bị loại khỏi lần chạy {@code ./mvnw test} bình thường (cấu hình surefire trong pom.xml).</p>
 *
 * <p>Test hộp đen (black-box) trên chức năng kiểm tra ngày ({@code check(day, month, year)}),
 * dùng một bản kiểm tra <b>CỐ TÌNH LỖI</b> (chấp nhận input đáng lẽ phải báo lỗi). Chạy 15 case
 * → <b>11 PASS / 4 FAIL</b>, đúng 4 defect trong <b>System Test Defect Log.xls</b>:</p>
 * <ul>
 *   <li>DFID001 — 29/02/1900 (năm không nhuận) phải KHÔNG hợp lệ</li>
 *   <li>DFID002 — day=32 (ngoài [1..31]) phải báo lỗi</li>
 *   <li>DFID003 — day="1.5" (không phải số nguyên) phải báo lỗi</li>
 *   <li>DFID004 — year rỗng "" phải báo lỗi</li>
 * </ul>
 * <p>Bản đúng nằm ở {@code DateTimeCheckerService.check(...)}. Lần chạy này kết thúc
 * {@code BUILD FAILURE} là ĐÚNG CHỦ ĐÍCH — 4 test fail thật để minh chứng defect.</p>
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SystemTestDefect {

    // ===== Bản check() CỐ TÌNH LỖI (mô phỏng hệ thống chứa bug) =====
    // Trả về true nếu hệ thống (lỗi) coi ngày là HỢP LỆ.
    private static boolean buggyValid(String dayS, String monthS, String yearS) {
        Integer day = tryInt(dayS);
        Integer month = tryInt(monthS);
        Integer year = tryInt(yearS);

        // DFID003: nhận nhầm số thập phân cho Day (vd "1.5" -> 1) thay vì báo "không phải số"
        if (day == null && isDecimal(dayS)) day = (int) Double.parseDouble(dayS.trim());
        // DFID004: Year rỗng "" bị coi là hợp lệ (mặc định 2000) thay vì báo lỗi
        if (year == null && "".equals(yearS)) year = 2000;

        if (day == null || month == null || year == null) return false;
        if (month < 1 || month > 12) return false;
        if (year < 1000 || year > 3000) return false;
        if (day < 1) return false;

        // DFID001 & DFID002: THIẾU kiểm tra chặn trên số ngày trong tháng
        //   -> chấp nhận mọi day >= 1 (29/02/1900 và day=32 lọt qua)
        return true;
    }

    private static Integer tryInt(String s) {
        if (s == null) return null;
        try { return Integer.parseInt(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    private static boolean isDecimal(String s) {
        if (s == null) return false;
        try { Double.parseDouble(s.trim()); return true; }
        catch (NumberFormatException e) { return false; }
    }

    private record R(String utcid, String day, String month, String year,
                     boolean expected, boolean actual) {
        boolean passed() { return expected == actual; }
    }

    private static final List<R> RESULTS = new ArrayList<>();

    /**
     * 15 case black-box: 4 case gắn dfid (kỳ vọng FAIL, khớp System Test Defect Log) + 11 hợp lệ.
     * expected = ngày có hợp lệ theo đặc tả đúng hay không.
     */
    static Stream<Arguments> cases() {
        return Stream.of(
                Arguments.of("UTCID01", "DFID001", "29", "2",  "1900", false), // FAIL: 29/2/1900 không nhuận
                Arguments.of("UTCID02", "",        "1",  "1",  "2000", true),
                Arguments.of("UTCID03", "DFID002", "32", "1",  "2000", false), // FAIL: day ngoài [1..31]
                Arguments.of("UTCID04", "",        "29", "2",  "2000", true),
                Arguments.of("UTCID05", "",        "28", "2",  "2001", true),
                Arguments.of("UTCID06", "DFID003", "1.5","1",  "2000", false), // FAIL: day không phải số nguyên
                Arguments.of("UTCID07", "",        "30", "4",  "2001", true),
                Arguments.of("UTCID08", "DFID004", "1",  "1",  "",     false), // FAIL: year rỗng
                Arguments.of("UTCID09", "",        "31", "12", "2001", true),
                Arguments.of("UTCID10", "",        "15", "6",  "2010", true),
                Arguments.of("UTCID11", "",        "1",  "13", "2000", false), // month ngoài [1..12]
                Arguments.of("UTCID12", "",        "0",  "1",  "2000", false), // day < 1
                Arguments.of("UTCID13", "",        "abc","1",  "2000", false), // day không phải số
                Arguments.of("UTCID14", "",        "1",  "1",  "999",  false), // year ngoài [1000..3000]
                Arguments.of("UTCID15", "",        "1",  "0",  "2000", false)  // month < 1
        );
    }

    @Order(1)
    @ParameterizedTest(name = "{0}: check(day={2}, month={3}, year={4}) valid={5}")
    @MethodSource("cases")
    @DisplayName("System Test Defect - 15 case (11 PASS / 4 FAIL)")
    void run(String utcid, String dfid, String day, String month, String year, boolean expected) {
        boolean actual = buggyValid(day, month, year);
        RESULTS.add(new R(utcid, day, month, year, expected, actual));

        String tag = dfid.isEmpty() ? utcid : utcid + "/" + dfid;
        assertEquals(expected, actual,
                () -> tag + " FAIL: check(day=" + day + ", month=" + month + ", year=" + year
                        + ") expected valid=" + expected + " but buggy system returned " + actual);
    }

    @AfterAll
    static void report() {
        RESULTS.sort((a, b) -> a.utcid().compareTo(b.utcid()));
        long passed = RESULTS.stream().filter(R::passed).count();
        long failed = RESULTS.size() - passed;

        StringBuilder sb = new StringBuilder();
        String line = "+----------+-------+-------+-------+----------+----------+--------+";
        sb.append('\n');
        sb.append("============ SYSTEM TEST DEFECT: check(day, month, year) ============\n");
        sb.append(line).append('\n');
        sb.append(String.format("| %-8s | %-5s | %-5s | %-5s | %-8s | %-8s | %-6s |%n",
                "UTCID", "Day", "Month", "Year", "Expected", "Actual", "Result"));
        sb.append(line).append('\n');
        for (R r : RESULTS) {
            sb.append(String.format("| %-8s | %-5s | %-5s | %-5s | %-8s | %-8s | %-6s |%n",
                    r.utcid(), r.day(), r.month(), r.year(),
                    r.expected() ? "valid" : "invalid",
                    r.actual() ? "valid" : "invalid",
                    r.passed() ? "PASS" : "FAIL"));
        }
        sb.append(line).append('\n');
        sb.append(String.format("Total: %d cases | PASS: %d | FAIL: %d%n",
                RESULTS.size(), passed, failed));
        sb.append("====================================================================\n");

        System.out.println(sb);
    }
}
