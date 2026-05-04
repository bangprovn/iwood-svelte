import { fail, type ActionFailure } from '@sveltejs/kit';
import type { CategoryWriteInput } from '$lib/server/admin-repos';

export type CategoryFormState = {
	values: Partial<CategoryWriteInput>;
	errors: Record<string, string>;
};

export type CategoryFormFail = ActionFailure<CategoryFormState>;

export function parseCategoryForm(
	fd: FormData
): { input: CategoryWriteInput } | CategoryFormFail {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const nameVi = (fd.get('nameVi')?.toString() ?? '').trim();
	const nameEn = (fd.get('nameEn')?.toString() ?? '').trim();
	const blurb = (fd.get('blurb')?.toString() ?? '').trim();
	const priceFrom = Number(fd.get('priceFrom') ?? 0);
	const imageUrl = (fd.get('imageUrl')?.toString() ?? '').trim();
	const displayCount = Number(fd.get('displayCount') ?? 0);
	const sortOrder = Number(fd.get('sortOrder') ?? 0);

	const errors: Record<string, string> = {};
	if (!nameVi) errors.nameVi = 'Required';
	if (!nameEn) errors.nameEn = 'Required';
	if (!blurb) errors.blurb = 'Required';
	if (!Number.isFinite(priceFrom) || priceFrom < 0) errors.priceFrom = 'Must be ≥ 0';
	if (!imageUrl) errors.imageUrl = 'Required';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: { id, nameVi, nameEn, blurb, priceFrom, imageUrl, displayCount, sortOrder }
		});
	}

	return {
		input: {
			id: id || undefined,
			nameVi,
			nameEn,
			blurb,
			priceFrom,
			imageUrl,
			displayCount,
			sortOrder
		}
	};
}
