const fs = require('fs');
const path = require('path');
const { runBrowserStackMobileTest } = require('./browserstack-mobile');

const testData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'test-data.json'), 'utf-8')
);

const selectedCases = [
  { description: '29/2/2000 - năm nhuận hợp lệ' },
  { description: '29/2/2004 - năm nhuận hợp lệ' },
  { description: '29/2/1900 - không phải năm nhuận, không hợp lệ' },
  { description: '29/2/2100 - không phải năm nhuận, không hợp lệ' },
  { description: 'Ngày cuối tháng: 28/2/2001 - hợp lệ' },
  {
    day: '31',
    month: '4',
    year: '2001',
    expectedValid: false,
    expectedField: null,
    description: 'Ngày 31/4/2001 - không hợp lệ',
  },
  { description: 'Ngày cuối tháng: 31/12/2001 - hợp lệ' },
  { description: 'Day = 0 - ngoài phạm vi [1-31]' },
  { description: 'Day = 32 - ngoài phạm vi [1-31]' },
  { description: 'Month = 0 - ngoài phạm vi [1-12]' },
  { description: 'Month = 13 - ngoài phạm vi [1-12]' },
  { description: 'Year = 999 - ngoài phạm vi [1000-3000]' },
  { description: 'Day = "abc" - không phải số nguyên' },
  { description: 'Month = "abc" - không phải số nguyên' },
  { description: 'Day = "" - không phải số nguyên' },
];

const testCases = selectedCases.map((selectedCase) => {
  if (selectedCase.day !== undefined) return selectedCase;

  const testCase = testData.find((item) => item.description === selectedCase.description);
  if (!testCase) {
    throw new Error(`Missing mobile E2E test case: ${selectedCase.description}`);
  }
  return testCase;
});

describe('DateTimeChecker mobile automation', function () {
  this.timeout(Number.parseInt(process.env.BROWSERSTACK_MOBILE_TIMEOUT || '180000', 10));

  it('runs 15 selected mobile UI E2E cases in one video', async function () {
    await runBrowserStackMobileTest({
      testCases,
    });
  });
});
