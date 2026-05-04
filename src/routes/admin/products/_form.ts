import { fail, type ActionFailure } from '@sveltejs/kit';
import type { ProductWriteInput } from '$lib/server/admin-repos';
import { sanitizeHtml, htmlToPlainText } from '$lib/server/sanitize-html';

export type ProductFormState = {
	values: Partial<ProductWriteInput> & { specs?: string[] };
	errors: Record<string, string>;
};

export type ProductFormFail = ActionFailure<ProductFormState>;

export function parseProductForm(
	fd: FormData
): { input: ProductWriteInput } | ProductFormFail {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const code = (fd.get('code')?.toString() ?? '').trim();
	const nameVi = (fd.get('nameVi')?.toString() ?? '').trim();
	const nameEn = (fd.get('nameEn')?.toString() ?? '').trim();
	const categoryId = (fd.get('categoryId')?.toString() ?? '').trim();
	const price = Number(fd.get('price') ?? 0);
	const imageUrl = (fd.get('imageUrl')?.toString() ?? '').trim();
	const tag = (fd.get('tag')?.toString() ?? '').trim();
	const descVi = sanitizeHtml(fd.get('descVi')?.toString() ?? '');
	const descEn = sanitizeHtml(fd.get('descEn')?.toString() ?? '');
	const specs = fd
		.getAll('specs')
		.map((s) => s.toString().trim())
		.filter(Boolean);

	const errors: Record<string, string> = {};
	if (!code) errors.code = 'Required';
	if (!nameVi) errors.nameVi = 'Required';
	if (!nameEn) errors.nameEn = 'Required';
	if (!categoryId) errors.categoryId = 'Required';
	if (!Number.isFinite(price) || price < 0) errors.price = 'Must be ≥ 0';
	if (!imageUrl) errors.imageUrl = 'Required';
	if (!htmlToPlainText(descVi)) errors.descVi = 'Required';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: { id, code, nameVi, nameEn, categoryId, price, imageUrl, tag, descVi, descEn, specs }
		});
	}

	return {
		input: {
			id: id || undefined,
			code,
			nameVi,
			nameEn,
			categoryId,
			price,
			imageUrl,
			tag: tag || null,
			descVi,
			descEn: descEn || null,
			specs
		}
	};
}
