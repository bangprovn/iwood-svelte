import { fail } from '@sveltejs/kit';
import { defineResource } from '$lib/server/admin';
import { localeWriteSchema } from '$lib/server/schemas';
import {
	createLocale,
	deleteLocale,
	getLocale,
	listLocales,
	updateLocale
} from '$lib/server/i18n/admin';

export const localesResource = defineResource({
	name: 'Locale',
	schema: localeWriteSchema,
	basePath: '/admin/locales',
	paramName: 'code',
	deleteIdField: 'code',
	listAll: async () => ({ rows: await listLocales() }),
	getOne: (code) => getLocale(code),
	create: (input) => createLocale(input),
	// Force the URL code as the canonical key — primary key isn't editable.
	update: (code, input) => updateLocale(code, { ...input, code }),
	deleteOne: (code) => deleteLocale(code),
	onWriteError: (err, input) =>
		fail(409, {
			errors: { code: err instanceof Error ? err.message : String(err) },
			values: input
		})
});
