import { requireAdmin } from '$lib/server/admin-guard';
import { createPage, validatePageInput, isRoutePatternTaken } from '$lib/server/repos/page.repo';
import { fail, redirect } from '@sveltejs/kit';

export async function load(event) {
	requireAdmin(event);
}

export const actions = {
	default: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const titleVi = (data.get('titleVi') as string) ?? '';
		const titleEn = (data.get('titleEn') as string) ?? '';
		const slug = ((data.get('slug') as string) ?? '').trim();
		const type = ((data.get('type') as string) || 'custom') as 'custom' | 'override';
		const routePattern = ((data.get('routePattern') as string) ?? '').trim() || null;

		const err = validatePageInput({ titleVi, slug, type, routePattern });
		if (err) return fail(400, { error: err, titleVi, titleEn, slug, type, routePattern });

		if (type === 'override' && routePattern && (await isRoutePatternTaken(routePattern))) {
			return fail(400, { error: `Route ${routePattern} is already overridden by another page`, titleVi, titleEn, slug, type, routePattern });
		}

		const result = await createPage({
			titleVi,
			titleEn: titleEn || titleVi,
			slug,
			type,
			routePattern
		});

		redirect(302, `/admin/pages/${result.id}`);
	}
};
