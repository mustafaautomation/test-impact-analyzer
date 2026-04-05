# Test Impact Analyzer

[![CI](https://github.com/mustafaautomation/test-impact-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/test-impact-analyzer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Run only the tests affected by your code changes. Maps source files to test files, analyzes git diffs, and outputs the minimal test set. Save 50-80% CI time.

---

## How It Works

```
git diff main...HEAD → Changed Files → File Mapper → Affected Tests → Run Only Those
```

| Changed File | Strategy | Tests Run |
|---|---|---|
| `src/auth.ts` | Mapped | `tests/auth.test.ts` |
| `tests/cart.test.ts` | Direct | `tests/cart.test.ts` |
| `package.json` | All | Everything |
| `src/unknown.ts` | All (safe) | Everything |

---

## Quick Start

```bash
# Analyze current branch vs main
npx tia analyze --src src --tests tests --base main

# JSON output for CI
npx tia analyze --json | jq '.affectedTests[]'

# Run only affected tests
npx tia analyze --json | jq -r '.affectedTests[]' | xargs npx vitest run
```

---

## CI Integration

```yaml
- name: Determine affected tests
  id: tia
  run: echo "tests=$(npx tia analyze --json | jq -r '.affectedTests | join(" ")')" >> $GITHUB_OUTPUT

- name: Run affected tests only
  run: npx vitest run ${{ steps.tia.outputs.tests }}
```

---

## Library API

```typescript
import { analyzeImpact } from 'test-impact-analyzer';

const result = analyzeImpact(
  { sourceDir: 'src', testDir: 'tests', testPattern: '*.test.ts' },
  'main',
);

console.log(`Run ${result.selectedTests}/${result.totalTests} tests (${result.savings}% saved)`);
```

---

## Project Structure

```
test-impact-analyzer/
├── src/
│   ├── core/
│   │   ├── types.ts         # FileMapping, ImpactResult
│   │   └── analyzer.ts      # Git diff + impact calculation
│   ├── mappers/
│   │   └── file-mapper.ts   # Convention-based source→test mapping
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   └── mapper.test.ts       # 9 tests — mapping, config detection, edge cases
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
