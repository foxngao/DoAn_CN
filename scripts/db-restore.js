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
  const args = {
    dryRun: false,
    file: '',
    yes: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token === '--yes') {
      args.yes = true;
      continue;
    }

    if (token === '--file') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Thiếu giá trị cho --file');
      }
      args.file = value;
      index += 1;
      continue;
    }

    throw new Error(`Tham số không hợp lệ: ${token}`);
  }

  if (!args.file) {
    throw new Error('Bắt buộc truyền --file <path>');
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

function printPlan(config, inputFile, dryRun) {
  console.log('Restore plan:');
  console.log(`- host: ${config.host}`);
  console.log(`- port: ${config.port}`);
  console.log(`- user: ${config.user}`);
  console.log(`- database(target): ${config.database}`);
  console.log(`- source file: ${inputFile}`);
  console.log(`- mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
}

function run() {
  loadEnvIfAvailable();
  const args = parseArgs(process.argv.slice(2));
  const config = resolveDbConfig();
  const inputFile = path.resolve(process.cwd(), args.file);

  printPlan(config, inputFile, args.dryRun);

  if (!fs.existsSync(inputFile)) {
    throw new Error(`Không tìm thấy file backup: ${inputFile}`);
  }

  if (args.dryRun) {
    console.log('Lệnh sẽ chạy: mysql -h <host> -P <port> -u <user> <database> < <file>');
    process.exit(0);
  }

  if (!args.yes) {
    throw new Error('Restore bị chặn. Thêm cờ --yes để xác nhận restore vào DB đích.');
  }

  const input = fs.readFileSync(inputFile);
  const result = spawnSync(
    'mysql',
    ['-h', config.host, '-P', config.port, '-u', config.user, config.database],
    {
      env: {
        ...process.env,
        MYSQL_PWD: config.password,
      },
      input,
      stdio: ['pipe', 'inherit', 'pipe'],
      encoding: 'utf8',
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `Restore thất bại với mã ${result.status}`);
  }

  console.log(`Restore hoàn tất từ file: ${inputFile}`);
}

try {
  run();
} catch (error) {
  console.error(`Lỗi restore: ${error.message}`);
  process.exit(1);
}
