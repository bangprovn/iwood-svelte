import { z } from 'zod';
import { optionalHtml, optionalId, optionalText, requiredText } from './_helpers';

export const postWriteSchema = z.object({
	id: optionalId,
	slug: optionalId,
	titleVi: requiredText,
	titleEn: requiredText,
	category: requiredText,
	publishedAt: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
	imageUrl: requiredText,
	excerptVi: requiredText,
	excerptEn: optionalText,
	contentVi: optionalHtml,
	contentEn: optionalHtml
});

export type PostWriteInput = z.infer<typeof postWriteSchema>;
