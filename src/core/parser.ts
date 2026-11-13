import { EnvEntry, ParsedEnvFile } from './types.js';

export class EnvParser {
  /**
   * Parse a raw .env string into structured key-value entries with metadata.
   */
  public static parse(content: string, filePath: string = '.env'): ParsedEnvFile {
    const entries: Record<string, EnvEntry> = {};
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Skip empty lines or pure comment lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Strip optional "export " prefix
      let lineToParse = trimmed;
      if (lineToParse.startsWith('export ')) {
        lineToParse = lineToParse.slice(7).trim();
      }

      const eqIdx = lineToParse.indexOf('=');
      if (eqIdx === -1) {
        // Variable without equals (e.g. KEY)
        const key = lineToParse.trim();
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          entries[key] = {
            key,
            value: '',
            line: i + 1,
            raw: rawLine,
          };
        }
        continue;
      }

      const key = lineToParse.slice(0, eqIdx).trim();
      let rawVal = lineToParse.slice(eqIdx + 1).trim();

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        continue;
      }

      let parsedVal = '';
      let comment: string | undefined;

      // Handle Quoted strings
      if (rawVal.startsWith('"')) {
        const endQuote = rawVal.indexOf('"', 1);
        if (endQuote !== -1) {
          parsedVal = rawVal.slice(1, endQuote).replace(/\\n/g, '\n').replace(/\\"/g, '"');
          const trailing = rawVal.slice(endQuote + 1).trim();
          if (trailing.startsWith('#')) {
            comment = trailing.slice(1).trim();
          }
        } else {
          // Unclosed quote - take rest of line
          parsedVal = rawVal.slice(1);
        }
      } else if (rawVal.startsWith("'")) {
        const endQuote = rawVal.indexOf("'", 1);
        if (endQuote !== -1) {
          parsedVal = rawVal.slice(1, endQuote);
          const trailing = rawVal.slice(endQuote + 1).trim();
          if (trailing.startsWith('#')) {
            comment = trailing.slice(1).trim();
          }
        } else {
          parsedVal = rawVal.slice(1);
        }
      } else {
        // Unquoted value: check for inline comments
        const commentIdx = rawVal.indexOf('#');
        if (commentIdx !== -1) {
          comment = rawVal.slice(commentIdx + 1).trim();
          parsedVal = rawVal.slice(0, commentIdx).trim();
        } else {
          parsedVal = rawVal.trim();
        }
      }

      entries[key] = {
        key,
        value: parsedVal,
        line: i + 1,
        comment,
        raw: rawLine,
      };
    }

    // Second pass: interpolate variables ${OTHER_VAR}
    for (const entry of Object.values(entries)) {
      if (entry.value.includes('${')) {
        entry.value = entry.value.replace(/\${([a-zA-Z_][a-zA-Z0-9_]*)}/g, (_, varName) => {
          return entries[varName]?.value || process.env[varName] || '';
        });
      }
    }

    return {
      filePath,
      entries,
      rawContent: content,
    };
  }
}
