import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { user } from './db/schema';
import type { RequestEvent } from '@sveltejs/kit';

const adminEmails = new Set(
	(env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
);

export function isAllowlistedEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	return adminEmails.has(email.toLowerCase());
}

/**
 * Promote allowlisted users to `admin` role on first sight. Idempotent.
 * Called from hooks.server.ts after a session is resolved.
 */
export async function ensureAdminRole(u: {
	id: string;
	email: string | null | undefined;
	role?: string | null;
}): Promise<string> {
	const role = u.role ?? 'user';
	if (role === 'admin') return 'admin';
	if (!isAllowlistedEmail(u.email)) return role;
	await db.update(user).set({ role: 'admin' }).where(eq(user.id, u.id));
	return 'admin';
}

/**
 * Throws redirect→/admin/login when no session, or 403 when not an admin.
 * Use as the first line of every admin `+page.server.ts` / form action.
 */
export function requireAdmin(event: RequestEvent): App.Locals['user'] & { role: string } {
	if (!event.locals.user) {
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		throw redirect(302, `/admin/login?next=${next}`);
	}
	const role = event.locals.user.role ?? 'user';
	if (role !== 'admin') throw error(403, 'Admin access required');
	return { ...event.locals.user, role };
}
