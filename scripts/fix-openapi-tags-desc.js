/**
 * scripts/fix-openapi-tags-desc.js
 * Fix:
 * 1. Tambah missing global tags (Fase 11)
 * 2. Tambah description ke operations yang tidak punya
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

const FILE_PATH = path.join(__dirname, '../src/docs/openapi.yaml');
const raw = fs.readFileSync(FILE_PATH, 'utf8');
const doc = YAML.load(raw);

// ─── 1. Tambah missing global tags ───────────────────────────────────────────
const missingTags = [
  { name: 'Dashboard (Fase 11)', description: 'Ringkasan statistik penjualan, produk terlaris, & performa outlet' },
  { name: 'Laporan (Fase 11)', description: 'Laporan penjualan harian/mingguan/bulanan & ekspor data Excel/PDF' },
  { name: 'Pengaturan Sistem (Fase 11)', description: 'Konfigurasi sistem global (Super Admin) & pengaturan bisnis per-tenant (Admin)' },
];

const existingTagNames = (doc.tags || []).map(t => t.name);
let addedTags = 0;

for (const tag of missingTags) {
  if (!existingTagNames.includes(tag.name)) {
    doc.tags.push(tag);
    addedTags++;
    console.log(`✅ Added global tag: ${tag.name}`);
  }
}

// ─── 2. Tambah description ke operations yang belum punya ────────────────────
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
let descAdded = 0;

for (const [, pathItem] of Object.entries(doc.paths || {})) {
  for (const method of HTTP_METHODS) {
    const op = pathItem[method];
    if (!op) continue;
    if (!op.description || op.description.trim() === '') {
      // Use summary as description if available
      op.description = op.summary || 'Tidak ada deskripsi tambahan.';
      descAdded++;
    }
  }
}

console.log(`✅ Added description to ${descAdded} operations`);

// ─── Save ─────────────────────────────────────────────────────────────────────
const output = YAML.dump(doc, {
  lineWidth: 120,
  noRefs: false,
  quotingType: "'",
  forceQuotes: false,
  indent: 2,
});

fs.writeFileSync(FILE_PATH, output, { encoding: 'utf8' });
console.log('✅ File saved');
