import { requireAdmin } from '$lib/server/auth';
import { getPage, listRevisions, revertToRevision } from '$lib/server/cms/admin';
import { error, fail } from '@sveltejs/kit';

export async function load(event) {
	requireAdmin(event);
	const page = await getPage(event.params.id);
	if (!page) error(404, 'Page not found');
	const revisions = await listRevisions(page.id);
	return { page, revisions };
}

export const actions = {
	revert: async (event) => {
		const admin = requireAdmin(event);
		const data = await event.request.formData();
		const revisionId = Number(data.get('revisionId'));
		if (!Number.isFinite(revisionId)) return fail(400, { error: 'revisionId is required' });
		try {
			await revertToRevision(event.params.id, revisionId, { userId: admin.id });
			return { success: true, revertedTo: revisionId };
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : String(e) });
		}
	}
};
