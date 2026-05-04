import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { createPost } from '$lib/server/admin-repos';
import { parsePostForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	requireAdmin(event);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parsePostForm(fd);
		if (!('input' in parsed)) return parsed;
		await createPost(parsed.input);
		throw redirect(303, '/admin/posts');
	}
};
