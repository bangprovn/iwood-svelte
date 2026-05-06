import { asc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { appLocale, appTranslation, appTranslationKey } from '../db/schema';
import { setKnownLocales } from '$lib/i18n/url';
import type { LocaleRow } from '$lib/i18n';
import seedJson from './seed.json';

type SeedRow = { key: string; vi: string; en?: string; description?: string };
const SEED: SeedRow[] = seedJson as SeedRow[];

export type I18nSnapshot = {
	locales: LocaleRow[];
	defaultLocale: string;
	dict: Record<string, Record<string, string>>;
	loadedAt: number;
};

let snapshot: I18nSnapshot | null = null;
const TTL_MS = 60_000;
let pending: Promise<I18nSnapshot> | null = null;
let seedEnsured = false;

export async function getI18nSnapshot(): Promise<I18nSnapshot> {
	if (snapshot && Date.now() - snapshot.loadedAt < TTL_MS) return snapshot;
	if (pending) return pending;
	pending = loadSnapshot().finally(() => {
		pending = null;
	});
	return pending;
}

export function invalidateI18n(): void {
	snapshot = null;
}

async function loadSnapshot(): Promise<I18nSnapshot> {
	const localeRows = await db.select().from(appLocale).orderBy(asc(appLocale.sortOrder));

	if (localeRows.length === 0) {
		await bootstrapDefaults();
		return loadSnapshot();
	}

	if (!seedEnsured) {
		await ensureSeedKeys();
		seedEnsured = true;
	}

	const translationRows = await db
		.select({
			key: appTranslation.key,
			locale: appTranslation.locale,
			value: appTranslation.value
		})
		.from(appTranslation);

	const activeLocales = localeRows
		.filter((l) => l.isActive)
		.map<LocaleRow>((l) => ({
			code: l.code,
			label: l.label,
			dir: l.dir === 'rtl' ? 'rtl' : 'ltr',
			isActive: l.isActive,
			isDefault: l.isDefault,
			sortOrder: l.sortOrder
		}));

	const defaultLocale = localeRows.find((l) => l.isDefault)?.code ?? activeLocales[0]?.code ?? 'en';

	const dict: Record<string, Record<string, string>> = {};
	for (const l of localeRows) dict[l.code] = {};
	for (const row of translationRows) {
		(dict[row.locale] ??= {})[row.key] = row.value;
	}

	const next: I18nSnapshot = {
		locales: activeLocales,
		defaultLocale,
		dict,
		loadedAt: Date.now()
	};

	setKnownLocales(activeLocales.map((l) => l.code));
	snapshot = next;
	return next;
}

// First-run bootstrap: vi (default, no URL prefix) + en (secondary). Seeds the
// pilot Header/Footer/homepage keys with their existing Vietnamese copy. The
// `en` locale stays empty so missing keys fall back through the default-locale
// dict — admins fill English values via /admin/translations.
async function bootstrapDefaults(): Promise<void> {
	await db.insert(appLocale).values([
		{
			code: 'vi',
			label: 'Tiếng Việt',
			dir: 'ltr',
			isActive: true,
			isDefault: true,
			sortOrder: 0
		},
		{
			code: 'en',
			label: 'English',
			dir: 'ltr',
			isActive: true,
			isDefault: false,
			sortOrder: 1
		}
	]);

	await db
		.insert(appTranslationKey)
		.values(SEED.map((s) => ({ key: s.key, description: s.description ?? null })));
	await db
		.insert(appTranslation)
		.values(SEED.map((s) => ({ key: s.key, locale: 'vi', value: s.vi })));
	await db
		.insert(appTranslation)
		.values(
			SEED.filter((s) => s.en !== undefined && s.en !== '').map((s) => ({
				key: s.key,
				locale: 'en',
				value: s.en!
			}))
		);
}

// Idempotently inserts seed keys + their default vi/en values for any keys
// the DB does not yet have. Runs once per process. Existing values are never
// overwritten — admin-edited copy in the DB always wins.
async function ensureSeedKeys(): Promise<void> {
	if (SEED.length === 0) return;
	const seedKeys = SEED.map((s) => s.key);
	const existingKeyRows = await db
		.select({ key: appTranslationKey.key })
		.from(appTranslationKey)
		.where(inArray(appTranslationKey.key, seedKeys));
	const existingKeys = new Set(existingKeyRows.map((r) => r.key));
	const missingKeys = SEED.filter((s) => !existingKeys.has(s.key));

	if (missingKeys.length > 0) {
		await db
			.insert(appTranslationKey)
			.values(missingKeys.map((s) => ({ key: s.key, description: s.description ?? null })));
	}

	// Find which (key, locale) pairs already have a value, so we never overwrite.
	const existingValueRows = await db
		.select({ key: appTranslation.key, locale: appTranslation.locale })
		.from(appTranslation)
		.where(inArray(appTranslation.key, seedKeys));
	const existingValuePairs = new Set(existingValueRows.map((r) => `${r.key}::${r.locale}`));

	const viInserts = SEED.filter((s) => !existingValuePairs.has(`${s.key}::vi`)).map((s) => ({
		key: s.key,
		locale: 'vi',
		value: s.vi
	}));
	const enInserts = SEED.filter(
		(s) => s.en !== undefined && s.en !== '' && !existingValuePairs.has(`${s.key}::en`)
	).map((s) => ({ key: s.key, locale: 'en', value: s.en! }));

	if (viInserts.length > 0) await db.insert(appTranslation).values(viInserts);
	if (enInserts.length > 0) await db.insert(appTranslation).values(enInserts);
}

export function buildMessagesForLocale(snap: I18nSnapshot, locale: string): Record<string, string> {
	const fallback = snap.dict[snap.defaultLocale] ?? {};
	const active = snap.dict[locale] ?? {};
	return { ...fallback, ...active };
}
