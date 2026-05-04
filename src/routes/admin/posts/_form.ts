import { fail, type ActionFailure } from '@sveltejs/kit';
import type { PostWriteInput } from '$lib/server/admin-repos';
import { sanitizeHtml } from '$lib/server/sanitize-html';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type PostFormState = {
	values: Partial<PostWriteInput>;
	errors: Record<string, string>;
};

export type PostFormFail = ActionFailure<PostFormState>;

export function parsePostForm(fd: FormData): { input: PostWriteInput } | PostFormFail {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const slug = (fd.get('slug')?.toString() ?? '').trim();
	const titleVi = (fd.get('titleVi')?.toString() ?? '').trim();
	const titleEn = (fd.get('titleEn')?.toString() ?? '').trim();
	const category = (fd.get('category')?.toString() ?? '').trim();
	const publishedAt = (fd.get('publishedAt')?.toString() ?? '').trim();
	const imageUrl = (fd.get('imageUrl')?.toString() ?? '').trim();
	const excerptVi = (fd.get('excerptVi')?.toString() ?? '').trim();
	const excerptEn = (fd.get('excerptEn')?.toString() ?? '').trim();
	const contentVi = sanitizeHtml(fd.get('contentVi')?.toString() ?? '');
	const contentEn = sanitizeHtml(fd.get('contentEn')?.toString() ?? '');

	const errors: Record<string, string> = {};
	if (!titleVi) errors.titleVi = 'Required';
	if (!titleEn) errors.titleEn = 'Required';
	if (!category) errors.category = 'Required';
	if (!ISO_DATE.test(publishedAt)) errors.publishedAt = 'Use YYYY-MM-DD';
	if (!imageUrl) errors.imageUrl = 'Required';
	if (!excerptVi) errors.excerptVi = 'Required';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: {
				id,
				slug,
				titleVi,
				titleEn,
				category,
				publishedAt,
				imageUrl,
				excerptVi,
				excerptEn,
				contentVi,
				contentEn
			}
		});
	}

	return {
		input: {
			id: id || undefined,
			slug: slug || undefined,
			titleVi,
			titleEn,
			category,
			publishedAt,
			imageUrl,
			excerptVi,
			excerptEn: excerptEn || null,
			contentVi: contentVi || null,
			contentEn: contentEn || null
		}
	};
}
