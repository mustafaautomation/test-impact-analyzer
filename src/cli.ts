#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeImpact } from './core/analyzer';

const R = '\x1b[0m',
  B = '\x1b[1m',
  D = '\x1b[2m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m';

const program = new Command();
program.name('tia').description('Test Impact Analysis — run only affected tests').version('1.0.0');

program
  .command('analyze')
  .description('Analyze which tests are affected by current changes')
  .option('--src <dir>', 'Source directory', 'src')
  .option('--tests <dir>', 'Test directory', 'tests')
  .option('--base <branch>', 'Base branch to diff against', 'main')
  .option('--pattern <glob>', 'Test file pattern', '*.test.ts')
  .option('--json', 'Output as JSON')
  .action((options) => {
    const result = analyzeImpact(
      { sourceDir: options.src, testDir: options.tests, testPattern: options.pattern },
      options.base,
    );

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log();
      console.log(`${B}${CYN}Test Impact Analysis${R}`);
      console.log();
      console.log(`  Changed files:   ${result.changedFiles.length}`);
      console.log(`  Total tests:     ${result.totalTests}`);
      console.log(`  ${GRN}Selected tests:  ${result.selectedTests}${R}`);
      console.log(`  Skipped tests:   ${result.skippedTests.length}`);
      console.log(`  ${YEL}Savings:         ${result.savings}%${R}`);
      console.log(`  Strategy:        ${result.strategy}`);
      console.log();

      if (result.affectedTests.length > 0) {
        console.log(`  ${B}Run these tests:${R}`);
        for (const t of result.affectedTests) {
          console.log(`    ${GRN}+ ${t}${R}`);
        }
      }

      if (result.skippedTests.length > 0 && result.skippedTests.length <= 10) {
        console.log(`  ${D}Skipped:${R}`);
        for (const t of result.skippedTests) {
          console.log(`    ${D}- ${t}${R}`);
        }
      }
      console.log();
    }
  });

program.parse();
