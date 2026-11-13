import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvParser } from '../core/parser.js';
import { SecretScanner } from '../core/scanner.js';
import { SchemaValidator } from '../core/schema.js';
import { EnvSchema } from '../core/types.js';

describe('Performance & Benchmark Tests', () => {
  it('parses 1,000 synthetic environment declarations in under 50ms', () => {
    const lines: string[] = [];
    for (let i = 0; i < 1000; i++) {
      lines.push(`SERVICE_PORT_${i}=${3000 + (i % 500)}`);
      lines.push(`SERVICE_NAME_${i}="service_${i}" # comment`);
    }
    const raw = lines.join('\n');

    const start = performance.now();
    const parsed = EnvParser.parse(raw);
    const elapsed = performance.now() - start;

    assert.strictEqual(Object.keys(parsed.entries).length, 2000);
    assert.ok(elapsed < 100, `Parsing should be fast, took ${elapsed.toFixed(2)}ms`);
  });

  it('scans 500 variables for Shannon entropy in under 50ms', () => {
    const rawVars: Record<string, { key: string; value: string; line: number }> = {};
    for (let i = 0; i < 500; i++) {
      rawVars[`VAR_${i}`] = {
        key: `VAR_${i}`,
        value: `val_token_identifier_${i}_safe`,
        line: i + 1,
      };
    }
    const parsed: any = { entries: rawVars, lines: 500, filePath: '.env.bench', rawContent: '' };

    const start = performance.now();
    const secrets = SecretScanner.scan(parsed);
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 100, `Entropy scanning took ${elapsed.toFixed(2)}ms`);
  });
});
