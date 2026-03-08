#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function loadEnvIfAvailable() {
  let dotenv;
  try {
    dotenv = require('dotenv');
  } catch {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
  ];

  candidates.forEach((envPath) => {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  });
}

function parseArgs(argv) {
  const args = { dryRun: false, output: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--output') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Thiếu giá trị cho --output');
      }
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Tham số không hợp lệ: ${token}`);
  }
  return args;
}

function envValue(primary, fallback) {
  return process.env[primary] || process.env[fallback] || '';
}

function resolveDbConfig() {
  const config = {
    host: envValue('DB_HOST', 'MYSQL_HOST'),
    port: envValue('DB_PORT', 'MYSQL_PORT') || '3306',
    user: envValue('DB_USER', 'MYSQL_USER'),
    password: envValue('DB_PASSWORD', 'MYSQL_PASSWORD'),
    database: envValue('DB_NAME', 'MYSQL_DATABASE'),
  };

  const missing = [];
  if (!config.host) missing.push('DB_HOST/MYSQL_HOST');
  if (!config.port) missing.push('DB_PORT/MYSQL_PORT');
  if (!config.user) missing.push('DB_USER/MYSQL_USER');
  if (!config.password) missing.push('DB_PASSWORD/MYSQL_PASSWORD');
  if (!config.database) missing.push('DB_NAME/MYSQL_DATABASE');

  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  }

  return config;
}

function defaultOutputFile() {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return path.resolve(process.cwd(), 'backups', `db-${timestamp}.sql`);
}

function printPlan(config, outputFile, dryRun) {
  console.log('Backup plan:');
  console.log(`- host: ${config.host}`);
  console.log(`- port: ${config.port}`);
  console.log(`- user: ${config.user}`);
  console.log(`- database: ${config.database}`);
  console.log(`- output: ${outputFile}`);
  console.log(`- mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
}

function run() {
  loadEnvIfAvailable();
  const args = parseArgs(process.argv.slice(2));
  const config = resolveDbConfig();
  const outputFile = path.resolve(process.cwd(), args.output || defaultOutputFile());

  printPlan(config, outputFile, args.dryRun);

  if (args.dryRun) {
    console.log('Lệnh sẽ chạy: mysqldump -h <host> -P <port> -u <user> <database> > <output>');
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const fd = fs.openSync(outputFile, 'w');
  const result = spawnSync(
    'mysqldump',
    ['-h', config.host, '-P', config.port, '-u', config.user, config.database],
    {
      env: {
        ...process.env,
        MYSQL_PWD: config.password,
      },
      stdio: ['ignore', fd, 'pipe'],
      encoding: 'utf8',
    },
  );
  fs.closeSync(fd);

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `Backup thất bại với mã ${result.status}`);
  }

  console.log(`Backup hoàn tất: ${outputFile}`);
}

try {
  run();
} catch (error) {
  console.error(`Lỗi backup: ${error.message}`);
  process.exit(1);
}
