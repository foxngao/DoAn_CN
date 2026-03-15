#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXIT = {
  PASS: 0,
  INVALID_POLICY_SCHEMA: 2,
  INVALID_AUDIT_JSON: 3,
  UNEXCEPTED_HIGH_CRITICAL: 4,
  EXPIRED_EXCEPTION: 5,
  SCOPE_MISMATCH_EXCEPTION: 6,
  UNMATCHED_STALE_EXCEPTION: 7,
};

const ALLOWED_SCOPES = new Set(['backend', 'frontend']);
const ALLOWED_SEVERITIES = new Set(['info', 'low', 'moderate', 'medium', 'high', 'critical']);
const POLICY_IDENTITY_KEYS = new Set(['advisory', 'url', 'package_range']);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    args[key] = value;
    i += 1;
  }
  return args;
}

function readFileSafe(filePath, exitCode, label) {
  try {
    return fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  } catch (error) {
    process.stderr.write(`Unable to read ${label}: ${error.message}\n`);
    process.exit(exitCode);
  }
}

function normalizeSeverity(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'moderate') return 'medium';
  return s;
}

function extractPolicyJsonFromMarkdown(markdown) {
  const fenced = markdown.match(/```json\s*([\s\S]*?)```/i);
  if (!fenced) return null;
  return fenced[1];
}

function parsePolicy(markdown) {
  const jsonText = extractPolicyJsonFromMarkdown(markdown);
  if (!jsonText) {
    throw new Error('Policy markdown must include a JSON fenced block.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Policy JSON parse error: ${error.message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Policy JSON must be an object.');
  }

  if (typeof parsed.version !== 'number') {
    throw new Error('Policy must define numeric version.');
  }

  if (!Array.isArray(parsed.scopes) || parsed.scopes.length === 0) {
    throw new Error('Policy must define non-empty scopes array.');
  }
  for (const s of parsed.scopes) {
    if (!ALLOWED_SCOPES.has(s)) {
      throw new Error(`Invalid scope in policy.scopes: ${s}`);
    }
  }

  if (!Array.isArray(parsed.severityThreshold) || parsed.severityThreshold.length === 0) {
    throw new Error('Policy must define non-empty severityThreshold array.');
  }
  for (const sev of parsed.severityThreshold.map(normalizeSeverity)) {
    if (!ALLOWED_SEVERITIES.has(sev)) {
      throw new Error(`Invalid severityThreshold value: ${sev}`);
    }
  }

  if (!Array.isArray(parsed.identityPrecedence) || parsed.identityPrecedence.length === 0) {
    throw new Error('Policy must define non-empty identityPrecedence array.');
  }
  for (const k of parsed.identityPrecedence) {
    if (!POLICY_IDENTITY_KEYS.has(k)) {
      throw new Error(`Invalid identityPrecedence key: ${k}`);
    }
  }

  const exceptions = Array.isArray(parsed.exceptions) ? parsed.exceptions : [];
  for (const [idx, ex] of exceptions.entries()) {
    if (typeof ex !== 'object' || ex === null || Array.isArray(ex)) {
      throw new Error(`Exception at index ${idx} must be an object.`);
    }
    const required = ['advisory', 'reason', 'owner', 'expiry', 'scope'];
    for (const field of required) {
      if (!String(ex[field] || '').trim()) {
        throw new Error(`Exception at index ${idx} missing field: ${field}`);
      }
    }
    if (!ALLOWED_SCOPES.has(ex.scope)) {
      throw new Error(`Exception at index ${idx} has invalid scope: ${ex.scope}`);
    }
    if (Number.isNaN(Date.parse(ex.expiry))) {
      throw new Error(`Exception at index ${idx} has invalid expiry date: ${ex.expiry}`);
    }
  }

  return {
    version: parsed.version,
    scopes: parsed.scopes,
    severityThreshold: parsed.severityThreshold.map(normalizeSeverity),
    identityPrecedence: parsed.identityPrecedence,
    exceptions,
  };
}

function parseAuditJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Audit JSON parse error: ${error.message}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Audit JSON must be an object.');
  }
  return parsed;
}

function advisoryFromUrl(url) {
  if (!url) return '';
  const match = String(url).match(/(GHSA-[a-z0-9-]+|CVE-\d{4}-\d+)/i);
  return match ? match[1].toUpperCase() : '';
}

function normalizeFinding(raw, defaultScope) {
  const scope = String(raw.scope || defaultScope || '').trim().toLowerCase();
  const severity = normalizeSeverity(raw.severity);
  const advisory = String(raw.advisory || '').trim().toUpperCase();
  const url = String(raw.url || '').trim();
  const pkg = String(raw.package || '').trim();
  const range = String(raw.range || '').trim();
  return {
    scope,
    severity,
    advisory: advisory || advisoryFromUrl(url),
    url,
    package: pkg,
    range,
  };
}

function extractFindingsFromNpmAudit(audit, defaultScope) {
  const findings = [];
  const vulnerabilities = audit.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object') return findings;

  for (const [pkgName, vuln] of Object.entries(vulnerabilities)) {
    if (!vuln || typeof vuln !== 'object') continue;
    const baseSeverity = normalizeSeverity(vuln.severity);
    const range = String(vuln.range || '').trim();
    const via = Array.isArray(vuln.via) ? vuln.via : [];

    const viaObjects = via.filter((item) => item && typeof item === 'object');
    if (viaObjects.length > 0) {
      for (const item of viaObjects) {
        findings.push(
          normalizeFinding(
            {
              scope: defaultScope,
              severity: item.severity || baseSeverity,
              advisory:
                item.id ||
                item.source ||
                advisoryFromUrl(item.url) ||
                (item.name && item.title ? `${item.name}:${item.title}` : item.name || ''),
              url: item.url || '',
              package: pkgName,
              range: item.range || range,
            },
            defaultScope,
          ),
        );
      }
      continue;
    }

    findings.push(
      normalizeFinding(
        {
          scope: defaultScope,
          severity: baseSeverity,
          advisory: advisoryFromUrl(vuln.url || ''),
          url: vuln.url || '',
          package: pkgName,
          range,
        },
        defaultScope,
      ),
    );
  }

  return findings;
}

function collectFindings(audit, defaultScope) {
  if (Array.isArray(audit.findings)) {
    return audit.findings.map((f) => normalizeFinding(f, defaultScope));
  }
  return extractFindingsFromNpmAudit(audit, defaultScope);
}

function identityKeys(finding, precedence) {
  const keys = [];
  for (const rule of precedence) {
    if (rule === 'advisory' && finding.advisory) keys.push(finding.advisory);
    if (rule === 'url' && finding.url) keys.push(finding.url);
    if (rule === 'package_range' && finding.package && finding.range) keys.push(`${finding.package}@${finding.range}`);
  }
  return keys;
}

function isExpired(isoDate) {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return true;
  return ts < Date.now();
}

function writeNormalizedOutputIfRequested(args, payload) {
  if (!args.normalizedOut) return;
  const outPath = path.resolve(process.cwd(), args.normalizedOut);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

const args = parseArgs(process.argv);
const scope = String(args.scope || '').trim().toLowerCase();
const mode = String(args.mode || '').trim().toLowerCase();

if (!args.audit || !args.policy || !scope || !mode) {
  process.stderr.write('Usage: node scripts/security/validate-audit-policy.cjs --audit <audit.json> --policy <policy.md> --scope <backend|frontend> --mode <baseline|enforce> [--normalizedOut <file>]\n');
  process.exit(EXIT.INVALID_POLICY_SCHEMA);
}

if (!ALLOWED_SCOPES.has(scope)) {
  process.stderr.write(`Invalid --scope: ${scope}\n`);
  process.exit(EXIT.INVALID_POLICY_SCHEMA);
}

if (!['baseline', 'enforce'].includes(mode)) {
  process.stderr.write(`Invalid --mode: ${mode}\n`);
  process.exit(EXIT.INVALID_POLICY_SCHEMA);
}

let policy;
try {
  policy = parsePolicy(readFileSafe(args.policy, EXIT.INVALID_POLICY_SCHEMA, 'policy file'));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(EXIT.INVALID_POLICY_SCHEMA);
}

if (!policy.scopes.includes(scope)) {
  process.stderr.write(`Scope ${scope} is not enabled in policy.scopes.\n`);
  process.exit(EXIT.INVALID_POLICY_SCHEMA);
}

let audit;
try {
  audit = parseAuditJson(readFileSafe(args.audit, EXIT.INVALID_AUDIT_JSON, 'audit file'));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(EXIT.INVALID_AUDIT_JSON);
}

const findings = collectFindings(audit, scope);
const normalized = {
  scope,
  mode,
  findings,
};

if (mode === 'baseline') {
  writeNormalizedOutputIfRequested(args, normalized);
  process.stdout.write(`PASS baseline (${findings.length} findings normalized)\n`);
  process.exit(EXIT.PASS);
}

const threshold = new Set(policy.severityThreshold.map(normalizeSeverity));
const enforceFindings = findings.filter((f) => f.scope === scope && threshold.has(f.severity));

const exceptions = policy.exceptions;
const matchedExceptionIndexes = new Set();

for (const finding of enforceFindings) {
  const keys = identityKeys(finding, policy.identityPrecedence);
  if (keys.length === 0) {
    process.stderr.write(`Unexcepted ${finding.severity} finding (no identity keys): ${JSON.stringify(finding)}\n`);
    process.exit(EXIT.UNEXCEPTED_HIGH_CRITICAL);
  }

  const matchingAnyScope = [];
  for (const [idx, ex] of exceptions.entries()) {
    if (keys.includes(String(ex.advisory))) {
      matchingAnyScope.push({ idx, ex });
    }
  }

  if (matchingAnyScope.length === 0) {
    process.stderr.write(`Unexcepted ${finding.severity} advisory: ${keys[0]}\n`);
    process.exit(EXIT.UNEXCEPTED_HIGH_CRITICAL);
  }

  const sameScope = matchingAnyScope.find(({ ex }) => ex.scope === scope);
  if (!sameScope) {
    process.stderr.write(`Scope mismatch exception for advisory: ${keys[0]}\n`);
    process.exit(EXIT.SCOPE_MISMATCH_EXCEPTION);
  }

  if (isExpired(sameScope.ex.expiry)) {
    process.stderr.write(`Expired exception for advisory: ${sameScope.ex.advisory}\n`);
    process.exit(EXIT.EXPIRED_EXCEPTION);
  }

  matchedExceptionIndexes.add(sameScope.idx);
}

for (const [idx, ex] of exceptions.entries()) {
  if (ex.scope !== scope) continue;
  if (!matchedExceptionIndexes.has(idx)) {
    process.stderr.write(`Unmatched/stale exception entry: ${ex.advisory}\n`);
    process.exit(EXIT.UNMATCHED_STALE_EXCEPTION);
  }
}

writeNormalizedOutputIfRequested(args, normalized);
process.stdout.write(`PASS enforce (${enforceFindings.length} threshold findings checked)\n`);
process.exit(EXIT.PASS);
