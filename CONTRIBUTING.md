# Contributing to EnvShield

Thank you for your interest in contributing to **EnvShield**! We welcome community contributions to make environment variable management, secret auditing, and drift detection safer and more reliable.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raghav1924/envshield.git
   cd envshield
   ```

2. **Compile TypeScript:**
   ```bash
   npm run build
   ```

3. **Run Unit Tests:**
   ```bash
   npm test
   ```

## Pull Request Guidelines

- Ensure all existing and new unit tests pass (`npm test`).
- Keep changes zero-dependency: utilize Node.js standard libraries (`node:fs`, `node:path`, `node:http`, `node:crypto`).
- Write meaningful, conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`).
- Document new secret pattern signatures in `README.md`.

---
Maintained by **[Jatin Sharma](https://jatinsh.netlify.app/)** • GitHub: **[@raghav1924](https://github.com/raghav1924)**

