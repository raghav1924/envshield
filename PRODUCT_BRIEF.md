# Product Brief: EnvShield 🛡️

**Date:** 2026-11-13  
**Author:** Jatin Sharma ([https://jatinsh.netlify.app/](https://jatinsh.netlify.app/))  
**GitHub:** [@raghav1924](https://github.com/raghav1924)  
**Repository:** [https://github.com/raghav1924/envshield](https://github.com/raghav1924/envshield)  

---

## 1. Executive Summary

In modern microservices, full-stack monorepos, and cloud deployments, environment variables configure runtime behavior, database connections, API secrets, and feature toggles. However, environment configuration management is notoriously error-prone:
- **Environment Drift:** Developers update `.env.local` or `.env.example`, but variables are missing in staging or production, triggering fatal runtime crashes during deployments.
- **Silent Type & Value Coercion Bugs:** An environment variable `ENABLE_BETA="false"` is evaluated as truthy in JavaScript (`Boolean("false") === true`), or invalid port numbers (`PORT="abc"`) cause unhandled server crashes.
- **Catastrophic Secret Leaks:** Live Stripe keys (`sk_live_...`), AWS credentials (`AKIA...`), and OpenAI keys accidentally committed to git or left unmasked in public repositories.
- **Out-of-Date Example Files:** `.env.example` files lag behind codebases by months, slowing developer onboarding.

**EnvShield** is a zero-dependency, developer-first **Environment Variable Linter, Secret Leak Detector, Schema Type Validator & Visual Drift Studio** built in TypeScript for Node.js. It gives developers and CI/CD pipelines instant static analysis across `.env` files, detects drift between environments, scans for committed secrets using Shannon entropy and pattern heuristics, auto-generates sanitized `.env.example` templates, and serves an interactive dark-mode Web Studio on `localhost:5151`.

---

## 2. Core Capabilities & Architecture

1. **Robust `.env` Parser:**
   - Full support for quoted strings (`"..."`, `'...'`), inline comments (`#`), escaped newlines, and variable interpolations (`${VAR}`).
2. **Strict Schema & Type Validation:**
   - Validates types: `string`, `number`, `port` (1-65535), `boolean` (catches dangerous `"false"` strings), `url`, `email`, `enum(...)`, and `secret`.
   - Enforces required vs optional variables and regex patterns.
3. **Multi-Environment Drift Engine:**
   - Matrix comparison across `.env.example`, `.env.local`, `.env.staging`, and `.env.production`.
   - Flags missing keys, undocumented orphan keys, and cross-environment type mismatches.
4. **Secret Leak & Shannon Entropy Scanner:**
   - Detects committed credentials: AWS, Stripe live tokens, GitHub PATs, OpenAI keys, Slack tokens, private RSA keys.
   - Computes Shannon entropy ($H \ge 4.5$) on variable values to flag high-entropy secret tokens committed to source code.
5. **Sanitized Template Generator:**
   - One-command generation of clean, masked `.env.example` templates with inferred type documentation from live `.env` files.
6. **Interactive Dark-Mode Web Studio (`:5151`):**
   - Live multi-environment drift matrix with color-coded comparison badges.
   - Secret audit panel with one-click redaction.
   - Schema playground and syntax validator.
7. **Zero External Dependencies:**
   - Built strictly using Node.js standard libraries (`node:fs`, `node:path`, `node:http`, `node:crypto`).

---

## 3. Directory Structure

```
envshield/
├── src/
│   ├── core/
│   │   ├── types.ts          # Core type definitions, schemas, drift results
│   │   ├── parser.ts         # Robust .env tokenizer and parser
│   │   ├── schema.ts         # Schema validator and type checker
│   │   ├── drift.ts          # Multi-environment comparison engine
│   │   ├── scanner.ts        # Secret leak & Shannon entropy scanner
│   │   └── generator.ts      # Sanitized .env.example template generator
│   ├── server/
│   │   └── studio.ts         # Embedded dark-mode HTTP Visual Studio (:5151)
│   ├── utils/
│   │   └── logger.ts         # ANSI terminal logger & formatted diagnostics
│   ├── tests/
│   │   ├── parser.test.ts    # Parser edge cases & variable expansions
│   │   ├── schema.test.ts    # Type validation & boolean pitfall checks
│   │   ├── drift.test.ts     # Multi-environment matrix comparison
│   │   └── scanner.test.ts   # Secret detection & Shannon entropy
│   ├── cli.ts                # Command-line interface
│   ├── index.ts              # Programmatic exports
│   ├── bin.ts                # Executable binary
│   └── node.d.ts             # Strict Node.js ambient declarations
├── examples/
│   ├── .env.example          # Baseline template
│   ├── .env.local            # Local development env
│   ├── .env.production       # Production env (with intentional drift for testing)
│   └── env.schema.json       # Strict environment schema
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 4. Key Metrics & Success Criteria
- Zero runtime dependencies.
- 100% passing unit tests via native Node.js test runner.
- CI/CD exit codes (`--strict`, `--fail-on-missing`, `--fail-on-secrets`).
- Interactive Web Studio on port 5151.

