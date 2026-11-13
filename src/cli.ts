import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EnvParser } from './core/parser.js';
import { SchemaValidator } from './core/schema.js';
import { DriftDetector } from './core/drift.js';
import { SecretScanner } from './core/scanner.js';
import { TemplateGenerator } from './core/generator.js';
import { StudioServer } from './server/studio.js';
import { EnvSchema, EnvAuditReport, ParsedEnvFile } from './core/types.js';
import { log, colors } from './utils/logger.js';

interface CliOptions {
  command: string;
  files: string[];
  schemaPath?: string;
  outPath?: string;
  port: number;
  strict: boolean;
  failOnSecrets: boolean;
  exportHtml?: string;
  jsonOutput: boolean;
  help: boolean;
  version: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    command: 'studio',
    files: [],
    port: 5151,
    strict: false,
    failOnSecrets: false,
    jsonOutput: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' || arg === '-v') {
      opts.version = true;
    } else if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--fail-on-secrets') {
      opts.failOnSecrets = true;
    } else if (arg === '--json') {
      opts.jsonOutput = true;
    } else if ((arg === '--port' || arg === '-p') && i + 1 < args.length) {
      opts.port = parseInt(args[++i], 10) || 5151;
    } else if ((arg === '--schema' || arg === '-s') && i + 1 < args.length) {
      opts.schemaPath = args[++i];
    } else if ((arg === '--out' || arg === '-o') && i + 1 < args.length) {
      opts.outPath = args[++i];
    } else if ((arg === '--export' || arg === '-e') && i + 1 < args.length) {
      opts.exportHtml = args[++i];
    } else if (!arg.startsWith('-')) {
      if (opts.files.length === 0 && ['check', 'drift', 'scan', 'generate', 'studio', 'init', 'help'].includes(arg.toLowerCase())) {
        opts.command = arg.toLowerCase();
      } else {
        opts.files.push(arg);
      }
    }
  }

  return opts;
}

function printBanner(): void {
  console.log(`
${colors.cyan}  ▲ EnvShield v1.0.0${colors.reset}
  ${colors.dim}Environment Variable Linter, Secret Leak Detector & Visual Drift Studio${colors.reset}
  ${colors.dim}Built by Jatin Sharma (${colors.underline}https://jatinsh.netlify.app/${colors.reset}${colors.dim})${colors.reset}
`);
}

function printHelp(): void {
  printBanner();
  console.log(`
${colors.bold}USAGE:${colors.reset}
  $ envshield [command] [options]

${colors.bold}COMMANDS:${colors.reset}
  check [files...]         Validate .env files against schema and lint boolean traps
  drift <base> <target>    Detect missing & undocumented keys across environments
  scan [files...]          Scan environment files for committed plaintext secrets
  generate <file>          Auto-generate a sanitized .env.example template
  studio [dir]             Launch interactive dark-mode Web Studio (default port 5151)
  init                     Scaffold default .env.example and env.schema.json
  help                     Show this help guide

${colors.bold}OPTIONS:${colors.reset}
  -s, --schema <file>      Path to JSON schema file for strict validation
  -o, --out <file>         Destination path for template generation
  -e, --export <file.html> Export standalone HTML visual audit report
  -p, --port <number>      Port for Web Studio (default: 5151)
  --strict                 Exit with code 1 if any validation warning or issue occurs
  --fail-on-secrets        Exit with code 1 if any secret leak or high entropy token found
  --json                   Output machine-readable JSON result
  -h, --help               Show help menu
  -v, --version            Show version number

${colors.bold}EXAMPLES:${colors.reset}
  $ envshield check .env.local --schema examples/env.schema.json
  $ envshield drift examples/.env.example examples/.env.production
  $ envshield scan .env.production --fail-on-secrets
  $ envshield generate .env.production --out .env.example
  $ envshield studio examples/ --port 5151
`);
}

function loadParsedEnv(filePath: string): ParsedEnvFile {
  const fullPath = resolve(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Environment file not found at: ${filePath}`);
  }
  const content = readFileSync(fullPath, 'utf-8');
  return EnvParser.parse(content, filePath);
}

export async function runCli(rawArgs: string[]): Promise<void> {
  const opts = parseArgs(rawArgs.slice(2));

  if (opts.help || opts.command === 'help') {
    printHelp();
    return;
  }

  if (opts.version || opts.command === 'version') {
    console.log('envshield v1.0.0');
    return;
  }

  if (opts.command === 'init') {
    printBanner();
    const exampleDest = resolve(process.cwd(), '.env.example');
    const schemaDest = resolve(process.cwd(), 'env.schema.json');

    const defaultExample = 'PORT=3000\nNODE_ENV=development\nAPP_URL=http://localhost:3000\nDATABASE_URL=postgresql://localhost:5432/mydb\n';
    const defaultSchema = {
      variables: {
        PORT: { type: 'port', required: true },
        NODE_ENV: { type: 'enum', enum: ['development', 'production', 'test'], required: true },
        APP_URL: { type: 'url', required: true },
        DATABASE_URL: { type: 'url', required: true },
      },
    };

    writeFileSync(exampleDest, defaultExample, 'utf-8');
    writeFileSync(schemaDest, JSON.stringify(defaultSchema, null, 2), 'utf-8');
    log.success(`Scaffolded .env.example and env.schema.json in current directory.`);
    return;
  }

  if (opts.command === 'generate') {
    printBanner();
    const sourceFile = opts.files[0] || '.env';
    const parsed = loadParsedEnv(sourceFile);
    const generated = TemplateGenerator.generateExample(parsed);

    if (opts.outPath) {
      const dest = resolve(process.cwd(), opts.outPath);
      writeFileSync(dest, generated, 'utf-8');
      log.success(`Sanitized template written to: ${opts.outPath}`);
    } else {
      console.log(generated);
    }
    return;
  }

  if (opts.command === 'drift') {
    printBanner();
    if (opts.files.length < 2) {
      log.error('Usage: envshield drift <base_env> <target_env>');
      process.exit(1);
    }

    const baseEnv = loadParsedEnv(opts.files[0]);
    const targetEnv = loadParsedEnv(opts.files[1]);
    const drift = DriftDetector.compare(baseEnv, targetEnv);

    if (opts.jsonOutput) {
      console.log(JSON.stringify(drift, null, 2));
      return;
    }

    log.info(`Comparing Baseline: ${colors.bold}${drift.baseFile}${colors.reset} ➜ Target: ${colors.bold}${drift.targetFile}${colors.reset}`);
    console.log(`\n• Parity Score:   ${drift.parityScore >= 80 ? colors.green : colors.red}${drift.parityScore}%${colors.reset}`);
    console.log(`• Matching Keys:  ${colors.green}${drift.matchingKeys.length}${colors.reset}`);
    console.log(`• Missing in Target: ${drift.missingKeys.length > 0 ? colors.red : colors.green}${drift.missingKeys.length}${colors.reset}`);
    console.log(`• Undocumented Extra: ${drift.extraKeys.length > 0 ? colors.yellow : colors.dim}${drift.extraKeys.length}${colors.reset}\n`);

    if (drift.missingKeys.length > 0) {
      console.log(`${colors.red}${colors.bold}✖ Missing Variables in ${drift.targetFile}:${colors.reset}`);
      for (const k of drift.missingKeys) {
        console.log(`  - ${k}`);
      }
      console.log('');
    }

    if (drift.extraKeys.length > 0) {
      console.log(`${colors.yellow}${colors.bold}⚠ Undocumented Extra Variables in ${drift.targetFile}:${colors.reset}`);
      for (const k of drift.extraKeys) {
        console.log(`  + ${k}`);
      }
      console.log('');
    }

    if (drift.missingKeys.length > 0 && opts.strict) {
      process.exit(1);
    }
    return;
  }

  if (opts.command === 'scan') {
    printBanner();
    const targets = opts.files.length > 0 ? opts.files : ['.env'];
    let totalFindings = 0;

    for (const file of targets) {
      const parsed = loadParsedEnv(file);
      const findings = SecretScanner.scan(parsed);
      totalFindings += findings.length;

      log.info(`Scanning ${colors.bold}${file}${colors.reset}...`);
      if (findings.length === 0) {
        log.success(`Zero secrets or high-entropy tokens detected in ${file}.`);
      } else {
        for (const f of findings) {
          console.log(`  ${colors.red}✖ [${f.severity}] ${f.key} (${f.provider}):${colors.reset} ${f.description} [${f.preview}]`);
        }
      }
      console.log('');
    }

    if (totalFindings > 0 && opts.failOnSecrets) {
      log.error(`Secret scanner failed: ${totalFindings} secret findings detected.`);
      process.exit(1);
    }
    return;
  }

  if (opts.command === 'check') {
    printBanner();
    const targets = opts.files.length > 0 ? opts.files : ['.env'];
    const schemaFile = opts.schemaPath ? resolve(process.cwd(), opts.schemaPath) : resolve(process.cwd(), 'examples/env.schema.json');
    let schema: EnvSchema = { variables: {} };

    if (existsSync(schemaFile)) {
      schema = JSON.parse(readFileSync(schemaFile, 'utf-8'));
    }

    let criticalCount = 0;
    for (const file of targets) {
      const parsed = loadParsedEnv(file);
      const issues = SchemaValidator.validate(parsed, schema);
      const secrets = SecretScanner.scan(parsed);

      log.info(`Auditing ${colors.bold}${file}${colors.reset} (${Object.keys(parsed.entries).length} variables)`);

      for (const issue of issues) {
        const mark = issue.severity === 'CRITICAL' ? `${colors.red}[CRITICAL]${colors.reset}` : `${colors.yellow}[${issue.severity}]${colors.reset}`;
        console.log(`  ${mark} ${issue.key}: ${issue.message}`);
        if (issue.remediation) {
          console.log(`    ${colors.dim}↳ Fix: ${issue.remediation}${colors.reset}`);
        }
        if (issue.severity === 'CRITICAL') criticalCount++;
      }

      for (const s of secrets) {
        console.log(`  ${colors.red}[SECRET LEAK]${colors.reset} ${s.key} (${s.provider}): ${s.description} [${s.preview}]`);
        criticalCount++;
      }
      console.log('');
    }

    if (criticalCount > 0 && opts.strict) {
      log.error(`Check failed with ${criticalCount} critical issues.`);
      process.exit(1);
    } else {
      log.success('Check completed successfully.');
    }
    return;
  }

  // Default: Studio
  printBanner();
  const defaultTargets = ['examples/.env.example', 'examples/.env.local', 'examples/.env.production'];
  const envMap: Record<string, ParsedEnvFile> = {};
  const schemaFile = resolve(process.cwd(), 'examples/env.schema.json');
  let schema: EnvSchema = { variables: {} };

  if (existsSync(schemaFile)) {
    schema = JSON.parse(readFileSync(schemaFile, 'utf-8'));
  }

  for (const f of defaultTargets) {
    const full = resolve(process.cwd(), f);
    if (existsSync(full)) {
      envMap[f] = EnvParser.parse(readFileSync(full, 'utf-8'), f);
    }
  }

  const allIssues = Object.values(envMap).flatMap(p => SchemaValidator.validate(p, schema));
  const allSecrets = Object.values(envMap).flatMap(p => SecretScanner.scan(p));
  const driftList = [];
  if (envMap['examples/.env.example'] && envMap['examples/.env.production']) {
    driftList.push(DriftDetector.compare(envMap['examples/.env.example'], envMap['examples/.env.production']));
  }

  const totalVars = Object.values(envMap).reduce((acc, curr) => acc + Object.keys(curr.entries).length, 0);
  const healthScore = Math.max(0, 100 - allIssues.filter(i => i.severity === 'CRITICAL').length * 15 - allSecrets.length * 20);

  const report: EnvAuditReport = {
    timestamp: new Date().toISOString(),
    filesAnalyzed: Object.keys(envMap),
    totalVariables: totalVars,
    validationIssues: allIssues,
    secretFindings: allSecrets,
    driftReports: driftList,
    healthScore,
  };

  StudioServer.serve(report, envMap, opts.port);
}

