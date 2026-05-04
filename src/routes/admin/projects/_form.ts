import { fail, type ActionFailure } from '@sveltejs/kit';
import type { ProjectWriteInput } from '$lib/server/admin-repos';
import { sanitizeHtml, htmlToPlainText } from '$lib/server/sanitize-html';

export type ProjectFormState = {
	values: Partial<ProjectWriteInput>;
	errors: Record<string, string>;
};

export type ProjectFormFail = ActionFailure<ProjectFormState>;

export function parseProjectForm(
	fd: FormData
): { input: ProjectWriteInput } | ProjectFormFail {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const nameVi = (fd.get('nameVi')?.toString() ?? '').trim();
	const nameEn = (fd.get('nameEn')?.toString() ?? '').trim();
	const categoryId = (fd.get('categoryId')?.toString() ?? '').trim();
	const year = Number(fd.get('year') ?? 0);
	const area = (fd.get('area')?.toString() ?? '').trim();
	const location = (fd.get('location')?.toString() ?? '').trim();
	const imageUrl = (fd.get('imageUrl')?.toString() ?? '').trim();
	const summaryVi = sanitizeHtml(fd.get('summaryVi')?.toString() ?? '');
	const summaryEn = sanitizeHtml(fd.get('summaryEn')?.toString() ?? '');
	const productIds = fd.getAll('productIds').map((s) => s.toString()).filter(Boolean);

	const errors: Record<string, string> = {};
	if (!nameVi) errors.nameVi = 'Required';
	if (!nameEn) errors.nameEn = 'Required';
	if (!categoryId) errors.categoryId = 'Required';
	if (!Number.isFinite(year) || year < 1900) errors.year = 'Invalid year';
	if (!area) errors.area = 'Required';
	if (!location) errors.location = 'Required';
	if (!imageUrl) errors.imageUrl = 'Required';
	if (!htmlToPlainText(summaryVi)) errors.summaryVi = 'Required';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: {
				id,
				nameVi,
				nameEn,
				categoryId,
				year,
				area,
				location,
				imageUrl,
				summaryVi,
				summaryEn,
				productIds
			}
		});
	}

	return {
		input: {
			id: id || undefined,
			nameVi,
			nameEn,
			categoryId,
			year,
			area,
			location,
			imageUrl,
			summaryVi,
			summaryEn: summaryEn || null,
			productIds
		}
	};
}
