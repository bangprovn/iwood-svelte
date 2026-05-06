import { z } from 'zod';
import { optionalId, requiredText } from './_helpers';

export const categoryWriteSchema = z.object({
	id: optionalId,
	nameVi: requiredText,
	nameEn: requiredText,
	blurb: requiredText,
	priceFrom: z.coerce.number().min(0, 'Must be ≥ 0'),
	imageUrl: requiredText,
	displayCount: z.coerce.number().min(0).default(0),
	sortOrder: z.coerce.number().default(0)
});

export type CategoryWriteInput = z.infer<typeof categoryWriteSchema>;
