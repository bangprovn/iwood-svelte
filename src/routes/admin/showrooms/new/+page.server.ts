import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { createShowroom } from '$lib/server/admin-repos';
import { parseShowroomForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	requireAdmin(event);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseShowroomForm(fd);
		if (!('input' in parsed)) return parsed;
		await createShowroom(parsed.input);
		throw redirect(303, '/admin/showrooms');
	}
};
