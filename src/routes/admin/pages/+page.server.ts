import { requireAdmin } from '$lib/server/auth';
import { listPages, deletePage, duplicatePage } from '$lib/server/cms/admin';

export async function load(event) {
	requireAdmin(event);
	const pages = await listPages();
	return { pages };
}

export const actions = {
	delete: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const id = data.get('id') as string;
		await deletePage(id);
		return { success: true };
	},
	duplicate: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const id = data.get('id') as string;
		const result = await duplicatePage(id);
		return { success: true, id: result.id };
	}
};