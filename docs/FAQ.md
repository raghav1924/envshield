# Frequently Asked Questions (envshield)

### 1. Does envshield require external npm dependencies?
No. envshield is engineered to run with zero external runtime npm dependencies, relying exclusively on Node.js standard libraries and strict TypeScript.

### 2. Can envshield run inside automated CI/CD pipelines?
Yes. envshield includes dedicated CLI flags and exit codes designed specifically for GitHub Actions, GitLab CI, and Docker build steps.

### 3. How do I start the local Web Studio?
Run the `studio` subcommand from your terminal:
```bash
npx envshield studio
```
Then visit the designated local port in your browser.

### 4. What Node.js versions are supported?
Node.js v18.0.0 and above (LTS 18, 20, and 22).

---
*Need more help? Contact [Jatin Sharma](https://jatinsh.netlify.app/)*
