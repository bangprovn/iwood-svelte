import { defineResource } from '$lib/server/admin';
import { projectWriteSchema } from '$lib/server/schemas';
import {
	createProject,
	deleteProject,
	getProjectAdmin,
	listProductsAdmin,
	listProjectCategoriesAdmin,
	listProjectsAdmin,
	updateProject
} from './admin-repos';

async function loadProjectFormDeps() {
	const [categories, products] = await Promise.all([
		listProjectCategoriesAdmin(),
		listProductsAdmin()
	]);
	return {
		categories,
		products: products.map((p) => ({ id: p.id, code: p.code, nameVi: p.nameVi }))
	};
}

export const projectsResource = defineResource({
	name: 'Project',
	schema: projectWriteSchema,
	basePath: '/admin/projects',
	listAll: async () => {
		const [rows, cats] = await Promise.all([
			listProjectsAdmin(),
			listProjectCategoriesAdmin()
		]);
		return { rows, cats };
	},
	loadRelated: loadProjectFormDeps,
	getOne: (id) => getProjectAdmin(id),
	create: (input) => createProject(input),
	update: (id, input) => updateProject(id, input),
	deleteOne: (id) => deleteProject(id)
});
