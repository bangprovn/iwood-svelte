import {
	listCategories,
	listPosts,
	listProducts,
	listProjectCategories,
	listProjects
} from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [categories, products, projects, projectCategories, posts] = await Promise.all([
		listCategories(),
		listProducts(),
		listProjects({ limit: 3 }),
		listProjectCategories(),
		listPosts({ limit: 3 })
	]);

	return { categories, products, projects, projectCategories, posts };
};
