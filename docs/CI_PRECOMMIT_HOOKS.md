# Pre-Commit & CI Quality Gates

Prevent accidental git commits containing unencrypted secrets:
```bash
node dist/bin.js check .env* --fail-on-secrets
```
