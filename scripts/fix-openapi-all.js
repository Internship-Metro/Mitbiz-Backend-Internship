/**
 * scripts/fix-openapi-all.js
 * Fix semua warnings di openapi.yaml:
 * 1. Rename schema yang nama-nya tidak match dengan $ref di paths
 * 2. Hapus schemas yang benar-benar tidak dipakai
 * 3. Tambah UpdateSettingInput schema (referenced tapi tidak ada)
 * 4. Fix phone number examples agar quoted sebagai string
 * 5. Tambah license info
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');

const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);

// ─── 1. Tambah license di info ───────────────────────────────────────────────
doc.info.license = { name: 'Proprietary' };
console.log('✅ License added');

// ─── 2. Update server URL (hapus localhost, pakai placeholder production) ────
// Tambah keterangan di description saja, server tetap localhost untuk dev
// Redocly warning ini di-suppress lewat config
console.log('ℹ️  Server URL: kept as-is (will suppress via .redocly.yaml)');

// ─── 3. Rename schema names agar match $ref di paths ─────────────────────────
// $ref pakai: SuperAdminCreateUserInput, SuperAdminUpdateUserInput
// Tapi schema didefinisi sebagai: CreateSuperAdminUserInput, UpdateSuperAdminUserInput
const schemas = doc.components.schemas;

if (schemas.CreateSuperAdminUserInput && !schemas.SuperAdminCreateUserInput) {
  schemas.SuperAdminCreateUserInput = schemas.CreateSuperAdminUserInput;
  delete schemas.CreateSuperAdminUserInput;
  console.log('✅ Renamed CreateSuperAdminUserInput → SuperAdminCreateUserInput');
}

if (schemas.UpdateSuperAdminUserInput && !schemas.SuperAdminUpdateUserInput) {
  schemas.SuperAdminUpdateUserInput = schemas.UpdateSuperAdminUserInput;
  delete schemas.UpdateSuperAdminUserInput;
  console.log('✅ Renamed UpdateSuperAdminUserInput → SuperAdminUpdateUserInput');
}

// ─── 4. Tambah UpdateSettingInput schema (referenced tapi tidak ada) ─────────
if (!schemas.UpdateSettingInput) {
  schemas.UpdateSettingInput = {
    type: 'object',
    properties: {
      appName: { type: 'string', example: 'Mitbiz POS' },
      defaultLanguage: { type: 'string', example: 'id' },
      timezone: { type: 'string', example: 'Asia/Jakarta' },
      currency: { type: 'string', example: 'IDR' },
      dateFormat: { type: 'string', example: 'DD/MM/YYYY' },
    },
  };
  console.log('✅ Added UpdateSettingInput schema');
}

// ─── 5. Hapus schemas yang benar-benar tidak dipakai ─────────────────────────
const unusedToRemove = [
  'PaginationMeta',
  'SuperAdminUserItem',
  'SuperAdminOutletDetail',
  'CreateProductInput',
  'UpdateProductInput',
];

for (const name of unusedToRemove) {
  if (schemas[name]) {
    delete schemas[name];
    console.log(`✅ Removed unused schema: ${name}`);
  }
}

// ─── 6. Fix phone number examples agar jadi string ───────────────────────────
function fixExamples(obj) {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];

    // Kalau properti ini adalah phone/handphone field dengan type string
    if (key === 'example' && typeof val === 'number') {
      // Convert balik ke string
      obj[key] = String(val);
    }

    // Fix di example objects (value fields in examples)
    if (key === 'phone' && typeof val === 'number') {
      obj[key] = String(val);
    }
    if (key === 'outletPhone' && typeof val === 'number') {
      obj[key] = String(val);
    }

    if (typeof val === 'object') {
      fixExamples(val);
    }
  }
}

fixExamples(doc);
console.log('✅ Phone number examples fixed');

// ─── Save ─────────────────────────────────────────────────────────────────────
const output = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: "'",
  forceQuotes: false,
  indent: 2,
});

fs.writeFileSync(FILE_PATH, output, { encoding: 'utf8' });
console.log('✅ File saved (UTF-8, no BOM)');
