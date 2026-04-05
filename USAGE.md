## Real-World Use Cases

### 1. PR CI Optimization
```yaml
- name: Find affected tests
  run: npx tia analyze --src src --tests tests --base main --json > impact.json

- name: Run only affected tests
  run: cat impact.json | jq -r ".affectedTests[]" | xargs npx vitest run
```
Saves 50-80% CI time on every PR.

### 2. Monorepo Test Selection
In monorepos, only run tests for the package that changed.
