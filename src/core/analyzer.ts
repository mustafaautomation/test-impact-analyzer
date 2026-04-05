import { execSync } from 'child_process';
import { ImpactResult } from './types';
import { buildFileMap, findAffectedTests } from '../mappers/file-mapper';
import { MappingConfig } from './types';

export function analyzeImpact(config: MappingConfig, baseBranch = 'main'): ImpactResult {
  const changedFiles = getChangedFiles(baseBranch);
  const mappings = buildFileMap(config);
  const allTestFiles = mappings.flatMap((m) => m.testFiles);
  const uniqueTests = [...new Set(allTestFiles)];

  const { affected, skipped, strategy } = findAffectedTests(changedFiles, mappings, uniqueTests);

  const savings =
    uniqueTests.length > 0 ? Math.round((skipped.length / uniqueTests.length) * 100) : 0;

  return {
    changedFiles,
    affectedTests: affected,
    skippedTests: skipped,
    totalTests: uniqueTests.length,
    selectedTests: affected.length,
    savings,
    strategy,
  };
}

export function getChangedFiles(baseBranch = 'main'): string[] {
  try {
    const output = execSync(`git diff --name-only ${baseBranch}...HEAD`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    // Not in a git repo or no commits — return empty
    return [];
  }
}
