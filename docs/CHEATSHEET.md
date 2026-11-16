# EnvShield CLI Cheatsheet

```bash
# Lint environment files and scan for secrets
envshield check .env*

# Fail CI if high-entropy secrets or syntax errors are found
envshield check .env* --fail-on-secrets --strict

# Check drift parity against template
envshield drift .env.example .env.production

# Generate sanitized template
envshield template .env.production
```
