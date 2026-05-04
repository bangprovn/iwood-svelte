import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { ensureAdminRole, isAllowlistedEmail } from '$lib/server/admin-guard';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user?.role === 'admin') {
		const next = url.searchParams.get('next');
		throw redirect(302, next && next.startsWith('/admin') ? next : '/admin');
	}
	return {
		error: url.searchParams.get('error') ?? null,
		next: url.searchParams.get('next') ?? '/admin'
	};
};

function safeNext(raw: FormDataEntryValue | null): string {
	const s = (raw ?? '').toString();
	return s.startsWith('/admin') ? s : '/admin';
}

export const actions: Actions = {
	signIn: async (event) => {
		const fd = await event.request.formData();
		const email = fd.get('email')?.toString().trim() ?? '';
		const password = fd.get('password')?.toString() ?? '';
		const next = safeNext(fd.get('next'));

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required', email });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers,
				asResponse: false
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: e.message || 'Sign-in failed', email });
			}
			return fail(500, { message: 'Unexpected error', email });
		}

		// Promote allowlisted user → admin (idempotent), then verify role.
		const [row] = await db
			.select({ id: userTable.id, role: userTable.role })
			.from(userTable)
			.where(eq(userTable.email, email));
		if (row) {
			await ensureAdminRole({ id: row.id, email, role: row.role });
		}
		if (!row || (row.role !== 'admin' && !isAllowlistedEmail(email))) {
			return fail(403, { message: 'This account does not have admin access', email });
		}
		throw redirect(303, next);
	},

	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(303, '/admin/login');
	}
};
