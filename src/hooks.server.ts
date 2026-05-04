import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { ensureAdminRole } from '$lib/server/admin-guard';
import { getI18nSnapshot } from '$lib/server/translations';
import { pickLocaleFromPath } from '$lib/i18n/url';

const COOKIE_NAME = 'LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const handleI18n: Handle = async ({ event, resolve }) => {
	const snap = await getI18nSnapshot();
	const codes = snap.locales.map((l) => l.code);

	const fromUrl = pickLocaleFromPath(event.url.pathname, codes);
	const fromCookie = event.cookies.get(COOKIE_NAME);
	const locale =
		fromUrl ?? (fromCookie && codes.includes(fromCookie) ? fromCookie : null) ?? snap.defaultLocale;

	if (fromUrl && fromCookie !== fromUrl) {
		event.cookies.set(COOKIE_NAME, fromUrl, { path: '/', maxAge: COOKIE_MAX_AGE });
	}

	event.locals.locale = locale;
	const dir = snap.locales.find((l) => l.code === locale)?.dir ?? 'ltr';

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%i18n.lang%', locale).replace('%i18n.dir%', dir)
	});
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;

		// better-auth strips unknown columns from its returned `user` shape, so
		// pull `role` directly and auto-promote any ADMIN_EMAILS allow-listed user.
		const [row] = await db
			.select({ role: userTable.role })
			.from(userTable)
			.where(eq(userTable.id, session.user.id));
		const initialRole = row?.role ?? 'user';
		const role = await ensureAdminRole({
			id: session.user.id,
			email: session.user.email,
			role: initialRole
		});
		event.locals.user = { ...session.user, role };
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleI18n, handleBetterAuth);
