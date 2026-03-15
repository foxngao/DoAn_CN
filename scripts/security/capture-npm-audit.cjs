#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1];
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

function runNpmAuditJson(cwd) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm audit --json'], {
      encoding: 'utf8',
      windowsHide: true,
      cwd,
    });
  }

  return spawnSync('sh', ['-lc', 'npm audit --json'], {
    encoding: 'utf8',
    windowsHide: true,
    cwd,
  });
}

function extractJsonText(raw) {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  const firstCurly = trimmed.indexOf('{');
  const lastCurly = trimmed.lastIndexOf('}');
  if (firstCurly === -1 || lastCurly === -1 || lastCurly <= firstCurly) return null;
  return trimmed.slice(firstCurly, lastCurly + 1);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv);
const prefix = args.prefix;
const outFile = args.out;

if (!prefix || !outFile) {
  fail('Usage: node scripts/security/capture-npm-audit.cjs --prefix <backend|frontend> --out <output-file.json>');
}

const result = runNpmAuditJson(path.resolve(process.cwd(), prefix));

if (result.error) {
  fail(`Failed to execute npm audit: ${result.error.message}`);
}

const jsonText = extractJsonText(result.stdout || '') || extractJsonText(`${result.stdout || ''}\n${result.stderr || ''}`);
if (!jsonText) {
  fail('Failed to capture valid npm audit JSON output.');
}

let parsed;
try {
  parsed = JSON.parse(jsonText);
} catch (error) {
  fail(`Failed to parse npm audit JSON: ${error.message}`);
}

try {
  const outPath = path.resolve(process.cwd(), outFile);
  const outDir = path.dirname(outPath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
} catch (error) {
  fail(`Failed to write audit file: ${error.message}`);
}

process.stdout.write(`Captured npm audit JSON to ${outFile}\n`);
process.exit(0);
