/**
 * scripts/fix-openapi-master.js
 * ONE script to rule them all — run this ONCE to get a clean file:
 * 1. Add contact to info
 * 2. Phone number examples → properly quoted strings (text-level, after dump)
 * 3. All other type fixes
 * 4. Write with NO BOM
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');
const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);

// ─── 1. Add contact info ──────────────────────────────────────────────────────
doc.info.contact = {
  name: 'Mitbiz Dev Team',
  email: 'dev@mitbiz.com',
};
console.log('✅ Contact info added');

// ─── 2. Deep fix all numeric examples that should be integers/numbers/strings ─
function deepFixExamples(node) {
  if (!node || typeof node !== 'object') return;

  if ('type' in node && 'example' in node) {
    const t = node.type;
    const ex = node.example;
    if ((t === 'integer' || t === 'number') && typeof ex === 'string') {
      const parsed = parseFloat(ex);
      if (!isNaN(parsed)) {
        node.example = t === 'integer' ? Math.trunc(parsed) : parsed;
      }
    }
    // string type: convert number → string
    if (t === 'string' && typeof ex === 'number') {
      node.example = String(ex);
    }
  }

  // Fix phone fields in value/example objects
  const phoneFields = ['phone', 'outletPhone', 'contactPhone'];
  for (const f of phoneFields) {
    if (f in node && typeof node[f] === 'number') {
      node[f] = String(node[f]);
    }
  }

  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') deepFixExamples(v);
  }
}

deepFixExamples(doc);
console.log('✅ Deep type fixes applied');

// ─── 3. Dump to YAML text ─────────────────────────────────────────────────────
let yamlText = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: "'",
  forceQuotes: false,
  indent: 2,
});

// ─── 4. TEXT-LEVEL: Force-quote all phone-looking numbers ─────────────────────
// Pattern: any value that is 08xxxxxxxx or 02xxxxxxxx (starts with 0, 7+ more digits)
// in YAML: "example: 081234567890" → "example: '081234567890'"
// Also fix inline example values: "phone: 081234567890" → "phone: '081234567890'"

// Fix schema-level examples
yamlText = yamlText.replace(
  /^(\s*example:\s+)(0\d{6,})$/gm,
  "$1'$2'"
);

// Fix property values in media type example objects  
yamlText = yamlText.replace(
  /^(\s*(?:phone|outletPhone|contactPhone):\s+)(0\d{6,})$/gm,
  "$1'$2'"
);

console.log('✅ Phone numbers force-quoted in text');

// ─── 5. Write without BOM ─────────────────────────────────────────────────────
fs.writeFileSync(FILE_PATH, yamlText, { encoding: 'utf8' });
console.log('✅ File written (UTF-8, no BOM)');
console.log('\nDone! Run: npx @redocly/cli lint src/docs/openapi.yaml --config .redocly.yaml');
