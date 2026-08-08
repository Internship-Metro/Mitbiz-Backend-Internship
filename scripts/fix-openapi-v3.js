/**
 * scripts/fix-openapi-v3.js
 * Deep fix untuk semua sisa warnings:
 * 1. Fix semua inline schema examples yang string tapi harusnya number/integer
 * 2. Fix SuperAdminCreateUserInput: fullName → name, tambah phone & businessId
 * 3. Fix SuperAdminUpdateUserInput: tambah name & phone
 * 4. Remove SuperAdminOutletStats (unused)
 * 5. Fix phone examples in ALL media type examples
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');
const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);
const schemas = doc.components.schemas;

// ─── 1. Fix SuperAdminCreateUserInput schema ──────────────────────────────────
// Problem: schema uses 'fullName' but example & actual API uses 'name'
// Also example sends 'phone' and 'businessId' which are not in schema
if (schemas.SuperAdminCreateUserInput) {
  schemas.SuperAdminCreateUserInput = {
    type: 'object',
    required: ['name', 'email', 'password', 'role', 'businessId'],
    properties: {
      name: { type: 'string', example: 'Siti Rahayu' },
      email: { type: 'string', format: 'email', example: 'siti@tokobudi.com' },
      phone: { type: 'string', nullable: true, example: '082234567890' },
      password: { type: 'string', minLength: 8, example: 'Password123!' },
      businessId: { type: 'string', example: 'cm1bisnis123' },
      role: {
        type: 'string',
        enum: ['ADMIN', 'KASIR'],
        example: 'ADMIN',
      },
      outletId: { type: 'string', nullable: true, example: 'cm1outlet456' },
    },
  };
  console.log('✅ Fixed SuperAdminCreateUserInput schema');
}

// ─── 2. Fix SuperAdminUpdateUserInput schema ──────────────────────────────────
if (schemas.SuperAdminUpdateUserInput) {
  schemas.SuperAdminUpdateUserInput = {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Siti Rahayu, S.E.' },
      phone: { type: 'string', nullable: true, example: '082234567891' },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
        example: 'ACTIVE',
      },
      outletId: { type: 'string', nullable: true, example: 'cm1outlet789' },
    },
  };
  console.log('✅ Fixed SuperAdminUpdateUserInput schema');
}

// ─── 3. Remove SuperAdminOutletStats (unused) ─────────────────────────────────
if (schemas.SuperAdminOutletStats) {
  delete schemas.SuperAdminOutletStats;
  console.log('✅ Removed SuperAdminOutletStats (unused)');
}

// ─── 4. Deep fix: recursively walk entire doc and fix type mismatches ─────────
let fixedCount = 0;

/**
 * Fix example values to match their declared type.
 * Also fix phone/outletPhone/contactPhone in any value object.
 */
function deepFix(node, parentKey) {
  if (!node || typeof node !== 'object') return;

  // If this is a schema property with both 'type' and 'example'
  if ('type' in node && 'example' in node) {
    const t = node.type;
    const ex = node.example;

    if ((t === 'integer' || t === 'number') && typeof ex === 'string') {
      const parsed = parseFloat(ex);
      if (!isNaN(parsed)) {
        node.example = t === 'integer' ? Math.trunc(parsed) : parsed;
        fixedCount++;
      }
    }
    if (t === 'string' && typeof ex === 'number') {
      node.example = String(ex);
      fixedCount++;
    }
  }

  // Fix phone-like fields inside value objects (media type examples)
  const phoneFields = ['phone', 'outletPhone', 'contactPhone'];
  for (const f of phoneFields) {
    if (f in node && typeof node[f] === 'number') {
      node[f] = String(node[f]);
      fixedCount++;
    }
  }

  // Recurse into all children
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object') deepFix(v, k);
  }
}

deepFix(doc, 'root');
console.log(`✅ Fixed ${fixedCount} example type mismatches`);

// ─── 5. Save ──────────────────────────────────────────────────────────────────
const output = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: "'",
  forceQuotes: false,
  indent: 2,
});

fs.writeFileSync(FILE_PATH, output, { encoding: 'utf8' });
console.log('✅ File saved');
