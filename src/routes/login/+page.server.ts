import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

function safeNext(raw: FormDataEntryValue | string | null | undefined): string {
	const s = (raw ?? '').toString();
	if (!s.startsWith('/') || s.startsWith('//')) return '/account';
	if (s.startsWith('/admin')) return '/account';
	return s;
}

export const load: PageServerLoad = ({ locals, url }) => {
	const next = safeNext(url.searchParams.get('next'));
	if (locals.user) throw redirect(302, next);
	return { next };
};

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

		throw redirect(303, next);
	},

	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(303, '/');
	}
};
