// Idempotent migration: adds missing translation keys and values without touching
// existing admin-edited data.
//
//   node scripts/i18n-migrate.mjs
//
// Reads DATABASE_URL the same way the app does. Safe to run repeatedly.

import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '.env');
let url = process.env.DATABASE_URL;
if (!url) {
	try {
		const txt = readFileSync(envPath, 'utf8');
		const match = txt.match(/^DATABASE_URL\s*=\s*(.+?)\s*$/m);
		if (match) url = match[1].replace(/^['"]|['"]$/g, '');
	} catch {
		// ignore
	}
}
if (!url) {
	console.error('DATABASE_URL is not set and .env not readable');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Load seed data from the same JSON the app uses
// ---------------------------------------------------------------------------
const seedPath = resolve(here, '..', 'src', 'lib', 'server', 'translations-seed.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

const client = createClient({ url });

// Ensure locales exist
const locales = [
	{ code: 'vi', label: 'Tiếng Việt', dir: 'ltr', isActive: 1, isDefault: 1, sortOrder: 0 },
	{ code: 'en', label: 'English', dir: 'ltr', isActive: 1, isDefault: 0, sortOrder: 1 }
];

for (const loc of locales) {
	await client.execute({
		sql: `INSERT INTO app_locale (code, label, dir, is_active, is_default, sort_order)
		      VALUES (?, ?, ?, ?, ?, ?)
		      ON CONFLICT (code) DO NOTHING`,
		args: [loc.code, loc.label, loc.dir, loc.isActive, loc.isDefault, loc.sortOrder]
	});
}

// Fetch existing keys
const existingKeys = new Set(
	(await client.execute('SELECT key FROM app_translation_key')).rows.map((r) => r.key)
);

// Fetch existing translations
const existingValues = new Map();
const valueRows = await client.execute('SELECT key, locale, value FROM app_translation');
for (const r of valueRows.rows) {
	existingValues.set(`${r.key}::${r.locale}`, r.value);
}

let keysCreated = 0;
let viInserted = 0;
let enInserted = 0;
let viSkipped = 0;
let enSkipped = 0;

for (const item of seed) {
	const { key, vi, en, description } = item;

	// 1. Ensure key exists
	if (!existingKeys.has(key)) {
		await client.execute({
			sql: `INSERT INTO app_translation_key (key, description) VALUES (?, ?)`,
			args: [key, description ?? null]
		});
		existingKeys.add(key);
		keysCreated++;
	}

	// 2. Ensure vi value exists (only insert if missing — preserves admin edits)
	const viKey = `${key}::vi`;
	if (!existingValues.has(viKey)) {
		await client.execute({
			sql: `INSERT INTO app_translation (key, locale, value) VALUES (?, 'vi', ?)`,
			args: [key, vi]
		});
		existingValues.set(viKey, vi);
		viInserted++;
	} else {
		viSkipped++;
	}

	// 3. Ensure en value exists (only insert if missing — preserves admin edits)
	if (en !== undefined && en !== '') {
		const enKey = `${key}::en`;
		if (!existingValues.has(enKey)) {
			await client.execute({
				sql: `INSERT INTO app_translation (key, locale, value) VALUES (?, 'en', ?)`,
				args: [key, en]
			});
			existingValues.set(enKey, en);
			enInserted++;
		} else {
			enSkipped++;
		}
	}
}

console.log('i18n migration complete:');
console.log(`  Keys created:    ${keysCreated}`);
console.log(`  VI inserted:     ${viInserted}`);
console.log(`  VI skipped:      ${viSkipped} (already exist)`);
console.log(`  EN inserted:     ${enInserted}`);
console.log(`  EN skipped:      ${enSkipped} (already exist)`);
console.log(`  Total in seed:   ${seed.length}`);

client.close();
