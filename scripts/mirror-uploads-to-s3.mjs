// Mirrors every iwood.com.vn upload referenced by the WP mirror (dumps/wp.sqlite)
// to an S3-compatible bucket. Keys are kept identical to the original WP path,
// prefixed with `uploads/` — i.e. `uploads/2024/05/foo.jpg`. The resulting CDN
// then serves `https://cdn.example.com/uploads/2024/05/foo.jpg`, matching what
// seed-from-wp.mjs writes into the app DB when MEDIA_BASE_URL is set.
//
// Resumable: HEAD on each key skips files that already exist with non-zero size.
// Network-bound; tune CONCURRENCY via env.
//
//   node scripts/mirror-uploads-to-s3.mjs
//
// Required env (same names as the runtime S3 driver):
//   S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL_BASE
// Optional:
//   S3_ENDPOINT          custom endpoint (R2/MinIO)
//   S3_FORCE_PATH_STYLE  "true" to force path-style addressing
//   WP_MIRROR            path to wp.sqlite (default dumps/wp.sqlite)
//   PROD_BASE            source origin (default https://iwood.com.vn)
//   CONCURRENCY          parallel uploads (default 6)
//   DRY_RUN              "true" to list the work without uploading

import { createClient } from '@libsql/client';
import {
	S3Client,
	PutObjectCommand,
	HeadObjectCommand
} from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');

function loadEnv() {
	try {
		const txt = readFileSync(resolve(ROOT, '.env'), 'utf8');
		for (const line of txt.split(/\r?\n/)) {
			const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i.exec(line);
			if (!m) continue;
			const [, k, vRaw] = m;
			if (process.env[k] != null) continue;
			process.env[k] = vRaw.replace(/^['"]|['"]$/g, '');
		}
	} catch {
		// optional
	}
}
loadEnv();

const WP_MIRROR = resolve(ROOT, process.env.WP_MIRROR ?? 'dumps/wp.sqlite');
const PROD_BASE = (process.env.PROD_BASE ?? 'https://iwood.com.vn').replace(/\/+$/, '');
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 6));
const DRY_RUN = process.env.DRY_RUN === 'true';

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION;
const ACCESS = process.env.S3_ACCESS_KEY;
const SECRET = process.env.S3_SECRET_KEY;
const PUBLIC_BASE = (process.env.S3_PUBLIC_URL_BASE ?? '').replace(/\/+$/, '');
const ENDPOINT = process.env.S3_ENDPOINT || undefined;
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

if (!BUCKET || !REGION || !ACCESS || !SECRET || !PUBLIC_BASE) {
	console.error(
		'Missing S3 config. Required: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL_BASE'
	);
	process.exit(1);
}
if (!existsSync(WP_MIRROR)) {
	console.error(`Mirror missing: ${WP_MIRROR}\nRun: node scripts/wp-mirror.mjs`);
	process.exit(1);
}

const wp = createClient({ url: `file:${WP_MIRROR}` });
const s3 = new S3Client({
	region: REGION,
	endpoint: ENDPOINT,
	forcePathStyle: FORCE_PATH_STYLE,
	credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET }
});

const rowsOf = async (sql, args = []) => (await wp.execute({ sql, args })).rows;

// --- enumerate the upload set ---------------------------------------------

function uploadsPathOf(url) {
	if (!url) return null;
	const m = /\/wp-content\/uploads\/(.+?)(?:[?#]|$)/i.exec(url);
	return m ? m[1] : null;
}

function imageUrlsInHtml(html) {
	if (!html) return [];
	const out = [];
	const seen = new Set();
	const consider = (url) => {
		const u = url.trim();
		if (!u || u.startsWith('data:')) return;
		if (/\b(emoji|spacer|pixel|blank)\b/i.test(u)) return;
		if (seen.has(u)) return;
		seen.add(u);
		out.push(u);
	};
	const imgRe = /<img\b[^>]*>/gi;
	let m;
	while ((m = imgRe.exec(html)) !== null) {
		const tag = m[0];
		const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag);
		if (srcMatch) consider(srcMatch[1]);
		const srcsetMatch = /\bsrcset\s*=\s*["']([^"']+)["']/i.exec(tag);
		if (srcsetMatch) {
			for (const cand of srcsetMatch[1].split(',')) {
				const url = cand.trim().split(/\s+/)[0];
				if (url) consider(url);
			}
		}
	}
	return out;
}

async function collectRelativePaths() {
	const set = new Set();

	// All attachment files in the WP mirror.
	const attached = await rowsOf(
		`SELECT pm.meta_value AS path
		 FROM wp_postmeta pm
		 WHERE pm.meta_key = '_wp_attached_file'`
	);
	for (const r of attached) {
		const rel = String(r.path ?? '').replace(/^\/+/, '');
		if (rel) set.add(rel);
	}

	// Every <img> URL embedded in post/product bodies — captures srcset variants
	// that aren't standalone attachments.
	const bodies = await rowsOf(
		`SELECT post_content FROM wp_post
		 WHERE post_type IN ('post','product','page') AND post_status='publish'`
	);
	for (const b of bodies) {
		for (const url of imageUrlsInHtml(b.post_content)) {
			const rel = uploadsPathOf(url);
			if (rel) set.add(rel);
		}
	}

	return [...set];
}

// --- upload helpers --------------------------------------------------------

const CONTENT_TYPE_BY_EXT = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif',
	svg: 'image/svg+xml',
	avif: 'image/avif',
	pdf: 'application/pdf'
};
function contentTypeFor(rel) {
	const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase();
	return CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream';
}

async function s3Exists(key) {
	try {
		const r = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
		return Number(r.ContentLength ?? 0) > 0;
	} catch (err) {
		const code = err?.$metadata?.httpStatusCode;
		if (code === 404 || code === 403) return false; // some providers 403 on missing
		throw err;
	}
}

async function uploadOne(rel) {
	const key = `uploads/${rel}`;
	const remoteUrl = `${PROD_BASE}/wp-content/uploads/${rel}`;

	if (await s3Exists(key)) return { rel, status: 'skipped' };
	if (DRY_RUN) return { rel, status: 'would-upload' };

	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const ac = new AbortController();
			const timer = setTimeout(() => ac.abort(), 30_000);
			const res = await fetch(remoteUrl, { signal: ac.signal });
			clearTimeout(timer);
			if (res.status === 404) return { rel, status: 'missing-upstream' };
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const buf = Buffer.from(await res.arrayBuffer());
			await s3.send(
				new PutObjectCommand({
					Bucket: BUCKET,
					Key: key,
					Body: buf,
					ContentType: contentTypeFor(rel)
				})
			);
			return { rel, status: 'uploaded', bytes: buf.byteLength };
		} catch (err) {
			if (attempt === 3) return { rel, status: 'failed', error: err.message ?? String(err) };
			await new Promise((r) => setTimeout(r, 400 * attempt + Math.random() * 600));
		}
	}
	return { rel, status: 'failed', error: 'exhausted retries' };
}

// --- main ------------------------------------------------------------------

console.log(`Mirror : ${WP_MIRROR}`);
console.log(`Bucket : ${BUCKET}${ENDPOINT ? ` (endpoint ${ENDPOINT})` : ''}`);
console.log(`CDN    : ${PUBLIC_BASE}`);
console.log(`Source : ${PROD_BASE}`);
console.log(`Mode   : ${DRY_RUN ? 'DRY RUN' : 'live'}  concurrency=${CONCURRENCY}`);

const rels = await collectRelativePaths();
console.log(`Found ${rels.length} unique upload paths to mirror.`);

const counts = { uploaded: 0, skipped: 0, 'missing-upstream': 0, failed: 0, 'would-upload': 0 };
const failures = [];
let bytes = 0;
let done = 0;
let i = 0;
const startedAt = Date.now();

const workers = Array.from({ length: CONCURRENCY }, async () => {
	while (i < rels.length) {
		const idx = i++;
		const result = await uploadOne(rels[idx]);
		counts[result.status]++;
		if (result.status === 'uploaded') bytes += result.bytes ?? 0;
		if (result.status === 'failed' || result.status === 'missing-upstream') {
			failures.push(result);
		}
		done++;
		if (done % 25 === 0 || done === rels.length) {
			const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
			process.stdout.write(
				`  ${done}/${rels.length}  uploaded=${counts.uploaded} skipped=${counts.skipped} missing=${counts['missing-upstream']} failed=${counts.failed}  ${elapsed}s\r`
			);
		}
	}
});
await Promise.all(workers);

console.log('');
console.log('Summary:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(16)} ${v}`);
console.log(`  bytes uploaded   ${(bytes / 1024 / 1024).toFixed(1)} MiB`);
if (failures.length) {
	console.log('Failures (first 20):');
	for (const f of failures.slice(0, 20)) console.log(`  ${f.status}\t${f.rel}\t${f.error ?? ''}`);
}

wp.close();
console.log('\nDone.');
