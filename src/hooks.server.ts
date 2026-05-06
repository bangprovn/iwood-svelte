import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { ensureAdminRole } from '$lib/server/admin-guard';
import { getI18nSnapshot } from '$lib/server/i18n';
import { getSettings } from '$lib/server/settings';
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

// Public visitors get a 503 holding page when system.maintenance_mode is on.
// Admin routes, the auth API, and static assets stay reachable so an admin
// can flip the switch back off.
const handleMaintenance: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);
	const path = event.url.pathname;
	const exempt =
		path.startsWith('/admin') ||
		path.startsWith('/api/auth') ||
		path.startsWith('/api/health') ||
		path.startsWith('/_app/') ||
		/\.[a-z0-9]+$/i.test(path);
	if (exempt) return resolve(event);

	const role = event.locals.user?.role;
	if (role === 'admin') return resolve(event);

	const settings = await getSettings();
	if (!settings['system.maintenance_mode']) return resolve(event);

	const message = String(
		settings['system.maintenance_message'] ||
			'We are performing scheduled maintenance. Please check back soon.'
	);
	const siteName = String(settings['system.site_name'] || 'Site');
	const escape = (s: string) =>
		s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
	const html = `<!doctype html>
<html lang="${event.locals.locale ?? 'en'}">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="robots" content="noindex,nofollow" />
		<title>${escape(siteName)} — Maintenance</title>
		<style>
			html, body { margin: 0; padding: 0; background: #f6f4f0; color: #0f0f10; font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif; min-height: 100%; }
			.wrap { min-height: 100vh; display: grid; place-items: center; padding: 32px 20px; }
			.card { max-width: 520px; text-align: center; padding: 40px 32px; background: #fff; border: 1px solid #e5e2dc; border-radius: 8px; box-shadow: 0 4px 12px rgba(15,15,16,.08); }
			.bar { display: inline-block; width: 40px; height: 3px; background: #e30613; margin-bottom: 16px; }
			h1 { font-size: 28px; font-weight: 800; margin: 0 0 12px; text-transform: uppercase; letter-spacing: .02em; }
			p { line-height: 1.55; color: #3a3a3d; margin: 0; white-space: pre-wrap; }
			.brand { margin-top: 24px; font-size: 12px; color: #6b6b70; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; }
		</style>
	</head>
	<body>
		<div class="wrap">
			<div class="card" role="status" aria-live="polite">
				<span class="bar" aria-hidden="true"></span>
				<h1>${escape(siteName)}</h1>
				<p>${escape(message)}</p>
				<div class="brand">Maintenance mode</div>
			</div>
		</div>
	</body>
</html>`;
	return new Response(html, {
		status: 503,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'retry-after': '600',
			'cache-control': 'no-store'
		}
	});
};

export const handle: Handle = sequence(handleI18n, handleBetterAuth, handleMaintenance);
