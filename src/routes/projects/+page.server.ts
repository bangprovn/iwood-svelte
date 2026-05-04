import { listProjectCategories, listProjects } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const cat = url.searchParams.get('cat') ?? undefined;
	const [projects, projectCategories] = await Promise.all([
		listProjects({ categoryId: cat }),
		listProjectCategories()
	]);
	return { projects, projectCategories };
};
