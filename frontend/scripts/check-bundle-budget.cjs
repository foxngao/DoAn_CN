const fs = require('fs');
const path = require('path');

const DIST_ASSETS_DIR = path.resolve(__dirname, '..', 'dist', 'assets');

const KB = 1024;
const BUDGETS = {
  maxEntryIndexBytes: 260 * KB,
  maxLargestChunkBytes: 450 * KB,
};

function formatKB(bytes) {
  return `${(bytes / KB).toFixed(2)} kB`;
}

function fail(message) {
  console.error(`❌ Bundle budget failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  fail(`Missing dist assets directory at ${DIST_ASSETS_DIR}. Run build first.`);
}

const jsFiles = fs
  .readdirSync(DIST_ASSETS_DIR)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const fullPath = path.join(DIST_ASSETS_DIR, file);
    return {
      file,
      size: fs.statSync(fullPath).size,
    };
  });

if (jsFiles.length === 0) {
  fail('No JS chunks found in dist/assets.');
}

const sorted = [...jsFiles].sort((a, b) => b.size - a.size);
const largestChunk = sorted[0];
const indexChunk = jsFiles.find((chunk) => /^index-.*\.js$/.test(chunk.file));

if (!indexChunk) {
  fail('Cannot find index-*.js chunk.');
}

console.log('📦 Bundle budget report');
console.log(`- index chunk: ${indexChunk.file} (${formatKB(indexChunk.size)})`);
console.log(`- largest chunk: ${largestChunk.file} (${formatKB(largestChunk.size)})`);

if (indexChunk.size > BUDGETS.maxEntryIndexBytes) {
  fail(
    `index chunk ${formatKB(indexChunk.size)} exceeds budget ${formatKB(BUDGETS.maxEntryIndexBytes)}`
  );
}

if (largestChunk.size > BUDGETS.maxLargestChunkBytes) {
  fail(
    `largest chunk ${formatKB(largestChunk.size)} exceeds budget ${formatKB(BUDGETS.maxLargestChunkBytes)}`
  );
}

console.log('✅ Bundle budget check passed.');
