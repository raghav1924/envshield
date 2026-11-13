import http from 'node:http';
import { URL } from 'node:url';
import { EnvAuditReport, ParsedEnvFile } from '../core/types.js';
import { log, colors } from '../utils/logger.js';

export class StudioServer {
  public static serve(
    report: EnvAuditReport,
    envFiles: Record<string, ParsedEnvFile>,
    port: number = 5151
  ): void {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const method = (req.method || 'GET').toUpperCase();

      // CORS Headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // REST API: Get audit report data
      if (pathname === '/api/studio/data' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ report, envFiles }));
        return;
      }

      // Serve HTML Dashboard
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderHtml(report, envFiles));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, () => {
      log.success(`EnvShield Visual Studio running at ${colors.cyan}http://localhost:${port}${colors.reset}`);
    });
  }

  public static renderHtml(report: EnvAuditReport, envFiles: Record<string, ParsedEnvFile>): string {
    const serialized = JSON.stringify({ report, envFiles }).replace(/</g, '\\u003c');
    const fileNames = Object.keys(envFiles);

    // Collect all distinct keys across all loaded files
    const allKeys = new Set<string>();
    for (const file of Object.values(envFiles)) {
      for (const k of Object.keys(file.entries)) {
        allKeys.add(k);
      }
    }
    const sortedKeys = Array.from(allKeys).sort();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnvShield 🛡️ Environment Variable Linter & Drift Studio</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --accent: #38bdf8;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.5;
    }
    header {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand h1 {
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-weight: 600;
    }
    .badge-author {
      background: #0f2744;
      color: #7dd3fc;
      border: 1px solid #0284c7;
      text-decoration: none;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      padding: 1.5rem 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
    }
    .main-container {
      padding: 0 2rem 2rem 2rem;
    }
    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .nav-tab {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }
    .nav-tab:hover { color: var(--text); }
    .nav-tab.active {
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    th {
      background: #162032;
      padding: 0.85rem 1rem;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .pill {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: monospace;
    }
    .pill-present { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .pill-missing { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .pill-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; }
    .pill-warning { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid #f59e0b; }
    .code-mask {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #93c5fd;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>🛡️ EnvShield</h1>
      <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc;">v1.0.0</span>
      <a href="https://jatinsh.netlify.app/" target="_blank" class="badge badge-author">Built by Jatin Sharma</a>
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <a href="https://github.com/raghav1924/envshield" target="_blank" class="badge" style="background: #1f2937; color: white; text-decoration: none; padding: 0.5rem 0.8rem;">GitHub Repository</a>
    </div>
  </header>

  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-label">Configuration Health Score</span>
      <span class="stat-value" style="color: ${report.healthScore >= 80 ? 'var(--success)' : 'var(--danger)'};">${report.healthScore}%</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Total Variables Analyzed</span>
      <span class="stat-value">${report.totalVariables}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Committed Secret Leaks</span>
      <span class="stat-value" style="color: ${report.secretFindings.length > 0 ? 'var(--danger)' : 'var(--success)'};">${report.secretFindings.length}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Type & Schema Violations</span>
      <span class="stat-value" style="color: ${report.validationIssues.length > 0 ? 'var(--warning)' : 'var(--success)'};">${report.validationIssues.length}</span>
    </div>
  </div>

  <div class="main-container">
    <div class="nav-tabs">
      <button class="nav-tab active" onclick="switchTab('drift')">Cross-Environment Drift Matrix</button>
      <button class="nav-tab" onclick="switchTab('secrets')">Secret Leak Audit (${report.secretFindings.length})</button>
      <button class="nav-tab" onclick="switchTab('schema')">Type & Coercion Linter (${report.validationIssues.length})</button>
    </div>

    <!-- Tab 1: Drift Matrix -->
    <div id="tab-drift" class="tab-content active">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Variable Key</th>
              ${fileNames.map(f => `<th>${escapeHtml(f)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sortedKeys.map(key => `
              <tr>
                <td style="font-weight: 600; font-family: monospace;">${escapeHtml(key)}</td>
                ${fileNames.map(f => {
                  const entry = envFiles[f]?.entries[key];
                  if (!entry) {
                    return `<td><span class="pill pill-missing">MISSING</span></td>`;
                  }
                  const masked = entry.value.length > 20 ? entry.value.slice(0, 4) + '...' + entry.value.slice(-4) : entry.value;
                  return `<td><span class="pill pill-present">PRESENT</span> <span class="code-mask" style="font-size:0.78rem; margin-left:0.4rem;">${escapeHtml(masked)}</span></td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Secret Leaks -->
    <div id="tab-secrets" class="tab-content">
      ${report.secretFindings.length === 0 ? `
        <div class="stat-card" style="border: 1px solid var(--success);">
          <h3 style="color: #34d399;">✔ Zero Committed Secrets Detected</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">No AWS, Stripe, GitHub, or high-entropy tokens found in analyzed files.</p>
        </div>
      ` : `
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Variable Key</th>
                <th>Provider / Rule</th>
                <th>Redacted Preview</th>
                <th>Entropy</th>
                <th>Diagnostic</th>
              </tr>
            </thead>
            <tbody>
              ${report.secretFindings.map(s => `
                <tr>
                  <td><span class="pill pill-${s.severity.toLowerCase()}">${s.severity}</span></td>
                  <td style="font-weight: 600; font-family: monospace;">${escapeHtml(s.key)}</td>
                  <td><strong>${escapeHtml(s.provider)}</strong> (${s.ruleId})</td>
                  <td class="code-mask">${escapeHtml(s.preview)}</td>
                  <td>${s.entropy} bits</td>
                  <td style="color: #fca5a5;">${escapeHtml(s.description)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Tab 3: Schema Violations -->
    <div id="tab-schema" class="tab-content">
      ${report.validationIssues.length === 0 ? `
        <div class="stat-card" style="border: 1px solid var(--success);">
          <h3 style="color: #34d399;">✔ All Variables Satisfy Schema Specifications</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">Port ranges, URLs, booleans, and required keys conform perfectly.</p>
        </div>
      ` : `
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Variable</th>
                <th>Rule</th>
                <th>Message</th>
                <th>Remediation Snippet</th>
              </tr>
            </thead>
            <tbody>
              ${report.validationIssues.map(i => `
                <tr>
                  <td><span class="pill pill-${i.severity.toLowerCase()}">${i.severity}</span></td>
                  <td style="font-weight: 600; font-family: monospace;">${escapeHtml(i.key)}</td>
                  <td>${escapeHtml(i.rule)}</td>
                  <td>${escapeHtml(i.message)}</td>
                  <td style="color: #93c5fd; font-family: monospace; font-size: 0.8rem;">${escapeHtml(i.remediation || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }
  </script>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
