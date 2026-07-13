const ansi = process.stdout.isTTY;
const paint = (code, text) => ansi ? `\u001b[${code}m${text}\u001b[0m` : text;
const green = (text) => paint('32', text);
const red = (text) => paint('31', text);
const yellow = (text) => paint('33', text);
const cyan = (text) => paint('36', text);
const dim = (text) => paint('2', text);
const bold = (text) => paint('1', text);

function duration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function line(char = '─', width = 64) {
  return char.repeat(width);
}

class AiConsoleReporter {
  constructor() {
    this.startedAt = 0;
    this.counts = { passed: 0, failed: 0, skipped: 0 };
    this.failures = [];
  }

  onBegin(_config, suite) {
    this.startedAt = Date.now();
    const total = suite.allTests().length;
    console.log('');
    console.log(cyan(`╭${line('─', 62)}╮`));
    console.log(cyan('│') + bold('  GEMINI AI-ASSISTED TEST RUN'.padEnd(62)) + cyan('│'));
    console.log(cyan('│') + dim(`  ${total} scenarios generated and validated`.padEnd(62)) + cyan('│'));
    console.log(cyan(`╰${line('─', 62)}╯`));
    console.log('');
  }

  onTestEnd(test, result) {
    const project = test.parent.project()?.name;
    const title = test.title;
    const elapsed = dim(duration(result.duration).padStart(7));

    if (result.status === 'passed') {
      this.counts.passed += 1;
      console.log(`  ${green('✓')} ${title} ${elapsed}`);
      return;
    }
    if (result.status === 'skipped') {
      this.counts.skipped += 1;
      console.log(`  ${yellow('○')} ${title} ${elapsed}`);
      return;
    }

    this.counts.failed += 1;
    const error = result.error?.message?.split('\n')[0] || 'Unknown failure';
    this.failures.push({ title, project, error });
    console.log(`  ${red('✗')} ${title} ${elapsed}`);
  }

  onEnd(result) {
    const totalTime = duration(Date.now() - this.startedAt);
    console.log('');
    console.log(dim(`  ${line()}`));
    console.log(
      `  ${bold('RESULT')}  ${green(`${this.counts.passed} passed`)}` +
      (this.counts.failed ? `  ${red(`${this.counts.failed} failed`)}` : '') +
      (this.counts.skipped ? `  ${yellow(`${this.counts.skipped} skipped`)}` : '') +
      `  ${dim(`in ${totalTime}`)}`
    );

    if (this.failures.length) {
      console.log('');
      console.log(red('  FAILED SCENARIOS'));
      for (const [index, failure] of this.failures.entries()) {
        console.log(`  ${index + 1}. ${failure.title}`);
        console.log(dim(`     ${failure.error}`));
      }
    }

    console.log('');
    const message = result.status === 'passed'
      ? green('  AI suite completed successfully.')
      : red('  AI suite needs attention.');
    console.log(message);
    console.log('');
  }

  printsToStdio() {
    return true;
  }
}

module.exports = AiConsoleReporter;
