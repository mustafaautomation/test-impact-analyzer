import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { analyzeImpact, getChangedFiles } from '../../src/core/analyzer';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

const mockedExecSync = vi.mocked(execSync);

describe('getChangedFiles', () => {
  it('should parse git diff output', () => {
    mockedExecSync.mockReturnValue(
      'src/auth.ts\nsrc/users.ts\npackage.json\n' as unknown as Buffer,
    );

    const files = getChangedFiles('main');
    expect(files).toHaveLength(3);
    expect(files).toContain('src/auth.ts');
    expect(files).toContain('src/users.ts');
    expect(files).toContain('package.json');
  });

  it('should handle empty diff', () => {
    mockedExecSync.mockReturnValue('\n' as unknown as Buffer);

    const files = getChangedFiles('main');
    expect(files).toHaveLength(0);
  });

  it('should handle git error gracefully', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    const files = getChangedFiles('main');
    expect(files).toHaveLength(0);
  });

  it('should trim whitespace from filenames', () => {
    mockedExecSync.mockReturnValue('  src/auth.ts  \n  src/users.ts  \n' as unknown as Buffer);

    const files = getChangedFiles('main');
    expect(files).toEqual(['src/auth.ts', 'src/users.ts']);
  });

  it('should filter empty lines', () => {
    mockedExecSync.mockReturnValue('src/a.ts\n\n\nsrc/b.ts\n\n' as unknown as Buffer);

    const files = getChangedFiles('main');
    expect(files).toHaveLength(2);
  });

  it('should use provided base branch', () => {
    mockedExecSync.mockReturnValue('' as unknown as Buffer);

    getChangedFiles('develop');
    expect(mockedExecSync).toHaveBeenCalledWith(
      'git diff --name-only develop...HEAD',
      expect.any(Object),
    );
  });

  it('should default to main branch', () => {
    mockedExecSync.mockReturnValue('' as unknown as Buffer);

    getChangedFiles();
    expect(mockedExecSync).toHaveBeenCalledWith(
      'git diff --name-only main...HEAD',
      expect.any(Object),
    );
  });
});

describe('analyzeImpact', () => {
  // Fixture project: two mapped tests and one test with no matching source file.
  let root: string;
  let src: string;
  let tests: string;

  beforeAll(() => {
    const abs = fs.mkdtempSync(path.join(os.tmpdir(), 'tia-'));
    root = path.relative(process.cwd(), abs);
    src = path.join(root, 'src');
    tests = path.join(root, 'tests');
    fs.mkdirSync(src);
    fs.mkdirSync(tests);
    for (const f of ['auth.ts', 'cart.ts']) fs.writeFileSync(path.join(src, f), '');
    for (const f of ['auth.test.ts', 'cart.test.ts', 'helpers.test.ts']) {
      fs.writeFileSync(path.join(tests, f), '');
    }
  });

  afterAll(() => {
    fs.rmSync(path.resolve(root), { recursive: true, force: true });
  });

  const config = () => ({ sourceDir: src, testDir: tests, testPattern: '*.test.ts' });

  it('counts every test file, including unmapped ones, in the totals', () => {
    mockedExecSync.mockReturnValue(`${path.join(src, 'auth.ts')}\n` as unknown as Buffer);

    const result = analyzeImpact(config());
    expect(result.affectedTests).toEqual([path.join(tests, 'auth.test.ts')]);
    expect(result.totalTests).toBe(3);
    expect(result.skippedTests).toHaveLength(2);
    expect(result.skippedTests).toContain(path.join(tests, 'helpers.test.ts'));
    expect(result.savings).toBe(67);
    expect(result.strategy).toBe('mapped');
  });

  it('runs every test file, including unmapped ones, when a config file changes', () => {
    mockedExecSync.mockReturnValue('package.json\n' as unknown as Buffer);

    const result = analyzeImpact(config());
    expect(result.strategy).toBe('all');
    expect(result.selectedTests).toBe(3);
    expect(result.affectedTests).toContain(path.join(tests, 'helpers.test.ts'));
    expect(result.savings).toBe(0);
  });
});
