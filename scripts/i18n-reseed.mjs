// One-shot dev helper: clears app_locale / app_translation_key / app_translation
// so the next request triggers bootstrapDefaults() in translations.ts. Run once
// after changing the bootstrap shape.
//
//   node scripts/i18n-reseed.mjs
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

const client = createClient({ url });
await client.execute('DELETE FROM app_translation');
await client.execute('DELETE FROM app_translation_key');
await client.execute('DELETE FROM app_locale');
console.log('i18n tables cleared — next request will re-bootstrap.');
client.close();
