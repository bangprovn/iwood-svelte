import { listCategories, listProducts } from '$lib/server/repos';
import { buildMessagesForLocale, getI18nSnapshot } from '$lib/server/translations';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [navCategories, megaFeatured, snap] = await Promise.all([
		listCategories(),
		listProducts({ sort: 'featured', limit: 2 }),
		getI18nSnapshot()
	]);
	const locale = locals.locale ?? snap.defaultLocale;
	return {
		navCategories,
		megaFeatured,
		i18n: {
			locale,
			defaultLocale: snap.defaultLocale,
			locales: snap.locales,
			messages: buildMessagesForLocale(snap, locale)
		}
	};
};
