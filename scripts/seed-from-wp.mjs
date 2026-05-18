// Seeds the local app database (dev.db) from the WP mirror produced by
// scripts/wp-mirror.mjs. Downloads referenced images into static/uploads/ and
// rewrites image fields to local paths.
//
//   node scripts/wp-mirror.mjs   # one-off, fetches data from prod
//   node scripts/seed-from-wp.mjs
//
// Re-runnable. Wipes the app's content tables and re-inserts. Image downloads
// are resumable (existing files are skipped).
//
// Env:
//   DATABASE_URL                 app SQLite (from .env, file:dev.db typical)
//   WP_MIRROR=dumps/wp.sqlite    local WP mirror
//   STATIC_DIR=static            output dir for downloaded images
//   PROD_BASE=https://iwood.com.vn   used to construct image URLs
//   MEDIA_BASE_URL=<empty>       when set (e.g. https://cdn.example.com), generated
//                                image URLs are absolute (`${MEDIA_BASE_URL}/uploads/...`)
//                                and on-disk downloads are skipped. Use this on the
//                                server, after running scripts/mirror-uploads-to-s3.mjs
//                                locally to populate the CDN.

import { createClient } from '@libsql/client';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');

// --- env -------------------------------------------------------------------
function loadEnv() {
	try {
		const txt = readFileSync(join(ROOT, '.env'), 'utf8');
		for (const line of txt.split(/\r?\n/)) {
			const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i.exec(line);
			if (!m) continue;
			const [, k, vRaw] = m;
			if (process.env[k] != null) continue;
			process.env[k] = vRaw.replace(/^['"]|['"]$/g, '');
		}
	} catch {
		// .env optional
	}
}
loadEnv();

const APP_DB_URL = process.env.DATABASE_URL ?? 'file:dev.db';
const WP_MIRROR = resolve(ROOT, process.env.WP_MIRROR ?? 'dumps/wp.sqlite');
const STATIC_DIR = resolve(ROOT, process.env.STATIC_DIR ?? 'static');
const UPLOAD_DIR = join(STATIC_DIR, 'uploads');
const PROD_BASE = (process.env.PROD_BASE ?? 'https://iwood.com.vn').replace(/\/+$/, '');
// When set, all generated image URLs go through this CDN base (`/uploads/...`
// appended) and no local downloads run. Designed for the server-side seed step,
// after the CDN has been populated locally via mirror-uploads-to-s3.mjs.
const MEDIA_BASE_URL = (process.env.MEDIA_BASE_URL ?? '').replace(/\/+$/, '');
const USE_CDN = MEDIA_BASE_URL.length > 0;
const uploadsUrl = (rel) => `${USE_CDN ? MEDIA_BASE_URL : ''}/uploads/${rel}`;

if (!existsSync(WP_MIRROR)) {
	console.error(`Mirror missing: ${WP_MIRROR}\nRun: node scripts/wp-mirror.mjs`);
	process.exit(1);
}

const wp = createClient({ url: `file:${WP_MIRROR}` });
const app = createClient({ url: APP_DB_URL });

// --- helpers ---------------------------------------------------------------

const rowsOf = async (sql, args = []) => (await wp.execute({ sql, args })).rows;

function stripTags(html) {
	if (!html) return '';
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function snippet(text, max = 280) {
	const t = stripTags(text);
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > max - 40 ? cut.slice(0, lastSpace) : cut) + '…';
}

// Extract the wp-content/uploads/<rest> path from a URL referencing the
// production site (or its dev predecessor). Returns null if the URL doesn't
// point at WP uploads.
function uploadsPathOf(url) {
	if (!url) return null;
	const m = /\/wp-content\/uploads\/(.+?)(?:[?#]|$)/i.exec(url);
	return m ? m[1] : null;
}

// WP often serves resized variants like `foo-300x200.jpg`. The download map is
// keyed by the original `_wp_attached_file` path (e.g. `foo.jpg`), so we strip
// the size suffix when matching.
function unscalePath(p) {
	return p.replace(/-\d+x\d+(\.(?:jpe?g|png|webp|gif|avif))$/i, '$1');
}

// Pulls image URLs out of an HTML blob in document order. Captures both
// `<img src>` and any `srcset` candidates — WP emits srcset with size variants
// plus the original, and browsers pick from srcset based on viewport, so we
// must mirror every URL that may be requested. Skips duplicates and tracking
// pixels (1×1 spacers, emoji).
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
			// srcset = "url1 1024w, url2 768w, ...", commas separate candidates.
			for (const cand of srcsetMatch[1].split(',')) {
				const url = cand.trim().split(/\s+/)[0];
				if (url) consider(url);
			}
		}
	}
	return out;
}

// Rewrites any iwood.com.vn (or migrated localhost) image URL inside an HTML
// blob to point at the configured upload location — either `/uploads/...` for
// local dev, or `${MEDIA_BASE_URL}/uploads/...` when targeting the CDN. Idempotent.
function rewriteUploadsInHtml(html) {
	if (!html) return html;
	return html.replace(
		/https?:\/\/(?:iwood\.com\.vn|localhost(?:\/[^"'\s]*)?)\/wp-content\/uploads\/([^"'\s)]+)/gi,
		(_m, rel) => uploadsUrl(rel)
	);
}

// True for any URL we treat as a managed upload (local or CDN). Used so the
// gallery-builder's "is this a media url" check works in either mode.
function isMediaUrl(u) {
	if (!u) return false;
	if (USE_CDN) return u.startsWith(`${MEDIA_BASE_URL}/uploads/`);
	return u.startsWith('/uploads/');
}

// --- image map: attachment_id -> { remoteUrl, localPath } ------------------

let _attachmentMap = null;
async function getAttachmentMap() {
	if (_attachmentMap) return _attachmentMap;
	const map = new Map();
	// Build from _wp_attached_file meta — guid often points to the original dev
	// domain ("http://localhost/iwood/...") which is wrong.
	const rows = await rowsOf(`
		SELECT p.id, pm.meta_value AS path
		FROM wp_post p
		JOIN wp_postmeta pm ON pm.post_id = p.id AND pm.meta_key = '_wp_attached_file'
		WHERE p.post_type = 'attachment'
	`);
	for (const r of rows) {
		const id = Number(r.id);
		const rel = String(r.path).replace(/^\/+/, '');
		map.set(id, {
			remoteUrl: `${PROD_BASE}/wp-content/uploads/${rel}`,
			localPath: `uploads/${rel}`
		});
	}
	_attachmentMap = map;
	return map;
}

// Returns the public URL ("/uploads/..." or "${MEDIA_BASE_URL}/uploads/...")
// for the given attachment id, or null if unknown.
async function resolveImageUrl(attachmentId) {
	if (!attachmentId) return null;
	const map = await getAttachmentMap();
	const a = map.get(Number(attachmentId));
	if (!a) return null;
	// a.localPath is "uploads/<rel>" — strip the prefix and route through uploadsUrl
	// so we get the same form regardless of storage mode.
	const rel = a.localPath.replace(/^uploads\//, '');
	return uploadsUrl(rel);
}

// --- Layer 1: attachments uploaded against a project (post_parent) --------

let _attachmentsByParent = null;
async function getAttachmentsByParent() {
	if (_attachmentsByParent) return _attachmentsByParent;
	const rows = await rowsOf(`
		SELECT id, post_parent, post_date
		FROM wp_post
		WHERE post_type = 'attachment' AND post_parent > 0
		ORDER BY post_parent, post_date ASC, id ASC
	`);
	const map = new Map(); // parentId -> [attachmentId,...]
	for (const r of rows) {
		const parent = Number(r.post_parent);
		if (!map.has(parent)) map.set(parent, []);
		map.get(parent).push(Number(r.id));
	}
	_attachmentsByParent = map;
	return map;
}

// --- Layer 3: product-slug token matcher ---------------------------------

let _productSuffixIndex = null;
// Build a suffix index: trailing 2- and 3-token suffix of each product slug ->
// product slug list. iWood project slugs reference products by their pattern
// code (e.g. "w10-2", "4s9-6") rather than the full sku-style slug, so we
// match on the slug's tail.
async function getProductSuffixIndex() {
	if (_productSuffixIndex) return _productSuffixIndex;
	const rows = await rowsOf(
		`SELECT id, post_name FROM wp_post WHERE post_type='product' AND post_status='publish'`
	);
	const slugByPostId = new Map();
	const postIdBySlug = new Map();
	const suffixMap = new Map(); // suffix -> Set<slug>
	for (const r of rows) {
		const slug = String(r.post_name || '').trim().toLowerCase();
		if (!slug) continue;
		slugByPostId.set(Number(r.id), slug);
		postIdBySlug.set(slug, Number(r.id));
		const toks = slug.split('-');
		for (const len of [2, 3]) {
			if (toks.length < len) continue;
			const suf = toks.slice(-len).join('-');
			// Skip generic suffixes (need at least one digit so we don't match on
			// "tai" or "trang-tri" type fragments).
			if (!/\d/.test(suf)) continue;
			if (!suffixMap.has(suf)) suffixMap.set(suf, new Set());
			suffixMap.get(suf).add(slug);
		}
	}
	_productSuffixIndex = { suffixMap, slugByPostId, postIdBySlug };
	return _productSuffixIndex;
}

async function productSlugsInText(slug) {
	const { suffixMap } = await getProductSuffixIndex();
	if (!slug) return [];
	const toks = String(slug).toLowerCase().split('-');
	const matched = new Set();
	for (const len of [2, 3]) {
		for (let i = 0; i + len <= toks.length; i++) {
			const sub = toks.slice(i, i + len).join('-');
			const hits = suffixMap.get(sub);
			if (hits) for (const h of hits) matched.add(h);
		}
	}
	return [...matched];
}

// Returns the attachment ids referenced by a product's WooCommerce gallery
// (_product_image_gallery is a CSV of attachment ids).
async function productGalleryAttachmentIds(productPostId) {
	const rows = await rowsOf(
		`SELECT meta_value FROM wp_postmeta WHERE post_id=? AND meta_key='_product_image_gallery' LIMIT 1`,
		[productPostId]
	);
	const csv = rows[0]?.meta_value;
	if (!csv) return [];
	return String(csv)
		.split(',')
		.map((s) => Number(String(s).trim()))
		.filter((n) => Number.isFinite(n) && n > 0);
}

// --- image downloader ------------------------------------------------------

const downloadState = { queued: new Set(), done: 0, skipped: 0, failed: 0, failedUrls: [] };

async function downloadOne(att) {
	const dest = join(STATIC_DIR, att.localPath);
	try {
		const st = await stat(dest);
		if (st.size > 0) {
			downloadState.skipped++;
			return true;
		}
	} catch {
		// missing, proceed to download
	}
	mkdirSync(dirname(dest), { recursive: true });
	// Up to 3 attempts with backoff. Treats 404 as permanent.
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const ac = new AbortController();
			const timer = setTimeout(() => ac.abort(), 30_000);
			const res = await fetch(att.remoteUrl, { signal: ac.signal });
			clearTimeout(timer);
			if (res.status === 404) {
				downloadState.failed++;
				downloadState.failedUrls.push({ url: att.remoteUrl, reason: '404' });
				return false;
			}
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const buf = Buffer.from(await res.arrayBuffer());
			await writeFile(dest, buf);
			downloadState.done++;
			return true;
		} catch (err) {
			if (attempt === 3) {
				downloadState.failed++;
				downloadState.failedUrls.push({ url: att.remoteUrl, reason: err.message || 'unknown' });
				return false;
			}
			await new Promise((r) => setTimeout(r, 400 * attempt + Math.random() * 600));
		}
	}
	return false;
}

async function downloadImages(ids, extraMap = new Map()) {
	const map = await getAttachmentMap();
	const byPath = new Map();
	for (const id of ids) {
		const a = map.get(Number(id));
		if (a) byPath.set(a.localPath, a.remoteUrl);
	}
	// extraMap is keyed by localPath ("uploads/...") -> remoteUrl. Dedupes
	// automatically against attachment-id entries.
	for (const [localPath, remoteUrl] of extraMap) {
		if (!byPath.has(localPath)) byPath.set(localPath, remoteUrl);
	}
	const wanted = [...byPath.entries()].map(([localPath, remoteUrl]) => ({ localPath, remoteUrl }));
	const CONC = 4;
	console.log(`Downloading ${wanted.length} images (concurrency ${CONC})...`);
	let i = 0;
	const workers = Array.from({ length: CONC }, async () => {
		while (i < wanted.length) {
			const idx = i++;
			await downloadOne(wanted[idx]);
			if (idx % 50 === 49) {
				process.stdout.write(
					`  ${downloadState.done + downloadState.skipped}/${wanted.length} (${downloadState.failed} failed)\r`
				);
			}
		}
	});
	await Promise.all(workers);
	console.log(
		`  done: ${downloadState.done} downloaded, ${downloadState.skipped} skipped, ${downloadState.failed} failed       `
	);
	if (downloadState.failedUrls.length) {
		const reasons = new Map();
		for (const f of downloadState.failedUrls) reasons.set(f.reason, (reasons.get(f.reason) ?? 0) + 1);
		console.log('  failure breakdown:');
		for (const [r, c] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
			console.log(`    ${c.toString().padStart(5)}  ${r}`);
		}
		const logFile = join(ROOT, 'dumps', 'image-failures.log');
		await writeFile(
			logFile,
			downloadState.failedUrls.map((f) => `${f.reason}\t${f.url}`).join('\n') + '\n'
		);
		console.log(`  full list -> ${logFile}`);
	}
}

// --- term helpers ----------------------------------------------------------

let _termsById = null;
async function getTerms() {
	if (_termsById) return _termsById;
	const rows = await rowsOf(`SELECT * FROM wp_term`);
	const byTaxId = new Map(); // term_taxonomy_id -> term
	const byTermId = new Map(); // term_id -> { byTaxonomy: Map<taxonomy, term> }
	for (const r of rows) {
		byTaxId.set(Number(r.term_taxonomy_id), r);
		const tid = Number(r.term_id);
		if (!byTermId.has(tid)) byTermId.set(tid, new Map());
		byTermId.get(tid).set(r.taxonomy, r);
	}
	_termsById = { byTaxId, byTermId };
	return _termsById;
}

// Walk a term up to its top-level ancestor within the same taxonomy.
async function rootTerm(termTaxonomyId) {
	const { byTaxId } = await getTerms();
	let cur = byTaxId.get(Number(termTaxonomyId));
	if (!cur) return null;
	// `parent` in wp_term_taxonomy is the parent term_id (not term_taxonomy_id)
	while (Number(cur.parent) > 0) {
		const tax = cur.taxonomy;
		const parentTermId = Number(cur.parent);
		// find the term_taxonomy_id matching parent term_id in same taxonomy
		let next = null;
		for (const t of byTaxId.values()) {
			if (Number(t.term_id) === parentTermId && t.taxonomy === tax) {
				next = t;
				break;
			}
		}
		if (!next) break;
		cur = next;
	}
	return cur;
}

// All descendant term_taxonomy_ids of a given term_id within a taxonomy.
async function descendantTaxIds(rootTermId, taxonomy) {
	const { byTaxId } = await getTerms();
	const out = new Set();
	const stack = [Number(rootTermId)];
	while (stack.length) {
		const tid = stack.pop();
		for (const t of byTaxId.values()) {
			if (t.taxonomy !== taxonomy) continue;
			if (Number(t.parent) === tid) {
				out.add(Number(t.term_taxonomy_id));
				stack.push(Number(t.term_id));
			}
			if (Number(t.term_id) === tid) {
				out.add(Number(t.term_taxonomy_id));
			}
		}
	}
	return out;
}

// --- gather meta as a map for fast lookup ---------------------------------

async function metaByPost(keys) {
	const placeholders = keys.map(() => '?').join(',');
	const rows = await rowsOf(
		`SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE meta_key IN (${placeholders})`,
		keys
	);
	const map = new Map();
	for (const r of rows) {
		const id = Number(r.post_id);
		if (!map.has(id)) map.set(id, {});
		map.get(id)[r.meta_key] = r.meta_value;
	}
	return map;
}

// --- term relationships index --------------------------------------------

async function termsForObjects(postIds) {
	if (!postIds.size) return new Map();
	const ids = [...postIds];
	const out = new Map(); // postId -> term_taxonomy_id[]
	const CHUNK = 500;
	for (let i = 0; i < ids.length; i += CHUNK) {
		const slice = ids.slice(i, i + CHUNK);
		const ph = slice.map(() => '?').join(',');
		const rows = await rowsOf(
			`SELECT object_id, term_taxonomy_id FROM wp_term_rel WHERE object_id IN (${ph})`,
			slice
		);
		for (const r of rows) {
			const id = Number(r.object_id);
			if (!out.has(id)) out.set(id, []);
			out.get(id).push(Number(r.term_taxonomy_id));
		}
	}
	return out;
}

// --- mapping plans ---------------------------------------------------------

const PLACEHOLDER_IMG = '/placeholder.svg';

function uniqueOrderedById(rows) {
	const seen = new Set();
	const out = [];
	for (const r of rows) {
		if (seen.has(r.id)) continue;
		seen.add(r.id);
		out.push(r);
	}
	return out;
}

async function buildCategories(referencedImageIds) {
	const { byTermId, byTaxId } = await getTerms();
	const topCats = [...byTaxId.values()].filter(
		(t) => t.taxonomy === 'product_cat' && Number(t.parent) === 0
	);

	// Map term_id -> thumbnail_id via wp_termmeta
	const tmRows = await rowsOf(
		`SELECT term_id, meta_value FROM wp_termmeta WHERE meta_key='thumbnail_id'`
	);
	const thumbByTerm = new Map(tmRows.map((r) => [Number(r.term_id), Number(r.meta_value)]));

	// For each top-level cat, walk down to find all product term_taxonomy_ids
	// then look up price + count of products
	const ph = (n) => Array.from({ length: n }, () => '?').join(',');

	const cats = [];
	let sortIdx = 0;
	for (const t of topCats) {
		const tax = 'product_cat';
		// Descendant term_taxonomy_ids in product_cat
		const taxIds = [...(await descendantTaxIds(Number(t.term_id), tax))];
		if (taxIds.length === 0) taxIds.push(Number(t.term_taxonomy_id));

		// Find product post ids assigned to any of these term_taxonomy_ids
		const rels = await rowsOf(
			`SELECT DISTINCT object_id FROM wp_term_rel WHERE term_taxonomy_id IN (${ph(taxIds.length)})`,
			taxIds
		);
		const objectIds = rels.map((r) => Number(r.object_id));
		let priceFrom = 0;
		let productCount = 0;
		if (objectIds.length) {
			const pid = await rowsOf(
				`SELECT p.id FROM wp_post p WHERE p.id IN (${ph(objectIds.length)}) AND p.post_type='product' AND p.post_status='publish'`,
				objectIds
			);
			productCount = pid.length;
			if (pid.length) {
				const pidArgs = pid.map((r) => Number(r.id));
				const prices = await rowsOf(
					`SELECT meta_value FROM wp_postmeta WHERE meta_key='_price' AND post_id IN (${ph(pidArgs.length)})`,
					pidArgs
				);
				const nums = prices
					.map((r) => Number(String(r.meta_value).replace(/[^0-9.]/g, '')))
					.filter((n) => Number.isFinite(n) && n > 0);
				priceFrom = nums.length ? Math.min(...nums) : 0;
			}
		}

		// Skip empty buckets like "Catalogue" and "Quy Trình" — they're not real
		// product types and clutter the storefront.
		if (productCount === 0) continue;

		let thumbId = thumbByTerm.get(Number(t.term_id)) ?? 0;
		// WP categories on iwood don't have featured images set — fall back to
		// the most recent published product in the category.
		if (!thumbId && objectIds.length) {
			const fallback = await rowsOf(
				`SELECT pm.meta_value FROM wp_post p
				 JOIN wp_postmeta pm ON pm.post_id=p.id AND pm.meta_key='_thumbnail_id'
				 WHERE p.id IN (${ph(objectIds.length)}) AND p.post_type='product' AND p.post_status='publish'
				 ORDER BY p.post_date DESC LIMIT 1`,
				objectIds
			);
			thumbId = Number(fallback[0]?.meta_value ?? 0);
		}
		const imageUrl = (await resolveImageUrl(thumbId)) ?? PLACEHOLDER_IMG;
		if (thumbId && imageUrl !== PLACEHOLDER_IMG) referencedImageIds.add(Number(thumbId));

		cats.push({
			id: t.slug,
			nameVi: t.name,
			nameEn: t.name,
			blurb: stripTags(t.description ?? '').slice(0, 240),
			priceFrom,
			imageUrl,
			displayCount: productCount,
			sortOrder: sortIdx++
		});
	}
	return cats;
}

async function buildProducts(referencedImageIds, categoryIds) {
	const products = await rowsOf(
		`SELECT id, post_name, post_title, post_content, post_excerpt, post_date
		 FROM wp_post WHERE post_type='product' AND post_status='publish'`
	);
	const ids = products.map((r) => Number(r.id));
	const meta = await metaByPost([
		'_thumbnail_id',
		'_price',
		'_regular_price',
		'_sku',
		'don_vi',
		'_yoast_wpseo_primary_product_cat',
		'yikes_woo_products_tabs'
	]);
	const termRel = await termsForObjects(new Set(ids));
	const { byTaxId, byTermId } = await getTerms();

	const out = [];
	const specs = [];
	const allowedCategoryIds = new Set(categoryIds);
	const slugSeen = new Set();
	for (const p of products) {
		const id = Number(p.id);
		const m = meta.get(id) ?? {};
		const thumbId = Number(m._thumbnail_id ?? 0);
		const imageUrl = (await resolveImageUrl(thumbId)) ?? PLACEHOLDER_IMG;
		if (thumbId && imageUrl !== PLACEHOLDER_IMG) referencedImageIds.add(thumbId);

		// Resolve category: primary if set & top-level, else walk up first product_cat assignment
		const primaryTermId = Number(m._yoast_wpseo_primary_product_cat ?? 0);
		let categoryId = null;
		if (primaryTermId) {
			const tax = byTermId.get(primaryTermId)?.get('product_cat');
			if (tax) {
				const root = await rootTerm(tax.term_taxonomy_id);
				if (root && allowedCategoryIds.has(root.slug)) categoryId = root.slug;
			}
		}
		if (!categoryId) {
			for (const ttid of termRel.get(id) ?? []) {
				const t = byTaxId.get(ttid);
				if (!t || t.taxonomy !== 'product_cat') continue;
				const root = await rootTerm(ttid);
				if (root && allowedCategoryIds.has(root.slug)) {
					categoryId = root.slug;
					break;
				}
			}
		}
		if (!categoryId) continue; // no usable category — skip

		const price = Number(String(m._regular_price ?? m._price ?? '0').replace(/[^0-9.]/g, '')) || 0;

		// Unique slug fallback (some posts share slugs after sanitization)
		let slug = String(p.post_name || '').trim().toLowerCase();
		if (!slug) slug = `prod-${id}`;
		if (slugSeen.has(slug)) slug = `${slug}-${id}`;
		slugSeen.add(slug);

		const descVi = p.post_excerpt
			? stripTags(p.post_excerpt)
			: snippet(p.post_content, 320);

		out.push({
			id: slug,
			code: slug.toUpperCase().slice(0, 64),
			nameVi: p.post_title || slug,
			nameEn: p.post_title || slug,
			categoryId,
			price,
			imageUrl,
			tag: null,
			descVi: descVi || '—',
			descEn: null,
			createdAt: Math.floor(new Date(p.post_date).getTime() / 1000)
		});

		const donVi = String(m.don_vi ?? '').trim();
		if (donVi) {
			specs.push({ productId: slug, label: `Đơn vị: ${donVi}`, sortOrder: 0 });
		}
	}
	return { products: out, specs };
}

async function buildProjectsAndPosts(referencedImageIds, mediaQueue) {
	// Project categories: children of term 291 ("Khách Hàng Tiêu Biểu")
	const { byTaxId, byTermId } = await getTerms();
	const projectParentTermId = 291;
	const projectCats = [...byTaxId.values()].filter(
		(t) => t.taxonomy === 'category' && Number(t.parent) === projectParentTermId
	);
	const projectTaxIds = new Set(projectCats.map((t) => Number(t.term_taxonomy_id)));
	const taxIdToCatSlug = new Map(projectCats.map((t) => [Number(t.term_taxonomy_id), t.slug]));

	// Pull all posts; we'll partition into projects vs blog posts.
	const allPosts = await rowsOf(
		`SELECT id, post_name, post_title, post_content, post_excerpt, post_date
		 FROM wp_post WHERE post_type='post' AND post_status='publish' AND post_title IS NOT NULL AND post_title <> ''`
	);
	const termRel = await termsForObjects(new Set(allPosts.map((r) => Number(r.id))));
	const meta = await metaByPost(['_thumbnail_id', '_yoast_wpseo_primary_category']);
	const attByParent = await getAttachmentsByParent();
	const { postIdBySlug } = await getProductSuffixIndex();
	const attachmentMap = await getAttachmentMap();

	const projects = [];
	const posts = [];
	const projectProducts = []; // {projectId, productId}
	const projectSlugs = new Set();
	const postSlugs = new Set();
	const GALLERY_CAP = 20;

	for (const p of allPosts) {
		const id = Number(p.id);
		const m = meta.get(id) ?? {};
		const thumbId = Number(m._thumbnail_id ?? 0);
		const imageUrl = (await resolveImageUrl(thumbId)) ?? PLACEHOLDER_IMG;
		if (thumbId && imageUrl !== PLACEHOLDER_IMG) referencedImageIds.add(thumbId);

		const rels = termRel.get(id) ?? [];
		const projectTaxHit = rels.find((tt) => projectTaxIds.has(tt));

		let slug = String(p.post_name || '').trim().toLowerCase() || `post-${id}`;
		const ts = Math.floor(new Date(p.post_date).getTime() / 1000);
		const year = new Date(p.post_date).getFullYear();
		const excerpt = p.post_excerpt ? stripTags(p.post_excerpt) : snippet(p.post_content, 280);

		if (projectTaxHit) {
			if (projectSlugs.has(slug)) slug = `${slug}-${id}`;
			projectSlugs.add(slug);

			// Build gallery in layered order, deduped by canonical (size-suffix-
			// stripped) path so we never repeat the same photo at different sizes.
			const coverCanonical = isMediaUrl(imageUrl) ? unscalePath(imageUrl) : null;
			const seenCanonical = new Set(coverCanonical ? [coverCanonical] : []);
			const gallery = [];
			const pushLocal = (url) => {
				if (!isMediaUrl(url)) return;
				const canon = unscalePath(url);
				if (seenCanonical.has(canon)) return;
				seenCanonical.add(canon);
				gallery.push(url);
			};

			// Layer 1: attachments uploaded against this project (post_parent).
			for (const attId of attByParent.get(id) ?? []) {
				if (gallery.length >= GALLERY_CAP) break;
				const a = attachmentMap.get(attId);
				if (!a) continue;
				const before = gallery.length;
				pushLocal(uploadsUrl(a.localPath.replace(/^uploads\//, '')));
				if (gallery.length > before) referencedImageIds.add(attId);
			}

			// Layer 2: <img> tags inside the post body.
			for (const url of imageUrlsInHtml(p.post_content)) {
				if (gallery.length >= GALLERY_CAP) break;
				const rel = uploadsPathOf(url);
				if (!rel) continue;
				const before = gallery.length;
				pushLocal(uploadsUrl(rel));
				if (gallery.length > before) {
					mediaQueue.set(`uploads/${rel}`, `${PROD_BASE}/wp-content/uploads/${rel}`);
				}
			}

			// Layer 3: matched products' WooCommerce galleries.
			const productSlugs = await productSlugsInText(slug);
			for (const ps of productSlugs) {
				const productPostId = postIdBySlug.get(ps);
				if (!productPostId) continue;
				projectProducts.push({ projectId: slug, productSlug: ps });
				if (gallery.length >= GALLERY_CAP) continue;
				const gIds = await productGalleryAttachmentIds(productPostId);
				for (const gid of gIds) {
					if (gallery.length >= GALLERY_CAP) break;
					const a = attachmentMap.get(gid);
					if (!a) continue;
					const before = gallery.length;
					pushLocal(uploadsUrl(a.localPath.replace(/^uploads\//, '')));
					if (gallery.length > before) referencedImageIds.add(gid);
				}
			}

			projects.push({
				id: slug,
				nameVi: p.post_title,
				nameEn: p.post_title,
				categoryId: taxIdToCatSlug.get(projectTaxHit),
				year,
				area: '',
				location: '',
				imageUrl,
				summaryVi: excerpt || '—',
				summaryEn: null,
				gallery,
				createdAt: ts
			});
		} else {
			// Resolve a single category label (Vietnamese) for the post.
			let catLabel = 'Tin tức';
			const primaryTermId = Number(m._yoast_wpseo_primary_category ?? 0);
			if (primaryTermId) {
				const tax = byTermId.get(primaryTermId)?.get('category');
				if (tax) catLabel = tax.name;
			} else {
				const firstCatTt = rels.find((tt) => byTaxId.get(tt)?.taxonomy === 'category');
				if (firstCatTt) catLabel = byTaxId.get(firstCatTt).name;
			}
			if (postSlugs.has(slug)) slug = `${slug}-${id}`;
			postSlugs.add(slug);
			const isoDate = String(p.post_date).slice(0, 10);
			// Queue every uploads/ image referenced in the post body so
			// `{@html post.content}` resolves locally after URL rewrite.
			for (const url of imageUrlsInHtml(p.post_content)) {
				const rel = uploadsPathOf(url);
				if (!rel) continue;
				mediaQueue.set(`uploads/${rel}`, `${PROD_BASE}/wp-content/uploads/${rel}`);
			}
			const rewrittenContent = p.post_content
				? rewriteUploadsInHtml(p.post_content)
				: null;
			posts.push({
				id: slug,
				slug,
				titleVi: p.post_title,
				titleEn: p.post_title,
				category: catLabel,
				publishedAt: isoDate,
				imageUrl,
				excerptVi: excerpt || '—',
				excerptEn: null,
				contentVi: rewrittenContent,
				contentEn: null
			});
		}
	}

	const projectCategories = projectCats.map((t, i) => ({
		id: t.slug,
		nameVi: t.name.replace(/^Khách hàng iWood\s*/i, '').trim() || t.name,
		nameEn: t.name.replace(/^Khách hàng iWood\s*/i, '').trim() || t.name,
		sortOrder: i
	}));

	return { projects, posts, projectCategories, projectProducts };
}

// --- write to app db -------------------------------------------------------

async function wipeAndInsert({
	categories,
	products,
	specs,
	projectCategories,
	projects,
	posts,
	projectProducts
}) {
	console.log('Wiping app content tables...');
	// Use raw SQL so we don't need drizzle here; matches the order in seed.ts
	const wipe = [
		'DELETE FROM quote_item',
		'DELETE FROM quote',
		'DELETE FROM contact_message',
		'DELETE FROM newsletter_subscription',
		'DELETE FROM project_product',
		'DELETE FROM product_spec',
		'DELETE FROM project',
		'DELETE FROM project_category',
		'DELETE FROM product',
		'DELETE FROM category',
		'DELETE FROM post'
	];
	for (const sql of wipe) await app.execute(sql);

	console.log(`Inserting ${categories.length} categories...`);
	if (categories.length) {
		await app.batch(
			categories.map((c) => ({
				sql: `INSERT INTO category (id,name_vi,name_en,blurb,price_from,image_url,display_count,sort_order)
					VALUES (?,?,?,?,?,?,?,?)`,
				args: [c.id, c.nameVi, c.nameEn, c.blurb, c.priceFrom, c.imageUrl, c.displayCount, c.sortOrder]
			})),
			'write'
		);
	}

	console.log(`Inserting ${products.length} products...`);
	// chunked for libsql parameter limits
	const CHUNK = 200;
	for (let i = 0; i < products.length; i += CHUNK) {
		const slice = products.slice(i, i + CHUNK);
		await app.batch(
			slice.map((p) => ({
				sql: `INSERT INTO product (id,code,name_vi,name_en,category_id,price,image_url,tag,desc_vi,desc_en,created_at)
					VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
				args: [
					p.id,
					p.code,
					p.nameVi,
					p.nameEn,
					p.categoryId,
					p.price,
					p.imageUrl,
					p.tag,
					p.descVi,
					p.descEn,
					p.createdAt
				]
			})),
			'write'
		);
	}

	console.log(`Inserting ${specs.length} product specs...`);
	for (let i = 0; i < specs.length; i += CHUNK) {
		const slice = specs.slice(i, i + CHUNK);
		await app.batch(
			slice.map((s) => ({
				sql: `INSERT INTO product_spec (product_id,label,sort_order) VALUES (?,?,?)`,
				args: [s.productId, s.label, s.sortOrder]
			})),
			'write'
		);
	}

	console.log(`Inserting ${projectCategories.length} project categories...`);
	if (projectCategories.length) {
		await app.batch(
			projectCategories.map((c) => ({
				sql: `INSERT INTO project_category (id,name_vi,name_en,sort_order) VALUES (?,?,?,?)`,
				args: [c.id, c.nameVi, c.nameEn, c.sortOrder]
			})),
			'write'
		);
	}

	console.log(`Inserting ${projects.length} projects...`);
	for (let i = 0; i < projects.length; i += CHUNK) {
		const slice = projects.slice(i, i + CHUNK);
		await app.batch(
			slice.map((p) => ({
				sql: `INSERT INTO project (id,name_vi,name_en,category_id,year,area,location,image_url,summary_vi,summary_en,gallery,created_at)
					VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
				args: [
					p.id,
					p.nameVi,
					p.nameEn,
					p.categoryId,
					p.year,
					p.area,
					p.location,
					p.imageUrl,
					p.summaryVi,
					p.summaryEn,
					JSON.stringify(p.gallery ?? []),
					p.createdAt
				]
			})),
			'write'
		);
	}

	// Filter project_product links to ones whose product was actually inserted
	// (some matched products get skipped above when no usable category resolves).
	const productIdSet = new Set(products.map((p) => p.id));
	const projectIdSet = new Set(projects.map((p) => p.id));
	const seenLinkKey = new Set();
	const validLinks = [];
	for (const l of projectProducts) {
		if (!productIdSet.has(l.productSlug)) continue;
		if (!projectIdSet.has(l.projectId)) continue;
		const k = `${l.projectId}|${l.productSlug}`;
		if (seenLinkKey.has(k)) continue;
		seenLinkKey.add(k);
		validLinks.push(l);
	}
	console.log(`Inserting ${validLinks.length} project_product links...`);
	for (let i = 0; i < validLinks.length; i += CHUNK) {
		const slice = validLinks.slice(i, i + CHUNK);
		await app.batch(
			slice.map((l) => ({
				sql: `INSERT INTO project_product (project_id, product_id) VALUES (?, ?)`,
				args: [l.projectId, l.productSlug]
			})),
			'write'
		);
	}

	console.log(`Inserting ${posts.length} posts...`);
	for (let i = 0; i < posts.length; i += CHUNK) {
		const slice = posts.slice(i, i + CHUNK);
		await app.batch(
			slice.map((p) => ({
				sql: `INSERT INTO post (id,slug,title_vi,title_en,category,published_at,image_url,excerpt_vi,excerpt_en,content_vi,content_en)
					VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
				args: [
					p.id,
					p.slug,
					p.titleVi,
					p.titleEn,
					p.category,
					p.publishedAt,
					p.imageUrl,
					p.excerptVi,
					p.excerptEn,
					p.contentVi,
					p.contentEn
				]
			})),
			'write'
		);
	}
}

// --- main ------------------------------------------------------------------

console.log(`Source mirror: ${WP_MIRROR}`);
console.log(`Target app db: ${APP_DB_URL}`);
console.log(`Image static : ${UPLOAD_DIR}`);

const referencedImageIds = new Set();
const mediaQueue = new Map(); // localPath -> remoteUrl for body-embedded images
const categories = await buildCategories(referencedImageIds);
const categoryIds = new Set(categories.map((c) => c.id));
const { products, specs } = await buildProducts(referencedImageIds, categoryIds);
const { projects, posts, projectCategories, projectProducts } = await buildProjectsAndPosts(
	referencedImageIds,
	mediaQueue
);

const galleryTotal = projects.reduce((n, p) => n + p.gallery.length, 0);
const galleryAvg = projects.length ? (galleryTotal / projects.length).toFixed(1) : '0';
console.log(`\nPlanned:
  categories         ${categories.length}
  products           ${products.length}
  product specs      ${specs.length}
  project categories ${projectCategories.length}
  projects           ${projects.length}  (${galleryTotal} gallery images, avg ${galleryAvg})
  project↔product    ${projectProducts.length} candidate links
  posts              ${posts.length}
  cover images       ${referencedImageIds.size}
  body images        ${mediaQueue.size}
`);

const downloadFlag = process.argv.includes('--no-images') ? false : !USE_CDN;
if (USE_CDN) {
	console.log(`Skipping image downloads — MEDIA_BASE_URL set, assuming CDN at ${MEDIA_BASE_URL} is populated.`);
} else if (downloadFlag) {
	mkdirSync(UPLOAD_DIR, { recursive: true });
	await downloadImages(referencedImageIds, mediaQueue);

	// Some referenced images return 404 on prod (stale post body URLs). Drop
	// missing entries from project galleries so the UI doesn't render broken
	// <img>s. Cover images that 404 stay as-is — the browser will still load
	// from prod since we kept the path scheme.
	let droppedGallery = 0;
	for (const p of projects) {
		const kept = [];
		for (const g of p.gallery) {
			const local = g.startsWith('/') ? g.slice(1) : g; // "uploads/..."
			try {
				const st = await stat(join(STATIC_DIR, local));
				if (st.size > 0) kept.push(g);
				else droppedGallery++;
			} catch {
				droppedGallery++;
			}
		}
		p.gallery = kept;
	}
	if (droppedGallery)
		console.log(`Dropped ${droppedGallery} unavailable images from project galleries.`);
} else {
	console.log('Skipping image downloads (--no-images).');
}

await wipeAndInsert({
	categories,
	products,
	specs,
	projectCategories,
	projects,
	posts,
	projectProducts
});

console.log('\nDone.');
wp.close();
app.close();
