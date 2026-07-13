const { test, expect } = require('@playwright/test');

// Các case rủi ro cao do AI gợi ý từ đặc tả Gregorian và validation order.
// Kỳ vọng được viết độc lập với API để tránh test chỉ lặp lại implementation.
const cases = [
  ['biên dưới của year', '1', '1', '1000', true, '01/01/1000 is a valid date.'],
  ['biên trên của year', '31', '12', '3000', true, '31/12/3000 is a valid date.'],
  ['năm chia hết cho 400 là năm nhuận', '29', '2', '2000', true, '29/02/2000 is a valid date.'],
  ['năm chia hết cho 100 không phải năm nhuận', '29', '2', '1900', false, '29/02/1900 is an invalid date.'],
  ['tháng 4 không có ngày 31', '31', '4', '2024', false, '31/04/2024 is an invalid date.'],
  ['day được validate trước month và year', 'abc', '13', '999', false, 'Day must be a number.'],
  ['month được validate trước year', '1', '13', '999', false, 'Month must be in range 1 to 12.'],
  ['trim khoảng trắng trước khi parse', ' 29 ', ' 2 ', ' 2024 ', true, '29/02/2024 is a valid date.'],
];

async function submit(page, day, month, year) {
  await page.getByLabel('Day', { exact: true }).fill(day);
  await page.getByLabel('Month', { exact: true }).fill(month);
  await page.getByLabel('Year', { exact: true }).fill(year);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

test.describe('AI-assisted risk-based scenarios', () => {
  for (const [name, day, month, year, valid, message] of cases) {
    test(name, async ({ page }) => {
      await page.goto('/');
      await submit(page, day, month, year);

      const result = page.locator('#result');
      await expect(result).toHaveText(message);
      await expect(result).toHaveCSS('color', valid ? 'rgb(0, 128, 0)' : 'rgb(255, 0, 0)');
    });
  }

  test('Clear xóa toàn bộ input, message và trạng thái màu', async ({ page }) => {
    await page.goto('/');
    await submit(page, '29', '2', '2000');
    await expect(page.locator('#result')).toHaveText('29/02/2000 is a valid date.');

    await page.getByRole('button', { name: 'Clear', exact: true }).click();

    await expect(page.getByLabel('Day', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Month', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Year', { exact: true })).toHaveValue('');
    await expect(page.locator('#result')).toBeEmpty();
  });
});
