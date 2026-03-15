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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractJobBlock(yamlText, jobName) {
  const pattern = new RegExp(`(^|\\n)  ${escapeRegExp(jobName)}:[\\s\\S]*?(?=\\n  [A-Za-z0-9_-]+:|$)`);
  const match = yamlText.match(pattern);
  return match ? match[0] : '';
}

const args = parseArgs(process.argv);
const workflow = args.workflow;
const job = args.job;
const eventName = args.event;
const branchesArg = args['target-branches'];
const requirePrBlockingArg = args['require-pr-blocking'];

if (!workflow || !job || !eventName || !branchesArg || typeof requirePrBlockingArg === 'undefined') {
  fail('Usage: node scripts/security/assert-ci-blocking-gate.cjs --workflow <ci.yml> --job <job-name> --event <pull_request> --target-branches <comma-separated> --require-pr-blocking <true|false>');
}

const requirePrBlocking = String(requirePrBlockingArg).toLowerCase() === 'true';
const targetBranches = branchesArg
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

if (eventName !== 'pull_request') {
  fail('This validator currently supports --event pull_request only.');
}

let yaml;
try {
  yaml = fs.readFileSync(path.resolve(process.cwd(), workflow), 'utf8');
} catch (error) {
  fail(`Unable to read workflow file: ${error.message}`);
}

if (!/\bpull_request\s*:/m.test(yaml)) {
  fail('Workflow does not define pull_request trigger.');
}

for (const branch of targetBranches) {
  const inInlineArray = new RegExp(`pull_request:\\s*[\\s\\S]*?branches:\\s*\\[[^\\]]*['\"]?${escapeRegExp(branch)}['\"]?[^\\]]*\\]`, 'm').test(yaml);
  const inDashList = new RegExp(`pull_request:\\s*[\\s\\S]*?branches:\\s*[\\r\\n]+(?:\\s*-\\s*[^\\r\\n]+[\\r\\n]+)*\\s*-\\s*${escapeRegExp(branch)}\\s*`, 'm').test(yaml);
  if (!inInlineArray && !inDashList) {
    fail(`pull_request trigger does not include target branch: ${branch}`);
  }
}

const jobBlock = extractJobBlock(yaml, job);
if (!jobBlock) {
  fail(`Job not found: ${job}`);
}

if (!/github\.event_name\s*==\s*['\"]pull_request['\"]/m.test(jobBlock)) {
  fail(`Job ${job} is missing pull_request event guard.`);
}

for (const branch of targetBranches) {
  const baseRefPattern = new RegExp(`github\\.base_ref\\s*==\\s*['\"]${escapeRegExp(branch)}['\"]`, 'm');
  if (!baseRefPattern.test(jobBlock)) {
    fail(`Job ${job} is missing base_ref guard for branch: ${branch}`);
  }
}

const continueOnErrorMatch = jobBlock.match(/continue-on-error\s*:\s*(true|false)/m);
const continueOnError = continueOnErrorMatch ? continueOnErrorMatch[1] === 'true' : false;

if (!requirePrBlocking) {
  if (!continueOnError) {
    fail(`Expected non-blocking PR gate for job ${job}, but continue-on-error is not true.`);
  }
} else if (continueOnError) {
  fail(`Expected blocking PR gate for job ${job}, but continue-on-error is true.`);
}

process.stdout.write(`PASS: ${job} PR blocking requirement = ${requirePrBlocking}\n`);
process.exit(0);
