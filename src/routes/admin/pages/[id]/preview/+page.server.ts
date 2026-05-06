import { requireAdmin } from '$lib/server/admin-guard';
import { getPagePreviewById } from '$lib/server/cms/admin';
import { getI18nSnapshot } from '$lib/server/i18n';
import { error } from '@sveltejs/kit';

export async function load(event) {
	requireAdmin(event);
	const url = new URL(event.request.url);
	const snap = await getI18nSnapshot();
	const locale = url.searchParams.get('locale') ?? event.locals.locale ?? snap.defaultLocale;
	const page = await getPagePreviewById(event.params.id, locale);
	if (!page) error(404, 'Page not found');
	return { page, locale, availableLocales: snap.locales.map((l) => l.code) };
}
