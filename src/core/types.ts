export interface FileMapping {
  sourceFile: string;
  testFiles: string[];
}

export interface ImpactResult {
  changedFiles: string[];
  affectedTests: string[];
  skippedTests: string[];
  totalTests: number;
  selectedTests: number;
  savings: number; // percentage of tests skipped
  strategy: 'mapped' | 'pattern' | 'all';
}

export interface MappingConfig {
  sourceDir: string;
  testDir: string;
  testPattern: string;
  mappings?: Record<string, string[]>;
}
