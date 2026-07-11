const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const browserstack = require('browserstack-local');

loadDotEnv();

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const baseUrl = process.env.BASE_URL || 'http://localhost:8081';
const webUrl = `${baseUrl.replace(/\/$/, '')}/`;
const skipLocal = process.env.BROWSERSTACK_SKIP_LOCAL === 'true';
const isLocalBaseUrl = isLocalUrl(baseUrl);
const useLocalTunnel = !skipLocal && isLocalBaseUrl;
const localIdentifier =
  process.env.BROWSERSTACK_LOCAL_IDENTIFIER ||
  `datetimechecker-${Date.now()}`;

const testDataPath = path.join(process.cwd(), 'test-data.json');
const allTestCases = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
const maxCases = Number.parseInt(process.env.BROWSERSTACK_MAX_CASES || '15', 10);
const testCases = Number.isInteger(maxCases) && maxCases > 0
  ? allTestCases.slice(0, maxCases)
  : allTestCases;

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function requireEnv() {
  const missing = [];
  if (!username) missing.push('BROWSERSTACK_USERNAME');
  if (!accessKey) missing.push('BROWSERSTACK_ACCESS_KEY');
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
  if (skipLocal && isLocalBaseUrl) {
    throw new Error(
      'BASE_URL points to localhost but BROWSERSTACK_SKIP_LOCAL=true. Use a public BASE_URL or enable BrowserStack Local.'
    );
  }
}

function isLocalUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
  } catch (error) {
    throw new Error(`Invalid BASE_URL: ${url}`);
  }
}

function requestUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve();
      } else {
        reject(new Error(`Local app returned HTTP ${res.statusCode}`));
      }
    });
    req.setTimeout(5000, () => {
      req.destroy(new Error('Timed out waiting for local app'));
    });
    req.on('error', reject);
  });
}

function getBrowserStackSession(sessionId) {
  const auth = Buffer.from(`${username}:${accessKey}`).toString('base64');
  const options = {
    hostname: 'api.browserstack.com',
    path: `/automate/sessions/${encodeURIComponent(sessionId)}.json`,
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`BrowserStack API returned HTTP ${res.statusCode}: ${body}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Could not parse BrowserStack API response: ${error.message}`));
        }
      });
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error('Timed out calling BrowserStack API'));
    });
    req.on('error', reject);
    req.end();
  });
}

function toDashboardV2Url(url) {
  if (!url) return null;
  return url.replace(
    'https://automate.browserstack.com/builds/',
    'https://automate.browserstack.com/dashboard/v2/builds/'
  );
}

async function printBrowserStackSessionLink(sessionId) {
  try {
    const data = await getBrowserStackSession(sessionId);
    const session = data.automation_session || data;
    const dashboardUrl = toDashboardV2Url(
      session.browser_url ||
      session.dashboard_url ||
      session.browserstack_status_url
    );
    const buildUrl = session.build_hashed_id
      ? `https://automate.browserstack.com/dashboard/v2/builds/${session.build_hashed_id}`
      : null;
    const publicUrl = toDashboardV2Url(session.public_url);

    if (dashboardUrl) {
      console.log(`BrowserStack dashboard URL: ${dashboardUrl}`);
    }
    if (buildUrl) {
      console.log(`BrowserStack build URL: ${buildUrl}`);
    }
    if (publicUrl) {
      console.log(`BrowserStack public URL: ${publicUrl}`);
    }
    if (!dashboardUrl && !buildUrl && !publicUrl) {
      console.log(
        `BrowserStack session URL was not returned by the API. Search this session id in Automate: ${sessionId}`
      );
    }
  } catch (error) {
    console.warn(`Could not fetch BrowserStack session URL: ${error.message}`);
    console.warn(`Search this session id in BrowserStack Automate: ${sessionId}`);
  }
}

async function waitForLocalApp(url) {
  const maxAttempts = Number.parseInt(
    process.env.BROWSERSTACK_LOCAL_READY_ATTEMPTS || '20',
    10
  );
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await requestUrl(url);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw new Error(
    `Local app is not reachable at ${url}: ${lastError && lastError.message}`
  );
}

function startLocalTunnel() {
  if (!useLocalTunnel) return Promise.resolve(null);

  const bsLocal = new browserstack.Local();
  const logFile = path.join(process.cwd(), 'test-results', 'browserstack-local.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  bsLocal.logfile = logFile;
  const options = {
    key: accessKey,
    localIdentifier,
  };

  return new Promise((resolve, reject) => {
    console.log(`Starting BrowserStack Local tunnel: ${localIdentifier}`);
    bsLocal.start(options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(bsLocal);
    });
  });
}

function stopLocalTunnel(bsLocal) {
  if (!bsLocal) return Promise.resolve();
  return new Promise((resolve, reject) => {
    bsLocal.stop((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function capabilities() {
  const bstackOptions = {
    projectName: 'DateTimeChecker',
    buildName: process.env.BROWSERSTACK_BUILD_NAME || 'Mobile UI E2E',
    sessionName: 'Mobile UI E2E date check',
    deviceName: process.env.BROWSERSTACK_DEVICE || 'iPhone 15',
    osVersion: process.env.BROWSERSTACK_OS_VERSION || '17',
    realMobile: true,
    debug: true,
    networkLogs: true,
    consoleLogs: 'errors',
  };

  if (useLocalTunnel) {
    bstackOptions.local = true;
    bstackOptions.localIdentifier = localIdentifier;
  }

  return {
    browserName: 'safari',
    'bstack:options': bstackOptions,
  };
}

async function setSessionStatus(driver, status, reason) {
  const payload = {
    action: 'setSessionStatus',
    arguments: { status, reason },
  };

  try {
    await driver.executeScript(
      `browserstack_executor: ${JSON.stringify(payload)}`
    );
  } catch (error) {
    console.warn(`Could not set BrowserStack status: ${error.message}`);
  }
}

async function runApiCheck(driver, testCase) {
  return driver.executeAsyncScript(
    `
      const testCase = arguments[0];
      const done = arguments[arguments.length - 1];
      const url = new URL('/api/datetime/check', window.location.origin).toString();

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: testCase.day,
          month: testCase.month,
          year: testCase.year
        })
      })
        .then(async (response) => {
          const body = await response.text();
          let data;

          try {
            data = body ? JSON.parse(body) : {};
          } catch (error) {
            done({
              error: 'Invalid JSON response',
              status: response.status,
              body
            });
            return;
          }

          if (!response.ok) {
            done({
              error: 'HTTP ' + response.status,
              status: response.status,
              body
            });
            return;
          }

          done(data);
        })
        .catch((error) => done({ error: String(error) }));
    `,
    testCase
  );
}

async function saveScreenshot(driver, fileName = 'browserstack-mobile-smoke.png') {
  const screenshot = await driver.takeScreenshot();
  const outputDir = path.join(process.cwd(), 'test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, fileName),
    screenshot,
    'base64'
  );
}

async function pause(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fillInput(driver, selector, value) {
  await driver.executeScript(
    `
      const element = document.querySelector(arguments[0]);
      const value = arguments[1];
      element.focus();
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
    `,
    selector,
    String(value)
  );
  await pause(250);
}

function normalizeColor(color) {
  return String(color).replace(/\s+/g, ' ').trim().toLowerCase();
}

async function runVisibleHtmlUiFlow(driver, demoCase, index, total) {
  console.log(
    `BrowserStack visible UI flow ${index}/${total}: entering ${demoCase.day || '<blank>'}/${demoCase.month || '<blank>'}/${demoCase.year || '<blank>'}`
  );

  await fillInput(driver, '#day', demoCase.day);
  await fillInput(driver, '#month', demoCase.month);
  await fillInput(driver, '#year', demoCase.year);

  await driver.findElement(By.css('button')).click();
  await pause(1000);

  const result = await driver.wait(until.elementLocated(By.css('#result')), 10000);
  await driver.wait(async () => {
    const text = await result.getText();
    return text.trim().length > 0;
  }, 10000, 'Waiting for visible UI result');

  const resultText = await result.getText();
  const resultColor = await driver.executeScript(
    "return getComputedStyle(document.querySelector('#result')).color;"
  );
  const expectedColor = demoCase.expectedValid ? 'rgb(0, 128, 0)' : 'rgb(255, 0, 0)';

  if (normalizeColor(resultColor) !== expectedColor) {
    throw new Error(
      `[${demoCase.description}] Expected result color ${expectedColor}, got ${resultColor}. Text: ${resultText}`
    );
  }
}

async function clearVisibleHtmlForm(driver) {
  await driver.findElement(By.css('#clear')).click();
  await pause(200);
}

async function runVisibleHtmlUiSuite(driver, casesToRun) {
  await driver.get(webUrl);
  await driver.wait(until.elementLocated(By.css('#day')), 30000);

  for (let index = 0; index < casesToRun.length; index += 1) {
    await runVisibleHtmlUiFlow(driver, casesToRun[index], index + 1, casesToRun.length);

    if (index < casesToRun.length - 1) {
      await clearVisibleHtmlForm(driver);
    }
  }

  await saveScreenshot(driver, 'browserstack-visible-ui-flow.png');
}

async function waitForFlutterRender(driver) {
  await driver.wait(async () => {
    return driver.executeScript(`
      return document.readyState === 'interactive' || document.readyState === 'complete';
    `);
  }, 45000, 'Waiting for document readiness');

  await driver.wait(async () => {
    return driver.executeScript(`
      const flutterViews = document.querySelectorAll('flt-glass-pane, flutter-view, flt-scene-host');
      const canvases = document.querySelectorAll('canvas');
      const bodyText = document.body ? document.body.innerText : '';

      return (
        flutterViews.length > 0 ||
        canvases.length > 0 ||
        bodyText.includes('DateTimeChecker')
      );
    `);
  }, 45000, 'Waiting for Flutter Web to render');
}

async function main(options = {}) {
  const casesToRun = options.testCases || testCases;

  requireEnv();
  console.log(`BrowserStack mobile cases: ${casesToRun.length}/${allTestCases.length}`);
  console.log(`BrowserStack target: ${webUrl}`);

  if (isLocalBaseUrl) {
    await waitForLocalApp(webUrl);
  }

  const bsLocal = await startLocalTunnel();
  let driver;
  let sessionId;

  try {
    const serverUrl = `https://${encodeURIComponent(username)}:${encodeURIComponent(accessKey)}@hub-cloud.browserstack.com/wd/hub`;
    driver = await new Builder()
      .usingServer(serverUrl)
      .withCapabilities(capabilities())
      .build();
    await driver.manage().setTimeouts({
      pageLoad: 60000,
      script: 45000,
    });

    const session = await driver.getSession();
    sessionId = session.getId();
    console.log(`BrowserStack session id: ${sessionId}`);

    await runVisibleHtmlUiSuite(driver, casesToRun);

    await saveScreenshot(driver);
    await setSessionStatus(
      driver,
      'passed',
      `Mobile UI E2E passed ${casesToRun.length} case(s)`
    );
    await printBrowserStackSessionLink(sessionId);
    console.log(
      `BrowserStack mobile UI E2E passed: ${casesToRun.length} case(s) at ${webUrl}`
    );
  } catch (error) {
    if (driver) {
      try {
        await saveScreenshot(driver);
      } catch (screenshotError) {
        console.warn(`Could not save failure screenshot: ${screenshotError.message}`);
      }
      await setSessionStatus(driver, 'failed', error.message.slice(0, 255));
      if (sessionId) {
        await printBrowserStackSessionLink(sessionId);
      }
    }
    throw error;
  } finally {
    if (driver) {
      await driver.quit();
    }
    await stopLocalTunnel(bsLocal);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runBrowserStackMobileTest: main,
};
