import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvParser } from '../core/parser.js';
import { SecretScanner } from '../core/scanner.js';

describe('SecretScanner Heuristics & Shannon Entropy', () => {
  it('flags known provider signatures (AWS, Stripe, GitHub, OpenAI)', () => {
    const mockAws = ['AKIA', '1234567890ABCDEF'].join('');
    const mockStripe = ['sk', 'live', '123456789012345678901234'].join('_');
    const mockGh = ['ghp', '123456789012345678901234567890123456'].join('_');
    const mockOpenAi = ['sk', '12345678901234567890123456789012'].join('-');

    const raw = `
      AWS_KEY=${mockAws}
      STRIPE_PROD=${mockStripe}
      GH_PAT=${mockGh}
      OPENAI_KEY=${mockOpenAi}
    `;
    const parsed = EnvParser.parse(raw);
    const findings = SecretScanner.scan(parsed);

    assert.strictEqual(findings.length, 4);
    assert.ok(findings.some(f => f.provider === 'Amazon Web Services'));
    assert.ok(findings.some(f => f.provider === 'Stripe'));
    assert.ok(findings.some(f => f.provider === 'GitHub'));
    assert.ok(findings.some(f => f.provider === 'OpenAI'));
  });

  it('calculates Shannon entropy and masks secret previews', () => {
    const lowEntropy = SecretScanner.calculateEntropy('aaaaaaaaaa');
    assert.strictEqual(lowEntropy, 0);

    const highEntropy = SecretScanner.calculateEntropy('Kj9#mP$2vL@8qZ!5xT&1wB*7');
    assert.ok(highEntropy > 4.0);

    const mockKey = ['sk', 'live', 'super_long_secret_key_1234'].join('_');
    const masked = SecretScanner.mask(mockKey);
    assert.strictEqual(masked, 'sk_l...1234');
  });
});
