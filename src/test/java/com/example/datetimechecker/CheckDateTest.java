package com.example.datetimechecker;

import com.example.datetimechecker.dto.DateTimeRequest;
import com.example.datetimechecker.service.DateTimeCheckerService;
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
 * Unit test cho hàm {@link DateTimeCheckerService#check} — kiểm tra ngày
 * {@code check(day, month, year)}.
 *
 * <p>15 test case (UTCID01..UTCID15) lấy đúng từ sheet <b>CheckDate</b> trong
 * file "Template_Unit Test Case.xls". Cột tham chiếu: Day / Month / Year /
 * Return (hợp lệ hay không). Dùng bản {@code check(...)} ĐÚNG trong service, nên
 * toàn bộ 15 case đều PASS (khác với {@link SystemTestDefect} là bản cố tình lỗi
 * chỉ chạy qua {@code -Plab04}).</p>
 *
 * <p>Sau khi chạy xong, {@code @AfterAll} in báo cáo bảng có <b>cột Day</b>
 * (Month/Year không thể hiện đủ input của hàm này).</p>
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CheckDateTest {

    private final DateTimeCheckerService service = new DateTimeCheckerService();

    private record CaseResult(String utcid, String day, String month, String year,
                              boolean expected, boolean actual, String type) {
        boolean passed() {
            return expected == actual;
        }
    }

    private static final List<CaseResult> RESULTS = new ArrayList<>();

    /**
     * 15 case từ sheet CheckDate.
     * Cột: UTCID | day | month | year | expected (true = hợp lệ) | type (N/A/B)
     */
    static Stream<Arguments> checkDateCases() {
        return Stream.of(
                Arguments.of("UTCID01", "29",  "2",  "1900", false, "B"), // 29/2/1900 năm không nhuận
                Arguments.of("UTCID02", "1",   "1",  "2000", true,  "N"),
                Arguments.of("UTCID03", "32",  "1",  "2000", false, "A"), // day ngoài [1..31]
                Arguments.of("UTCID04", "29",  "2",  "2000", true,  "B"), // 2000 nhuận
                Arguments.of("UTCID05", "28",  "2",  "2001", true,  "B"),
                Arguments.of("UTCID06", "1.5", "1",  "2000", false, "A"), // day không phải số nguyên
                Arguments.of("UTCID07", "30",  "4",  "2001", true,  "B"),
                Arguments.of("UTCID08", "1",   "1",  "",     false, "A"), // year rỗng
                Arguments.of("UTCID09", "31",  "12", "2001", true,  "B"),
                Arguments.of("UTCID10", "15",  "6",  "2010", true,  "N"),
                Arguments.of("UTCID11", "1",   "13", "2000", false, "A"), // month ngoài [1..12]
                Arguments.of("UTCID12", "0",   "1",  "2000", false, "A"), // day < 1
                Arguments.of("UTCID13", "abc", "1",  "2000", false, "A"), // day không phải số
                Arguments.of("UTCID14", "1",   "1",  "999",  false, "A"), // year ngoài [1000..3000]
                Arguments.of("UTCID15", "1",   "0",  "2000", false, "A")  // month < 1
        );
    }

    @Order(1)
    @ParameterizedTest(name = "{0}: check(day={1}, month={2}, year={3}) valid={4}")
    @MethodSource("checkDateCases")
    @DisplayName("CheckDate - 15 test case (UTCID01..UTCID15)")
    void checkDate(String utcid, String day, String month, String year,
                   boolean expected, String type) {
        boolean actual = service.check(new DateTimeRequest(day, month, year)).valid();

        // Ghi lại TRƯỚC khi assert để báo cáo có đủ 15 dòng dù có case fail.
        RESULTS.add(new CaseResult(utcid, day, month, year, expected, actual, type));

        assertEquals(expected, actual,
                () -> utcid + " FAIL: check(day=" + day + ", month=" + month + ", year=" + year
                        + ") kỳ vọng valid=" + expected + " nhưng nhận " + actual);
    }

    @AfterAll
    static void printReport() {
        RESULTS.sort((a, b) -> a.utcid().compareTo(b.utcid()));

        long passed = RESULTS.stream().filter(CaseResult::passed).count();
        long failed = RESULTS.size() - passed;

        StringBuilder sb = new StringBuilder();
        String line = "+----------+-------+-------+-------+----------+----------+------+--------+";
        sb.append('\n');
        sb.append("============ UNIT TEST REPORT: check(day, month, year) ============\n");
        sb.append(line).append('\n');
        sb.append(String.format("| %-8s | %-5s | %-5s | %-5s | %-8s | %-8s | %-4s | %-6s |%n",
                "UTCID", "Day", "Month", "Year", "Expected", "Actual", "Type", "Result"));
        sb.append(line).append('\n');
        for (CaseResult r : RESULTS) {
            sb.append(String.format("| %-8s | %-5s | %-5s | %-5s | %-8s | %-8s | %-4s | %-6s |%n",
                    r.utcid(), r.day(), r.month(), r.year(),
                    r.expected() ? "valid" : "invalid",
                    r.actual() ? "valid" : "invalid",
                    r.type(), r.passed() ? "PASS" : "FAIL"));
        }
        sb.append(line).append('\n');
        sb.append(String.format("Total: %d cases | PASS: %d | FAIL: %d%n",
                RESULTS.size(), passed, failed));
        sb.append("==================================================================\n");

        System.out.println(sb);
    }
}
