import { z } from 'zod';
import { optionalHtml, optionalId, requiredHtml, requiredText, stringArray } from './_helpers';

export const projectWriteSchema = z.object({
	id: optionalId,
	nameVi: requiredText,
	nameEn: requiredText,
	categoryId: requiredText,
	year: z.coerce.number().min(1900, 'Invalid year'),
	area: requiredText,
	location: requiredText,
	imageUrl: requiredText,
	summaryVi: requiredHtml,
	summaryEn: optionalHtml,
	productIds: stringArray
});

export type ProjectWriteInput = z.infer<typeof projectWriteSchema>;
