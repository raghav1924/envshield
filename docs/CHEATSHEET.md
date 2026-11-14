# EnvShield CLI Cheatsheet & Quick Reference

A fast reference guide for using **EnvShield** in CI/CD pipelines, Dockerfiles, and pre-commit hooks.

Author: [Jatin Sharma](https://jatinsh.netlify.app/) (`@raghav1924`)

---

## Command Matrix

| Command | Arguments | Description | Example |
|---|---|---|---|
| `check` | `--env <file>` | Validate schema, types, and boolean coercion traps | `envshield check --env .env.local` |
| `check` | `--fail-on-secrets` | Fail with exit code 1 if leaked keys are detected | `envshield check --fail-on-secrets` |
| `drift` | `--baseline <a> --target <b>` | Compare two environment files and compute parity % | `envshield drift --baseline .env.example --target .env.prod` |
| `generate` | `--env <file>` | Synthesize sanitized `.env.example` template | `envshield generate --env .env.local` |
| `studio` | `--port=<p>` | Launch dark-mode visual drift inspector | `envshield studio --port=5151` |
| `version` | | Print version string | `envshield version` |

---

## Pre-Commit Hook (Husky)

```bash
#!/bin/sh
npx envshield check --env .env.local --fail-on-secrets
```
