# 12-Factor App Environment Best Practices

Managing configurations in modern GitOps:
- Never commit unencrypted `.env` files to source control.
- Utilize automated pre-commit hooks to block high-entropy strings ($H \ge 4.5$).
- Always maintain synchronized `.env.example` templates in repository root.
