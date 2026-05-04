// Admin write surface for i18n. Every function here assumes the caller has
// already passed `requireAdmin`. Each write invalidates the in-memory cache.

import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { db } from './db';
import { appLocale, appTranslation, appTranslationKey } from './db/schema';
import { invalidateI18n } from './translations';

const LOCALE_CODE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;
const KEY_RE = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

export type LocaleWriteInput = {
	code: string;
	label: string;
	dir: 'ltr' | 'rtl';
	isActive: boolean;
	isDefault: boolean;
	sortOrder: number;
};

export type TranslationKeyInput = {
	key: string;
	description?: string | null;
};

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

export async function listLocales() {
	return db.select().from(appLocale).orderBy(asc(appLocale.sortOrder), asc(appLocale.code));
}

export async function getLocale(code: string) {
	const [row] = await db.select().from(appLocale).where(eq(appLocale.code, code));
	return row ?? null;
}

export function validateLocaleCode(code: string): string | null {
	if (!code) return 'Required';
	if (!LOCALE_CODE_RE.test(code)) return 'Use BCP-47 form, e.g. "en", "vi", "zh-Hans"';
	return null;
}

export async function createLocale(input: LocaleWriteInput): Promise<void> {
	if (validateLocaleCode(input.code)) throw new Error('Invalid locale code');
	if (!input.label.trim()) throw new Error('Label is required');

	await db.transaction(async (tx) => {
		if (input.isDefault) {
			await tx.update(appLocale).set({ isDefault: false });
		}
		await tx.insert(appLocale).values({
			code: input.code,
			label: input.label,
			dir: input.dir,
			isActive: input.isDefault ? true : input.isActive,
			isDefault: input.isDefault,
			sortOrder: input.sortOrder
		});
	});
	invalidateI18n();
}

export async function updateLocale(code: string, input: LocaleWriteInput): Promise<void> {
	if (validateLocaleCode(input.code)) throw new Error('Invalid locale code');
	if (!input.label.trim()) throw new Error('Label is required');

	await db.transaction(async (tx) => {
		const [current] = await tx.select().from(appLocale).where(eq(appLocale.code, code));
		if (!current) throw new Error('Locale not found');

		if (current.isDefault && !input.isDefault) {
			throw new Error('Cannot unset default — set another locale as default first');
		}
		if (current.isDefault && !input.isActive) {
			throw new Error('Default locale must remain active');
		}

		if (input.isDefault && !current.isDefault) {
			await tx.update(appLocale).set({ isDefault: false });
		}

		await tx
			.update(appLocale)
			.set({
				code: input.code,
				label: input.label,
				dir: input.dir,
				isActive: input.isDefault ? true : input.isActive,
				isDefault: input.isDefault,
				sortOrder: input.sortOrder
			})
			.where(eq(appLocale.code, code));
	});
	invalidateI18n();
}

export async function setDefaultLocale(code: string): Promise<void> {
	await db.transaction(async (tx) => {
		const [target] = await tx.select().from(appLocale).where(eq(appLocale.code, code));
		if (!target) throw new Error('Locale not found');
		await tx.update(appLocale).set({ isDefault: false });
		await tx
			.update(appLocale)
			.set({ isDefault: true, isActive: true })
			.where(eq(appLocale.code, code));
	});
	invalidateI18n();
}

export async function deleteLocale(code: string): Promise<void> {
	const [row] = await db.select().from(appLocale).where(eq(appLocale.code, code));
	if (!row) return;
	if (row.isDefault) throw new Error('Cannot delete the default locale');
	await db.delete(appLocale).where(eq(appLocale.code, code));
	invalidateI18n();
}

// ---------------------------------------------------------------------------
// Translation keys + values
// ---------------------------------------------------------------------------

export function validateKey(key: string): string | null {
	if (!key) return 'Required';
	if (key.length > 200) return 'Too long';
	if (!KEY_RE.test(key)) return 'Use letters, numbers, dots, dashes, underscores';
	return null;
}

export type TranslationListRow = {
	key: string;
	description: string | null;
	values: Record<string, string>;
};

export async function listTranslationKeys(opts: {
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<{ rows: TranslationListRow[]; total: number }> {
	const search = opts.search?.trim() ?? '';
	const limit = Math.max(1, Math.min(opts.limit ?? 50, 500));
	const offset = Math.max(0, opts.offset ?? 0);

	const where = search
		? or(
				like(appTranslationKey.key, `%${search}%`),
				like(appTranslationKey.description, `%${search}%`)
			)
		: undefined;

	const [keysRows, [{ total }]] = await Promise.all([
		db
			.select()
			.from(appTranslationKey)
			.where(where as never)
			.orderBy(asc(appTranslationKey.key))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(appTranslationKey)
			.where(where as never)
	]);

	if (keysRows.length === 0) return { rows: [], total: Number(total) };

	const keys = keysRows.map((r) => r.key);
	const valueRows = await db
		.select({
			key: appTranslation.key,
			locale: appTranslation.locale,
			value: appTranslation.value
		})
		.from(appTranslation)
		.where(or(...keys.map((k) => eq(appTranslation.key, k))) as never);

	const valuesByKey = new Map<string, Record<string, string>>();
	for (const r of valueRows) {
		const bag = valuesByKey.get(r.key) ?? {};
		bag[r.locale] = r.value;
		valuesByKey.set(r.key, bag);
	}

	return {
		rows: keysRows.map((r) => ({
			key: r.key,
			description: r.description,
			values: valuesByKey.get(r.key) ?? {}
		})),
		total: Number(total)
	};
}

export async function getTranslationKey(key: string) {
	const [row] = await db.select().from(appTranslationKey).where(eq(appTranslationKey.key, key));
	if (!row) return null;
	const values = await db
		.select({ locale: appTranslation.locale, value: appTranslation.value })
		.from(appTranslation)
		.where(eq(appTranslation.key, key));
	const valuesByLocale: Record<string, string> = {};
	for (const v of values) valuesByLocale[v.locale] = v.value;
	return { key: row.key, description: row.description, values: valuesByLocale };
}

export async function createTranslationKey(input: TranslationKeyInput): Promise<void> {
	if (validateKey(input.key)) throw new Error('Invalid key');
	await db.insert(appTranslationKey).values({
		key: input.key,
		description: input.description ?? null
	});
	invalidateI18n();
}

export async function updateTranslationKeyMeta(
	key: string,
	input: { description: string | null }
): Promise<void> {
	await db
		.update(appTranslationKey)
		.set({ description: input.description })
		.where(eq(appTranslationKey.key, key));
	invalidateI18n();
}

export async function renameTranslationKey(oldKey: string, newKey: string): Promise<void> {
	if (validateKey(newKey)) throw new Error('Invalid key');
	if (oldKey === newKey) return;
	const [exists] = await db
		.select({ key: appTranslationKey.key })
		.from(appTranslationKey)
		.where(eq(appTranslationKey.key, newKey));
	if (exists) throw new Error('A key with that name already exists');
	// FK is ON UPDATE CASCADE, so updating the parent row updates child rows too.
	await db.update(appTranslationKey).set({ key: newKey }).where(eq(appTranslationKey.key, oldKey));
	invalidateI18n();
}

export async function deleteTranslationKey(key: string): Promise<void> {
	await db.delete(appTranslationKey).where(eq(appTranslationKey.key, key));
	invalidateI18n();
}

/**
 * Replace all per-locale values for a key. An empty string deletes the row
 * (so the locale falls back to the default-locale value).
 */
export async function setTranslationValues(
	key: string,
	values: Record<string, string>
): Promise<void> {
	await db.transaction(async (tx) => {
		const [exists] = await tx
			.select({ key: appTranslationKey.key })
			.from(appTranslationKey)
			.where(eq(appTranslationKey.key, key));
		if (!exists) throw new Error('Key not found');

		const locales = await tx.select({ code: appLocale.code }).from(appLocale);
		const validCodes = new Set(locales.map((l) => l.code));

		for (const [locale, raw] of Object.entries(values)) {
			if (!validCodes.has(locale)) continue;
			const value = raw.trim();
			if (value === '') {
				await tx
					.delete(appTranslation)
					.where(and(eq(appTranslation.key, key), eq(appTranslation.locale, locale)));
				continue;
			}
			await tx
				.insert(appTranslation)
				.values({ key, locale, value })
				.onConflictDoUpdate({
					target: [appTranslation.key, appTranslation.locale],
					set: { value, updatedAt: new Date() }
				});
		}
	});
	invalidateI18n();
}

// ---------------------------------------------------------------------------
// Bulk import / export
// ---------------------------------------------------------------------------

export async function exportLocaleDictionary(locale: string): Promise<Record<string, string>> {
	const rows = await db
		.select({ key: appTranslation.key, value: appTranslation.value })
		.from(appTranslation)
		.where(eq(appTranslation.locale, locale))
		.orderBy(asc(appTranslation.key));
	const out: Record<string, string> = {};
	for (const r of rows) out[r.key] = r.value;
	return out;
}

export type ImportResult = {
	inserted: number;
	updated: number;
	deleted: number;
	skipped: number;
	keysCreated: number;
};

export async function importLocaleDictionary(
	locale: string,
	dict: Record<string, string>,
	mode: 'merge' | 'replace'
): Promise<ImportResult> {
	const result: ImportResult = {
		inserted: 0,
		updated: 0,
		deleted: 0,
		skipped: 0,
		keysCreated: 0
	};

	await db.transaction(async (tx) => {
		const [localeRow] = await tx.select().from(appLocale).where(eq(appLocale.code, locale));
		if (!localeRow) throw new Error(`Locale "${locale}" does not exist`);

		const existingKeys = new Set(
			(await tx.select({ key: appTranslationKey.key }).from(appTranslationKey)).map((r) => r.key)
		);
		const existingValues = new Map(
			(
				await tx
					.select({ key: appTranslation.key, value: appTranslation.value })
					.from(appTranslation)
					.where(eq(appTranslation.locale, locale))
			).map((r) => [r.key, r.value])
		);

		for (const [rawKey, rawValue] of Object.entries(dict)) {
			if (validateKey(rawKey)) {
				result.skipped += 1;
				continue;
			}
			const value = String(rawValue ?? '').trim();
			if (value === '') {
				if (existingValues.has(rawKey)) {
					await tx
						.delete(appTranslation)
						.where(and(eq(appTranslation.key, rawKey), eq(appTranslation.locale, locale)));
					result.deleted += 1;
				} else {
					result.skipped += 1;
				}
				continue;
			}
			if (!existingKeys.has(rawKey)) {
				await tx.insert(appTranslationKey).values({ key: rawKey });
				existingKeys.add(rawKey);
				result.keysCreated += 1;
			}
			const prior = existingValues.get(rawKey);
			if (prior === undefined) {
				await tx.insert(appTranslation).values({ key: rawKey, locale, value });
				result.inserted += 1;
			} else if (prior !== value) {
				await tx
					.update(appTranslation)
					.set({ value, updatedAt: new Date() })
					.where(and(eq(appTranslation.key, rawKey), eq(appTranslation.locale, locale)));
				result.updated += 1;
			} else {
				result.skipped += 1;
			}
		}

		if (mode === 'replace') {
			for (const [key] of existingValues) {
				if (!(key in dict)) {
					await tx
						.delete(appTranslation)
						.where(and(eq(appTranslation.key, key), eq(appTranslation.locale, locale)));
					result.deleted += 1;
				}
			}
		}
	});

	invalidateI18n();
	return result;
}
