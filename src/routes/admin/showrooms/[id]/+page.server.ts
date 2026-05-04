import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { getShowroomAdmin, updateShowroom } from '$lib/server/admin-repos';
import { parseShowroomForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const row = await getShowroomAdmin(event.params.id);
	if (!row) throw error(404, 'Not found');
	return { row };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseShowroomForm(fd);
		if (!('input' in parsed)) return parsed;
		await updateShowroom(event.params.id, parsed.input);
		throw redirect(303, '/admin/showrooms');
	}
};
