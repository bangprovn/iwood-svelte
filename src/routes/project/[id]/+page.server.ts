import { error } from '@sveltejs/kit';
import {
	getProject,
	listMoreProjects,
	listProducts,
	listProjectCategories
} from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const project = await getProject(params.id);
	if (!project) throw error(404, 'Project not found');

	const [more, projectCategories, allProducts] = await Promise.all([
		listMoreProjects(project.id, project.cat),
		listProjectCategories(),
		listProducts()
	]);

	const usedProducts = allProducts.filter((p) => project.products.includes(p.code));

	return { project, more, projectCategories, usedProducts };
};
