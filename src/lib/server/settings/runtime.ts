// Server-side site settings: DB persistence + in-memory cache + typed
// accessors. The shape of each setting is declared in ./registry.ts;
// this module is the runtime that backs it.
//
// Behavior:
//   - getSettings()      → resolves from cache, falls back to DB, fills
//                          missing keys from registry defaults.
//   - getPublicSettings() → only the keys with isPublic=true. Safe to send
//                          to the browser via +layout.server.ts.
//   - setSetting / setMany → persist + invalidate the cache.
//   - cssVariables()     → generates the inline CSS custom properties from
//                          the appearance + theme settings.

import { eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { siteSetting } from '../db/schema';
import {
	SETTING_DEFS,
	SETTING_DEF_BY_KEY,
	type SettingDef,
	type SettingValue
} from './registry';

export type { SettingValue } from './registry';

export type SettingsMap = Record<string, SettingValue>;

const TTL_MS = 60_000;

let cache: { map: SettingsMap; loadedAt: number } | null = null;
let pending: Promise<SettingsMap> | null = null;
let seedEnsured = false;

export function invalidateSettings(): void {
	cache = null;
}

export async function getSettings(): Promise<SettingsMap> {
	if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.map;
	if (pending) return pending;
	pending = loadSettings().finally(() => {
		pending = null;
	});
	return pending;
}

async function loadSettings(): Promise<SettingsMap> {
	const rows = await db.select().from(siteSetting);

	if (!seedEnsured) {
		await ensureSeedDefaults(rows.map((r) => r.key));
		seedEnsured = true;
	}

	const map: SettingsMap = {};
	for (const def of SETTING_DEFS) map[def.key] = def.default;
	for (const row of rows) {
		const def = SETTING_DEF_BY_KEY[row.key];
		if (!def) {
			map[row.key] = parseStored(row.value, 'string');
			continue;
		}
		map[def.key] = parseStored(row.value, defKind(def));
	}

	cache = { map, loadedAt: Date.now() };
	return map;
}

// On first run, write registry defaults as DB rows so admins can later
// inspect/edit them. Skips any keys that already have a row.
async function ensureSeedDefaults(existingKeys: string[]): Promise<void> {
	const existing = new Set(existingKeys);
	const missing = SETTING_DEFS.filter((d) => !existing.has(d.key));
	if (missing.length === 0) return;
	const now = new Date();
	await db.insert(siteSetting).values(
		missing.map((d) => ({
			key: d.key,
			group: d.group,
			value: serialize(d.default),
			isPublic: d.isPublic,
			updatedAt: now
		}))
	);
}

export async function getPublicSettings(): Promise<SettingsMap> {
	const all = await getSettings();
	const out: SettingsMap = {};
	for (const def of SETTING_DEFS) {
		if (def.isPublic) out[def.key] = all[def.key];
	}
	return out;
}

export async function getSetting<T extends SettingValue = SettingValue>(
	key: string
): Promise<T | undefined> {
	const all = await getSettings();
	return all[key] as T | undefined;
}

export async function setSetting(key: string, value: SettingValue): Promise<void> {
	const def = SETTING_DEF_BY_KEY[key];
	if (!def) throw new Error(`Unknown setting key: ${key}`);
	const now = new Date();
	const stored = serialize(value);
	const existing = await db
		.select({ key: siteSetting.key })
		.from(siteSetting)
		.where(eq(siteSetting.key, key));
	if (existing.length === 0) {
		await db.insert(siteSetting).values({
			key,
			group: def.group,
			value: stored,
			isPublic: def.isPublic,
			updatedAt: now
		});
	} else {
		await db
			.update(siteSetting)
			.set({ value: stored, group: def.group, isPublic: def.isPublic, updatedAt: now })
			.where(eq(siteSetting.key, key));
	}
	invalidateSettings();
}

export async function setMany(values: Record<string, SettingValue>): Promise<void> {
	const keys = Object.keys(values);
	if (keys.length === 0) return;
	const now = new Date();
	const existingRows = await db
		.select({ key: siteSetting.key })
		.from(siteSetting)
		.where(inArray(siteSetting.key, keys));
	const existing = new Set(existingRows.map((r) => r.key));

	for (const key of keys) {
		const def = SETTING_DEF_BY_KEY[key];
		if (!def) continue;
		const stored = serialize(values[key]);
		if (existing.has(key)) {
			await db
				.update(siteSetting)
				.set({ value: stored, group: def.group, isPublic: def.isPublic, updatedAt: now })
				.where(eq(siteSetting.key, key));
		} else {
			await db.insert(siteSetting).values({
				key,
				group: def.group,
				value: stored,
				isPublic: def.isPublic,
				updatedAt: now
			});
		}
	}
	invalidateSettings();
}

// --- Serialization helpers ------------------------------------------------

function serialize(value: SettingValue): string {
	if (typeof value === 'boolean') return value ? '1' : '0';
	return String(value);
}

type DefKind = 'string' | 'number' | 'boolean';

function defKind(def: SettingDef): DefKind {
	if (def.type === 'toggle') return 'boolean';
	if (def.type === 'number') return 'number';
	return 'string';
}

function parseStored(raw: string, kind: DefKind): SettingValue {
	if (kind === 'boolean') return raw === '1' || raw === 'true';
	if (kind === 'number') {
		const n = Number(raw);
		return Number.isFinite(n) ? n : 0;
	}
	return raw;
}

// --- Field-level validation + parsing for admin form posts ---------------

export type FieldParseResult =
	| { ok: true; value: SettingValue }
	| { ok: false; error: string };

export function parseAndValidate(def: SettingDef, raw: FormDataEntryValue | null): FieldParseResult {
	if (def.type === 'toggle') {
		// HTML form: checkbox sends "1" when checked, missing when unchecked.
		const checked = raw === '1' || raw === 'on' || raw === 'true';
		return { ok: true, value: checked };
	}
	const str = (raw ?? '').toString().trim();
	if (def.type === 'number') {
		if (str === '') return { ok: true, value: def.default };
		const n = Number(str);
		if (!Number.isFinite(n)) return { ok: false, error: 'Must be a number' };
		if (def.min !== undefined && n < def.min) return { ok: false, error: `Must be ≥ ${def.min}` };
		if (def.max !== undefined && n > def.max) return { ok: false, error: `Must be ≤ ${def.max}` };
		return { ok: true, value: n };
	}
	if (def.type === 'select') {
		if (str === '') return { ok: true, value: def.default };
		const allowed = def.options.some((o) => o.value === str);
		if (!allowed) return { ok: false, error: 'Not a valid option' };
		return { ok: true, value: str };
	}
	if (def.validate) {
		const err = def.validate(str);
		if (err) return { ok: false, error: err };
	}
	return { ok: true, value: str };
}

// --- CSS variables generated from public appearance/theme settings -------

const RADIUS_PRESETS: Record<string, { sm: string; md: string; lg: string }> = {
	sharp: { sm: '4px', md: '8px', lg: '12px' },
	round: { sm: '8px', md: '14px', lg: '20px' },
	soft: { sm: '14px', md: '22px', lg: '32px' }
};

export function cssVariables(settings: SettingsMap): string {
	const lines: string[] = [];
	const accent = String(settings['appearance.primary_color'] ?? '');
	const accentHover = String(settings['appearance.primary_color_hover'] ?? '');
	const ink = String(settings['appearance.ink_color'] ?? '');
	const paper = String(settings['appearance.paper_color'] ?? '');
	const bone = String(settings['appearance.bone_color'] ?? '');
	const bodyFont = String(settings['theme.font_body'] ?? '');
	const headingFont = String(settings['theme.font_heading'] ?? '');
	const radius = String(settings['theme.radius'] ?? 'sharp');

	if (accent) lines.push(`--accent:${accent};`, `--iwood-red:${accent};`, `--danger:${accent};`);
	if (accentHover) lines.push(`--accent-hover:${accentHover};`, `--iwood-red-deep:${accentHover};`);
	if (ink) lines.push(`--ink:${ink};`, `--fg-1:${ink};`, `--border-strong:${ink};`, `--bg-dark:${ink};`);
	if (paper) lines.push(`--paper:${paper};`, `--bg:${paper};`, `--fg-on-red:${paper};`, `--fg-on-dark:${paper};`);
	if (bone) lines.push(`--bone:${bone};`, `--bg-alt:${bone};`);
	if (bodyFont) lines.push(`--font-body:'${bodyFont}', 'Inter', system-ui, sans-serif;`);
	if (headingFont) lines.push(`--font-display:'${headingFont}', 'Be Vietnam Pro', system-ui, sans-serif;`);
	const r = RADIUS_PRESETS[radius] ?? RADIUS_PRESETS.sharp;
	lines.push(`--radius-sm:${r.sm};`, `--radius-md:${r.md};`, `--radius-lg:${r.lg};`);
	return `:root{${lines.join('')}}`;
}

// --- Web font preload URL (only Google Fonts; non-Google falls back to OS) -

const GOOGLE_FONT_FAMILIES = new Set([
	'Be Vietnam Pro',
	'Barlow Condensed',
	'Barlow',
	'Oswald',
	'Bebas Neue',
	'Inter',
	'Roboto',
	'Roboto Condensed',
	'Source Sans 3',
	'IBM Plex Sans'
]);

export function googleFontsHref(settings: SettingsMap): string | null {
	const fams = new Set<string>();
	const body = String(settings['theme.font_body'] ?? '');
	const head = String(settings['theme.font_heading'] ?? '');
	if (body && GOOGLE_FONT_FAMILIES.has(body)) fams.add(body);
	if (head && GOOGLE_FONT_FAMILIES.has(head)) fams.add(head);
	if (fams.size === 0) return null;
	const families = [...fams]
		.map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`)
		.join('&');
	return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
