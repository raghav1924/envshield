import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvParser } from '../core/parser.js';

describe('EnvParser Tokenizer & Parser', () => {
  it('parses standard unquoted key-value pairs', () => {
    const raw = `
      PORT=3000
      NODE_ENV=production
    `;
    const parsed = EnvParser.parse(raw);
    assert.strictEqual(parsed.entries['PORT']?.value, '3000');
    assert.strictEqual(parsed.entries['NODE_ENV']?.value, 'production');
  });

  it('handles double and single quotes with escaped characters', () => {
    const raw = `
      GREETING="Hello\\nWorld"
      SECRET='unmodified$literal'
    `;
    const parsed = EnvParser.parse(raw);
    assert.strictEqual(parsed.entries['GREETING']?.value, 'Hello\nWorld');
    assert.strictEqual(parsed.entries['SECRET']?.value, 'unmodified$literal');
  });

  it('extracts inline comments without polluting variable values', () => {
    const raw = `
      DATABASE_PORT=5432 # standard postgres port
      TIMEOUT_MS="5000" # 5 second limit
    `;
    const parsed = EnvParser.parse(raw);
    assert.strictEqual(parsed.entries['DATABASE_PORT']?.value, '5432');
    assert.strictEqual(parsed.entries['DATABASE_PORT']?.comment, 'standard postgres port');
    assert.strictEqual(parsed.entries['TIMEOUT_MS']?.value, '5000');
    assert.strictEqual(parsed.entries['TIMEOUT_MS']?.comment, '5 second limit');
  });

  it('performs variable interpolation using ${VAR} syntax', () => {
    const raw = `
      HOST=localhost
      PORT=8080
      BASE_URL=http://\${HOST}:\${PORT}/api
    `;
    const parsed = EnvParser.parse(raw);
    assert.strictEqual(parsed.entries['BASE_URL']?.value, 'http://localhost:8080/api');
  });
});
