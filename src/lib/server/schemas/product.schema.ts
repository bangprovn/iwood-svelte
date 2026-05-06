import { z } from 'zod';
import {
	optionalHtml,
	optionalId,
	optionalText,
	requiredHtml,
	requiredText,
	stringArray
} from './_helpers';

export const productWriteSchema = z.object({
	id: optionalId,
	code: requiredText,
	nameVi: requiredText,
	nameEn: requiredText,
	categoryId: requiredText,
	price: z.coerce.number().min(0, 'Must be ≥ 0'),
	imageUrl: requiredText,
	tag: optionalText,
	descVi: requiredHtml,
	descEn: optionalHtml,
	specs: stringArray
});

export type ProductWriteInput = z.infer<typeof productWriteSchema>;
