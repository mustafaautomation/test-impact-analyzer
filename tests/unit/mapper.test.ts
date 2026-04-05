import { describe, it, expect } from 'vitest';
import { findAffectedTests } from '../../src/mappers/file-mapper';
import { FileMapping } from '../../src/core/types';

const mappings: FileMapping[] = [
  { sourceFile: 'src/auth.ts', testFiles: ['tests/auth.test.ts'] },
  { sourceFile: 'src/users.ts', testFiles: ['tests/users.test.ts', 'tests/users.spec.ts'] },
  { sourceFile: 'src/cart.ts', testFiles: ['tests/cart.test.ts'] },
];
const allTests = [
  'tests/auth.test.ts',
  'tests/users.test.ts',
  'tests/users.spec.ts',
  'tests/cart.test.ts',
];

describe('findAffectedTests', () => {
  it('should find tests for changed source file', () => {
    const { affected } = findAffectedTests(['src/auth.ts'], mappings, allTests);
    expect(affected).toContain('tests/auth.test.ts');
  });

  it('should find multiple tests for one file', () => {
    const { affected } = findAffectedTests(['src/users.ts'], mappings, allTests);
    expect(affected).toContain('tests/users.test.ts');
    expect(affected).toContain('tests/users.spec.ts');
  });

  it('should include changed test files directly', () => {
    const { affected } = findAffectedTests(['tests/cart.test.ts'], mappings, allTests);
    expect(affected).toContain('tests/cart.test.ts');
  });

  it('should run all tests when config files change', () => {
    const { affected, strategy } = findAffectedTests(['package.json'], mappings, allTests);
    expect(strategy).toBe('all');
    expect(affected).toHaveLength(allTests.length);
  });

  it('should run all tests when tsconfig changes', () => {
    const { strategy } = findAffectedTests(['tsconfig.json'], mappings, allTests);
    expect(strategy).toBe('all');
  });

  it('should calculate skipped tests', () => {
    const { skipped } = findAffectedTests(['src/auth.ts'], mappings, allTests);
    expect(skipped).not.toContain('tests/auth.test.ts');
    expect(skipped.length).toBe(allTests.length - 1);
  });

  it('should run all tests when no mapping found', () => {
    const { strategy } = findAffectedTests(['src/unknown.ts'], mappings, allTests);
    expect(strategy).toBe('all');
  });

  it('should handle empty changed files', () => {
    const { strategy } = findAffectedTests([], mappings, allTests);
    expect(strategy).toBe('all');
  });

  it('should handle multiple changed files', () => {
    const { affected } = findAffectedTests(['src/auth.ts', 'src/cart.ts'], mappings, allTests);
    expect(affected).toContain('tests/auth.test.ts');
    expect(affected).toContain('tests/cart.test.ts');
  });
});
