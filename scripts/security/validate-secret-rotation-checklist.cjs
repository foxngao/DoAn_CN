#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    args[token.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv);
const checklistPath = args.checklist;
const finding = args.finding;

if (!checklistPath || !finding) {
  fail('Usage: node scripts/security/validate-secret-rotation-checklist.cjs --checklist <docs/security/secret-rotation-checklist.md> --finding <backend/.env>');
}

let content;
try {
  content = fs.readFileSync(path.resolve(process.cwd(), checklistPath), 'utf8');
} catch (error) {
  fail(`Unable to read checklist: ${error.message}`);
}

const escapedFinding = finding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findingLineRegex = new RegExp(`^\\s*-\\s*finding:\\s*${escapedFinding}\\s*$`, 'im');
const findingLineMatch = content.match(findingLineRegex);
if (!findingLineMatch || typeof findingLineMatch.index !== 'number') {
  fail(`Checklist missing record for finding: ${finding}`);
}

const start = findingLineMatch.index;
const tail = content.slice(start + findingLineMatch[0].length);
const nextMatch = tail.match(/\n\s*-\s*finding:\s*/i);
const end = nextMatch && typeof nextMatch.index === 'number'
  ? start + findingLineMatch[0].length + nextMatch.index
  : content.length;
const block = content.slice(start, end);
const requiredFields = ['finding', 'status', 'owner', 'environment', 'due-date', 'rotation-trigger'];

for (const field of requiredFields) {
  const fieldRegex = new RegExp(`-\\s*${field}:\\s*(.+)`, 'i');
  const match = block.match(fieldRegex);
  if (!match || !String(match[1] || '').trim()) {
    fail(`Checklist record for ${finding} missing non-empty field: ${field}`);
  }
}

process.stdout.write(`PASS: checklist record is valid for ${finding}\n`);
process.exit(0);
