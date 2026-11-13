import { EnvSchema, ParsedEnvFile, ValidationIssue } from './types.js';

export class SchemaValidator {
  public static validate(parsed: ParsedEnvFile, schema: EnvSchema): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check all rules in the schema
    for (const [key, rule] of Object.entries(schema.variables)) {
      const entry = parsed.entries[key];

      // 1. Missing required variables
      if (!entry) {
        if (rule.required !== false) {
          issues.push({
            key,
            value: '',
            severity: 'CRITICAL',
            rule: 'REQUIRED_VARIABLE_MISSING',
            message: `Required environment variable "${key}" is missing from ${parsed.filePath}.`,
            remediation: rule.default ? `Set "${key}=${rule.default}"` : `Define "${key}" in your environment file.`,
          });
        }
        continue;
      }

      const val = entry.value;

      // 2. Type validation
      switch (rule.type) {
        case 'port': {
          const portNum = parseInt(val, 10);
          if (isNaN(portNum) || portNum < 1 || portNum > 65535 || String(portNum) !== val.trim()) {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'INVALID_PORT_NUMBER',
              message: `Port "${key}" must be an integer between 1 and 65535. Received: "${val}".`,
              remediation: 'Set to a valid port such as 3000, 8080, or 4000.',
            });
          }
          break;
        }

        case 'number': {
          if (isNaN(Number(val)) || val.trim() === '') {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'INVALID_NUMERIC_TYPE',
              message: `Variable "${key}" expected numeric value, received "${val}".`,
              remediation: 'Provide a valid integer or float.',
            });
          }
          break;
        }

        case 'boolean': {
          const lower = val.toLowerCase().trim();
          if (!['true', 'false', '1', '0'].includes(lower)) {
            issues.push({
              key,
              value: val,
              severity: 'WARNING',
              rule: 'INVALID_BOOLEAN_TYPE',
              message: `Variable "${key}" expected boolean ("true" or "false"), received "${val}".`,
              remediation: 'Set value to "true" or "false".',
            });
          } else if (lower === 'false') {
            // High-impact trap: Boolean("false") === true in JavaScript
            issues.push({
              key,
              value: val,
              severity: 'INFO',
              rule: 'BOOLEAN_STRING_TRAP',
              message: `Caution: In JavaScript, Boolean("false") evaluates to TRUE. Verify that your app checks process.env.${key} === "true".`,
              remediation: `Use (process.env.${key} === 'true') instead of Boolean(process.env.${key}).`,
            });
          }
          break;
        }

        case 'url': {
          try {
            const u = new URL(val);
            if (!['http:', 'https:', 'postgres:', 'postgresql:', 'redis:', 'mongodb:', 'mysql:'].includes(u.protocol)) {
              issues.push({
                key,
                value: val,
                severity: 'WARNING',
                rule: 'UNCONVENTIONAL_URL_PROTOCOL',
                message: `URL "${key}" has unconventional protocol: "${u.protocol}".`,
              });
            }
          } catch {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'INVALID_URL_FORMAT',
              message: `Variable "${key}" is not a valid URL. Received: "${val}".`,
              remediation: 'Ensure URL includes protocol (e.g. "https://api.example.com").',
            });
          }
          break;
        }

        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'INVALID_EMAIL_FORMAT',
              message: `Variable "${key}" is not a valid email address. Received: "${val}".`,
            });
          }
          break;
        }

        case 'enum': {
          if (rule.enum && !rule.enum.includes(val)) {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'ENUM_VALUE_VIOLATION',
              message: `Variable "${key}" value "${val}" is not in allowed list [${rule.enum.join(', ')}].`,
              remediation: `Change value to one of: ${rule.enum.join(', ')}.`,
            });
          }
          break;
        }

        case 'secret': {
          const lower = val.toLowerCase().trim();
          if (['change_me', 'secret', 'password', '123456', 'todo'].includes(lower)) {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'INSECURE_PLACEHOLDER_SECRET',
              message: `Secret "${key}" is using an insecure dummy placeholder value: "${val}".`,
              remediation: 'Generate a secure, random cryptographic secret.',
            });
          }
          break;
        }
      }

      // 3. Regex validation if specified
      if (rule.regex) {
        try {
          const re = new RegExp(rule.regex);
          if (!re.test(val)) {
            issues.push({
              key,
              value: val,
              severity: 'CRITICAL',
              rule: 'REGEX_PATTERN_MISMATCH',
              message: `Variable "${key}" does not match required regex pattern: ${rule.regex}`,
            });
          }
        } catch {}
      }
    }

    return issues;
  }
}
