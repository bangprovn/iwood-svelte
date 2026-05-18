// Mirrors the subset of the iwood.com.vn WordPress database we need into a
// local SQLite file at dumps/wp.sqlite. Pulls rows from the running MariaDB
// container over SSH and streams them in as newline-delimited JSON.
//
// Run:  node scripts/wp-mirror.mjs
//
// Connection settings come from env. Falls back to the values we already
// discovered for the iwood production server when unset, so a bare invocation
// works for the canonical setup.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const DUMPS = resolve(ROOT, 'dumps');
const MIRROR = resolve(DUMPS, 'wp.sqlite');

const cfg = {
	sshHost: process.env.WP_SSH_HOST ?? 'root@95.216.173.25',
	sshKey: process.env.WP_SSH_KEY ?? '/Users/bangprovn/Downloads/whale-privatekey',
	sshPassphrase: process.env.WP_SSH_PASSPHRASE ?? '82vs$P6zuUb5%yi9qJ&',
	container: process.env.WP_DB_CONTAINER ?? 'mariadb-vkksc408w8c4ogcsck88o4wc',
	dbUser: process.env.WP_DB_USER ?? 'root',
	dbPassword: process.env.WP_DB_PASSWORD ?? 'Sm4OKJO0o6kdkYHIeiCjNAp9UUvuMUd8',
	dbName: process.env.WP_DB_NAME ?? 'wordpress'
};

mkdirSync(DUMPS, { recursive: true });

// --- ssh-agent: load key once so subsequent ssh invocations are passwordless ---

let agentPid = 0;
function startAgent() {
	const out = execFileSync('ssh-agent', ['-s'], { encoding: 'utf8' });
	const sock = /SSH_AUTH_SOCK=([^;]+);/.exec(out)?.[1];
	const pid = /SSH_AGENT_PID=([^;]+);/.exec(out)?.[1];
	if (!sock || !pid) throw new Error('ssh-agent did not return socket/pid');
	process.env.SSH_AUTH_SOCK = sock;
	agentPid = Number(pid);
	// Escape for Tcl/expect double-quoted strings: \, ", $, [ all special.
	const escapedPass = cfg.sshPassphrase
		.replaceAll('\\', '\\\\')
		.replaceAll('"', '\\"')
		.replaceAll('$', '\\$')
		.replaceAll('[', '\\[');
	const script = `set timeout 30
spawn ssh-add ${cfg.sshKey}
expect {
  "passphrase" { send "${escapedPass}\\r"; exp_continue }
  eof
}`;
	execFileSync('expect', ['-c', script], { stdio: 'inherit' });
}

function stopAgent() {
	if (!agentPid) return;
	try {
		process.kill(agentPid);
	} catch {
		// ignore
	}
}

process.on('exit', stopAgent);
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

// --- streaming runner: ssh -> docker exec -> mariadb -> stdout (NDJSON) ----

function runQueryNDJSON(sql, onLine) {
	const remoteCmd = [
		'docker exec -i',
		cfg.container,
		'mariadb',
		'-u',
		cfg.dbUser,
		`-p${cfg.dbPassword}`,
		'--batch',
		'--raw',
		'--skip-column-names',
		cfg.dbName,
		'-e',
		`"${sql.replaceAll('"', '\\"')}"`
	].join(' ');
	return new Promise((resolveP, rejectP) => {
		const proc = spawn(
			'ssh',
			[
				'-o',
				'StrictHostKeyChecking=no',
				'-o',
				'BatchMode=yes',
				'-i',
				cfg.sshKey,
				cfg.sshHost,
				remoteCmd
			],
			{ stdio: ['ignore', 'pipe', 'pipe'] }
		);
		let buf = '';
		let stderr = '';
		let rowCount = 0;
		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', (chunk) => {
			buf += chunk;
			let nl;
			while ((nl = buf.indexOf('\n')) !== -1) {
				const line = buf.slice(0, nl);
				buf = buf.slice(nl + 1);
				if (line.length === 0) continue;
				try {
					onLine(JSON.parse(line));
					rowCount++;
				} catch (err) {
					rejectP(new Error(`JSON parse failed at row ${rowCount}: ${err.message}\nLine: ${line.slice(0, 200)}`));
					proc.kill();
					return;
				}
			}
		});
		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', (chunk) => {
			stderr += chunk;
		});
		proc.on('error', rejectP);
		proc.on('close', (code) => {
			if (buf.trim().length > 0) {
				try {
					onLine(JSON.parse(buf));
					rowCount++;
				} catch (err) {
					rejectP(new Error(`Trailing JSON parse failed: ${err.message}\nLine: ${buf.slice(0, 200)}`));
					return;
				}
			}
			if (code === 0) resolveP(rowCount);
			else rejectP(new Error(`mariadb exited ${code}\n${stderr}`));
		});
	});
}

// --- Local SQLite mirror -----------------------------------------------------

if (existsSync(MIRROR)) unlinkSync(MIRROR);
const db = createClient({ url: `file:${MIRROR}` });

async function exec(sql) {
	await db.execute(sql);
}
async function batchExec(stmts) {
	if (!stmts.length) return;
	await db.batch(stmts, 'write');
}

// Streams rows from `runQueryNDJSON` into `tableName` via a serialized flush
// queue. We splice fixed-size chunks off the in-memory buffer so each chunk is
// inserted exactly once even when stdout data arrives while a flush is in
// flight.
async function streamInto({ sql, table, batchSize, insertSql, rowToArgs, label }) {
	const buf = [];
	let chain = Promise.resolve();
	let totalQueued = 0;
	let error = null;

	const enqueueFlush = (chunk) => {
		chain = chain
			.then(() =>
				batchExec(chunk.map((r) => ({ sql: insertSql, args: rowToArgs(r) })))
			)
			.catch((err) => {
				if (!error) error = err;
			});
	};

	const drain = () => {
		while (!error && buf.length >= batchSize) {
			enqueueFlush(buf.splice(0, batchSize));
		}
	};

	const rowCount = await runQueryNDJSON(sql, (row) => {
		if (error) return;
		buf.push(row);
		totalQueued++;
		if (totalQueued % 2000 === 0) process.stdout.write(`  ${label}: ${totalQueued}...\r`);
		drain();
	});

	if (buf.length) enqueueFlush(buf.splice(0));
	await chain;
	if (error) throw error;
	console.log(`${label.padEnd(15)} ${rowCount} rows`.padEnd(40));
}

// --- Steps -------------------------------------------------------------------

async function mirrorTerms() {
	await exec(`CREATE TABLE wp_term (
		term_taxonomy_id INTEGER PRIMARY KEY,
		term_id INTEGER,
		name TEXT,
		slug TEXT,
		taxonomy TEXT,
		parent INTEGER,
		count INTEGER,
		description TEXT
	)`);
	await exec(`CREATE INDEX wp_term_tax_idx ON wp_term(taxonomy)`);
	await exec(`CREATE INDEX wp_term_parent_idx ON wp_term(parent)`);
	await exec(`CREATE INDEX wp_term_termid_idx ON wp_term(term_id)`);

	await streamInto({
		label: 'wp_term',
		batchSize: 200,
		sql: `SELECT JSON_OBJECT(
			'term_taxonomy_id', tt.term_taxonomy_id,
			'term_id', t.term_id,
			'name', t.name,
			'slug', t.slug,
			'taxonomy', tt.taxonomy,
			'parent', tt.parent,
			'count', tt.count,
			'description', tt.description
		) FROM wp_terms t JOIN wp_term_taxonomy tt ON t.term_id=tt.term_id
		WHERE tt.taxonomy IN ('product_cat','category','product_tag','post_tag')`,
		insertSql: `INSERT INTO wp_term (term_taxonomy_id,term_id,name,slug,taxonomy,parent,count,description) VALUES (?,?,?,?,?,?,?,?)`,
		rowToArgs: (r) => [
			r.term_taxonomy_id,
			r.term_id,
			r.name,
			r.slug,
			r.taxonomy,
			r.parent ?? 0,
			r.count ?? 0,
			r.description ?? ''
		]
	});
}

async function mirrorTermMeta() {
	await exec(`CREATE TABLE wp_termmeta (
		term_id INTEGER,
		meta_key TEXT,
		meta_value TEXT
	)`);
	await exec(`CREATE INDEX wp_termmeta_idx ON wp_termmeta(term_id, meta_key)`);

	await streamInto({
		label: 'wp_termmeta',
		batchSize: 500,
		sql: `SELECT JSON_OBJECT('term_id', term_id, 'meta_key', meta_key, 'meta_value', meta_value)
			FROM wp_termmeta WHERE meta_key IN ('thumbnail_id','order','display_type','product_count_product_cat')`,
		insertSql: `INSERT INTO wp_termmeta VALUES (?,?,?)`,
		rowToArgs: (r) => [r.term_id, r.meta_key, r.meta_value]
	});
}

async function mirrorTermRelationships() {
	await exec(`CREATE TABLE wp_term_rel (
		object_id INTEGER,
		term_taxonomy_id INTEGER,
		term_order INTEGER
	)`);
	await exec(`CREATE INDEX wp_term_rel_obj_idx ON wp_term_rel(object_id)`);
	await exec(`CREATE INDEX wp_term_rel_tt_idx ON wp_term_rel(term_taxonomy_id)`);

	await streamInto({
		label: 'wp_term_rel',
		batchSize: 1000,
		sql: `SELECT JSON_OBJECT('object_id', object_id, 'term_taxonomy_id', term_taxonomy_id, 'term_order', term_order)
			FROM wp_term_relationships`,
		insertSql: `INSERT INTO wp_term_rel VALUES (?,?,?)`,
		rowToArgs: (r) => [r.object_id, r.term_taxonomy_id, r.term_order ?? 0]
	});
}

async function mirrorPosts() {
	await exec(`CREATE TABLE wp_post (
		id INTEGER PRIMARY KEY,
		post_date TEXT,
		post_content TEXT,
		post_title TEXT,
		post_excerpt TEXT,
		post_status TEXT,
		post_name TEXT,
		post_parent INTEGER,
		guid TEXT,
		menu_order INTEGER,
		post_type TEXT,
		post_mime_type TEXT
	)`);
	await exec(`CREATE INDEX wp_post_type_status_idx ON wp_post(post_type, post_status)`);
	await exec(`CREATE INDEX wp_post_slug_idx ON wp_post(post_name)`);

	await streamInto({
		label: 'wp_post',
		batchSize: 100,
		sql: `SELECT JSON_OBJECT(
			'id', ID,
			'post_date', DATE_FORMAT(post_date, '%Y-%m-%dT%H:%i:%s'),
			'post_content', post_content,
			'post_title', post_title,
			'post_excerpt', post_excerpt,
			'post_status', post_status,
			'post_name', post_name,
			'post_parent', post_parent,
			'guid', guid,
			'menu_order', menu_order,
			'post_type', post_type,
			'post_mime_type', post_mime_type
		) FROM wp_posts
		WHERE (post_type IN ('product','post','page') AND post_status='publish')
		   OR (post_type='attachment' AND post_status='inherit')`,
		insertSql: `INSERT INTO wp_post VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		rowToArgs: (r) => [
			r.id,
			r.post_date,
			r.post_content ?? '',
			r.post_title ?? '',
			r.post_excerpt ?? '',
			r.post_status,
			r.post_name ?? '',
			r.post_parent ?? 0,
			r.guid ?? '',
			r.menu_order ?? 0,
			r.post_type,
			r.post_mime_type ?? ''
		]
	});
}

async function mirrorPostMeta() {
	await exec(`CREATE TABLE wp_postmeta (
		post_id INTEGER,
		meta_key TEXT,
		meta_value TEXT
	)`);
	await exec(`CREATE INDEX wp_postmeta_idx ON wp_postmeta(post_id, meta_key)`);

	const keys = [
		'_thumbnail_id',
		'_price',
		'_regular_price',
		'_sale_price',
		'_sku',
		'_stock_status',
		'_product_image_gallery',
		'_wp_attached_file',
		'_wp_attachment_metadata',
		'don_vi',
		'yikes_woo_products_tabs',
		'_yoast_wpseo_primary_category',
		'_yoast_wpseo_primary_product_cat'
	];
	const keysSql = keys.map((k) => `'${k}'`).join(',');
	await streamInto({
		label: 'wp_postmeta',
		batchSize: 500,
		sql: `SELECT JSON_OBJECT('post_id', post_id, 'meta_key', meta_key, 'meta_value', meta_value)
			FROM wp_postmeta WHERE meta_key IN (${keysSql})`,
		insertSql: `INSERT INTO wp_postmeta VALUES (?,?,?)`,
		rowToArgs: (r) => [r.post_id, r.meta_key, r.meta_value]
	});
}

async function mirrorOptions() {
	await exec(`CREATE TABLE wp_option (
		option_name TEXT PRIMARY KEY,
		option_value TEXT
	)`);
	await streamInto({
		label: 'wp_option',
		batchSize: 20,
		sql: `SELECT JSON_OBJECT('option_name', option_name, 'option_value', option_value)
			FROM wp_options WHERE option_name IN ('siteurl','home','blogname','blogdescription','upload_path','upload_url_path')`,
		insertSql: `INSERT INTO wp_option VALUES (?,?)`,
		rowToArgs: (r) => [r.option_name, r.option_value]
	});
}

// --- Main --------------------------------------------------------------------

console.log(`Mirroring iwood WordPress -> ${MIRROR}`);
console.log('Starting ssh-agent...');
startAgent();

try {
	await mirrorOptions();
	await mirrorTerms();
	await mirrorTermMeta();
	await mirrorTermRelationships();
	await mirrorPosts();
	await mirrorPostMeta();

	// Summary
	const summary = await db.execute(`SELECT 'wp_post (by type)' tag, post_type k, COUNT(*) c FROM wp_post GROUP BY post_type
		UNION ALL SELECT 'wp_term (by tax)', taxonomy, COUNT(*) FROM wp_term GROUP BY taxonomy
		UNION ALL SELECT 'wp_postmeta', meta_key, COUNT(*) FROM wp_postmeta GROUP BY meta_key`);
	console.log('\nSummary:');
	for (const row of summary.rows) {
		console.log(`  ${row.tag.padEnd(20)} ${String(row.k).padEnd(40)} ${row.c}`);
	}
} finally {
	db.close();
}

console.log('\nDone.');
