import { getPageBySlug } from '$lib/server/cms/admin';
import { getI18nSnapshot } from '$lib/server/i18n';
import { error } from '@sveltejs/kit';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function load({ params, locals }) {
	if (!SLUG_RE.test(params.slug)) error(404, 'Not found');
	const snap = await getI18nSnapshot();
	const locale = locals.locale ?? snap.defaultLocale;
	const page = await getPageBySlug(params.slug, locale);
	if (!page) error(404, 'Page not found');
	return { page, locale };
}
