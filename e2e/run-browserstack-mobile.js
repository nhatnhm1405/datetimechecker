const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

loadDotEnv();

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;

if (!username || !accessKey) {
  console.error('Missing BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY in .env');
  process.exit(1);
}

const generatedConfig = path.join(process.cwd(), 'browserstack.yml');
fs.writeFileSync(generatedConfig, browserStackConfig(username, accessKey));

const bin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'browserstack-node-sdk.cmd' : 'browserstack-node-sdk'
);

const child = spawn(
  bin,
  [
    'mocha',
    path.join('e2e', 'browserstack-mobile.mocha.js'),
    '--timeout',
    process.env.BROWSERSTACK_MOBILE_TIMEOUT || '180000',
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSERSTACK_SDK_RUN: 'true',
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

child.on('exit', (code, signal) => {
  cleanupGeneratedConfig();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', () => {
  cleanupGeneratedConfig();
});

process.on('exit', cleanupGeneratedConfig);

function cleanupGeneratedConfig() {
  try {
    if (fs.existsSync(generatedConfig)) {
      fs.unlinkSync(generatedConfig);
    }
  } catch (error) {
    console.warn(`Could not remove generated BrowserStack config: ${error.message}`);
  }
}

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

function yamlString(value) {
  return JSON.stringify(String(value));
}

function browserStackConfig(userName, key) {
  const projectName = process.env.BROWSERSTACK_PROJECT_NAME || 'DateTimeChecker';
  const buildName = process.env.BROWSERSTACK_BUILD_NAME || 'Mobile UI E2E';
  const deviceName = process.env.BROWSERSTACK_DEVICE || 'iPhone 15';
  const osVersion = process.env.BROWSERSTACK_OS_VERSION || '17';

  return `userName: ${yamlString(userName)}
accessKey: ${yamlString(key)}

projectName: ${yamlString(projectName)}
buildName: ${yamlString(buildName)}
buildIdentifier: '#\${DATE_TIME}'

platforms:
  - deviceName: ${yamlString(deviceName)}
    osVersion: ${yamlString(osVersion)}
    browserName: safari

parallelsPerPlatform: 1
browserstackLocal: false
debug: true
networkLogs: true
consoleLogs: errors
testReporting: true
`;
}
