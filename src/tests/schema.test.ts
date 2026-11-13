import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvParser } from '../core/parser.js';
import { SchemaValidator } from '../core/schema.js';
import { EnvSchema } from '../core/types.js';

describe('SchemaValidator Type Verification & Linter', () => {
  const schema: EnvSchema = {
    variables: {
      PORT: { type: 'port', required: true },
      APP_URL: { type: 'url', required: true },
      DEBUG: { type: 'boolean', required: false },
      TIER: { type: 'enum', enum: ['free', 'pro', 'enterprise'], required: true },
      MANDATORY_SECRET: { type: 'secret', required: true },
    },
  };

  it('validates conforming environment variables with zero issues', () => {
    const raw = `
      PORT=3000
      APP_URL=https://api.example.com
      DEBUG=true
      TIER=pro
      MANDATORY_SECRET=prod_secure_secret_token_98124
    `;
    const parsed = EnvParser.parse(raw);
    const issues = SchemaValidator.validate(parsed, schema);
    const criticals = issues.filter(i => i.severity === 'CRITICAL');
    assert.strictEqual(criticals.length, 0);
  });

  it('flags invalid port numbers and missing required keys', () => {
    const raw = `
      PORT=999999
      APP_URL=invalid_not_a_url
      TIER=unrecognized_plan
    `;
    const parsed = EnvParser.parse(raw);
    const issues = SchemaValidator.validate(parsed, schema);

    assert.ok(issues.some(i => i.rule === 'INVALID_PORT_NUMBER'));
    assert.ok(issues.some(i => i.rule === 'INVALID_URL_FORMAT'));
    assert.ok(issues.some(i => i.rule === 'ENUM_VALUE_VIOLATION'));
    assert.ok(issues.some(i => i.rule === 'REQUIRED_VARIABLE_MISSING' && i.key === 'MANDATORY_SECRET'));
  });

  it('detects dangerous JavaScript boolean "false" string coercion trap', () => {
    const raw = `
      PORT=3000
      APP_URL=https://example.com
      DEBUG=false
      TIER=free
      MANDATORY_SECRET=custom_secret_123
    `;
    const parsed = EnvParser.parse(raw);
    const issues = SchemaValidator.validate(parsed, schema);
    const trap = issues.find(i => i.rule === 'BOOLEAN_STRING_TRAP');
    assert.ok(trap, 'Should warn about Boolean("false") pitfall in JS');
  });
});

