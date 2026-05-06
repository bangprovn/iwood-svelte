import { fail, redirect } from '@sveltejs/kit';
import { getI18nSnapshot } from '$lib/server/i18n';
import { localizedHref } from '$lib/i18n/url';
import type { Actions } from './$types';

const COOKIE_NAME = 'LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const actions: Actions = {
	setLocale: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const locale = fd.get('locale')?.toString() ?? '';
		const snap = await getI18nSnapshot();
		const codes = snap.locales.map((l) => l.code);
		if (!codes.includes(locale)) return fail(400, { message: 'Unknown locale' });

		cookies.set(COOKIE_NAME, locale, { path: '/', maxAge: COOKIE_MAX_AGE });
		throw redirect(303, localizedHref(url.pathname, locale, snap.defaultLocale));
	}
};
