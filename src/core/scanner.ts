import { ParsedEnvFile, SecretFinding } from './types.js';

interface SecretPattern {
  id: string;
  provider: string;
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH';
  description: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  {
    id: 'SEC-AWS-01',
    provider: 'Amazon Web Services',
    regex: /AKIA[0-9A-Z]{16}/,
    severity: 'CRITICAL',
    description: 'Committed AWS Access Key ID detected.',
  },
  {
    id: 'SEC-STRIPE-01',
    provider: 'Stripe',
    regex: /sk_live_[0-9a-zA-Z]{24,}/,
    severity: 'CRITICAL',
    description: 'Committed live Stripe production secret key detected.',
  },
  {
    id: 'SEC-GITHUB-01',
    provider: 'GitHub',
    regex: /ghp_[0-9a-zA-Z]{36}/,
    severity: 'CRITICAL',
    description: 'Committed GitHub Personal Access Token detected.',
  },
  {
    id: 'SEC-OPENAI-01',
    provider: 'OpenAI',
    regex: /sk-[0-9a-zA-Z]{32,}/,
    severity: 'CRITICAL',
    description: 'Committed OpenAI API key detected.',
  },
  {
    id: 'SEC-SLACK-01',
    provider: 'Slack',
    regex: /xox[baprs]-[0-9a-zA-Z]{10,}/,
    severity: 'HIGH',
    description: 'Committed Slack API token detected.',
  },
  {
    id: 'SEC-RSA-01',
    provider: 'Private Key',
    regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/,
    severity: 'CRITICAL',
    description: 'Unencrypted private RSA/SSH key embedded in configuration.',
  },
];

export class SecretScanner {
  /**
   * Calculate Shannon entropy of a string to identify randomized tokens.
   */
  public static calculateEntropy(str: string): number {
    if (!str || str.length === 0) return 0;
    const len = str.length;
    const frequencies: Record<string, number> = {};

    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(frequencies)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return parseFloat(entropy.toFixed(2));
  }

  /**
   * Mask a secret string for safe display in CLI and web dashboards.
   */
  public static mask(val: string): string {
    if (!val || val.length <= 8) return '********';
    return `${val.slice(0, 4)}...${val.slice(-4)}`;
  }

  /**
   * Scan parsed environment file entries for known secret patterns and high entropy.
   */
  public static scan(parsed: ParsedEnvFile): SecretFinding[] {
    const findings: SecretFinding[] = [];

    for (const [key, entry] of Object.entries(parsed.entries)) {
      const val = entry.value;
      if (!val || val.length < 8) continue;

      // 1. Check known signature patterns
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(val)) {
          findings.push({
            key,
            preview: this.mask(val),
            ruleId: pattern.id,
            provider: pattern.provider,
            entropy: this.calculateEntropy(val),
            severity: pattern.severity,
            description: pattern.description,
          });
          break; // Avoid double flagging same key
        }
      }

      // 2. High-entropy random token heuristic (length >= 24, entropy >= 4.5)
      const entropy = this.calculateEntropy(val);
      const isAlreadyFlagged = findings.some(f => f.key === key);

      if (!isAlreadyFlagged && val.length >= 24 && entropy >= 4.5) {
        const isUrlOrPath = val.includes('/') || val.includes('\\');
        if (!isUrlOrPath) {
          findings.push({
            key,
            preview: this.mask(val),
            ruleId: 'SEC-ENTROPY-01',
            provider: 'High-Entropy Secret',
            entropy,
            severity: 'HIGH',
            description: `High Shannon entropy (${entropy}) indicates a raw randomized secret token committed to plaintext.`,
          });
        }
      }
    }

    return findings;
  }
}
