/**
 * scripts/fix-openapi-final.js
 * Final comprehensive fix:
 * 1. Rename CreateSuperAdminUserInput → SuperAdminCreateUserInput
 * 2. Rename UpdateSuperAdminUserInput → SuperAdminUpdateUserInput
 * 3. Delete SuperAdminOutletItem (now unused)
 * 4. Fix example values: quoted strings for integers/numbers, and phone as string
 * 5. Fix OutletStats examples (string → number/integer)
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');

const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);

const schemas = doc.components.schemas;

// ─── 1. Rename schema names to match $ref in paths ───────────────────────────
if (schemas.CreateSuperAdminUserInput) {
  schemas.SuperAdminCreateUserInput = schemas.CreateSuperAdminUserInput;
  delete schemas.CreateSuperAdminUserInput;
  console.log('✅ Renamed CreateSuperAdminUserInput → SuperAdminCreateUserInput');
}

if (schemas.UpdateSuperAdminUserInput) {
  schemas.SuperAdminUpdateUserInput = schemas.UpdateSuperAdminUserInput;
  delete schemas.UpdateSuperAdminUserInput;
  console.log('✅ Renamed UpdateSuperAdminUserInput → SuperAdminUpdateUserInput');
}

// ─── 2. Delete SuperAdminOutletItem (unused after SuperAdminOutletDetail removed) ──
if (schemas.SuperAdminOutletItem) {
  delete schemas.SuperAdminOutletItem;
  console.log('✅ Removed SuperAdminOutletItem (unused)');
}

// ─── 3. Fix example values recursively ───────────────────────────────────────
/**
 * Walk the YAML document and fix:
 * - `example` values that are strings ('3', '42') but schema type is integer/number
 * - `example` values that are numbers but schema type is string (phone)
 * - Nested value objects in `examples[].value` (media type examples)
 */
function fixSchema(schemaObj) {
  if (!schemaObj || typeof schemaObj !== 'object') return;

  // Fix example at this level if type info is available
  if (schemaObj.type && 'example' in schemaObj) {
    const type = schemaObj.type;
    const ex = schemaObj.example;

    if ((type === 'integer' || type === 'number') && typeof ex === 'string') {
      const num = Number(ex.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) {
        schemaObj.example = type === 'integer' ? Math.round(num) : num;
        console.log(`  Fixed example: "${ex}" → ${schemaObj.example} (${type})`);
      }
    }

    if (type === 'string' && typeof ex === 'number') {
      schemaObj.example = String(ex);
      console.log(`  Fixed example: ${ex} → "${schemaObj.example}" (string)`);
    }
  }

  // Recurse into properties
  if (schemaObj.properties) {
    for (const prop of Object.values(schemaObj.properties)) {
      fixSchema(prop);
    }
  }

  // Recurse into items (arrays)
  if (schemaObj.items) fixSchema(schemaObj.items);

  // Recurse into allOf/oneOf/anyOf
  for (const key of ['allOf', 'oneOf', 'anyOf']) {
    if (Array.isArray(schemaObj[key])) {
      schemaObj[key].forEach(fixSchema);
    }
  }
}

// Fix all schema examples
console.log('\n📋 Fixing schema examples:');
for (const schema of Object.values(schemas)) {
  fixSchema(schema);
}

// Fix media type examples in paths (value objects under examples[].value or example)
function fixMediaTypeExamples(obj) {
  if (!obj || typeof obj !== 'object') return;

  // Fix 'value' objects in media type examples — phone fields
  if ('value' in obj && typeof obj.value === 'object') {
    fixValueObject(obj.value);
  }

  // Fix direct 'example' object in media type (e.g., example: { phone: 081xxx })
  if ('example' in obj && typeof obj.example === 'object' && obj.example !== null) {
    fixValueObject(obj.example);
  }

  for (const child of Object.values(obj)) {
    if (typeof child === 'object') fixMediaTypeExamples(child);
  }
}

function fixValueObject(val) {
  if (!val || typeof val !== 'object') return;

  const phoneFields = ['phone', 'outletPhone', 'contactPhone'];
  for (const field of phoneFields) {
    if (field in val && typeof val[field] === 'number') {
      val[field] = String(val[field]);
      console.log(`  Fixed ${field}: ${val[field]}`);
    }
  }

  // Recurse
  for (const child of Object.values(val)) {
    if (typeof child === 'object') fixValueObject(child);
  }
}

console.log('\n📋 Fixing media type examples in paths:');
fixMediaTypeExamples(doc.paths);

// ─── 4. Save ──────────────────────────────────────────────────────────────────
const output = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: "'",
  forceQuotes: false,
  indent: 2,
});

fs.writeFileSync(FILE_PATH, output, { encoding: 'utf8' });
console.log('\n✅ File saved');
