import { listCategories, listProducts } from '$lib/server/repos';
import { buildMessagesForLocale, getI18nSnapshot } from '$lib/server/translations';
import { getPageOverride } from '$lib/server/repos/page.repo';
import {
	ensurePrimaryMenuSeed,
	getMenuByLocation,
	resolveMenuTree
} from '$lib/server/repos/menu.repo';
import { cssVariables, getPublicSettings, googleFontsHref } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

function isOverridablePath(pathname: string): boolean {
	if (pathname.startsWith('/api/')) return false;
	if (pathname.startsWith('/admin')) return false;
	if (pathname.startsWith('/_app/')) return false;
	if (/\.[a-z0-9]+$/i.test(pathname)) return false;
	return true;
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Best-effort: ensure a starter "Primary" menu exists so the public site
	// has a navigation bar from day one. Idempotent + cheap on the hot path.
	await ensurePrimaryMenuSeed().catch(() => {});

	const [navCategories, megaFeatured, snap, settings, primaryMenu, footerMenu] = await Promise.all([
		listCategories(),
		listProducts({ sort: 'featured', limit: 2 }),
		getI18nSnapshot(),
		getPublicSettings(),
		getMenuByLocation('primary'),
		getMenuByLocation('footer')
	]);
	const locale = locals.locale ?? snap.defaultLocale;
	const localeKey: 'vi' | 'en' = locale === 'en' ? 'en' : 'vi';
	const routePattern = url.pathname;
	const [pageOverride, primaryNav, footerNav] = await Promise.all([
		isOverridablePath(routePattern) ? getPageOverride(routePattern, locale) : null,
		resolveMenuTree(primaryMenu, localeKey),
		resolveMenuTree(footerMenu, localeKey)
	]);
	return {
		navCategories,
		megaFeatured,
		pageOverride,
		primaryNav,
		footerNav,
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					email: locals.user.email,
					role: locals.user.role ?? 'user'
				}
			: null,
		i18n: {
			locale,
			defaultLocale: snap.defaultLocale,
			locales: snap.locales,
			messages: buildMessagesForLocale(snap, locale)
		},
		site: {
			settings,
			cssVars: cssVariables(settings),
			fontsHref: googleFontsHref(settings)
		}
	};
};
