import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import { localizedHref as urlLocalizedHref } from './url';

export type LocaleRow = {
	code: string;
	label: string;
	dir: 'ltr' | 'rtl';
	isActive: boolean;
	isDefault: boolean;
	sortOrder: number;
};

export type I18nData = {
	locale: string;
	defaultLocale: string;
	locales: LocaleRow[];
	messages: Record<string, string>;
};

const KEY = Symbol('i18n');

export function setI18n(initial: I18nData): Writable<I18nData> {
	const store = writable(initial);
	setContext(KEY, store);
	return store;
}

export function useI18n(): Writable<I18nData> {
	const store = getContext<Writable<I18nData>>(KEY);
	if (!store) throw new Error('i18n context missing — call setI18n() in the root layout');
	return store;
}

export function interpolate(template: string, params?: Record<string, unknown>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (_, k) =>
		k in params ? String(params[k] ?? '') : `{${k}}`
	);
}

export function t(data: I18nData, key: string, params?: Record<string, unknown>): string {
	const raw = data.messages[key];
	if (raw === undefined) return key;
	return interpolate(raw, params);
}

export function localizedHref(data: I18nData, path: string, locale: string = data.locale): string {
	return urlLocalizedHref(path, locale, data.defaultLocale);
}

export { stripLocaleFromPath, pickLocaleFromPath } from './url';
