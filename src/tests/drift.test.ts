import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvParser } from '../core/parser.js';
import { DriftDetector } from '../core/drift.js';

describe('DriftDetector Cross-Environment Comparison', () => {
  it('detects missing and undocumented extra variables between environments', () => {
    const base = EnvParser.parse(`
      PORT=3000
      DATABASE_URL=postgres://localhost
      STRIPE_KEY=your_key
    `, '.env.example');

    const target = EnvParser.parse(`
      PORT=8080
      DATABASE_URL=postgres://prod
      EXTRA_UNDOCUMENTED_FLAG=true
    `, '.env.production');

    const drift = DriftDetector.compare(base, target);

    assert.strictEqual(drift.totalBaseKeys, 3);
    assert.strictEqual(drift.totalTargetKeys, 3);
    assert.ok(drift.missingKeys.includes('STRIPE_KEY'));
    assert.ok(drift.extraKeys.includes('EXTRA_UNDOCUMENTED_FLAG'));
    assert.strictEqual(drift.matchingKeys.length, 2);
    assert.strictEqual(drift.parityScore, 50); // 2 matching out of 4 total unique keys = 50%
  });

  it('computes 100% parity when environments contain identical keys', () => {
    const envA = EnvParser.parse('A=1\nB=2\nC=3\n');
    const envB = EnvParser.parse('A=10\nB=20\nC=30\n');
    const drift = DriftDetector.compare(envA, envB);

    assert.strictEqual(drift.parityScore, 100);
    assert.strictEqual(drift.missingKeys.length, 0);
    assert.strictEqual(drift.extraKeys.length, 0);
  });
});

