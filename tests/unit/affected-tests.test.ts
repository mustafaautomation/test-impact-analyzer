import { describe, it, expect } from 'vitest';
import { findAffectedTests } from '../../src/mappers/file-mapper';
import { FileMapping } from '../../src/core/types';

const allTestFiles = [
  'tests/auth.test.ts',
  'tests/users.test.ts',
  'tests/products.test.ts',
  'tests/cart.test.ts',
  'tests/checkout.test.ts',
];

const mappings: FileMapping[] = [
  { sourceFile: 'src/auth.ts', testFiles: ['tests/auth.test.ts'] },
  { sourceFile: 'src/users.ts', testFiles: ['tests/users.test.ts'] },
  { sourceFile: 'src/products.ts', testFiles: ['tests/products.test.ts'] },
  { sourceFile: 'src/cart.ts', testFiles: ['tests/cart.test.ts'] },
  { sourceFile: 'src/checkout.ts', testFiles: ['tests/checkout.test.ts'] },
];

describe('findAffectedTests — direct mapping', () => {
  it('should find test for single changed source file', () => {
    const result = findAffectedTests(['src/auth.ts'], mappings, allTestFiles);
    expect(result.affected).toContain('tests/auth.test.ts');
    expect(result.affected).toHaveLength(1);
    expect(result.skipped).toHaveLength(4);
    expect(result.strategy).toBe('mapped');
  });

  it('should find tests for multiple changed files', () => {
    const result = findAffectedTests(['src/auth.ts', 'src/cart.ts'], mappings, allTestFiles);
    expect(result.affected).toContain('tests/auth.test.ts');
    expect(result.affected).toContain('tests/cart.test.ts');
    expect(result.affected).toHaveLength(2);
    expect(result.skipped).toHaveLength(3);
  });

  it('should deduplicate affected tests', () => {
    const duplicateMappings: FileMapping[] = [
      { sourceFile: 'src/a.ts', testFiles: ['tests/shared.test.ts'] },
      { sourceFile: 'src/b.ts', testFiles: ['tests/shared.test.ts'] },
    ];
    const result = findAffectedTests(['src/a.ts', 'src/b.ts'], duplicateMappings, [
      'tests/shared.test.ts',
    ]);
    expect(result.affected).toHaveLength(1);
  });
});

describe('findAffectedTests — test file changes', () => {
  it('should include changed test files directly', () => {
    const result = findAffectedTests(['tests/auth.test.ts'], mappings, allTestFiles);
    expect(result.affected).toContain('tests/auth.test.ts');
  });

  it('should include .spec.ts files', () => {
    const result = findAffectedTests(['tests/auth.spec.ts'], mappings, allTestFiles);
    expect(result.affected).toContain('tests/auth.spec.ts');
  });

  it('should include _test.ts files', () => {
    const result = findAffectedTests(['tests/auth_test.ts'], mappings, allTestFiles);
    expect(result.affected).toContain('tests/auth_test.ts');
  });
});

describe('findAffectedTests — config file changes', () => {
  it('should run ALL tests when package.json changes', () => {
    const result = findAffectedTests(['package.json'], mappings, allTestFiles);
    expect(result.strategy).toBe('all');
    expect(result.affected).toHaveLength(allTestFiles.length);
    expect(result.skipped).toHaveLength(0);
  });

  it('should run ALL tests when tsconfig changes', () => {
    const result = findAffectedTests(['tsconfig.json'], mappings, allTestFiles);
    expect(result.strategy).toBe('all');
    expect(result.affected).toEqual(allTestFiles);
  });

  it('should run ALL tests when .env changes', () => {
    const result = findAffectedTests(['.env.production'], mappings, allTestFiles);
    expect(result.strategy).toBe('all');
  });

  it('should run ALL tests when config file changes', () => {
    const result = findAffectedTests(['config/database.ts'], mappings, allTestFiles);
    expect(result.strategy).toBe('all');
  });
});

describe('findAffectedTests — pattern fallback', () => {
  it('should match by basename when no direct mapping', () => {
    const result = findAffectedTests(
      ['src/utils/helpers.ts'],
      [], // no explicit mappings
      ['tests/helpers.test.ts', 'tests/other.test.ts'],
    );
    expect(result.affected).toContain('tests/helpers.test.ts');
    expect(result.affected).not.toContain('tests/other.test.ts');
  });

  it('should run ALL when no matches found', () => {
    const result = findAffectedTests(['src/completely-new-file.ts'], mappings, allTestFiles);
    // No mapping, not a test file, no pattern match → run all
    expect(result.strategy).toBe('all');
    expect(result.affected).toEqual(allTestFiles);
  });
});

describe('findAffectedTests — savings calculation', () => {
  it('should calculate correct savings with partial selection', () => {
    const result = findAffectedTests(['src/auth.ts'], mappings, allTestFiles);
    // 1 affected out of 5 → 4 skipped → 80% savings
    expect(result.skipped).toHaveLength(4);
  });

  it('should have zero skipped when all affected', () => {
    const result = findAffectedTests(['package.json'], mappings, allTestFiles);
    expect(result.skipped).toHaveLength(0);
  });

  it('should handle empty test list', () => {
    const result = findAffectedTests(['src/auth.ts'], [], []);
    expect(result.strategy).toBe('all');
    expect(result.affected).toHaveLength(0);
  });
});
