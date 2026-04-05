import fs from 'fs';
import path from 'path';
import { FileMapping, MappingConfig } from '../core/types';

/**
 * Maps source files to their corresponding test files using conventions.
 * Supports: src/foo.ts → tests/foo.test.ts, src/foo.ts → __tests__/foo.test.ts
 */
export function buildFileMap(config: MappingConfig): FileMapping[] {
  const mappings: FileMapping[] = [];
  const testFiles = findFiles(config.testDir, config.testPattern);

  const sourceFiles = findFiles(config.sourceDir, '*.ts');

  for (const sourceFile of sourceFiles) {
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    const matching = testFiles.filter(
      (t) =>
        t.includes(basename + '.test.') ||
        t.includes(basename + '.spec.') ||
        t.includes(basename + '_test.'),
    );

    // Also check explicit mappings
    const explicit = config.mappings?.[sourceFile] || [];

    const allTests = [...new Set([...matching, ...explicit])];

    if (allTests.length > 0) {
      mappings.push({ sourceFile, testFiles: allTests });
    }
  }

  return mappings;
}

/**
 * Given a list of changed files, find affected test files.
 */
export function findAffectedTests(
  changedFiles: string[],
  mappings: FileMapping[],
  allTestFiles: string[],
): { affected: string[]; skipped: string[]; strategy: 'mapped' | 'pattern' | 'all' } {
  const affected = new Set<string>();

  for (const changed of changedFiles) {
    // Check direct mappings
    const mapping = mappings.find((m) => m.sourceFile === changed);
    if (mapping) {
      mapping.testFiles.forEach((t) => affected.add(t));
      continue;
    }

    // Check if changed file IS a test file
    if (isTestFile(changed)) {
      affected.add(changed);
      continue;
    }

    // Pattern-based: match by basename
    const basename = path.basename(changed, path.extname(changed));
    const patternMatches = allTestFiles.filter(
      (t) => t.includes(basename + '.test.') || t.includes(basename + '.spec.'),
    );
    patternMatches.forEach((t) => affected.add(t));
  }

  // If config/package files changed, run all tests
  const configFiles = changedFiles.filter(
    (f) =>
      f.includes('package.json') ||
      f.includes('tsconfig') ||
      f.includes('.env') ||
      f.includes('config'),
  );

  if (configFiles.length > 0) {
    return { affected: allTestFiles, skipped: [], strategy: 'all' };
  }

  if (affected.size === 0) {
    return { affected: allTestFiles, skipped: [], strategy: 'all' };
  }

  const skipped = allTestFiles.filter((t) => !affected.has(t));
  return {
    affected: [...affected],
    skipped,
    strategy: affected.size < allTestFiles.length ? 'mapped' : 'all',
  };
}

function isTestFile(file: string): boolean {
  return file.includes('.test.') || file.includes('.spec.') || file.includes('_test.');
}

function findFiles(dir: string, pattern: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];
  const ext = pattern.replace('*', '');

  function walk(d: string): void {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(ext) || pattern === '*.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}
