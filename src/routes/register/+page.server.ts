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
	signUp: async (event) => {
		const fd = await event.request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		const email = fd.get('email')?.toString().trim() ?? '';
		const password = fd.get('password')?.toString() ?? '';
		const confirm = fd.get('confirm')?.toString() ?? '';
		const next = safeNext(fd.get('next'));

		if (!name || !email || !password) {
			return fail(400, { message: 'All fields are required', name, email });
		}
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters', name, email });
		}
		if (password !== confirm) {
			return fail(400, { message: 'Passwords do not match', name, email });
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password },
				headers: event.request.headers,
				asResponse: false
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: e.message || 'Sign-up failed', name, email });
			}
			return fail(500, { message: 'Unexpected error', name, email });
		}

		throw redirect(303, next);
	}
};
