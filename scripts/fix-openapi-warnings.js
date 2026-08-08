/**
 * scripts/fix-openapi-warnings.js
 * Fix OpenAPI warnings:
 * 1. Add missing operationId to every operation
 * 2. Add missing 4xx response to every operation
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');

// HTTP methods that OpenAPI supports
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

/**
 * Convert path + method to a camelCase operationId
 * e.g. POST /api/v1/auth/login -> postAuthLogin
 *      GET /api/v1/outlets/{id} -> getOutletsById
 */
function toOperationId(method, apiPath) {
  const segments = apiPath
    .replace(/^\/api\/v\d+\//, '') // strip /api/v1/
    .split('/')
    .map(seg => {
      if (seg.startsWith('{') && seg.endsWith('}')) {
        return 'By' + seg.slice(1, -1).charAt(0).toUpperCase() + seg.slice(2, -1);
      }
      return seg
        .split('-')
        .map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
    });

  const joined = segments
    .filter(Boolean)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  return method.toLowerCase() + joined.charAt(0).toUpperCase() + joined.slice(1);
}

function has4xxResponse(responses) {
  if (!responses) return false;
  return Object.keys(responses).some(code => {
    const num = parseInt(code, 10);
    return num >= 400 && num < 500;
  });
}

// Load YAML
const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);

let operationIdCount = 0;
let responseCount = 0;

const paths = doc.paths || {};

for (const [apiPath, pathItem] of Object.entries(paths)) {
  for (const method of HTTP_METHODS) {
    const operation = pathItem[method];
    if (!operation) continue;

    // Fix 1: Add operationId if missing
    if (!operation.operationId) {
      operation.operationId = toOperationId(method, apiPath);
      operationIdCount++;
    }

    // Fix 2: Add 4xx response if missing
    if (!has4xxResponse(operation.responses)) {
      if (!operation.responses) operation.responses = {};
      operation.responses['401'] = { description: 'Unauthorized - Token tidak valid atau tidak ditemukan' };
      responseCount++;
    }
  }
}

// Save back to YAML (no BOM, UTF-8)
const output = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: '"',
  forceQuotes: false,
});

fs.writeFileSync(FILE_PATH, output, { encoding: 'utf8' });

console.log(`✅ Done!`);
console.log(`   operationId added: ${operationIdCount}`);
console.log(`   4xx response added: ${responseCount}`);
