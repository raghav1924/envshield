# Multi-Tenant & Multi-Cluster Environment Parity Guide

A guide to enforcing environment variable parity across staging, preview, and production clusters with **EnvShield**.

Author: [Jatin Sharma](https://jatinsh.netlify.app/) (`@raghav1924`)

---

## 1. Automated CI Drift Gates

Ensure staging and production never deviate from `.env.example`:

```bash
# In CI pipeline
node dist/bin.js drift --baseline .env.example --target .env.production
```

If the parity score drops below 100%, the CI pipeline alerts engineers to undocumented variables.

---

## 2. Preventing Secret Leakage into Staging

Staging environments often clone production databases without sanitizing API keys. Run:

```bash
node dist/bin.js check --env .env.staging --fail-on-secrets
```
