export type EnvVarType =
  | 'string'
  | 'number'
  | 'port'
  | 'boolean'
  | 'url'
  | 'email'
  | 'enum'
  | 'secret';

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  comment?: string;
  raw: string;
}

export interface ParsedEnvFile {
  filePath: string;
  entries: Record<string, EnvEntry>;
  rawContent: string;
}

export interface SchemaRule {
  type: EnvVarType;
  required?: boolean;
  default?: string;
  enum?: string[];
  regex?: string;
  description?: string;
}

export interface EnvSchema {
  variables: Record<string, SchemaRule>;
}

export interface ValidationIssue {
  key: string;
  value: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  rule: string;
  message: string;
  remediation?: string;
}

export interface DriftComparison {
  baseFile: string;
  targetFile: string;
  totalBaseKeys: number;
  totalTargetKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  matchingKeys: string[];
  parityScore: number; // 0 - 100%
}

export interface SecretFinding {
  key: string;
  preview: string;
  ruleId: string;
  provider: string;
  entropy: number;
  severity: 'CRITICAL' | 'HIGH';
  description: string;
}

export interface EnvAuditReport {
  timestamp: string;
  filesAnalyzed: string[];
  totalVariables: number;
  validationIssues: ValidationIssue[];
  secretFindings: SecretFinding[];
  driftReports: DriftComparison[];
  healthScore: number; // 0 - 100
}
