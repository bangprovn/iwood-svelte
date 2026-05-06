import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	createProjectCategory,
	deleteProjectCategory,
	listProjectCategoriesAdmin,
	updateProjectCategory
} from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listProjectCategoriesAdmin() };
};

function parse(fd: FormData) {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const nameVi = (fd.get('nameVi')?.toString() ?? '').trim();
	const nameEn = (fd.get('nameEn')?.toString() ?? '').trim();
	const sortOrder = Number(fd.get('sortOrder') ?? 0);
	const errors: Record<string, string> = {};
	if (!nameVi) errors.nameVi = 'Required';
	if (!nameEn) errors.nameEn = 'Required';
	return { id, nameVi, nameEn, sortOrder, errors };
}

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const p = parse(fd);
		if (Object.keys(p.errors).length) return fail(400, { errors: p.errors, scope: 'create' });
		await createProjectCategory({
			id: p.id || undefined,
			nameVi: p.nameVi,
			nameEn: p.nameEn,
			sortOrder: p.sortOrder
		});
		throw redirect(303, '/admin/project-categories');
	},
	update: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const p = parse(fd);
		if (!p.id) return fail(400, { message: 'id required' });
		if (Object.keys(p.errors).length)
			return fail(400, { errors: p.errors, scope: 'update', editId: p.id });
		await updateProjectCategory(p.id, {
			nameVi: p.nameVi,
			nameEn: p.nameEn,
			sortOrder: p.sortOrder
		});
		return { success: true };
	},
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		try {
			await deleteProjectCategory(id);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
