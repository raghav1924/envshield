# EnvShield Architecture & Design Principles

This document provides a technical overview of **EnvShield**'s internal architecture, execution pipelines, and design decisions.

Author: [Jatin Sharma](https://jatinsh.netlify.app/) (`@raghav1924`)

---

## High-Level Pipeline

EnvShield follows a linear, deterministic execution model with zero external runtime dependencies:

```
Raw .env / .env.example
          │
          ▼
   [ Lexical Parser ] ────> AST Key-Value Token Map
          │
          ├────────────────────────┬────────────────────────┐
          ▼                        ▼                        ▼
 [ Schema Validator ]      [ Secret Scanner ]      [ Drift Matrix ]
 - Type conformity        - Provider regex         - Baseline comparison
 - Boolean "false" trap   - Shannon Entropy (H)    - Parity percentage
          │                        │                        │
          └────────────────────────┴────────────────────────┘
                                   │
                                   ▼
                       [ Aggregated Result ]
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              [ CLI Output ]              [ Web Studio ]
            (Exit Code 0 / 1)             (Port :5151)
```

---

## 1. Lexical Tokenizer (`src/core/parser.ts`)

- **State Machine:** Single-pass lexer handling key extraction, delimiter tracking (`=`), quoted string handling (`"`, `'`), and escaped character normalization.
- **Comment Parsing:** Distinguishes full-line comments (`# ...`) from inline comments (`PORT=8080 # App port`), ensuring quotes within comments do not trigger lexical errors.
- **Variable Interpolation:** Recursively resolves `${VAR}` expressions against already parsed tokens.
- **Bash Cleanliness:** Automatically strips `export ` prefixes from declarations.

---

## 2. Shannon Entropy Secret Detection (`src/core/scanner.ts`)

To catch newly minted or non-standard API keys that do not match static signatures, EnvShield calculates Shannon Entropy:

$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

Where $P(x_i)$ is the frequency of character $x_i$ divided by total length. Strings with length $\ge 20$ and entropy $H \ge 4.5$ are categorized as potential leaked secrets.

---

## 3. The Boolean Coercion Trap Linter (`src/core/schema.ts`)

In Node.js, `Boolean("false") === true`. When a variable is defined as type `boolean` in the schema but its assigned string value is `"false"` or `"0"`, the schema validator flags a high-priority warning alerting developers that native boolean casting will invert the intended flag.

---

## 4. Cross-Environment Drift Parity Matrix (`src/core/drift.ts`)

The drift analyzer performs set-theoretic comparisons:
- **Missing Keys:** $\text{Baseline} \setminus \text{Target}$
- **Extra Keys:** $\text{Target} \setminus \text{Baseline}$
- **Parity Score:** $\frac{|\text{Baseline} \cap \text{Target}|}{|\text{Baseline} \cup \text{Target}|} \times 100\%$

---

## Zero-Dependency Guarantee

EnvShield exclusively relies on Node.js standard modules (`node:fs`, `node:path`, `node:http`, `node:crypto`). This guarantees sub-50ms execution times and compatibility with any minimal container environment.
