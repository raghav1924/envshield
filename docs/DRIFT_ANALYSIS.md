# Cross-Environment Drift Parity

Compare configuration sets across environments:
- Identifies keys present in `.env.example` but missing from production `.env`.
- Flags orphaned keys in production that are no longer declared in source schemas.
