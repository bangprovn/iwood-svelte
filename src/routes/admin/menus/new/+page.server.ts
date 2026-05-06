import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { createMenu, MENU_LOCATIONS } from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { locations: [...MENU_LOCATIONS] };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		const slug = fd.get('slug')?.toString().trim() ?? '';
		const location = fd.get('location')?.toString().trim() ?? '';
		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Required';
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values: { name, slug, location } });
		}
		try {
			const { id } = await createMenu({
				name,
				slug: slug || undefined,
				location: location || null,
				isActive: true
			});
			throw redirect(303, `/admin/menus/${id}`);
		} catch (e) {
			if (e instanceof Response || (e && (e as { status?: number }).status === 303)) throw e;
			return fail(500, {
				values: { name, slug, location },
				message: e instanceof Error ? e.message : String(e)
			});
		}
	}
};
