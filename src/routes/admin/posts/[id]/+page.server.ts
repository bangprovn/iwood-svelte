import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { getPostAdmin, updatePost } from '$lib/server/admin-repos';
import { parsePostForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const row = await getPostAdmin(event.params.id);
	if (!row) throw error(404, 'Not found');
	return { row };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parsePostForm(fd);
		if (!('input' in parsed)) return parsed;
		await updatePost(event.params.id, parsed.input);
		throw redirect(303, '/admin/posts');
	}
};
