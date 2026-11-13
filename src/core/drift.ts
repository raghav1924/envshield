import { ParsedEnvFile, DriftComparison } from './types.js';

export class DriftDetector {
  /**
   * Compare a baseline environment (e.g. .env.example) against a target environment (e.g. .env.production).
   */
  public static compare(base: ParsedEnvFile, target: ParsedEnvFile): DriftComparison {
    const baseKeys = Object.keys(base.entries);
    const targetKeys = Object.keys(target.entries);

    const baseSet = new Set(baseKeys);
    const targetSet = new Set(targetKeys);

    const missingKeys = baseKeys.filter(k => !targetSet.has(k));
    const extraKeys = targetKeys.filter(k => !baseSet.has(k));
    const matchingKeys = baseKeys.filter(k => targetSet.has(k));

    const totalUniqueKeys = new Set([...baseKeys, ...targetKeys]).size;
    const parityScore = totalUniqueKeys > 0
      ? Math.round((matchingKeys.length / totalUniqueKeys) * 100)
      : 100;

    return {
      baseFile: base.filePath,
      targetFile: target.filePath,
      totalBaseKeys: baseKeys.length,
      totalTargetKeys: targetKeys.length,
      missingKeys,
      extraKeys,
      matchingKeys,
      parityScore,
    };
  }
}

