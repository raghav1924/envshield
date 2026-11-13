# EnvShield Cookbook & Practical Recipes

Common integration recipes for utilizing **EnvShield** in enterprise pipelines, CI/CD runners, and Docker workflows.

Author: [Jatin Sharma](https://jatinsh.netlify.app/) (`@raghav1924`)

---

## 1. Pre-Commit Hook (Husky / Git Hooks)

Prevent committing raw API keys or invalid `.env` files locally before code reaches GitHub:

```bash
#!/bin/sh
# .husky/pre-commit
npx envshield check --env .env.local --fail-on-secrets
```

---

## 2. GitHub Actions CI Parity Gate

Fail PR builds if `.env.example` has drifted from `.env.production` or staging templates:

```yaml
name: Environment Parity Verification

on:
  pull_request:
    branches: [main]

jobs:
  verify-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - name: Verify Drift Parity
        run: node dist/bin.js drift --baseline examples/.env.example --target examples/.env.production
```

---

## 3. Safe Boolean Conversion Pattern in TypeScript

Avoid the `Boolean(process.env.DEBUG)` trap flagged by EnvShield by using this pattern:

```typescript
export function parseEnvBoolean(val: string | undefined, defaultVal = false): boolean {
  if (!val) return defaultVal;
  const normalized = val.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return defaultVal;
}
```

---

## 4. Docker Multi-Stage Build Secret Check

Ensure no plaintext keys are baked into final Docker images:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build
# Audit environment templates before final image creation
RUN node dist/bin.js check --env .env.example --strict
```
