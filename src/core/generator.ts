import { ParsedEnvFile } from './types.js';

export class TemplateGenerator {
  /**
   * Generates a sanitized .env.example string from a parsed .env file with smart placeholders.
   */
  public static generateExample(parsed: ParsedEnvFile): string {
    const lines: string[] = [
      '# -----------------------------------------------------------------------------',
      '# Environment Configuration Template',
      '# Generated automatically by EnvShield (https://github.com/raghav1924/envshield)',
      '# Author: Jatin Sharma (https://jatinsh.netlify.app/)',
      '# -----------------------------------------------------------------------------\n',
    ];

    for (const [key, entry] of Object.entries(parsed.entries)) {
      if (entry.comment) {
        lines.push(`# ${entry.comment}`);
      }

      const placeholder = this.inferPlaceholder(key, entry.value);
      lines.push(`${key}=${placeholder}`);
    }

    return lines.join('\n') + '\n';
  }

  private static inferPlaceholder(key: string, val: string): string {
    const upperKey = key.toUpperCase();

    if (upperKey.includes('PORT')) {
      return val ? val : '3000';
    }
    if (upperKey.includes('DATABASE') || upperKey.includes('POSTGRES')) {
      return 'postgresql://user:password@localhost:5432/mydb';
    }
    if (upperKey.includes('REDIS')) {
      return 'redis://localhost:6379';
    }
    if (upperKey.includes('MONGO')) {
      return 'mongodb://localhost:27017/mydb';
    }
    if (upperKey.includes('URL') || upperKey.includes('HOST')) {
      return 'http://localhost:3000';
    }
    if (upperKey.includes('EMAIL')) {
      return 'admin@example.com';
    }
    if (val === 'true' || val === 'false' || upperKey.startsWith('ENABLE_') || upperKey.startsWith('DISABLE_')) {
      return 'false';
    }
    if (upperKey.includes('KEY') || upperKey.includes('SECRET') || upperKey.includes('TOKEN') || upperKey.includes('PASS')) {
      return `your_${key.toLowerCase()}_here`;
    }

    return 'placeholder_value';
  }
}

