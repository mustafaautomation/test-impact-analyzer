import { describe, it, expect, vi } from 'vitest';
import { getChangedFiles } from '../../src/core/analyzer';

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
