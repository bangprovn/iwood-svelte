import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(302, `/login?next=${next}`);
	}
	return { user: locals.user };
};

export const actions: Actions = {
	updateProfile: async (event) => {
		if (!event.locals.user) throw redirect(302, '/login');
		const fd = await event.request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		if (!name) return fail(400, { scope: 'profile', message: 'Name is required' });
		await db.update(userTable).set({ name }).where(eq(userTable.id, event.locals.user.id));
		return { scope: 'profile', success: true };
	},

	changePassword: async (event) => {
		if (!event.locals.user) throw redirect(302, '/login');
		const fd = await event.request.formData();
		const currentPassword = fd.get('currentPassword')?.toString() ?? '';
		const newPassword = fd.get('newPassword')?.toString() ?? '';
		if (!currentPassword || !newPassword) {
			return fail(400, { scope: 'password', message: 'Both fields are required' });
		}
		if (newPassword.length < 8) {
			return fail(400, { scope: 'password', message: 'New password must be at least 8 characters' });
		}
		try {
			await auth.api.changePassword({
				body: { currentPassword, newPassword },
				headers: event.request.headers,
				asResponse: false
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { scope: 'password', message: e.message || 'Could not change password' });
			}
			return fail(500, { scope: 'password', message: 'Unexpected error' });
		}
		return { scope: 'password', success: true };
	},

	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(303, '/');
	}
};
