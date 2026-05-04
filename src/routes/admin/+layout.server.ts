import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// /admin/login is the only admin route allowed without an admin role.
	if (url.pathname.startsWith('/admin/login')) {
		if (locals.user && locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
		return { user: null };
	}

	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(302, `/admin/login?next=${next}`);
	}
	if (locals.user.role !== 'admin') {
		throw redirect(303, '/admin/login?error=forbidden');
	}
	return {
		user: { id: locals.user.id, name: locals.user.name, email: locals.user.email }
	};
};
