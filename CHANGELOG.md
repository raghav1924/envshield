# Changelog

All notable changes to **EnvShield** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-13

### Added
- Robust `.env` parser with quotes, inline comments, escaped characters, and `${VAR}` interpolation.
- Schema validator supporting types: `port`, `number`, `boolean`, `url`, `email`, `enum`, `secret`.
- Dangerous JavaScript boolean string coercion linter (`Boolean("false") === true`).
- Multi-environment cross-drift comparison engine calculating parity percentage.
- Secret leak detector with signature heuristics for AWS, Stripe, GitHub, OpenAI, Slack, and private keys.
- Shannon entropy calculator ($H \ge 4.5$) detecting raw randomized token commits.
- Sanitized `.env.example` template synthesizer.
- Interactive dark-mode Web Studio on port 5151.
- Zero external runtime dependencies.

